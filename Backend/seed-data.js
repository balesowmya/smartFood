const foodImages = {
  biryani: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=700&q=80',
  curry: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=700&q=80',
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=700&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
  pizza: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=700&q=80',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80',
  dessert: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80',
  drink: 'https://images.unsplash.com/photo-1513558161293-cafb7b2fa68d?auto=format&fit=crop&w=700&q=80',
}

export const restaurants = [
  { id: 1, name: 'Spice Garden', category: 'Indian', rating: 4.5, deliveryTime: '25–30 min', location: 'Hyderabad', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=85', description: 'Bold spices and homestyle Indian comfort.', tagline: 'Bold spices, homestyle comfort' },
  { id: 2, name: 'Urban Bites', category: 'Fast Food', rating: 4.3, deliveryTime: '20–25 min', location: 'Hyderabad', image: foodImages.burger, description: 'Handcrafted burgers, crispy sides and more.', tagline: 'The classics, done right' },
  { id: 3, name: 'Green Bowl', category: 'Healthy', rating: 4.6, deliveryTime: '30–35 min', location: 'Hyderabad', image: foodImages.salad, description: 'Fresh ingredients and feel-good food.', tagline: 'Fresh ingredients, feel-good food' },
  { id: 4, name: 'Pizza House', category: 'Pizza', rating: 4.4, deliveryTime: '25–30 min', location: 'Hyderabad', image: foodImages.pizza, description: 'Stone-baked pizzas with generous toppings.', tagline: 'Stone-baked, always satisfying' },
  { id: 5, name: 'Hyderabad Biryani Hub', category: 'Biryani', rating: 4.7, deliveryTime: '30–35 min', location: 'Hyderabad', image: foodImages.biryani, description: 'Dum-cooked biryani made the Hyderabadi way.', tagline: 'The city’s biryani, made with love' },
  { id: 6, name: 'South Indian Delight', category: 'South Indian', rating: 4.5, deliveryTime: '20–30 min', location: 'Hyderabad', image: foodImages.dosa, description: 'Crisp dosas and comforting South Indian staples.', tagline: 'A little taste of the South' },
  { id: 7, name: 'Burger Junction', category: 'Burgers', rating: 4.2, deliveryTime: '20–25 min', location: 'Hyderabad', image: foodImages.burger, description: 'Juicy burgers stacked fresh to order.', tagline: 'Big flavor, stacked high' },
  { id: 8, name: 'Sweet Treats', category: 'Desserts', rating: 4.8, deliveryTime: '25–30 min', location: 'Hyderabad', image: foodImages.dessert, description: 'A sweet finish for every kind of day.', tagline: 'Save room for something sweet' },
]

const menus = {
  1: [
    ['Chicken Biryani', 'Aromatic basmati rice with slow-cooked spiced chicken.', 250, 'Main Course', foodImages.biryani, true],
    ['Mutton Biryani', 'Tender mutton layered with fragrant dum rice.', 320, 'Main Course', foodImages.biryani, true],
    ['Paneer Biryani', 'Fragrant rice layered with paneer and fresh herbs.', 220, 'Main Course', foodImages.curry, true],
    ['Veg Biryani', 'Seasonal vegetables and basmati with warming spices.', 180, 'Main Course', foodImages.biryani, true],
    ['Butter Chicken', 'Creamy tomato curry with tender tandoori chicken.', 280, 'Main Course', foodImages.curry, true],
    ['Paneer Butter Masala', 'Soft paneer in a rich, buttery tomato gravy.', 230, 'Main Course', foodImages.curry, true],
  ],
  2: [
    ['Chicken Burger', 'Grilled chicken, crisp lettuce and house sauce.', 180, 'Burgers', foodImages.burger, true],
    ['Veg Burger', 'A crunchy vegetable patty with fresh toppings.', 140, 'Burgers', foodImages.burger, true],
    ['Cheese Burger', 'Beef-free classic with a melty cheese slice.', 200, 'Burgers', foodImages.burger, true],
    ['French Fries', 'Golden fries tossed with a little sea salt.', 100, 'Sides', foodImages.pizza, true],
    ['Chicken Nuggets', 'Crispy bite-sized chicken with a dip.', 160, 'Sides', foodImages.burger, false],
    ['Grilled Sandwich', 'Toasted sandwich with cheese and vegetables.', 130, 'Snacks', foodImages.pizza, true],
  ],
  3: [
    ['Veg Salad', 'Crunchy greens, cucumber, tomato and lemon dressing.', 180, 'Healthy', foodImages.salad, true],
    ['Chicken Salad', 'Grilled chicken, greens and a light herb dressing.', 260, 'Healthy', foodImages.salad, true],
    ['Fruit Bowl', 'A fresh mix of seasonal cut fruit.', 150, 'Healthy', foodImages.dessert, true],
    ['Paneer Bowl', 'Spiced paneer, greens, grains and yogurt dressing.', 240, 'Main Course', foodImages.curry, true],
    ['Quinoa Bowl', 'Quinoa, roasted vegetables and citrus dressing.', 280, 'Main Course', foodImages.salad, true],
    ['Grilled Chicken Bowl', 'Lean grilled chicken with grains and greens.', 300, 'Main Course', foodImages.salad, false],
  ],
  4: [
    ['Margherita Pizza', 'Tomato, mozzarella and fresh basil on a crisp base.', 250, 'Pizza', foodImages.pizza, true],
    ['Farmhouse Pizza', 'Loaded with garden-fresh vegetables and cheese.', 320, 'Pizza', foodImages.pizza, true],
    ['Paneer Pizza', 'Tandoori paneer, peppers and a creamy drizzle.', 340, 'Pizza', foodImages.pizza, true],
    ['Chicken Pizza', 'Smoky chicken, onion and melted mozzarella.', 380, 'Pizza', foodImages.pizza, true],
    ['Cheese Burst Pizza', 'A golden crust filled with extra cheese.', 390, 'Pizza', foodImages.pizza, true],
    ['Veggie Pizza', 'Mushrooms, peppers, olives and sweet corn.', 300, 'Pizza', foodImages.pizza, false],
  ],
  5: [
    ['Hyderabadi Chicken Dum Biryani', 'Classic dum biryani with tender chicken.', 260, 'Biryani', foodImages.biryani, true],
    ['Mutton Dum Biryani', 'Slow-cooked mutton and long-grain basmati.', 340, 'Biryani', foodImages.biryani, true],
    ['Chicken 65', 'Crisp, spicy chicken bites with curry leaves.', 220, 'Snacks', foodImages.curry, true],
    ['Tandoori Chicken', 'Smoky yogurt-marinated chicken from the tandoor.', 320, 'Main Course', foodImages.curry, true],
    ['Egg Biryani', 'Fragrant dum rice served with spiced boiled egg.', 200, 'Biryani', foodImages.biryani, true],
    ['Double Ka Meetha', 'Hyderabadi bread pudding with saffron.', 120, 'Desserts', foodImages.dessert, false],
  ],
  6: [
    ['Masala Dosa', 'Crisp dosa filled with spiced potato masala.', 100, 'Main Course', foodImages.dosa, true],
    ['Plain Dosa', 'Golden, paper-thin dosa with chutney and sambar.', 80, 'Main Course', foodImages.dosa, true],
    ['Idli', 'Soft steamed rice cakes with fresh chutneys.', 60, 'Breakfast', foodImages.dosa, true],
    ['Medu Vada', 'Crisp lentil doughnuts served with sambar.', 70, 'Snacks', foodImages.dosa, true],
    ['Pongal', 'Comforting rice and lentils with pepper and ghee.', 90, 'Breakfast', foodImages.curry, true],
    ['Poori Masala', 'Puffy pooris with a warm potato curry.', 100, 'Breakfast', foodImages.dosa, false],
  ],
  7: [
    ['Classic Chicken Burger', 'Juicy chicken patty with lettuce and sauce.', 190, 'Burgers', foodImages.burger, true],
    ['Double Cheese Burger', 'Two patties, double cheese, big flavor.', 260, 'Burgers', foodImages.burger, true],
    ['Crispy Veg Burger', 'Crunchy veggie patty with tangy house sauce.', 150, 'Burgers', foodImages.burger, true],
    ['Chicken Wrap', 'Spiced chicken and salad wrapped up fresh.', 180, 'Snacks', foodImages.burger, true],
    ['Loaded Fries', 'Fries topped with cheese and jalapeños.', 160, 'Sides', foodImages.pizza, true],
    ['Cold Coffee', 'Chilled coffee blended smooth and creamy.', 120, 'Drinks', foodImages.drink, false],
  ],
  8: [
    ['Chocolate Cake', 'Rich chocolate sponge with silky ganache.', 150, 'Desserts', foodImages.dessert, true],
    ['Brownie', 'Fudgy chocolate brownie, baked in small batches.', 100, 'Desserts', foodImages.dessert, true],
    ['Gulab Jamun', 'Soft milk dumplings soaked in cardamom syrup.', 90, 'Desserts', foodImages.dessert, true],
    ['Vanilla Ice Cream', 'Creamy vanilla made for a sweet little break.', 80, 'Desserts', foodImages.dessert, true],
    ['Cheesecake', 'New York-style cheesecake with a buttery base.', 190, 'Desserts', foodImages.dessert, true],
    ['Chocolate Shake', 'Thick chocolate shake topped with cocoa.', 140, 'Drinks', foodImages.drink, false],
  ],
}

export const menuItems = Object.entries(menus).flatMap(([restaurantId, items]) => items.map(([name, description, price, category, image, available], index) => ({
  id: Number(restaurantId) * 100 + index + 1,
  restaurantId: Number(restaurantId), name, description, price, category, image, available,
})))
