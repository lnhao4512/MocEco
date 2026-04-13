require('../utils/MongooseUtil');
const Models = require('./Models');
const mongoose = require('mongoose');
const { isMongoReady } = require('../utils/DbMode');
const { store, oid, clone } = require('../utils/InMemoryStore');

const ProductDAO = {
  // ── SELECT ALL ────────────────────────────────────────────────────────────
  async selectAll() {
    if (!isMongoReady()) return clone(store.products);
    const products = await Models.Product.find({}).exec();
    return products;
  },

  // ── SELECT BY ID ──────────────────────────────────────────────────────────
  async selectByID(_id) {
    if (!isMongoReady()) {
      const product = store.products.find((p) => p._id === String(_id));
      return product ? clone(product) : null;
    }
    const product = await Models.Product.findById(_id).exec();
    return product;
  },

  // ── SELECT BY CATEGORY ID (single) ───────────────────────────────────────
  async selectByCatID(_cid) {
    if (!isMongoReady()) {
      const products = store.products.filter(
        (p) => p.category && String(p.category._id) === String(_cid)
      );
      return clone(products);
    }
    const products = await Models.Product.find({ 'category._id': _cid }).exec();
    return products;
  },

  // ── SELECT BY MULTIPLE CATEGORY IDs (category tree) ──────────────────────
  async selectByCatIDs(catIds) {
    if (!isMongoReady()) {
      const ids = catIds.map(String);
      const products = store.products.filter(
        (p) => p.category && ids.includes(String(p.category._id))
      );
      return clone(products);
    }
    const products = await Models.Product.find({
      'category._id': { $in: catIds }
    }).exec();
    return products;
  },

  // ── (Removed selectBySize) ────────────────────────────────────────────────

  // ── SELECT BY KEYWORD ─────────────────────────────────────────────────────
  async selectByKeyword(keyword) {
    if (!isMongoReady()) {
      const q = String(keyword || '').toLowerCase();
      const products = store.products.filter((p) =>
        String(p.name || '').toLowerCase().includes(q)
      );
      return clone(products);
    }
    const products = await Models.Product.find({
      name: { $regex: new RegExp(keyword, 'i') }
    }).exec();
    return products;
  },

  // ── INSERT ────────────────────────────────────────────────────────────────
  async insert(product) {
    if (!isMongoReady()) {
      const created = { 
        ...product, 
        _id: oid(), 
        stock: product.stock !== undefined ? product.stock : 0
      };
      store.products.push(created);
      return clone(created);
    }
    product._id = new mongoose.Types.ObjectId();
    const result = await Models.Product.create(product);
    return result;
  },

  // ── UPDATE ────────────────────────────────────────────────────────────────
  async update(product) {
    if (!isMongoReady()) {
      const idx = store.products.findIndex((p) => p._id === String(product._id));
      if (idx === -1) return null;
      store.products[idx] = {
        ...store.products[idx],
        name: product.name,
        price: product.price,
        image: product.image,
        cdate: product.cdate,
        category: product.category,
        stock: product.stock || 0
      };
      return clone(store.products[idx]);
    }
    const newvalues = {
      name:       product.name,
      price:      product.price,
      image:      product.image,
      cdate:      product.cdate,
      category:   product.category,
      stock:      product.stock !== undefined ? Number(product.stock) : 0,
      updatedAt:  new Date()
    };
    const result = await Models.Product.findByIdAndUpdate(
      product._id, { $set: newvalues }, { new: true }
    );
    return result;
  },

  // ── DELETE ────────────────────────────────────────────────────────────────
  async delete(_id) {
    if (!isMongoReady()) {
      const idx = store.products.findIndex((p) => p._id === String(_id));
      if (idx === -1) return null;
      const deleted = store.products[idx];
      store.products.splice(idx, 1);
      return clone(deleted);
    }
    const result = await Models.Product.findByIdAndDelete(_id);
    return result;
  },

  // ── TOP NEW ───────────────────────────────────────────────────────────────
  async selectTopNew(top) {
    if (!isMongoReady()) {
      const products = [...store.products]
        .sort((a, b) => b.cdate - a.cdate)
        .slice(0, top);
      return clone(products);
    }
    const products = await Models.Product.find({})
      .sort({ cdate: -1 })
      .limit(top)
      .exec();
    return products;
  },

  // ── TOP HOT ───────────────────────────────────────────────────────────────
  async selectTopHot(top) {
    if (!isMongoReady()) {
      const approved = store.orders.filter((o) => o.status === 'APPROVED');
      const qtyByProduct = {};
      approved.forEach((order) => {
        (order.items || []).forEach((item) => {
          const pid = item.product && item.product._id;
          if (!pid) return;
          qtyByProduct[pid] = (qtyByProduct[pid] || 0) + Number(item.quantity || 0);
        });
      });
      const sortedIds = Object.keys(qtyByProduct)
        .sort((a, b) => qtyByProduct[b] - qtyByProduct[a])
        .slice(0, top);
      const hotProducts = sortedIds
        .map((id) => store.products.find((p) => p._id === id))
        .filter(Boolean);
      return clone(hotProducts);
    }
    const items = await Models.Order.aggregate([
      { $match: { status: 'APPROVED' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product._id', sum: { $sum: '$items.quantity' } } },
      { $sort: { sum: -1 } },
      { $limit: top }
    ]).exec();

    const products = [];
    for (const item of items) {
      const product = await ProductDAO.selectByID(item._id);
      products.push(product);
    }
    return products;
  }
};

module.exports = ProductDAO;