const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const partnerSchema = new mongoose.Schema({
  // Basic Information
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[6-9]\d{9}$/
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true
  },
  
  // Authentication
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  
  // Business Information
  businessName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  businessType: {
    type: String,
    enum: ['garage', 'tire_shop', 'petrol_pump', 'ev_charging', 'battery_swap', 'car_wash', 'towing', 'emergency_service', 'other'],
    required: true
  },
  businessDescription: {
    type: String,
    maxlength: 500
  },
  
  // Location & Address
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  
  // Contact Information
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  alternatePhone: String,
  
  // Business Details
  gstNumber: {
    type: String,
    trim: true,
    match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  },
  panNumber: {
    type: String,
    trim: true,
    match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  },
  businessLicense: String,
  
  // Services Offered
  services: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    price: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    estimatedTime: Number, // in minutes
    category: {
      type: String,
      enum: ['repair', 'maintenance', 'emergency', 'cleaning', 'fuel', 'battery', 'other']
    }
  }],
  
  // Business Hours
  businessHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    openTime: String, // HH:MM format
    closeTime: String, // HH:MM format
    breakStart: String,
    breakEnd: String
  }],
  
  // Media
  photos: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  documents: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['license', 'certificate', 'insurance', 'other']
    }
  }],
  
  // Status & Availability
  isOnline: {
    type: Boolean,
    default: false
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
  approvalDate: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  // Ratings & Reviews
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // Financial Information
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String
  },
  commissionRate: {
    type: Number,
    default: 10, // 10% commission
    min: 0,
    max: 100
  },
  
  // Statistics
  totalBookings: {
    type: Number,
    default: 0
  },
  completedBookings: {
    type: Number,
    default: 0
  },
  cancelledBookings: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  monthlyEarnings: {
    type: Number,
    default: 0
  },
  
  // Preferences
  language: {
    type: String,
    enum: ['en', 'hi', 'gu'],
    default: 'en'
  },
  notifications: {
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    }
  },
  
  // Emergency Services
  isEmergencyService: {
    type: Boolean,
    default: false
  },
  emergencyResponseTime: Number, // in minutes
  emergencyRadius: Number, // in kilometers
  
  // Last Activity
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
partnerSchema.index({ phoneNumber: 1 });
partnerSchema.index({ location: '2dsphere' });
partnerSchema.index({ businessType: 1 });
partnerSchema.index({ isOnline: 1, isApproved: 1 });
partnerSchema.index({ rating: -1 });
partnerSchema.index({ createdAt: -1 });

// Hash password before saving
partnerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
partnerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP
partnerSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  };
  return otp;
};

// Verify OTP
partnerSchema.methods.verifyOTP = function(otp) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  
  if (new Date() > this.otp.expiresAt) {
    return false;
  }
  
  return this.otp.code === otp;
};

// Update last active
partnerSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Get partner profile (without sensitive data)
partnerSchema.methods.getPublicProfile = function() {
  const partnerObject = this.toObject();
  delete partnerObject.password;
  delete partnerObject.otp;
  delete partnerObject.bankDetails;
  return partnerObject;
};

// Calculate average rating
partnerSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating * this.reviewCount) + newRating;
  this.reviewCount += 1;
  this.rating = totalRating / this.reviewCount;
  return this.save();
};

module.exports = mongoose.model('Partner', partnerSchema);
