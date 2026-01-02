const mongoose = require('mongoose');

const serviceCallSchema = new mongoose.Schema({
  // Customer Information
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  customerLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String
  },

  // Partner Information
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true,
    index: true
  },
  partnerName: {
    type: String,
    required: true,
    trim: true
  },
  partnerPhone: {
    type: String,
    required: true,
    trim: true
  },

  // Service Information
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true
  },
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  serviceCategory: {
    type: String,
    trim: true
  },

  // Call Details
  callStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  callType: {
    type: String,
    enum: ['service_request', 'inquiry', 'emergency'],
    default: 'service_request'
  },
  
  // Request Details
  requestMessage: {
    type: String,
    maxlength: 500,
    trim: true
  },
  preferredDate: {
    type: Date
  },
  preferredTime: {
    type: String // HH:MM format
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },

  // Vehicle Information (if applicable)
  vehicleDetails: {
    type: {
      type: String,
      enum: ['car', 'bike', 'truck', 'bus', 'auto', 'other']
    },
    make: String,
    model: String,
    registrationNumber: String
  },

  // Response Details
  partnerResponse: {
    respondedAt: Date,
    responseMessage: String,
    estimatedPrice: Number,
    estimatedTime: Number, // in minutes
    accepted: Boolean
  },

  // Completion Details
  completedAt: Date,
  actualPrice: Number,
  customerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  customerFeedback: {
    type: String,
    maxlength: 500
  },

  // Metadata
  source: {
    type: String,
    enum: ['app', 'web', 'phone', 'other'],
    default: 'app'
  },
  ipAddress: String,
  userAgent: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
serviceCallSchema.index({ partnerId: 1, createdAt: -1 });
serviceCallSchema.index({ customerId: 1, createdAt: -1 });
serviceCallSchema.index({ serviceId: 1, createdAt: -1 });
serviceCallSchema.index({ callStatus: 1, createdAt: -1 });
serviceCallSchema.index({ partnerId: 1, callStatus: 1, createdAt: -1 });
serviceCallSchema.index({ createdAt: -1 });

// Update timestamp
serviceCallSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Get call summary
serviceCallSchema.methods.getSummary = function() {
  return {
    id: this._id,
    customerName: this.customerName,
    customerPhone: this.customerPhone,
    serviceName: this.serviceName,
    callStatus: this.callStatus,
    createdAt: this.createdAt,
    urgency: this.urgency
  };
};

module.exports = mongoose.model('ServiceCall', serviceCallSchema);

