# Smart Food API

This Express API uses SQLite from Node.js (`node:sqlite`) and stores its database at `database/smart-food.sqlite` by default. The first startup creates the schema and seeds eight restaurants with six menu items each.

## Run locally

Use Node.js 22.5 or newer. Copy `.env.example` to `.env`, set a private `JWT_SECRET`, then run:

```sh
npm install
npm run dev
```

The API listens on port 5000 by default. `FRONTEND_ORIGIN` controls the allowed browser origin. The SQLite file and `.env` are excluded from version control.

## Main endpoints

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/restaurants`, `GET /api/restaurants/:id/menu`
- `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`, `PUT /api/orders/:id/status`
- `GET /api/dashboard/summary`
- `GET /api/restaurant/orders`, `GET /api/restaurant/menu`
- `GET /api/delivery/orders`, `POST /api/delivery/orders/:id/claim`
- `POST /api/reviews`

Restaurant owners can create a restaurant, add menu entries, and change availability for menu items they own. Admin accounts are intentionally not self-registerable and must be provisioned by an administrator before use.
