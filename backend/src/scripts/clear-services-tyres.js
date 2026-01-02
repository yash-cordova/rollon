const mongoose = require('mongoose');
require('dotenv').config();

const Service = require('../models/Service');
const Tyre = require('../models/Tyre');
const connectDB = require('../config/database');

const clearData = async () => {
  try {
    await connectDB();
    console.log('📊 Connected to MongoDB\n');

    // Delete all services
    console.log('🗑️  Deleting all services...');
    const servicesResult = await Service.deleteMany({});
    console.log(`   ✅ Deleted ${servicesResult.deletedCount} services`);

    // Delete all tyres
    console.log('🗑️  Deleting all tyres...');
    const tyresResult = await Tyre.deleteMany({});
    console.log(`   ✅ Deleted ${tyresResult.deletedCount} tyres`);

    console.log('\n🎉 All services and tyres deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run script
if (require.main === module) {
  clearData();
}

module.exports = { clearData };

