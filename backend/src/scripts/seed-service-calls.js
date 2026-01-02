const mongoose = require('mongoose');
require('dotenv').config();

const ServiceCall = require('../models/ServiceCall');
const User = require('../models/User');
const Partner = require('../models/Partner');
const Service = require('../models/Service');
const connectDB = require('../config/database');

const seedServiceCalls = async () => {
  try {
    await connectDB();
    console.log('📊 Connected to MongoDB\n');

    // Get existing customers, partners, and services
    const customers = await User.find({ isActive: true }).limit(10);
    const partners = await Partner.find({ 
      approvalStatus: 'approved', 
      isApproved: true 
    }).limit(5);
    const services = await Service.find({ isActive: true, isApproved: true }).limit(10);

    if (customers.length === 0) {
      console.log('⚠️  No customers found. Please create customers first.');
      return;
    }

    if (partners.length === 0) {
      console.log('⚠️  No approved partners found. Please create and approve partners first.');
      return;
    }

    if (services.length === 0) {
      console.log('⚠️  No services found. Please create services first.');
      return;
    }

    console.log(`📋 Found ${customers.length} customers, ${partners.length} partners, ${services.length} services\n`);

    // Generate dummy service calls
    const serviceCalls = [];
    const statuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    const urgencies = ['low', 'medium', 'high', 'emergency'];
    const callTypes = ['service_request', 'inquiry', 'emergency'];
    const vehicleTypes = ['car', 'bike', 'truck', 'auto'];

    // Create service calls for the last 30 days
    const today = new Date();
    const daysAgo = 30;

    for (let i = 0; i < 50; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const partner = partners[Math.floor(Math.random() * partners.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      
      // Random date within last 30 days
      const daysBack = Math.floor(Math.random() * daysAgo);
      const callDate = new Date(today);
      callDate.setDate(callDate.getDate() - daysBack);
      callDate.setHours(Math.floor(Math.random() * 12) + 8); // 8 AM to 8 PM
      callDate.setMinutes(Math.floor(Math.random() * 60));

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const urgency = urgencies[Math.floor(Math.random() * urgencies.length)];
      const callType = callTypes[Math.floor(Math.random() * callTypes.length)];

      // Generate preferred date (within next 7 days from call date)
      const preferredDate = new Date(callDate);
      preferredDate.setDate(preferredDate.getDate() + Math.floor(Math.random() * 7));

      const requestMessages = [
        'Need urgent service for my vehicle',
        'Please provide service at my location',
        'Looking for quick service',
        'Need professional service',
        'Urgent repair required',
        'Regular maintenance needed',
        'Emergency service required',
        'Need service as soon as possible',
        'Looking for quality service',
        'Need experienced technician'
      ];

      const vehicleMakes = ['Honda', 'Maruti', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Ford'];
      const vehicleModels = ['City', 'Swift', 'i20', 'Nexon', 'XUV', 'Innova', 'EcoSport'];

      const serviceCall = {
        customerId: customer._id,
        customerName: customer.name,
        customerPhone: customer.phoneNumber,
        customerEmail: customer.email || undefined,
        customerLocation: customer.currentLocation || {
          type: 'Point',
          coordinates: [72.5714 + (Math.random() - 0.5) * 0.1, 23.0225 + (Math.random() - 0.5) * 0.1],
          address: customer.address ? `${customer.address.street || ''}, ${customer.address.city || ''}` : undefined
        },
        partnerId: partner._id,
        partnerName: partner.shopName || partner.businessName || partner.ownerName,
        partnerPhone: partner.mobileNumber || partner.phoneNumber,
        serviceId: service._id,
        serviceName: service.name,
        serviceCategory: service.category,
        callStatus: status,
        callType: callType,
        requestMessage: requestMessages[Math.floor(Math.random() * requestMessages.length)],
        preferredDate: preferredDate,
        preferredTime: `${String(Math.floor(Math.random() * 12) + 9).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        urgency: urgency,
        vehicleDetails: {
          type: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
          make: vehicleMakes[Math.floor(Math.random() * vehicleMakes.length)],
          model: vehicleModels[Math.floor(Math.random() * vehicleModels.length)],
          registrationNumber: `GJ${String(Math.floor(Math.random() * 100)).padStart(2, '0')}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
        },
        source: 'app',
        createdAt: callDate,
        updatedAt: callDate
      };

      // Add response details if accepted or completed
      if (status === 'accepted' || status === 'completed') {
        const respondedDate = new Date(callDate);
        respondedDate.setHours(respondedDate.getHours() + Math.floor(Math.random() * 2) + 1);
        
        serviceCall.partnerResponse = {
          respondedAt: respondedDate,
          responseMessage: 'We can provide the service. Please confirm.',
          estimatedPrice: service.basePrice + Math.floor(Math.random() * 500),
          estimatedTime: service.estimatedDuration || 60,
          accepted: true
        };
        serviceCall.updatedAt = respondedDate;
      }

      // Add completion details if completed
      if (status === 'completed') {
        const completedDate = new Date(callDate);
        completedDate.setDate(completedDate.getDate() + Math.floor(Math.random() * 3) + 1);
        
        serviceCall.completedAt = completedDate;
        serviceCall.actualPrice = serviceCall.partnerResponse.estimatedPrice + Math.floor(Math.random() * 200) - 100;
        serviceCall.customerRating = Math.floor(Math.random() * 5) + 1;
        serviceCall.customerFeedback = ['Great service!', 'Very satisfied', 'Good work', 'Professional service', 'Excellent'][Math.floor(Math.random() * 5)];
        serviceCall.updatedAt = completedDate;
      }

      serviceCalls.push(serviceCall);
    }

    console.log('🌱 Seeding service calls...\n');

    // Insert service calls
    let inserted = 0;
    let skipped = 0;

    for (const callData of serviceCalls) {
      // Check if similar call already exists (same customer, partner, service, and date)
      const existing = await ServiceCall.findOne({
        customerId: callData.customerId,
        partnerId: callData.partnerId,
        serviceId: callData.serviceId,
        createdAt: {
          $gte: new Date(callData.createdAt.getTime() - 60000), // Within 1 minute
          $lte: new Date(callData.createdAt.getTime() + 60000)
        }
      });

      if (existing) {
        skipped++;
        continue;
      }

      const serviceCall = new ServiceCall(callData);
      await serviceCall.save();
      inserted++;
      
      if (inserted % 10 === 0) {
        console.log(`   ✅ Created ${inserted} service calls...`);
      }
    }

    console.log(`\n✅ Service calls seeding completed!`);
    console.log(`   📊 Created: ${inserted} service calls`);
    console.log(`   ⏭️  Skipped: ${skipped} duplicates`);

    // Show summary
    const summary = await ServiceCall.aggregate([
      {
        $group: {
          _id: '$callStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📈 Service Calls Summary by Status:');
    summary.forEach(item => {
      console.log(`   ${item._id}: ${item.count}`);
    });

  } catch (error) {
    console.error('❌ Error seeding service calls:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run seed script
if (require.main === module) {
  seedServiceCalls();
}

module.exports = { seedServiceCalls };

