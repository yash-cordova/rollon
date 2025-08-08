const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  // Service Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['repair', 'maintenance', 'emergency', 'cleaning', 'fuel', 'battery', 'other'],
    required: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  
  // Service Details
  serviceType: {
    type: String,
    enum: ['onsite', 'workshop', 'mobile', 'pickup_delivery'],
    default: 'onsite'
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  complexity: {
    type: String,
    enum: ['simple', 'moderate', 'complex', 'expert'],
    default: 'moderate'
  },
  
  // Pricing
  basePrice: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  pricingModel: {
    type: String,
    enum: ['fixed', 'hourly', 'per_unit', 'negotiable'],
    default: 'fixed'
  },
  additionalCharges: [{
    name: String,
    amount: Number,
    description: String,
    isOptional: {
      type: Boolean,
      default: false
    }
  }],
  
  // Vehicle Compatibility
  compatibleVehicles: [{
    type: {
      type: String,
      enum: ['car', 'bike', 'truck', 'bus', 'auto', 'other']
    },
    brands: [String],
    models: [String],
    fuelTypes: [{
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg']
    }]
  }],
  
  // Requirements
  requirements: [{
    name: String,
    description: String,
    isMandatory: {
      type: Boolean,
      default: true
    }
  }],
  
  // Materials & Parts
  materials: [{
    name: String,
    quantity: Number,
    unit: String,
    cost: Number,
    isIncluded: {
      type: Boolean,
      default: true
    }
  }],
  
  // Warranty
  warranty: {
    duration: Number, // in days
    description: String,
    terms: [String]
  },
  
  // Availability
  isAvailable: {
    type: Boolean,
    default: true
  },
  availabilityHours: {
    startTime: String, // HH:MM format
    endTime: String, // HH:MM format
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  
  // Emergency Services
  isEmergencyService: {
    type: Boolean,
    default: false
  },
  emergencyResponseTime: Number, // in minutes
  emergencyRadius: Number, // in kilometers
  
  // Quality & Standards
  certifications: [{
    name: String,
    issuingAuthority: String,
    validUntil: Date
  }],
  qualityStandards: [String],
  
  // Media
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  videos: [{
    url: String,
    title: String,
    description: String
  }],
  
  // Statistics
  totalBookings: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  
  // Metadata
  tags: [String],
  keywords: [String],
  seoDescription: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
serviceSchema.index({ name: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ subCategory: 1 });
serviceSchema.index({ isActive: 1, isApproved: 1 });
serviceSchema.index({ averageRating: -1 });
serviceSchema.index({ tags: 1 });
serviceSchema.index({ createdAt: -1 });

// Update timestamp
serviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate total price including additional charges
serviceSchema.methods.calculateTotalPrice = function() {
  const additionalChargesTotal = this.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  return this.basePrice + additionalChargesTotal;
};

// Check if service is available for vehicle type
serviceSchema.methods.isCompatibleWithVehicle = function(vehicleType, brand, model, fuelType) {
  const compatibility = this.compatibleVehicles.find(comp => comp.type === vehicleType);
  if (!compatibility) return false;
  
  // Check brand compatibility
  if (compatibility.brands.length > 0 && !compatibility.brands.includes(brand)) {
    return false;
  }
  
  // Check model compatibility
  if (compatibility.models.length > 0 && !compatibility.models.includes(model)) {
    return false;
  }
  
  // Check fuel type compatibility
  if (compatibility.fuelTypes.length > 0 && !compatibility.fuelTypes.includes(fuelType)) {
    return false;
  }
  
  return true;
};

// Update rating
serviceSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.averageRating * this.reviewCount) + newRating;
  this.reviewCount += 1;
  this.averageRating = totalRating / this.reviewCount;
  return this.save();
};

// Get service summary
serviceSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    category: this.category,
    basePrice: this.basePrice,
    estimatedDuration: this.estimatedDuration,
    averageRating: this.averageRating,
    isAvailable: this.isAvailable
  };
};

// Check if service is available now
serviceSchema.methods.isAvailableNow = function() {
  if (!this.isAvailable || !this.isApproved) return false;
  
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  // Check if current day is in availability days
  const isDayAvailable = this.availabilityHours.days.includes(currentDay);
  if (!isDayAvailable) return false;
  
  // Check if current time is within availability hours
  const isTimeAvailable = currentTime >= this.availabilityHours.startTime && 
                         currentTime <= this.availabilityHours.endTime;
  
  return isTimeAvailable;
};

// Get service with pricing
serviceSchema.methods.getServiceWithPricing = function() {
  return {
    ...this.toObject(),
    totalPrice: this.calculateTotalPrice(),
    isAvailableNow: this.isAvailableNow()
  };
};

module.exports = mongoose.model('Service', serviceSchema);
