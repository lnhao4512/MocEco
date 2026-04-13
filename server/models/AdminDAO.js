require('../utils/MongooseUtil');
const Models = require('./Models');
const mongoose = require('mongoose');
const CryptoUtil = require('../utils/CryptoUtil');
const { isMongoReady, useInMemoryFallback } = require('../utils/DbMode');
const { store, oid, clone } = require('../utils/InMemoryStore');

const AdminDAO = {
  async selectByUsernameAndPassword(username, password) {
    if (!isMongoReady() && useInMemoryFallback()) {
      const admin = store.admins.find((a) => a.username === username && a.password === password);
      return admin ? clone(admin) : null;
    }
    const query = { username: username };
    const admin = await Models.Admin.findOne(query).exec();
    if (!admin) return null;
    const md5Password = CryptoUtil.md5(String(password));
    if (admin.password === password || admin.password === md5Password) return admin;
    return null;
  },
  async selectAll() {
    if (!isMongoReady() && useInMemoryFallback()) return clone(store.admins);
    const admins = await Models.Admin.find({});
    return admins;
  },
  async insert(username, password) {
    if (!isMongoReady() && useInMemoryFallback()) {
      const admin = { _id: oid(), username, password };
      store.admins.push(admin);
      return clone(admin);
    }
    const admin = new Models.Admin({
      _id: new mongoose.Types.ObjectId(),
      username: username,
      password: password
    });
    await admin.save();
    return admin;
  }
};
module.exports = AdminDAO;