const mongoose = require('mongoose');
require('dotenv').config();

const Admin = require('../models/Admin');

const createAdmin = async () => {
  try {
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://rollon:rollon@cluster0.33li06j.mongodb.net/rollon?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('📊 Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'rollonadmin@admin.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists with email: rollonadmin@admin.com');
      console.log('   Updating password...');
      existingAdmin.password = 'RollOn@1234';
      await existingAdmin.save();
      console.log('✅ Admin password updated successfully');
      process.exit(0);
    }
    
    // Create new admin user
    const admin = new Admin({
      username: 'rollonadmin',
      email: 'rollonadmin@admin.com',
      name: 'Rollon Admin',
      password: 'RollOn@1234', // Will be hashed by pre-save hook
      role: 'super_admin',
      isActive: true,
      isEmailVerified: true,
      department: 'general',
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
          actions: ['create', 'read', 'update', 'delete']
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
    
    await admin.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('   Email: rollonadmin@admin.com');
    console.log('   Password: RollOn@1234');
    console.log('   Role: super_admin');
    
    // Close database connection
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
createAdmin();

