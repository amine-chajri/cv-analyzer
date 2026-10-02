/**
 * Creates or promotes an admin account.
 *
 * Usage:
 *   npm run create-admin -- <name> <email> <password>
 *   npm run create-admin -- "Admin User" admin@cvlens.com SuperSecret123
 *
 * If the email already exists, the account is promoted to admin instead
 * (its password is NOT changed).
 */
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');

const [name, email, password] = process.argv.slice(2);

const DEFAULTS = {
  name: 'Admin',
  email: 'admin@cvlens.com',
  password: 'Admin@12345',
};

async function main() {
  const adminName = name || DEFAULTS.name;
  const adminEmail = (email || DEFAULTS.email).toLowerCase();
  const adminPassword = password || DEFAULTS.password;

  if (adminPassword.length < 6) {
    console.error('Error: password must be at least 6 characters');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  const existing = await User.findOne({ email: adminEmail });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Account ${adminEmail} is already an admin. Nothing to do.`);
    } else {
      existing.role = 'admin';
      await existing.save();
      console.log(`Promoted existing account ${adminEmail} to admin.`);
    }
  } else {
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
    console.log('Admin account created:');
    console.log(`  Name:     ${adminName}`);
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('\nStore these credentials securely and change the password later.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
