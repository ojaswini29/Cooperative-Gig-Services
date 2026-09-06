const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigrations() {
  console.log('Running database migrations...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.query(schemaSql);
    console.log('Database migration completed successfully. Database structure ready & EMPTY.');
  } catch (err) {
    console.error('Error running migrations:', err);
    throw err;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runMigrations;
