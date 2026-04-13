// CLI: npm install mongoose --save
const mongoose = require('mongoose');

// schemas
const AdminSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    password: String
}, { versionKey: false });

const CategorySchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }
}, { versionKey: false });

const CustomerSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    password: String,
    name: String,
    phone: String,
    email: String,
    active: Number,
    token: String,
}, { versionKey: false });

const ProductSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,      // giá cơ bản (dùng khi size.price = null)
    image: String,
    cdate: Number,
    category: CategorySchema,
    stock: { type: Number, default: 0 },              // số lượng tồn kho
    updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });

const CartItemSchema = mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity:  { type: Number, required: true, min: 1 },
    price:     { type: Number, required: true }
}, { versionKey: false, _id: false });

const CartSchema = mongoose.Schema({
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
    items:     [CartItemSchema],
    updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });

const OrderItemSchema = mongoose.Schema({
    productId: String,
    name: String,
    image: String,
    quantity: Number,
    price: Number
}, { versionKey: false, _id: false });

const OrderSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: String,
    email: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
        street:   { type: String, required: true },
        building: { type: String, default: '' },
        ward:     { type: String, required: true },
        district: { type: String, required: true },
        city:     { type: String, required: true },
        country:  { type: String, default: 'Việt Nam' }
    },
    items: [OrderItemSchema],
    totalAmount:   { type: Number, required: true },
    shippingFee:   { type: Number, default: 70000 },
    paymentMethod: { type: String, enum: ['cod', 'bank_transfer'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    orderStatus:   { type: String, enum: ['processing', 'shipping', 'completed', 'cancelled'], default: 'processing' },
    qrCodeUrl:     { type: String, default: '' },
    bankInfo: {
        accountNo: String,
        bankCode:  String
    },
    paidAt:    { type: Date },
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const AboutSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: { type: String, default: 'Câu Chuyện Của Mộc' },
    description: { type: String, default: '' },
    image: { type: String, default: '' }, // Base64
    logo: { type: String, default: '' },  // Base64 (Small icon inside story)
    navbarLogo: { type: String, default: '' }, // Base64 (Logo for top navbar)
    video: { type: String, default: '' },  // Base64
    philosophy: { type: String, default: '' },
    mission: { type: String, default: '' },
    vision: { type: String, default: '' },
    values: { type: String, default: '' }
}, { versionKey: false });

const HeroSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    video: { type: String, default: '' }  // URL to file
}, { versionKey: false });

const SkinAnalysisSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: String, required: true }, // Changed to String to support both real and mock IDs
    image: String, // Base64
    skinType: String, 
    concerns: {
        acne: { type: Number, default: 0 }, 
        pores: { type: Number, default: 0 },
        wrinkles: { type: Number, default: 0 },
        hydration: { type: Number, default: 0 } 
    },
    reasons: {
        acne: String,
        pores: String
    },
    recommendations: [String],
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

// models
const Admin         = mongoose.model('Admin',         AdminSchema);
const Category      = mongoose.model('Category',      CategorySchema);
const Customer      = mongoose.model('Customer',      CustomerSchema);
const Product       = mongoose.model('Product',       ProductSchema);
const Cart          = mongoose.model('Cart',          CartSchema);
const Order         = mongoose.model('Order',         OrderSchema);
const About         = mongoose.model('About',         AboutSchema);
const Hero          = mongoose.model('Hero',          HeroSchema);
const SkinAnalysis  = mongoose.model('SkinAnalysis',  SkinAnalysisSchema);

const CheckoutOrder = mongoose.model('CheckoutOrder', OrderSchema, 'orders');

module.exports = { Admin, Category, Customer, Product, Cart, Order, CheckoutOrder, About, Hero, SkinAnalysis };