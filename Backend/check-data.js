require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Donor = require('./models/Donor');
const BloodBank = require('./models/BloodBank');
const BloodRequest = require('./models/BloodRequest');
const Event = require('./models/Event');

const check = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected.\n');

    const [u, d, b, r, e] = await Promise.all([
      User.countDocuments(),
      Donor.countDocuments(),
      BloodBank.countDocuments(),
      BloodRequest.countDocuments(),
      Event.countDocuments(),
    ]);

    const bankApproved = await BloodBank.countDocuments({ status: 'approved' });
    const eventApproved = await Event.countDocuments({ status: 'approved' });

    console.log('--- DATABASE SNAPSHOT ---');
    console.log(`Total Users:    ${u}`);
    console.log(`Total Donors:   ${d}`);
    console.log(`Blood Banks:    ${b} (Approved: ${bankApproved})`);
    console.log(`Requests:       ${r}`);
    console.log(`Events:         ${e} (Approved: ${eventApproved})`);
    console.log('-------------------------');

    if (u === 0 && d === 0 && b === 0) {
      console.log('\n⚠️  WARNING: Database appears to be empty.');
    } else {
      console.log('\n✅ Data found in database.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during check:', error.message);
    process.exit(1);
  }
};

check();
