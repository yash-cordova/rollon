const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  // Basic Information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Authentication
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Role & Permissions
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator', 'support'],
    default: 'admin'
  },
  permissions: [{
    module: {
      type: String,
      enum: ['users', 'partners', 'bookings', 'emergencies', 'payments', 'reports', 'settings']
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'approve', 'reject']
    }]
  }],
  
  // Profile Information
  profilePicture: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: /^[6-9]\d{9}$/
  },
  department: {
    type: String,
    enum: ['operations', 'support', 'finance', 'marketing', 'technical', 'general'],
    default: 'general'
  },
  
  // Activity Tracking
  lastLogin: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    location: String
  }],
  
  // Actions Performed
  actionsPerformed: [{
    action: String,
    target: {
      type: String,
      enum: ['user', 'partner', 'booking', 'emergency', 'payment', 'system']
    },
    targetId: mongoose.Schema.Types.ObjectId,
    details: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statistics
  totalActions: {
    type: Number,
    default: 0
  },
  usersManaged: {
    type: Number,
    default: 0
  },
  partnersApproved: {
    type: Number,
    default: 0
  },
  issuesResolved: {
    type: Number,
    default: 0
  },
  
  // Preferences
  language: {
    type: String,
    enum: ['en', 'hi', 'gu'],
    default: 'en'
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  
  // Security
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  accountLockedUntil: Date
}, {
  timestamps: true
});

// Indexes for better query performance
adminSchema.index({ username: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ createdAt: -1 });

// Hash password before saving
adminSchema.pre('save', async function(next) {
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
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last active
adminSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Record login
adminSchema.methods.recordLogin = function(ipAddress, userAgent, location) {
  this.lastLogin = new Date();
  this.lastActive = new Date();
  this.failedLoginAttempts = 0;
  this.accountLocked = false;
  this.accountLockedUntil = null;
  
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    location
  });
  
  // Keep only last 50 login records
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }
  
  return this.save();
};

// Record failed login attempt
adminSchema.methods.recordFailedLogin = function() {
  this.failedLoginAttempts += 1;
  
  // Lock account after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.accountLocked = true;
    this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  return this.save();
};

// Check if account is locked
adminSchema.methods.isAccountLocked = function() {
  if (!this.accountLocked) return false;
  
  if (this.accountLockedUntil && new Date() > this.accountLockedUntil) {
    this.accountLocked = false;
    this.accountLockedUntil = null;
    this.failedLoginAttempts = 0;
    this.save();
    return false;
  }
  
  return true;
};

// Record action performed
adminSchema.methods.recordAction = function(action, target, targetId, details) {
  this.actionsPerformed.push({
    action,
    target,
    targetId,
    details,
    timestamp: new Date()
  });
  
  this.totalActions += 1;
  
  // Keep only last 100 actions
  if (this.actionsPerformed.length > 100) {
    this.actionsPerformed = this.actionsPerformed.slice(-100);
  }
  
  return this.save();
};

// Check permission
adminSchema.methods.hasPermission = function(module, action) {
  if (this.role === 'super_admin') return true;
  
  const permission = this.permissions.find(p => p.module === module);
  if (!permission) return false;
  
  return permission.actions.includes(action);
};

// Get admin profile (without sensitive data)
adminSchema.methods.getPublicProfile = function() {
  const adminObject = this.toObject();
  delete adminObject.password;
  delete adminObject.twoFactorSecret;
  delete adminObject.passwordResetToken;
  delete adminObject.passwordResetExpires;
  return adminObject;
};

// Generate password reset token
adminSchema.methods.generatePasswordResetToken = function() {
  const token = require('crypto').randomBytes(32).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return this.save();
};

// Clear password reset token
adminSchema.methods.clearPasswordResetToken = function() {
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
  return this.save();
};

module.exports = mongoose.model('Admin', adminSchema);
