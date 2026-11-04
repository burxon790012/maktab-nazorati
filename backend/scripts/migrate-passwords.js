/**
 * One-time idempotent script to migrate existing plain passwords to bcrypt hashes (cost 12).
 * Does not log passwords.
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, '..', 'data', 'smart_child_multischool_db.json');

function migratePasswords() {
  if (!fs.existsSync(DB_FILE)) {
    console.error('Database file not found at:', DB_FILE);
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data.users)) {
    console.log('No users array found in DB.');
    return;
  }

  let updatedCount = 0;
  for (const user of data.users) {
    if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      user.password = bcrypt.hashSync(user.password, 12);
      updatedCount++;
    }
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Password migration complete. Updated ${updatedCount} user(s).`);
}

if (require.main === module) {
  migratePasswords();
}

module.exports = { migratePasswords };

