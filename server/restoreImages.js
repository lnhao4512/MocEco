const mongoose = require('mongoose');
const MyConstants = require('./utils/MyConstants');
const Models = require('./models/Models');

async function restore() {
  const uri = 'mongodb+srv://' + MyConstants.DB_USER + ':' + MyConstants.DB_PASS + '@' + MyConstants.DB_SERVER + '/' + MyConstants.DB_DATABASE;
  await mongoose.connect(uri);
  const updates = [
    { name: 'Samsung Galaxy S23', image: 'https://images.unsplash.com/photo-1510557880182-3a9352c5d1c1?auto=format&fit=crop&w=600&q=80' },
    { name: 'Oppo Find X6', image: 'https://images.unsplash.com/photo-1523475496153-3d6cc7e7a4f5?auto=format&fit=crop&w=600&q=80' },
    { name: 'Xiaomi 13', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80' }
  ];
  for (const u of updates) {
    const prod = await Models.Product.findOne({ name: u.name }).exec();
    if (prod) {
      prod.image = u.image;
      await prod.save();
      console.log(`Restored image for ${u.name}`);
    } else {
      console.log(`Product not found: ${u.name}`);
    }
  }
  mongoose.connection.close();
}

restore().catch(err => {
  console.error('Restore failed:', err.message);
  mongoose.connection.close();
});
