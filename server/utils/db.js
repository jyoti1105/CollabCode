const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collab-editor';
let useMongo = false;

async function connect() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    useMongo = true;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.warn('⚠️ MongoDB unavailable, falling back to local storage.');
    console.warn(err.message);
  }
}

function isMongoAvailable() {
  return useMongo;
}

module.exports = {
  connect,
  isMongoAvailable,
};
