require('../utils/MongooseUtil');
const Models = require('./Models');
const mongoose = require('mongoose');
const { isMongoReady } = require('../utils/DbMode');
const { store, oid, clone } = require('../utils/InMemoryStore');

// Helper: build tree từ flat list
function buildTree(flatList, parentId = null) {
  return flatList
    .filter((c) => String(c.parentId || null) === String(parentId))
    .map((c) => ({
      ...c.toObject ? c.toObject() : c,
      children: buildTree(flatList, c._id)
    }));
}

// Helper: lấy tất cả ID con cháu (recursive) từ flat list
function getDescendantIds(flatList, parentId) {
  const directChildren = flatList.filter(
    (c) => String(c.parentId || null) === String(parentId)
  );
  let ids = directChildren.map((c) => c._id);
  for (const child of directChildren) {
    ids = ids.concat(getDescendantIds(flatList, child._id));
  }
  return ids;
}

const CategoryDAO = {
  // Lấy tất cả categories (flat list, có parentId)
  async selectAll() {
    if (!isMongoReady()) return clone(store.categories);
    const categories = await Models.Category.find({}).exec();
    return categories;
  },

  // Lấy danh mục dạng cây (nested tree)
  async selectTree() {
    if (!isMongoReady()) {
      const flat = clone(store.categories);
      return buildTree(flat);
    }
    const flat = await Models.Category.find({}).exec();
    return buildTree(flat);
  },

  // Lấy chỉ leaf categories (không có con) – dùng cho dropdown chọn category sản phẩm
  async selectLeaves() {
    if (!isMongoReady()) {
      const flat = clone(store.categories);
      const parentIds = new Set(flat.map((c) => String(c.parentId || '')).filter(Boolean));
      return flat.filter((c) => !parentIds.has(String(c._id)));
    }
    const flat = await Models.Category.find({}).exec();
    const parentIds = new Set(
      flat.map((c) => (c.parentId ? String(c.parentId) : '')).filter(Boolean)
    );
    return flat.filter((c) => !parentIds.has(String(c._id)));
  },

  // Lấy tất cả ID con cháu của một category (kể cả chính nó)
  async selectDescendantIds(parentId) {
    if (!isMongoReady()) {
      const flat = clone(store.categories);
      const ids = getDescendantIds(flat, parentId);
      return [parentId, ...ids.map((i) => String(i))];
    }
    const flat = await Models.Category.find({}).exec();
    const ids = getDescendantIds(flat, parentId);
    return [parentId, ...ids.map((i) => String(i))];
  },

  async insert(category) {
    if (!isMongoReady()) {
      const created = {
        _id: oid(),
        name: category.name,
        parentId: category.parentId || null
      };
      store.categories.push(created);
      return clone(created);
    }
    category._id = new mongoose.Types.ObjectId();
    category.parentId = category.parentId
      ? new mongoose.Types.ObjectId(category.parentId)
      : null;
    const result = await Models.Category.create(category);
    return result;
  },

  async update(category) {
    if (!isMongoReady()) {
      const idx = store.categories.findIndex((c) => c._id === String(category._id));
      if (idx === -1) return null;
      store.categories[idx].name = category.name;
      store.categories[idx].parentId = category.parentId || null;
      return clone(store.categories[idx]);
    }
    const newvalues = {
      name: category.name,
      parentId: category.parentId
        ? new mongoose.Types.ObjectId(category.parentId)
        : null
    };
    const result = await Models.Category.findByIdAndUpdate(category._id, newvalues, { new: true });
    return result;
  },

  async delete(_id) {
    if (!isMongoReady()) {
      const idx = store.categories.findIndex((c) => c._id === String(_id));
      if (idx === -1) return null;
      const deleted = store.categories[idx];
      store.categories.splice(idx, 1);
      return clone(deleted);
    }
    // Kiểm tra có con không trước khi xóa
    const children = await Models.Category.find({ parentId: _id }).exec();
    if (children.length > 0) {
      throw new Error('Không thể xóa danh mục đang có danh mục con');
    }
    const result = await Models.Category.findByIdAndDelete(_id);
    return result;
  },

  async selectByID(_id) {
    if (!isMongoReady()) {
      const category = store.categories.find((c) => c._id === String(_id));
      return category ? clone(category) : null;
    }
    const category = await Models.Category.findById(_id).exec();
    return category;
  }
};

module.exports = CategoryDAO;