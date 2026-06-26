const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const dotenv = require('dotenv');
const util = require('util');
const crypto = require('crypto');
const pipeline = util.promisify(require('stream').pipeline);

dotenv.config();

const BACKUP_DIR = path.join(__dirname, 'backups');

async function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${timestamp}.json.gz`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  console.log(`\n📦 Starting NexORA Database Backup [${timestamp}]...`);

  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // 2. Fetch all collections dynamically
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✓ Discovered ${collections.length} collections`);

    const dbData = {};

    // 3. Export all collections
    for (let collection of collections) {
      const colName = collection.name;
      const data = await mongoose.connection.db.collection(colName).find({}).toArray();
      dbData[colName] = data;
      console.log(`  - Exported ${data.length} records from ${colName}`);
    }

    // 4. Compress and save to disk
    console.log('\n🗜️ Compressing backup data...');
    const jsonString = JSON.stringify(dbData);
    const gzip = zlib.createGzip();
    
    // Create streams
    const source = require('stream').Readable.from([jsonString]);
    const destination = fs.createWriteStream(backupFilePath);
    
    // Pipe through gzip
    await pipeline(source, gzip, destination);
    
    // 5. Calculate Checksum
    const hash = crypto.createHash('sha256');
    const fileBuffer = fs.readFileSync(backupFilePath);
    const checksum = hash.update(fileBuffer).digest('hex');
    fs.writeFileSync(`${backupFilePath}.sha256`, checksum);

    // 6. Verification
    const stats = fs.statSync(backupFilePath);
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 File: ${backupFilePath}`);
    console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`🛡️  Checksum (SHA-256): ${checksum}`);
    console.log(`\nKeep this file secure as it contains sensitive PII and Commerce data.`);
    console.log(`\n🔄 To restore this backup, you will need a script that parses the JSON and uses MongoDB insertMany() for each collection.\n`);
    
  } catch (err) {
    console.error('\n❌ Backup Failed!');
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

createBackup();
