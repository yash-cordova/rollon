const mongoose = require('mongoose');
require('dotenv').config();

const Service = require('../models/Service');
const Tyre = require('../models/Tyre');
const connectDB = require('../config/database');

const seedServices = async () => {
  const services = [
    {
      name: 'Oil Change',
      description: 'Complete engine oil change with filter replacement',
      category: 'maintenance',
      subCategory: 'Engine Service',
      serviceType: 'workshop',
      estimatedDuration: 30,
      complexity: 'simple',
      basePrice: 500,
      currency: 'INR',
      pricingModel: 'fixed',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved'
    },
    {
      name: 'Tyre Replacement',
      description: 'Replace old tyres with new ones',
      category: 'repair',
      subCategory: 'Tyre Service',
      serviceType: 'workshop',
      estimatedDuration: 45,
      complexity: 'moderate',
      basePrice: 200,
      currency: 'INR',
      pricingModel: 'per_unit',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved'
    },
    {
      name: 'Tyre Puncture Repair',
      description: 'Repair punctured tyre using patch or plug method',
      category: 'repair',
      subCategory: 'Tyre Service',
      serviceType: 'onsite',
      estimatedDuration: 20,
      complexity: 'simple',
      basePrice: 100,
      currency: 'INR',
      pricingModel: 'fixed',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved'
    },
    {
      name: 'Battery Replacement',
      description: 'Replace old battery with new one',
      category: 'repair',
      subCategory: 'Electrical',
      serviceType: 'mobile',
      estimatedDuration: 30,
      complexity: 'moderate',
      basePrice: 300,
      currency: 'INR',
      pricingModel: 'fixed',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved'
    },
    {
      name: 'Car Wash',
      description: 'Complete car wash and detailing service',
      category: 'cleaning',
      subCategory: 'Washing',
      serviceType: 'workshop',
      estimatedDuration: 60,
      complexity: 'simple',
      basePrice: 300,
      currency: 'INR',
      pricingModel: 'fixed',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved'
    },
    {
      name: 'Towing Service',
      description: 'Vehicle towing to nearest service center',
      category: 'emergency',
      subCategory: 'Roadside Assistance',
      serviceType: 'mobile',
      estimatedDuration: 60,
      complexity: 'moderate',
      basePrice: 1000,
      currency: 'INR',
      pricingModel: 'negotiable',
      isEmergencyService: true,
      emergencyResponseTime: 30,
      emergencyRadius: 50,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved'
    },
    {
      name: 'Flat Tyre Assistance',
      description: 'On-site flat tyre repair or replacement',
      category: 'emergency',
      subCategory: 'Roadside Assistance',
      serviceType: 'mobile',
      estimatedDuration: 30,
      complexity: 'simple',
      basePrice: 500,
      currency: 'INR',
      pricingModel: 'fixed',
      isEmergencyService: true,
      emergencyResponseTime: 20,
      emergencyRadius: 30,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved'
    },
    {
      name: 'AC Service',
      description: 'AC cleaning, gas refill, and service',
      category: 'maintenance',
      subCategory: 'AC Service',
      serviceType: 'workshop',
      estimatedDuration: 90,
      complexity: 'moderate',
      basePrice: 1500,
      currency: 'INR',
      pricingModel: 'fixed',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved'
    },
    {
      name: 'Brake Service',
      description: 'Brake pad replacement and brake fluid top-up',
      category: 'repair',
      subCategory: 'Brake Service',
      serviceType: 'workshop',
      estimatedDuration: 60,
      complexity: 'moderate',
      basePrice: 800,
      currency: 'INR',
      pricingModel: 'fixed',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved'
    },
    {
      name: 'Wheel Alignment',
      description: 'Wheel alignment and balancing service',
      category: 'maintenance',
      subCategory: 'Tyre Service',
      serviceType: 'workshop',
      estimatedDuration: 45,
      complexity: 'moderate',
      basePrice: 400,
      currency: 'INR',
      pricingModel: 'fixed',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved'
    }
  ];

  console.log('🌱 Seeding services...');
  
  for (const serviceData of services) {
    const existingService = await Service.findOne({ name: serviceData.name });
    if (existingService) {
      console.log(`   ⏭️  Service "${serviceData.name}" already exists, skipping...`);
    } else {
      const service = new Service(serviceData);
      await service.save();
      console.log(`   ✅ Created service: ${serviceData.name}`);
    }
  }
  
  console.log('✅ Services seeding completed!\n');
};

