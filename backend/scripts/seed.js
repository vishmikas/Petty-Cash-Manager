const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Department = require('../models/Department');

dotenv.config();

const seed = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing in backend/.env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@pettycash.local';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123';

    let finance = await Department.findOne({ name: 'Finance' });
    if (!finance) {
      finance = await Department.create({
        name: 'Finance',
        description: 'Finance and petty cash administration',
        monthlyBudget: 0
      });
      console.log('Created Finance department');
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        department: finance._id,
        isActive: true
      });
      console.log(`Created admin user: ${adminEmail}`);
      console.log(`Default password: ${adminPassword}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }

    const defaults = [
      { name: 'Operations', description: 'Operations petty cash requests' },
      { name: 'Sales', description: 'Sales petty cash requests' }
    ];

    for (const item of defaults) {
      const exists = await Department.findOne({ name: item.name });
      if (!exists) {
        await Department.create(item);
        console.log(`Created ${item.name} department`);
      }
    }

    console.log('Seed completed');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
