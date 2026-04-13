require('../utils/MongooseUtil');
const Models = require('./Models');
const { isMongoReady } = require('../utils/DbMode');
const { store, oid, clone } = require('../utils/InMemoryStore');

const OrderDAO = {
  async insert(order) {
    if (!isMongoReady()) {
      const created = { ...order, _id: oid() };
      store.orders.push(created);
      return clone(created);
    }
    const mongoose = require('mongoose');
    order._id = new mongoose.Types.ObjectId();
    const result = await Models.Order.create(order);
    return result;
  },

  async selectByCustID(_cid) {
    if (!isMongoReady()) {
      const orders = store.orders.filter((o) => o.customer && String(o.customer._id) === String(_cid));
      return clone(orders);
    }
    const query = { 'customer._id': _cid };
    const orders = await Models.Order.find(query).exec();
    return orders;
  }
,
  async selectAll() {
    if (!isMongoReady()) {
      const orders = [...store.orders].sort((a, b) => b.cdate - a.cdate);
      return clone(orders);
    }
    const query = {};
    const mysort = { cdate: -1 };
    const orders = await Models.Order.find(query).sort(mysort).exec();
    return orders;
  },
  async selectRecent(limit) {
    if (!isMongoReady()) {
      const orders = [...store.orders].sort((a, b) => (b.createdAt || b.cdate || 0) - (a.createdAt || a.cdate || 0)).slice(0, limit);
      return clone(orders);
    }
    return await Models.Order.find({}).sort({ createdAt: -1, cdate: -1 }).limit(limit).exec();
  },
  async update(_id, newStatus) {
    if (!isMongoReady()) {
      const idx = store.orders.findIndex((o) => o._id === String(_id));
      if (idx === -1) return null;
      store.orders[idx].status = newStatus;
      return clone(store.orders[idx]);
    }
    const newvalues = { status: newStatus };
    const result = await Models.Order.findByIdAndUpdate(_id, newvalues, { new: true });
    return result;
  }
};
module.exports = OrderDAO;

