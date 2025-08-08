const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  // Emergency Information
  emergencyId: {
    type: String,
    required: true,
    unique: true
  },
  emergencyType: {
    type: String,
    enum: ['breakdown', 'accident', 'fuel_empty', 'battery_dead', 'flat_tire', 'medical', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
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
  
  // Emergency Details
  description: {
    type: String,
    maxlength: 500
  },
  photos: [{
    url: String,
    caption: String
  }],
  
  // Status Tracking
  status: {
    type: String,
    enum: ['active', 'assigned', 'in_progress', 'resolved', 'cancelled'],
    default: 'active'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['active', 'assigned', 'in_progress', 'resolved', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: String,
      enum: ['user', 'partner', 'system', 'admin']
    },
    notes: String
  }],
  
  // Assigned Partner
  assignedPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner'
  },
  assignedPartnerName: String,
  assignedPartnerPhone: String,
  
  // Response Times
  requestTime: {
    type: Date,
    default: Date.now
  },
  responseTime: Date,
  arrivalTime: Date,
  resolutionTime: Date,
  
  // Communication
  userNotes: String,
  partnerNotes: String,
  resolutionNotes: String,
  
  // Emergency Contacts Notified
  contactsNotified: [{
    name: String,
    phoneNumber: String,
    relationship: String,
    notifiedAt: {
      type: Date,
      default: Date.now
    },
    notificationStatus: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent'
    }
  }],
  
  // Notifications Sent
  notificationsSent: [{
    type: {
      type: String,
      enum: ['sms', 'push', 'email', 'call']
    },
    recipient: {
      type: String,
      enum: ['user', 'partner', 'emergency_contact', 'admin']
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed']
    },
    message: String
  }],
  
  // Related Booking (if emergency leads to booking)
  relatedBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  // Cost Information
  estimatedCost: Number,
  actualCost: Number,
  costBreakdown: [{
    item: String,
    amount: Number,
    description: String
  }],
  
  // Feedback
  userRating: {
    type: Number,
    min: 1,
    max: 5
  },
  userFeedback: String,
  partnerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  partnerFeedback: String,
  
  // Metadata
  source: {
    type: String,
    enum: ['sos_button', 'app', 'call_center'],
    default: 'sos_button'
  },
  deviceInfo: {
    platform: String,
    version: String,
    deviceId: String,
    batteryLevel: Number,
    networkType: String
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
  resolvedAt: Date,
  cancelledAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
emergencySchema.index({ emergencyId: 1 });
emergencySchema.index({ userId: 1 });
emergencySchema.index({ assignedPartnerId: 1 });
emergencySchema.index({ status: 1 });
emergencySchema.index({ priority: 1 });
emergencySchema.index({ createdAt: -1 });
emergencySchema.index({ userLocation: '2dsphere' });
emergencySchema.index({ emergencyType: 1 });

// Generate emergency ID
emergencySchema.pre('save', function(next) {
  if (!this.emergencyId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.emergencyId = `EM${timestamp}${random}`;
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

// Update status
emergencySchema.methods.updateStatus = function(newStatus, updatedBy, notes = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: updatedBy,
    notes: notes
  });
  
  // Set resolution time
  if (newStatus === 'resolved') {
    this.resolvedAt = new Date();
  }
  
  // Set cancellation time
  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
  }
  
  return this.save();
};

// Assign partner
emergencySchema.methods.assignPartner = function(partnerId, partnerName, partnerPhone) {
  this.assignedPartnerId = partnerId;
  this.assignedPartnerName = partnerName;
  this.assignedPartnerPhone = partnerPhone;
  this.status = 'assigned';
  this.responseTime = new Date();
  
  return this.updateStatus('assigned', 'system', `Assigned to ${partnerName}`);
};

// Calculate response time
emergencySchema.methods.calculateResponseTime = function() {
  if (this.responseTime && this.requestTime) {
    return (this.responseTime - this.requestTime) / 1000; // in seconds
  }
  return null;
};

// Calculate resolution time
emergencySchema.methods.calculateResolutionTime = function() {
  if (this.resolutionTime && this.requestTime) {
    return (this.resolutionTime - this.requestTime) / 1000; // in seconds
  }
  return null;
};

// Get emergency summary
emergencySchema.methods.getSummary = function() {
  return {
    emergencyId: this.emergencyId,
    emergencyType: this.emergencyType,
    status: this.status,
    priority: this.priority,
    requestTime: this.requestTime,
    assignedPartnerName: this.assignedPartnerName
  };
};

// Check if emergency is active
emergencySchema.methods.isActive = function() {
  return ['active', 'assigned', 'in_progress'].includes(this.status);
};

// Notify emergency contacts
emergencySchema.methods.notifyContacts = function(contacts) {
  contacts.forEach(contact => {
    this.contactsNotified.push({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      relationship: contact.relationship,
      notifiedAt: new Date()
    });
  });
  
  return this.save();
};

module.exports = mongoose.model('Emergency', emergencySchema);
