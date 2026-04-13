const express = require('express');
const router = express.Router();
const Models = require('../models/Models');
const JwtUtil = require('../utils/JwtUtil');

// GET /api/customer/cart/:userId
router.get('/cart/:userId', JwtUtil.checkToken, async function (req, res) {
    try {
        const userId = req.params.userId;
        const cart = await Models.Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.json({ success: true, cart: { userId, items: [] } });
        }
        res.json({ success: true, cart });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/customer/cart/add
router.post('/cart/add', JwtUtil.checkToken, async function (req, res) {
    try {
        const { userId, productId, quantity, price } = req.body;
        if (!userId || !productId || !quantity || !price) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        let cart = await Models.Cart.findOne({ userId });
        if (!cart) {
            cart = new Models.Cart({ userId, items: [] });
        }

        // Check if item exists in cart
        const itemIndex = cart.items.findIndex(p => p.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, quantity, price });
        }

        cart.updatedAt = new Date();
        await cart.save();
        
        const populatedCart = await Models.Cart.findById(cart._id).populate('items.productId');
        res.json({ success: true, cart: populatedCart });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/customer/cart/update
router.put('/cart/update', JwtUtil.checkToken, async function (req, res) {
    try {
        const { userId, productId, quantity } = req.body;
        const cart = await Models.Cart.findOne({ userId });
        
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(p => p.productId.toString() === productId);
        if (itemIndex > -1) {
            if (quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = quantity;
            }
            cart.updatedAt = new Date();
            await cart.save();
            const populatedCart = await Models.Cart.findById(cart._id).populate('items.productId');
            return res.json({ success: true, cart: populatedCart });
        }
        
        res.status(404).json({ success: false, message: "Item not found in cart" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/customer/cart/remove
router.delete('/cart/remove', JwtUtil.checkToken, async function (req, res) {
    try {
        const { userId, productId } = req.body;
        const cart = await Models.Cart.findOne({ userId });
        
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        cart.items = cart.items.filter(p => !(p.productId.toString() === productId));
        cart.updatedAt = new Date();
        await cart.save();
        
        const populatedCart = await Models.Cart.findById(cart._id).populate('items.productId');
        res.json({ success: true, cart: populatedCart });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/customer/cart/clear/:userId
router.delete('/cart/clear/:userId', JwtUtil.checkToken, async function (req, res) {
    try {
        const userId = req.params.userId;
        const cart = await Models.Cart.findOne({ userId });
        if (cart) {
            cart.items = [];
            cart.updatedAt = new Date();
            await cart.save();
        }
        res.json({ success: true, cart });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
