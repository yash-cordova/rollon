const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Partner = require('../models/Partner');
const Booking = require('../models/Booking');
const Emergency = require('../models/Emergency');
const Admin = require('../models/Admin');
const Service = require('../models/Service');

const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up Rollon Database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rollon');
    
    console.log('📊 Connected to MongoDB');
    
    // Create collections and indexes
    console.log('📋 Creating collections and indexes...');
    
    // Users collection
    await User.createCollection();
    console.log('✅ Users collection created');
    
    // Partners collection
    await Partner.createCollection();
    console.log('✅ Partners collection created');
    
    // Bookings collection
    await Booking.createCollection();
    console.log('✅ Bookings collection created');
    
    // Emergencies collection
    await Emergency.createCollection();
    console.log('✅ Emergencies collection created');
    
    // Admins collection
    await Admin.createCollection();
    console.log('✅ Admins collection created');
    
    // Services collection
    await Service.createCollection();
    console.log('✅ Services collection created');
    
    // Create indexes
    console.log('🔍 Creating indexes...');
    
    // User indexes
    await User.collection.createIndex({ phoneNumber: 1 }, { unique: true });
    await User.collection.createIndex({ currentLocation: '2dsphere' });
    await User.collection.createIndex({ 'vehicles.registrationNumber': 1 });
    await User.collection.createIndex({ createdAt: -1 });
    console.log('✅ User indexes created');
    
    // Partner indexes
    await Partner.collection.createIndex({ phoneNumber: 1 }, { unique: true });
    await Partner.collection.createIndex({ location: '2dsphere' });
    await Partner.collection.createIndex({ businessType: 1 });
    await Partner.collection.createIndex({ isOnline: 1, isApproved: 1 });
    await Partner.collection.createIndex({ rating: -1 });
    await Partner.collection.createIndex({ createdAt: -1 });
    console.log('✅ Partner indexes created');
    
    // Booking indexes
    await Booking.collection.createIndex({ bookingId: 1 }, { unique: true });
    await Booking.collection.createIndex({ userId: 1 });
    await Booking.collection.createIndex({ partnerId: 1 });
    await Booking.collection.createIndex({ status: 1 });
    await Booking.collection.createIndex({ createdAt: -1 });
    await Booking.collection.createIndex({ scheduledDate: 1 });
    await Booking.collection.createIndex({ userLocation: '2dsphere' });
    await Booking.collection.createIndex({ partnerLocation: '2dsphere' });
    console.log('✅ Booking indexes created');
    
    // Emergency indexes
    await Emergency.collection.createIndex({ emergencyId: 1 }, { unique: true });
    await Emergency.collection.createIndex({ userId: 1 });
    await Emergency.collection.createIndex({ assignedPartnerId: 1 });
    await Emergency.collection.createIndex({ status: 1 });
    await Emergency.collection.createIndex({ priority: 1 });
    await Emergency.collection.createIndex({ createdAt: -1 });
    await Emergency.collection.createIndex({ userLocation: '2dsphere' });
    await Emergency.collection.createIndex({ emergencyType: 1 });
    console.log('✅ Emergency indexes created');
    
    // Admin indexes
    await Admin.collection.createIndex({ username: 1 }, { unique: true });
    await Admin.collection.createIndex({ email: 1 }, { unique: true });
    await Admin.collection.createIndex({ role: 1 });
    await Admin.collection.createIndex({ isActive: 1 });
    await Admin.collection.createIndex({ createdAt: -1 });
    console.log('✅ Admin indexes created');
    
    // Service indexes
    await Service.collection.createIndex({ name: 1 });
    await Service.collection.createIndex({ category: 1 });
    await Service.collection.createIndex({ subCategory: 1 });
    await Service.collection.createIndex({ isActive: 1, isApproved: 1 });
    await Service.collection.createIndex({ averageRating: -1 });
    await Service.collection.createIndex({ tags: 1 });
    await Service.collection.createIndex({ createdAt: -1 });
    console.log('✅ Service indexes created');
    
    // Create default admin user
    console.log('👨‍💼 Creating default admin user...');
    const adminExists = await Admin.findOne({ email: 'admin@rollon.in' });
    
    if (!adminExists) {
      const defaultAdmin = new Admin({
        username: 'admin',
        email: 'admin@rollon.in',
        name: 'Rollon Admin',
        password: 'admin123456',
        role: 'super_admin',
        isEmailVerified: true,
        isActive: true,
        permissions: [
          {
            module: 'users',
            actions: ['create', 'read', 'update', 'delete']
          },
          {
            module: 'partners',
            actions: ['create', 'read', 'update', 'delete', 'approve', 'reject']
          },
          {
            module: 'bookings',
            actions: ['create', 'read', 'update', 'delete']
          },
          {
            module: 'emergencies',
            actions: ['create', 'read', 'update', 'delete']
          },
          {
            module: 'payments',
            actions: ['read', 'update']
          },
          {
            module: 'reports',
            actions: ['read']
          },
          {
            module: 'settings',
            actions: ['read', 'update']
          }
        ]
      });
      
      await defaultAdmin.save();
      console.log('✅ Default admin user created');
      console.log('📧 Email: admin@rollon.in');
      console.log('🔑 Password: admin123456');
    } else {
      console.log('ℹ️ Default admin user already exists');
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('📊 Database: rollon');
    console.log('📋 Collections: users, partners, bookings, emergencies, admins, services');
    console.log('🔍 Indexes: Created for optimal query performance');
    
    // Display database statistics
    const stats = await mongoose.connection.db.stats();
    console.log('\n📈 Database Statistics:');
    console.log(`📊 Collections: ${stats.collections}`);
    console.log(`💾 Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🗂️ Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📝 Documents: ${stats.objects}`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
