// NexORA — MongoDB Connection

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8+ options (serverSelectionTimeoutMS default is fine)
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️   MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed (SIGINT)');
  process.exit(0);
});

module.exports = connectDB;
