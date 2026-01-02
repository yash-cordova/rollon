const mongoose = require('mongoose');

const tyreSchema = new mongoose.Schema({
  // Brand Information
  brand: {
    type: String,
    required: true,
    trim: true,
    enum: ['MRF', 'Apollo', 'CEAT', 'Michelin', 'JK Tyre', 'Other'],
    index: true
  },
  
  // Tyre Details
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  model: {
    type: String,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  
  // Specifications
  size: {
    width: Number, // e.g., 185
    aspectRatio: Number, // e.g., 65
    rimDiameter: Number, // e.g., 15
    fullSize: String // e.g., "185/65 R15"
  },
  loadIndex: {
    type: Number,
    min: 0
  },
  speedRating: {
    type: String,
    enum: ['Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', 'Z'],
    uppercase: true
  },
  type: {
    type: String,
    enum: ['tubeless', 'tube', 'tubeless-ready'],
    default: 'tubeless'
  },
  pattern: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Vehicle Compatibility
  vehicleType: {
    type: String,
    enum: ['car', 'bike', 'truck', 'bus', 'auto', 'other'],
    required: true
  },
  suitableFor: [{
    type: String,
    trim: true
  }],
  
  // Pricing (Reference pricing - actual prices may vary by partner)
  basePrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Features
  features: [{
    type: String,
    trim: true
  }],
  
  // Warranty
  warranty: {
    duration: Number, // in months
    description: String,
    terms: [String]
  },
  
  // Media
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  tags: [String],
  keywords: [String],
  
  // Statistics
  totalSold: {
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
tyreSchema.index({ brand: 1, isActive: 1 });
tyreSchema.index({ vehicleType: 1, isActive: 1 });
tyreSchema.index({ name: 1 });
tyreSchema.index({ tags: 1 });
tyreSchema.index({ createdAt: -1 });

// Update timestamp
tyreSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Get tyre summary
tyreSchema.methods.getSummary = function() {
  return {
    id: this._id,
    brand: this.brand,
    name: this.name,
    model: this.model,
    size: this.size,
    vehicleType: this.vehicleType,
    basePrice: this.basePrice,
    averageRating: this.averageRating,
    isAvailable: this.isAvailable
  };
};

module.exports = mongoose.model('Tyre', tyreSchema);

