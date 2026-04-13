const Models = require('./Models');
const CryptoUtil = require('../utils/CryptoUtil');
const { isMongoReady, useInMemoryFallback } = require('../utils/DbMode');
const { store, oid, clone } = require('../utils/InMemoryStore');

const CustomerDAO = {
  async selectByUsernameOrEmail(username, email) {
    if (!isMongoReady() && useInMemoryFallback()) {
      const customer = store.customers.find((c) => c.username === username || c.email === email);
      return customer ? clone(customer) : null;
    }
    const query = { $or: [{ username: username }, { email: email }] };
    const customer = await Models.Customer.findOne(query);
    return customer;
  },
  async insert(customer) {
    if (!isMongoReady() && useInMemoryFallback()) {
      const created = { ...customer, _id: oid() };
      store.customers.push(created);
      return clone(created);
    }
    const mongoose = require('mongoose');
    customer._id = new mongoose.Types.ObjectId();
    const result = await Models.Customer.create(customer);
    return result;
  },
  async active(_id, token, active) {
    if (!isMongoReady() && useInMemoryFallback()) {
      const customer = store.customers.find((c) => c._id === String(_id) && c.token === token);
      if (!customer) return null;
      customer.active = active;
      return clone(customer);
    }
    const query = { _id: _id, token: token };
    const newvalues = { active: active };
    const result = await Models.Customer.findOneAndUpdate(query, newvalues, { new: true });
    return result;
  },
  async selectByUsernameAndPassword(username, password) {
    if (!isMongoReady() && useInMemoryFallback()) {
      const md5Password = CryptoUtil.md5(String(password));
      const customer = store.customers.find((c) => c.username === username && (c.password === password || c.password === md5Password));
      return customer ? clone(customer) : null;
    }
    const query = { username: username };
    const customer = await Models.Customer.findOne(query).exec();
    if (!customer) return null;
    const md5Password = CryptoUtil.md5(String(password));
    if (customer.password === password || customer.password === md5Password) return customer;
    return null;
  },
  async update(customer) {
    if (!isMongoReady() && useInMemoryFallback()) {
      const idx = store.customers.findIndex((c) => c._id === String(customer._id));
      if (idx === -1) return null;
      store.customers[idx] = {
        ...store.customers[idx],
        username: customer.username,
        password: customer.password,
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      };
      return clone(store.customers[idx]);
    }
    const newvalues = {
      username: customer.username,
      password: customer.password,
      name: customer.name,
      phone: customer.phone,
      email: customer.email
    };
    const result = await Models.Customer.findByIdAndUpdate(customer._id, newvalues, { new: true });
    return result;
  },
  async selectAll() {
    if (!isMongoReady() && useInMemoryFallback()) return clone(store.customers);
    const query = {};
    const customers = await Models.Customer.find(query).exec();
    return customers;
  },
  async selectByID(_id) {
    if (!isMongoReady() && useInMemoryFallback()) {
      const customer = store.customers.find((c) => c._id === String(_id));
      return customer ? clone(customer) : null;
    }
    const customer = await Models.Customer.findById(_id).exec();
    return customer;
  }
};

module.exports = CustomerDAO;
