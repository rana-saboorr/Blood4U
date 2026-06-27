require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Donor = require('./models/Donor');
const BloodBank = require('./models/BloodBank');

const seed = async () => {
  try {
    console.log('🌱 Seeding sample data...');
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find first user to own the records
    const user = await User.findOne();
    if (!user) throw new Error('No user found to assign records to.');

    // Add a Donor
    const donorExists = await Donor.findOne({ fullName: 'Full Name' });
    if (!donorExists) {
      await Donor.create({
        fullName: 'Full Name',
        mobile: '03000000000',
        bloodGroup: 'O+',
        city: 'City',
        gender: 'Gender',
        dateOfBirth: '2000-01-01',
        weight: 70,
        available: true,
        paymentType: 'unpaid',
        userId: user._id
      });
      console.log('✅ Sample Donor created.');
    }

    // Add a Blood Bank
    const bankExists = await BloodBank.findOne({ name: 'Central Blood Bank' });
    if (!bankExists) {
      await BloodBank.create({
        name: 'Central Blood Bank',
        contact: '03117654321',
        city: 'Lahore',
        address: 'Model Town, Block A',
        status: 'approved',
        registeredBy: user._id,
        bloodStock: { 'O+': 10, 'A+': 5 }
      });
      console.log('✅ Sample Blood Bank created.');
    }

    console.log('\n✨ Database seeded! Refresh your dashboard now.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