const seedTyres = async () => {
  const tyres = [
    // MRF Tyres
    {
      brand: 'MRF',
      name: 'Zapper Q',
      model: 'ZQ-185/65 R15',
      description: 'Premium tubeless tyre for cars with excellent grip and durability',
      size: {
        width: 185,
        aspectRatio: 65,
        rimDiameter: 15,
        fullSize: '185/65 R15'
      },
      vehicleType: 'car',
      type: 'tubeless',
      basePrice: 3500,
      currency: 'INR',
      isActive: true,
      isAvailable: true
    },
    {
      brand: 'MRF',
      name: 'Nylo Zapper',
      model: 'NZ-100/90-17',
      description: 'High performance tyre for motorcycles',
      size: {
        width: 100,
        aspectRatio: 90,
        rimDiameter: 17,
        fullSize: '100/90-17'
      },
      vehicleType: 'bike',
      type: 'tubeless',
      basePrice: 1200,
      currency: 'INR',
      isActive: true,
      isAvailable: true
    },
    {
      brand: 'MRF',
      name: 'Fleetguard',
      model: 'FG-195/75 R16',
      description: 'Heavy duty tyre for trucks and commercial vehicles',
      size: {
        width: 195,
        aspectRatio: 75,
        rimDiameter: 16,
        fullSize: '195/75 R16'
      },
      vehicleType: 'truck',
      type: 'tubeless',
      basePrice: 8500,
      currency: 'INR',
      isActive: true,
      isAvailable: true
    },
    // Apollo Tyres
    {
      brand: 'Apollo',
      name: 'Amazer 4G Life',
      model: 'A4G-175/70 R13',
      description: 'Long-lasting tyre with excellent fuel efficiency',
      size: {
        width: 175,
        aspectRatio: 70,
        rimDiameter: 13,
        fullSize: '175/70 R13'
      },
      vehicleType: 'car',
      type: 'tubeless',
      basePrice: 3200,
      currency: 'INR',
      isActive: true,
      isAvailable: true
    },
    {
      brand: 'Apollo',
      name: 'Acti 3G',
      model: 'A3G-90/90-18',
      description: 'Durable tyre for two-wheelers',
      size: {
        width: 90,
        aspectRatio: 90,
        rimDiameter: 18,
        fullSize: '90/90-18'
      },
      vehicleType: 'bike',
      type: 'tubeless',
      basePrice: 1100,
      currency: 'INR',
      isActive: true,
      isAvailable: true
    },
    // CEAT Tyres
    {
      brand: 'CEAT',
      name: 'SecuraDrive',
      model: 'SD-185/60 R15',
      description: 'Premium car tyre with superior handling',
      size: {
        width: 185,
        aspectRatio: 60,
        rimDiameter: 15,
        fullSize: '185/60 R15'
      },
      vehicleType: 'car',
      type: 'tubeless',
      basePrice: 3400,
      currency: 'INR',
      isActive: true,
      isAvailable: true
    },
    {
      brand: 'CEAT',
      name: 'Milaze',
      model: 'MZ-80/100-18',
      description: 'All-terrain tyre for motorcycles',
      size: {
        width: 80,
        aspectRatio: 100,
        rimDiameter: 18,
        fullSize: '80/100-18'
      },
      vehicleType: 'bike',
      type: 'tubeless',
      basePrice: 1300,
      currency: 'INR',
      isActive: true,
      isAvailable: true
    },
    // Michelin Tyres
    {
      brand: 'Michelin',
      name: 'Energy XM2',
      model: 'EXM2-195/60 R15',
      description: 'Premium fuel-efficient tyre with long life',
      size: {
        width: 195,
        aspectRatio: 60,
        rimDiameter: 15,
        fullSize: '195/60 R15'
      },
      vehicleType: 'car',
      type: 'tubeless',
      basePrice: 4500,
      currency: 'INR',
      isActive: true,
      isAvailable: true
    },
    // JK Tyre
    {
      brand: 'JK Tyre',
      name: 'Ultra',
      model: 'ULT-175/65 R14',
      description: 'High performance car tyre',
      size: {
        width: 175,
        aspectRatio: 65,
        rimDiameter: 14,
        fullSize: '175/65 R14'
      },
      vehicleType: 'car',
      type: 'tubeless',
      basePrice: 3000,
      currency: 'INR',
      isActive: true,
      isAvailable: true
    },
    {
      brand: 'JK Tyre',
      name: 'Champion',
      model: 'CH-3.00-18',
      description: 'Durable tyre for auto-rickshaws',
      size: {
        fullSize: '3.00-18'
      },
      vehicleType: 'auto',
      type: 'tube',
      basePrice: 800,
      currency: 'INR',
      isActive: true,
      isAvailable: true
    }
  ];

  console.log('🌱 Seeding tyres...');
  
  for (const tyreData of tyres) {
    const existingTyre = await Tyre.findOne({ 
      brand: tyreData.brand, 
      name: tyreData.name,
      model: tyreData.model 
    });
    if (existingTyre) {
      console.log(`   ⏭️  Tyre "${tyreData.brand} ${tyreData.name}" already exists, skipping...`);
    } else {
      const tyre = new Tyre(tyreData);
      await tyre.save();
      console.log(`   ✅ Created tyre: ${tyreData.brand} ${tyreData.name}`);
    }
  }
  
  console.log('✅ Tyres seeding completed!\n');
};

const seedData = async () => {
  try {
    await connectDB();
    console.log('📊 Connected to MongoDB\n');

    await seedServices();
    await seedTyres();

    console.log('🎉 All seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run seed script
if (require.main === module) {
  seedData();
}

module.exports = { seedServices, seedTyres };

