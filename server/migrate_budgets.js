const mongoose = require('mongoose');
const dotenv = require('dotenv');
const UserPreference = require('./src/models/UserPreference');

dotenv.config();

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  
  // Find all where budgets is an array
  const prefs = await UserPreference.find({ budgets: { $type: 'array' } });
  console.log(`Found ${prefs.length} records with legacy budgets array.`);
  
  for (const pref of prefs) {
    let maxPurchase = 0;
    if (Array.isArray(pref.budgets) && pref.budgets.length > 0) {
      maxPurchase = Math.max(...pref.budgets.filter(b => typeof b === 'number'));
    }
    
    // Using Mongoose updateOne to completely overwrite the old array
    await UserPreference.collection.updateOne(
      { _id: pref._id },
      { $set: { 
        budgets: {
          declared: null,
          observedAvg: null,
          maxPurchase: maxPurchase === -Infinity ? 0 : maxPurchase,
          comfortRange: { min: 0, max: 0 }
        }
      }}
    );
  }
  
  console.log('Migration complete');
  process.exit(0);
}

migrate().catch(console.error);
