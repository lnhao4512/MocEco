require('dotenv').config();
const mongoose = require('mongoose');
const MyConstants = require('./utils/MyConstants');
const Models = require('./models/Models');

// Dùng cùng logic kết nối như MongooseUtil
let uri = MyConstants.DB_URI;
if (!uri) {
  const hasUser = Boolean(MyConstants.DB_USER);
  const isAtlasLike = String(MyConstants.DB_SERVER || '').includes('mongodb.net');
  if (hasUser && isAtlasLike) {
    uri = 'mongodb+srv://' + encodeURIComponent(MyConstants.DB_USER) + ':' +
          encodeURIComponent(MyConstants.DB_PASS || '') + '@' +
          MyConstants.DB_SERVER + '/' + MyConstants.DB_DATABASE;
  } else {
    uri = 'mongodb://127.0.0.1:27017/' + MyConstants.DB_DATABASE;
  }
}

// Helper: tạo sizes array
const mkSizes = (defs) => defs.map(([name, stock, price = null]) => ({ name, stock, price }));

mongoose.connect(uri)
  .then(async () => {
    console.log('✅ Đã kết nối MongoDB. Tạo dữ liệu mẫu...\n');

    // ──────────────────── ADMIN ────────────────────
    await Models.Admin.deleteMany({});
    await new Models.Admin({ _id: new mongoose.Types.ObjectId(), username: 'admin', password: '123' }).save();
    console.log('✔ Admin: username="admin", password="123"');

    // ──────────────────── CATEGORIES (3 cấp) ────────────────────
    await Models.Category.deleteMany({});
    const id = () => new mongoose.Types.ObjectId();

    // Cấp 1
    const catNam    = { _id: id(), name: 'Nam',         parentId: null };
    const catNu     = { _id: id(), name: 'Nữ',          parentId: null };
    const catTreEm  = { _id: id(), name: 'Trẻ em',      parentId: null };
    const catUnisex = { _id: id(), name: 'Unisex',      parentId: null };
    const catSale   = { _id: id(), name: 'Sale',         parentId: null };
    const catNewArr = { _id: id(), name: 'New Arrivals', parentId: null };

    // Cấp 2
    const catNamAo   = { _id: id(), name: 'Áo',   parentId: catNam._id };
    const catNamQuan = { _id: id(), name: 'Quần', parentId: catNam._id };
    const catNamGiay = { _id: id(), name: 'Giày', parentId: catNam._id };
    const catNuAo    = { _id: id(), name: 'Áo',   parentId: catNu._id  };
    const catNuQuan  = { _id: id(), name: 'Quần', parentId: catNu._id  };
    const catNuVay   = { _id: id(), name: 'Váy',  parentId: catNu._id  };
    const catBeTrai  = { _id: id(), name: 'Bé trai', parentId: catTreEm._id };
    const catBeGai   = { _id: id(), name: 'Bé gái',  parentId: catTreEm._id };
    const catUniAo   = { _id: id(), name: 'Áo',   parentId: catUnisex._id };
    const catUniQuan = { _id: id(), name: 'Quần', parentId: catUnisex._id };

    // Cấp 3 – Nam > Áo
    const catAoThunNam   = { _id: id(), name: 'Áo thun',  parentId: catNamAo._id };
    const catAoSomiNam   = { _id: id(), name: 'Áo sơ mi', parentId: catNamAo._id };
    const catHoodieNam   = { _id: id(), name: 'Hoodie',    parentId: catNamAo._id };
    const catAoKhoac     = { _id: id(), name: 'Áo khoác',  parentId: catNamAo._id };
    // Cấp 3 – Nam > Quần
    const catQuanJeanNam  = { _id: id(), name: 'Quần jean',  parentId: catNamQuan._id };
    const catQuanShortNam = { _id: id(), name: 'Quần short', parentId: catNamQuan._id };
    const catQuanKakhi    = { _id: id(), name: 'Quần kaki',  parentId: catNamQuan._id };
    // Cấp 3 – Nữ > Áo
    const catAoThunNu    = { _id: id(), name: 'Áo thun nữ', parentId: catNuAo._id };
    const catAoKieuNu    = { _id: id(), name: 'Áo kiểu',    parentId: catNuAo._id };
    const catAoBlouse    = { _id: id(), name: 'Blouse',      parentId: catNuAo._id };
    // Cấp 3 – Nữ > Quần / Váy
    const catQuanLegging = { _id: id(), name: 'Quần legging', parentId: catNuQuan._id };
    const catQuanJeanNu  = { _id: id(), name: 'Quần jean nữ', parentId: catNuQuan._id };
    const catVayNgan     = { _id: id(), name: 'Váy ngắn',     parentId: catNuVay._id  };
    const catVayDai      = { _id: id(), name: 'Váy dài',      parentId: catNuVay._id  };
    // Cấp 3 – Trẻ em
    const catBeTraiAo    = { _id: id(), name: 'Áo bé trai',   parentId: catBeTrai._id };
    const catBeTraiQuan  = { _id: id(), name: 'Quần bé trai', parentId: catBeTrai._id };
    const catBeGaiAo     = { _id: id(), name: 'Áo bé gái',    parentId: catBeGai._id  };
    const catBeGaiVay    = { _id: id(), name: 'Váy bé gái',   parentId: catBeGai._id  };
    // Cấp 3 – Unisex
    const catUniHoodie   = { _id: id(), name: 'Hoodie unisex',  parentId: catUniAo._id   };
    const catUniTee      = { _id: id(), name: 'Áo thun unisex', parentId: catUniAo._id   };
    const catUniJogger   = { _id: id(), name: 'Quần jogger',    parentId: catUniQuan._id };

    const allCategories = [
      catNam, catNu, catTreEm, catUnisex, catSale, catNewArr,
      catNamAo, catNamQuan, catNamGiay,
      catNuAo, catNuQuan, catNuVay,
      catBeTrai, catBeGai, catUniAo, catUniQuan,
      catAoThunNam, catAoSomiNam, catHoodieNam, catAoKhoac,
      catQuanJeanNam, catQuanShortNam, catQuanKakhi,
      catAoThunNu, catAoKieuNu, catAoBlouse,
      catQuanLegging, catQuanJeanNu, catVayNgan, catVayDai,
      catBeTraiAo, catBeTraiQuan, catBeGaiAo, catBeGaiVay,
      catUniHoodie, catUniTee, catUniJogger
    ];
    await Models.Category.insertMany(allCategories);
    console.log(`✔ Đã tạo ${allCategories.length} categories (3 cấp)`);

    // ──────────────────── PRODUCTS (với sizes đầy đủ) ────────────────────
    await Models.Product.deleteMany({});
    const now = Date.now();

    const products = [
      // ── Nam – Áo thun ──────────────────────────────────────────────────
      {
        name: 'Áo Thun Nam Basic Trắng',
        price: 299000,
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
        category: catAoThunNam, cdate: now - 1000000,
        sizes: mkSizes([['S',45],['M',60],['L',50],['XL',30],['XXL',10],['XXXL',0]])
      },
      {
        name: 'Áo Thun Nam Oversize Đen',
        price: 350000,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
        category: catAoThunNam, cdate: now - 900000,
        sizes: mkSizes([['S',20],['M',35],['L',40],['XL',25],['XXL',5],['XXXL',0]])
      },
      {
        name: 'Áo Thun Nam Kẻ Sọc',
        price: 320000,
        image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=600&q=80',
        category: catAoThunNam, cdate: now - 800000,
        sizes: mkSizes([['S',0],['M',15],['L',30],['XL',20],['XXL',8]])
      },
      // ── Nam – Áo sơ mi ─────────────────────────────────────────────────
      {
        name: 'Áo Sơ Mi Kẻ Caro Flannel',
        price: 450000,
        image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80',
        category: catAoSomiNam, cdate: now - 700000,
        sizes: mkSizes([['S',10],['M',25],['L',30],['XL',15],['XXL',5],['XXXL',0]])
      },
      {
        name: 'Áo Sơ Mi Trắng Công Sở Slim Fit',
        price: 520000,
        image: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=600&q=80',
        category: catAoSomiNam, cdate: now - 600000,
        sizes: mkSizes([['S',8],['M',20],['L',25],['XL',10],['XXL',0]])
      },
      // ── Nam – Hoodie ────────────────────────────────────────────────────
      {
        name: 'Hoodie Nam Cotton 100% Nặng',
        price: 699000,
        image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?auto=format&fit=crop&w=600&q=80',
        category: catHoodieNam, cdate: now - 500000,
        // Hoodie XXL có giá cao hơn
        sizes: mkSizes([['S',15],['M',30],['L',40],['XL',20],['XXL',8,749000],['XXXL',3,799000]])
      },
      {
        name: 'Hoodie Nam Zip-Up Thể Thao',
        price: 750000,
        image: 'https://images.unsplash.com/photo-1614495090560-a3e6c53bfc17?auto=format&fit=crop&w=600&q=80',
        category: catHoodieNam, cdate: now - 400000,
        sizes: mkSizes([['S',0],['M',12],['L',18],['XL',10],['XXL',4,800000]])
      },
      // ── Nam – Quần jean ─────────────────────────────────────────────────
      {
        name: 'Quần Jean Nam Slim Fit Xanh',
        price: 599000,
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80',
        category: catQuanJeanNam, cdate: now - 300000,
        sizes: mkSizes([['S',5],['M',20],['L',25],['XL',15],['XXL',5],['XXXL',0]])
      },
      {
        name: 'Quần Jean Nam Rách Gối Trendy',
        price: 650000,
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
        category: catQuanJeanNam, cdate: now - 200000,
        sizes: mkSizes([['S',8],['M',18],['L',22],['XL',12],['XXL',3]])
      },
      // ── Nam – Quần short ────────────────────────────────────────────────
      {
        name: 'Quần Short Thể Thao Khô Nhanh',
        price: 299000,
        image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?auto=format&fit=crop&w=600&q=80',
        category: catQuanShortNam, cdate: now - 100000,
        sizes: mkSizes([['S',30],['M',45],['L',50],['XL',30],['XXL',10],['XXXL',5]])
      },
      // ── Nữ – Áo thun ───────────────────────────────────────────────────
      {
        name: 'Áo Thun Nữ Crop Top Cơ Bản',
        price: 259000,
        image: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?auto=format&fit=crop&w=600&q=80',
        category: catAoThunNu, cdate: now - 50000,
        sizes: mkSizes([['S',40],['M',50],['L',35],['XL',15],['XXL',5]])
      },
      {
        name: 'Áo Thun Nữ Dài Tay Pastel',
        price: 320000,
        image: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=600&q=80',
        category: catAoThunNu, cdate: now - 80000,
        sizes: mkSizes([['S',25],['M',30],['L',20],['XL',8],['XXL',0]])
      },
      // ── Nữ – Blouse ────────────────────────────────────────────────────
      {
        name: 'Blouse Hoa Nhí Tay Bồng',
        price: 480000,
        image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=600&q=80',
        category: catAoBlouse, cdate: now - 120000,
        sizes: mkSizes([['S',20],['M',28],['L',15],['XL',6],['XXL',0]])
      },
      // ── Nữ – Váy ngắn ──────────────────────────────────────────────────
      {
        name: 'Váy Ngắn Chữ A Kẻ Caro',
        price: 399000,
        image: 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?auto=format&fit=crop&w=600&q=80',
        category: catVayNgan, cdate: now - 160000,
        sizes: mkSizes([['S',18],['M',22],['L',15],['XL',5],['XXL',0]])
      },
      {
        name: 'Váy Ngắn Denim Phố Thị',
        price: 450000,
        image: 'https://images.unsplash.com/photo-1583496661160-fb5218afa9a7?auto=format&fit=crop&w=600&q=80',
        category: catVayNgan, cdate: now - 200000,
        sizes: mkSizes([['S',12],['M',18],['L',10],['XL',3],['XXL',0]])
      },
      // ── Nữ – Quần legging ──────────────────────────────────────────────
      {
        name: 'Quần Legging Yoga Co Giãn 4D',
        price: 349000,
        image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=600&q=80',
        category: catQuanLegging, cdate: now - 250000,
        sizes: mkSizes([['S',35],['M',40],['L',30],['XL',15],['XXL',5]])
      },
      // ── Unisex – Hoodie ────────────────────────────────────────────────
      {
        name: 'Hoodie Unisex Form Rộng Premium',
        price: 750000,
        image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=600&q=80',
        category: catUniHoodie, cdate: now - 30000,
        sizes: mkSizes([['S',10],['M',20],['L',25],['XL',15],['XXL',5,800000],['XXXL',2,850000]])
      },
      // ── Unisex – Áo thun ──────────────────────────────────────────────
      {
        name: 'Áo Thun Unisex In Logo Graphic',
        price: 280000,
        image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=600&q=80',
        category: catUniTee, cdate: now - 15000,
        sizes: mkSizes([['S',30],['M',40],['L',35],['XL',20],['XXL',8],['XXXL',3]])
      }
    ];

    for (const p of products) {
      await new Models.Product({
        _id: new mongoose.Types.ObjectId(),
        name: p.name, price: p.price,
        image: p.image, cdate: p.cdate,
        category: p.category,
        sizes: p.sizes || []
      }).save();
    }
    console.log(`✔ Đã tạo ${products.length} sản phẩm (đầy đủ sizes + stock)`);

    console.log('\n─────────────────────────────────────────');
    console.log('🎉 SEED THÀNH CÔNG!');
    console.log('   Admin login: username="admin" / password="123"');
    console.log('─────────────────────────────────────────');
    mongoose.connection.close();
  })
  .catch(err => { console.error('❌ Không thể kết nối MongoDB:', err.message); });
