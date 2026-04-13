const mongoose = require('mongoose');
const axios = require('axios');
const MyConstants = require('./utils/MyConstants');
const Models = require('./models/Models');

async function fixImages() {
  const uri = 'mongodb+srv://' + MyConstants.DB_USER + ':' + MyConstants.DB_PASS + '@' + MyConstants.DB_SERVER + '/' + MyConstants.DB_DATABASE;
  await mongoose.connect(uri);
  
  const products = await Models.Product.find();
  for (let p of products) {
    if (p.image && p.image.startsWith('http')) {
      try {
        const response = await axios.get(`https://picsum.photos/400/400?random=${Math.random()}`, { responseType: 'arraybuffer', maxRedirects: 5 });
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        p.image = base64;
        await p.save();
        console.log(`Updated image for ${p.name}`);
      } catch (err) {
        console.error(`Failed to fetch image for ${p.name}:`, err.message);
      }
    }
  }
  
  console.log('Done!');
  mongoose.connection.close();
}

fixImages();
