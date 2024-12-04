const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());

let menuItems = [];
let orders = [];

// Endpoint to add or update menu items
app.post('/menu', (req, res) => {
    const { id, name, price, category } = req.body;
    if (price <= 0 || !['appetizer', 'main', 'dessert'].includes(category)) {
        return res.status(400).send('Invalid menu item data');
    }
    
    const existingItemIndex = menuItems.findIndex(item => item.id === id);
    if (existingItemIndex > -1) {
        menuItems[existingItemIndex] = { id, name, price, category };
    } else {
        menuItems.push({ id, name, price, category });
    }
    
    res.status(200).json(menuItems);
});

// Endpoint to get menu items
app.get('/menu', (req, res) => {
    res.status(200).json(menuItems);
});

// Endpoint to place an order
app.post('/orders', (req, res) => {
    const { items } = req.body;
    if (!items.every(itemId => menuItems.some(item => item.id === itemId))) {
        return res.status(400).send('One or more item IDs are invalid');
    }

    const newOrder = {
        id: orders.length + 1,
        items,
        status: 'Preparing'
    };
    orders.push(newOrder);
    
    res.status(201).json(newOrder);
});

// Endpoint to get details of a specific order
app.get('/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        return res.status(404).send('Order not found');
    }
    
    res.status(200).json(order);
});

// Cron job to update order statuses periodically
cron.schedule('* * * * *', () => {
    orders.forEach(order => {
        if (order.status === 'Preparing') {
            order.status = 'Out for Delivery';
        } else if (order.status === 'Out for Delivery') {
            order.status = 'Delivered';
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});