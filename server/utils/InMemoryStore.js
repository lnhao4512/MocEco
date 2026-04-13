const mongoose = require('mongoose');

function oid() { return new mongoose.Types.ObjectId().toString(); }
function clone(v) { return JSON.parse(JSON.stringify(v)); }

// Helper: build sizes array
const mkSizes = (defs) => defs.map(([name, stock, price = null]) => ({ name, stock, price }));

// ── Cấp 1 ──
const catNam    = { _id: oid(), name: 'Nam',         parentId: null };
const catNu     = { _id: oid(), name: 'Nữ',          parentId: null };
const catTreEm  = { _id: oid(), name: 'Trẻ em',      parentId: null };
const catUnisex = { _id: oid(), name: 'Unisex',      parentId: null };
const catSale   = { _id: oid(), name: 'Sale',         parentId: null };
const catNewArr = { _id: oid(), name: 'New Arrivals', parentId: null };

// ── Cấp 2 ──
const catNamAo   = { _id: oid(), name: 'Áo',   parentId: catNam._id };
const catNamQuan = { _id: oid(), name: 'Quần', parentId: catNam._id };
const catNuAo    = { _id: oid(), name: 'Áo',   parentId: catNu._id  };
const catNuVay   = { _id: oid(), name: 'Váy',  parentId: catNu._id  };
const catUniAo   = { _id: oid(), name: 'Áo',   parentId: catUnisex._id };
const catUniQuan = { _id: oid(), name: 'Quần', parentId: catUnisex._id };

// ── Cấp 3 – Leaf nodes ──
const catAoThunNam    = { _id: oid(), name: 'Áo thun',  parentId: catNamAo._id   };
const catAoSomiNam    = { _id: oid(), name: 'Áo sơ mi', parentId: catNamAo._id   };
const catHoodieNam    = { _id: oid(), name: 'Hoodie',    parentId: catNamAo._id   };
const catQuanJeanNam  = { _id: oid(), name: 'Quần jean',  parentId: catNamQuan._id };
const catQuanShortNam = { _id: oid(), name: 'Quần short', parentId: catNamQuan._id };
const catAoThunNu     = { _id: oid(), name: 'Áo thun nữ', parentId: catNuAo._id   };
const catAoBlouse     = { _id: oid(), name: 'Blouse',      parentId: catNuAo._id   };
const catVayNgan      = { _id: oid(), name: 'Váy ngắn',    parentId: catNuVay._id  };
const catQuanLegging  = { _id: oid(), name: 'Quần legging', parentId: catNuAo._id  };
const catUniHoodie    = { _id: oid(), name: 'Hoodie unisex',  parentId: catUniAo._id   };
const catUniTee       = { _id: oid(), name: 'Áo thun unisex', parentId: catUniAo._id   };

const categories = [
  catNam, catNu, catTreEm, catUnisex, catSale, catNewArr,
  catNamAo, catNamQuan, catNuAo, catNuVay, catUniAo, catUniQuan,
  catAoThunNam, catAoSomiNam, catHoodieNam,
  catQuanJeanNam, catQuanShortNam,
  catAoThunNu, catAoBlouse, catVayNgan, catQuanLegging,
  catUniHoodie, catUniTee
];

// ── Products với sizes ──
const products = [
  {
    _id: oid(), name: 'Áo Thun Nam Basic Trắng', price: 299000, image: '', cdate: Date.now() - 1000000,
    category: catAoThunNam,
    sizes: mkSizes([['S',45],['M',60],['L',50],['XL',30],['XXL',10],['XXXL',0]])
  },
  {
    _id: oid(), name: 'Áo Thun Nam Oversize Đen', price: 350000, image: '', cdate: Date.now() - 900000,
    category: catAoThunNam,
    sizes: mkSizes([['S',20],['M',35],['L',40],['XL',25],['XXL',5],['XXXL',0]])
  },
  {
    _id: oid(), name: 'Áo Sơ Mi Kẻ Caro Flannel', price: 450000, image: '', cdate: Date.now() - 700000,
    category: catAoSomiNam,
    sizes: mkSizes([['S',10],['M',25],['L',30],['XL',15],['XXL',5]])
  },
  {
    _id: oid(), name: 'Hoodie Nam Cotton Nặng', price: 699000, image: '', cdate: Date.now() - 500000,
    category: catHoodieNam,
    sizes: mkSizes([['S',15],['M',30],['L',40],['XL',20],['XXL',8,749000],['XXXL',3,799000]])
  },
  {
    _id: oid(), name: 'Quần Jean Nam Slim Fit', price: 599000, image: '', cdate: Date.now() - 300000,
    category: catQuanJeanNam,
    sizes: mkSizes([['S',5],['M',20],['L',25],['XL',15],['XXL',5]])
  },
  {
    _id: oid(), name: 'Quần Short Thể Thao', price: 299000, image: '', cdate: Date.now() - 100000,
    category: catQuanShortNam,
    sizes: mkSizes([['S',30],['M',45],['L',50],['XL',30],['XXL',10]])
  },
  {
    _id: oid(), name: 'Áo Thun Nữ Crop Top', price: 259000, image: '', cdate: Date.now() - 50000,
    category: catAoThunNu,
    sizes: mkSizes([['S',40],['M',50],['L',35],['XL',15],['XXL',0]])
  },
  {
    _id: oid(), name: 'Blouse Hoa Nhí Tay Bồng', price: 480000, image: '', cdate: Date.now() - 80000,
    category: catAoBlouse,
    sizes: mkSizes([['S',20],['M',28],['L',15],['XL',6],['XXL',0]])
  },
  {
    _id: oid(), name: 'Váy Ngắn Chữ A', price: 399000, image: '', cdate: Date.now() - 120000,
    category: catVayNgan,
    sizes: mkSizes([['S',18],['M',22],['L',15],['XL',5]])
  },
  {
    _id: oid(), name: 'Hoodie Unisex Premium', price: 750000, image: '', cdate: Date.now() - 30000,
    category: catUniHoodie,
    sizes: mkSizes([['S',10],['M',20],['L',25],['XL',15],['XXL',5,800000],['XXXL',2,850000]])
  },
  {
    _id: oid(), name: 'Áo Thun Unisex Graphic', price: 280000, image: '', cdate: Date.now() - 15000,
    category: catUniTee,
    sizes: mkSizes([['S',30],['M',40],['L',35],['XL',20],['XXL',8]])
  }
];

const MyConstants = require('./MyConstants');

const store = {
  admins:    [{ _id: oid(), username: 'admin', password: 'admin' }],
  categories,
  customers: [{
    _id: oid(), username: 'sonkk', password: '123',
    name: 'Son', phone: '0900000000', email: 'son@example.com',
    active: 1, token: 'default-active-token'
  }],
  products,
  orders: [],
  checkoutOrders: [],
  // ── Shipping / delivery config ──────────────────────────────────────────────
  shippingConfig: {
    fee:              MyConstants.SHIPPING_FEE || 70000,
    freeShipThreshold: 0,       // 0 = không có miễn ship
    estDays:          '2-4',    // thời gian giao dự kiến
    note:             'Giao hàng toàn quốc',
    updatedAt:        null
  }
};

module.exports = { store, oid, clone };
