const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Booking Information
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  bookingType: {
    type: String,
    enum: ['scheduled', 'emergency', 'on_demand'],
    default: 'on_demand'
  },
  
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userLocation: {
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
  userAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  
  // Partner Information
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  partnerLocation: {
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
  
  // Service Information
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  serviceDescription: String,
  serviceCategory: {
    type: String,
    enum: ['repair', 'maintenance', 'emergency', 'cleaning', 'fuel', 'battery', 'other']
  },
  
  // Vehicle Information
  vehicleDetails: {
    type: {
      type: String,
      enum: ['car', 'bike', 'truck', 'bus', 'auto', 'other']
    },
    brand: String,
    model: String,
    registrationNumber: String,
    color: String,
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg']
    }
  },
  
  // Booking Details
  scheduledDate: {
    type: Date
  },
  scheduledTime: String, // HH:MM format
  estimatedDuration: Number, // in minutes
  actualDuration: Number, // in minutes
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected', 'expired'],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected', 'expired']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: String,
      enum: ['user', 'partner', 'system', 'admin']
    },
    reason: String
  }],
  
  // Pricing
  basePrice: {
    type: Number,
    required: true
  },
  additionalCharges: [{
    name: String,
    amount: Number,
    description: String
  }],
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  partnerEarnings: {
    type: Number,
    default: 0
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'wallet', 'online'],
    default: 'cash'
  },
  transactionId: String,
  
  // Communication
  userNotes: String,
  partnerNotes: String,
  cancellationReason: String,
  
  // Tracking
  estimatedArrivalTime: Date,
  actualArrivalTime: Date,
  serviceStartTime: Date,
  serviceEndTime: Date,
  
  // Emergency Services
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencyPriority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Feedback & Rating
  userRating: {
    type: Number,
    min: 1,
    max: 5
  },
  userReview: String,
  partnerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  partnerReview: String,
  
  // Notifications
  notificationsSent: [{
    type: {
      type: String,
      enum: ['sms', 'push', 'email']
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed']
    }
  }],
  
  // Metadata
  source: {
    type: String,
    enum: ['app', 'web', 'call_center'],
    default: 'app'
  },
  deviceInfo: {
    platform: String,
    version: String,
    deviceId: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  cancelledAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ partnerId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ userLocation: '2dsphere' });
bookingSchema.index({ partnerLocation: '2dsphere' });

// Generate booking ID
bookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.bookingId = `RB${timestamp}${random}`;
  }
  
  // Update status history
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: 'system'
    });
  }
  
  this.updatedAt = new Date();
  next();
});

// Calculate total amount
bookingSchema.methods.calculateTotalAmount = function() {
  const additionalChargesTotal = this.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  this.totalAmount = this.basePrice + additionalChargesTotal - this.discount;
  return this.totalAmount;
};

// Calculate partner earnings
bookingSchema.methods.calculatePartnerEarnings = function() {
  const commissionRate = 0.10; // 10% commission
  this.commissionAmount = this.totalAmount * commissionRate;
  this.partnerEarnings = this.totalAmount - this.commissionAmount;
  return this.partnerEarnings;
};

// Update status
bookingSchema.methods.updateStatus = function(newStatus, updatedBy, reason = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: updatedBy,
    reason: reason
  });
  
  // Set completion time
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  }
  
  // Set cancellation time
  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
  }
  
  return this.save();
};

// Get booking summary
bookingSchema.methods.getSummary = function() {
  return {
    bookingId: this.bookingId,
    status: this.status,
    serviceName: this.serviceName,
    totalAmount: this.totalAmount,
    scheduledDate: this.scheduledDate,
    createdAt: this.createdAt
  };
};

// Check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const allowedStatuses = ['pending', 'accepted'];
  return allowedStatuses.includes(this.status);
};

// Calculate estimated arrival time
bookingSchema.methods.calculateETA = function() {
  if (this.estimatedArrivalTime) {
    return this.estimatedArrivalTime;
  }
  
  // Simple ETA calculation (can be enhanced with real-time traffic data)
  const now = new Date();
  const estimatedMinutes = 15; // Default 15 minutes
  this.estimatedArrivalTime = new Date(now.getTime() + estimatedMinutes * 60000);
  return this.estimatedArrivalTime;
};

module.exports = mongoose.model('Booking', bookingSchema);
