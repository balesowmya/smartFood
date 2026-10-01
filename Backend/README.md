# Smart Food API

Node.js and Express API for the existing Smart Food React/Vite application. It uses SQLite through Node.js' built-in `node:sqlite` (Node 22.5 or newer), bcryptjs, JWT, dotenv, and restricted CORS. The client stays unchanged and continues to use its Axios Bearer-token interceptor.

## Local setup

```powershell
cd Backend
Copy-Item .env.example .env
# Set a private JWT_SECRET in .env before starting.
npm install
npm start
```

The API listens on `0.0.0.0` at `PORT` (default 5000). Relative `DATABASE_PATH` values are resolved from the `Backend` directory. The first run creates `food_delivery.db`, its schema, and sample restaurants/menu entries. The database file is ignored by Git.

Configure the Vite frontend with `VITE_API_URL=http://localhost:5000/api` (already shown in `Frontend/.env.example`). The API permits `http://localhost:5173` and `http://localhost:5174`; additional frontend origins are set with comma-separated `FRONTEND_URL` values.

### Optional demo accounts

No default or plaintext-password accounts are created automatically. For local demonstrations only, set `DEMO_SEED_PASSWORD` to a private password of at least 12 characters, ensure `NODE_ENV` is not `production`, and run:

```powershell
npm run seed:demo
```

This creates customer, restaurant-owner, delivery-partner, and admin demo accounts with bcrypt hashes. Demo emails are printed in the command's source (`database/seed.js`); the configured password is not stored or logged. Never run this in production.

## Render

Create a Render **Web Service** with root directory `Backend`, build command `npm install`, and start command `npm start`. Set these environment variables in Render:

| Name | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | A secure, private production secret |
| `DATABASE_PATH` | `/var/data/food_delivery.db` |
| `FRONTEND_URL` | Your actual deployed Vercel origin |

Attach a Render Persistent Disk and mount it at `/var/data`. Persistent storage must be configured in Render; a deployed SQLite file without the disk is ephemeral. No production URL or secret is hardcoded here.

In Vercel, set the public frontend variable `VITE_API_URL` to `https://<actual-render-service-host>/api`, then redeploy from Vercel. Never place `JWT_SECRET` in a `VITE_*` variable.

## API

Health: `GET /api/health` returns `{ "status": "ok", "service": "smart-food-delivery-api", "database": "ok" }` after querying SQLite.

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Public; returns `{ message, user }` |
| `POST` | `/api/auth/login` | Public; returns `{ token, user }` |
| `GET` | `/api/auth/me` | Authenticated |
| `GET` | `/api/restaurants` | Public; direct array |
| `GET` | `/api/restaurants/:id` | Public; restaurant object |
| `POST`, `PUT`, `DELETE` | `/api/restaurants`, `/api/restaurants/:id` | Owner's own records or admin |
| `GET` | `/api/restaurants/:id/menu` | Public; `{ restaurant, items }` |
| `POST` | `/api/restaurants/:restaurantId/menu` | Owner of restaurant or admin |
| `GET` | `/api/restaurant/menu` | Restaurant owner; `{ restaurant, items }` |
| `PUT`, `DELETE` | `/api/menu/:id` | Owner of restaurant or admin |
| `POST` | `/api/orders` | Customer |
| `GET` | `/api/orders`, `/api/orders/:id` | Authenticated; scoped to customer, owner, assigned partner, or admin |
| `PUT` | `/api/orders/:id/status` | Authorized owner, assigned partner, or admin |
| `GET` | `/api/restaurant/orders` | Restaurant owner; direct array |
| `GET` | `/api/delivery/orders` | Delivery partner; available and assigned orders |
| `POST` | `/api/delivery/orders/:id/claim` | Delivery partner |
| `GET` | `/api/deliveries`, `/api/deliveries/:id` | Assigned partner, restaurant owner, or admin |
| `POST` | `/api/deliveries/assign` | Owner of restaurant or admin |
| `PUT` | `/api/deliveries/:id/status` | Assigned delivery partner |
| `POST` | `/api/reviews` | Customer who owns a delivered order |
| `GET` | `/api/restaurants/:restaurantId/reviews` | Public |
| `GET` | `/api/dashboard/summary` | Authenticated; role-scoped fields |

All API errors return JSON `{ "message": "..." }`. The order API retains the frontend's `total`, `deliveryAddress`, `restaurantName`, `restaurantCategory`, `items`, and `review` response fields. It calculates prices and totals from SQLite and applies the existing frontend fee rule: ₹40 delivery, waived when subtotal exceeds ₹500. Registration/login do not return password data. The JWT is sent as `Authorization: Bearer <token>`.

New orders create their initial status log and delivery row in a SQLite transaction. Valid status transitions are `PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED`; each transition is recorded. Unavailable menu items cannot be ordered, and duplicate reviews for one order are rejected.
