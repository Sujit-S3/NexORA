const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const h = await bcrypt.hash('Password123', 12);
  await db.collection('users').updateOne({email:'admin-test@nexora.com'},{$set:{password:h}});
  console.log('Admin password fixed');
  process.exit(0);
});
