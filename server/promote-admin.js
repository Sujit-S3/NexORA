const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');
    const existing = await User.findOne({ email: 'admin-test@nexora.com' });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password123', salt);
      await User.create({
        name: 'Admin Test User',
        email: 'admin-test@nexora.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Created admin-test@nexora.com');
    } else {
      existing.role = 'admin';
      await existing.save();
      console.log('Updated admin-test@nexora.com to admin role');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('DB Connection error:', err);
    process.exit(1);
  });
