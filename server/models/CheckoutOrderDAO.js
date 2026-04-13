require('../utils/MongooseUtil');
const Models = require('./Models');
const { isMongoReady } = require('../utils/DbMode');
const { store, oid, clone } = require('../utils/InMemoryStore');

// Ensure in-memory store has checkoutOrders array
if (!store.checkoutOrders) store.checkoutOrders = [];

const CheckoutOrderDAO = {

  async insert(order) {
    if (!isMongoReady()) {
      const created = { ...order, _id: oid(), createdAt: new Date() };
      store.checkoutOrders.push(created);
      return clone(created);
    }
    const mongoose = require('mongoose');
    order._id = new mongoose.Types.ObjectId();
    const result = await Models.CheckoutOrder.create(order);
    return result;
  },

  async selectById(_id) {
    if (!isMongoReady()) {
      const found = store.checkoutOrders.find(o => String(o._id) === String(_id));
      return found ? clone(found) : null;
    }
    return await Models.CheckoutOrder.findById(_id).exec();
  },

  async selectAll() {
    if (!isMongoReady()) {
      return clone([...store.checkoutOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
    return await Models.CheckoutOrder.find({}).sort({ createdAt: -1 }).exec();
  },

  async selectByCustId(userId) {
    if (!isMongoReady()) {
      return clone(store.checkoutOrders.filter(o => String(o.userId) === String(userId)));
    }
    return await Models.CheckoutOrder.find({ userId }).sort({ createdAt: -1 }).exec();
  },

  async updatePaymentStatus(_id, paymentStatus) {
    if (!isMongoReady()) {
      const idx = store.checkoutOrders.findIndex(o => String(o._id) === String(_id));
      if (idx === -1) return null;
      store.checkoutOrders[idx].paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') store.checkoutOrders[idx].paidAt = new Date();
      return clone(store.checkoutOrders[idx]);
    }
    const update = { paymentStatus };
    if (paymentStatus === 'paid') update.paidAt = new Date();
    return await Models.CheckoutOrder.findByIdAndUpdate(_id, update, { new: true });
  },

  async updateOrderStatus(_id, orderStatus) {
    if (!isMongoReady()) {
      const idx = store.checkoutOrders.findIndex(o => String(o._id) === String(_id));
      if (idx === -1) return null;
      store.checkoutOrders[idx].orderStatus = orderStatus;
      return clone(store.checkoutOrders[idx]);
    }
    return await Models.CheckoutOrder.findByIdAndUpdate(_id, { orderStatus }, { new: true });
  }
};

module.exports = CheckoutOrderDAO;
