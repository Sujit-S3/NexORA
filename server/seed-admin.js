const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const hashedPassword = await bcrypt.hash('password123', 10);
  await db.collection('users').updateOne(
    { email: 'admin_test@nexora.com' },
    { $set: { name: 'Admin Test', password: hashedPassword, role: 'admin' } },
    { upsert: true }
  );
  console.log('Admin user ready');
  process.exit(0);
})();
