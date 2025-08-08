# Rollon Database Architecture Documentation 🗄️

## Table of Contents

- [Overview](#overview)
- [Database Technology](#database-technology)
- [Collections Overview](#collections-overview)
- [Detailed Schema Design](#detailed-schema-design)
- [Indexes & Performance](#indexes--performance)
- [Relationships & References](#relationships--references)
- [Data Flow](#data-flow)
- [Security Considerations](#security-considerations)
- [Scalability Strategy](#scalability-strategy)
- [Backup & Recovery](#backup--recovery)

## Overview

The Rollon application uses **MongoDB** as its primary database, designed to handle vehicle service bookings, emergency requests, user management, and partner operations. The database architecture is optimized for:

- **Geospatial queries** for nearby service providers
- **Real-time operations** for booking and emergency management
- **Scalability** to handle millions of users across India
- **Multi-language support** (Hindi, Gujarati, English)
- **Mobile-first** data structure

## Database Technology

### MongoDB Version
- **Version**: 5.0+
- **Storage Engine**: WiredTiger
- **Replication**: 3-node replica set (production)
- **Sharding**: Planned for horizontal scaling

### Key Features Utilized
- **Geospatial Indexes**: For location-based queries
- **Text Indexes**: For search functionality
- **Compound Indexes**: For complex queries
- **TTL Indexes**: For session management
- **Change Streams**: For real-time updates

## Collections Overview

| Collection | Purpose | Document Count | Size Estimate |
|------------|---------|----------------|---------------|
| **users** | User profiles and authentication | 1M+ | ~500MB |
| **partners** | Service provider information | 50K+ | ~200MB |
| **bookings** | Service bookings and transactions | 5M+ | ~2GB |
| **emergencies** | Emergency requests and SOS | 100K+ | ~100MB |
| **admins** | Administrative users | 100+ | ~1MB |
| **services** | Service definitions | 1K+ | ~10MB |

## Detailed Schema Design

### 1. Users Collection

**Purpose**: Store user profiles, authentication, and preferences

```javascript
{
  _id: ObjectId,
  
  // Basic Information
  phoneNumber: String (unique, Indian format),
  name: String,
  email: String,
  
  // Authentication
  password: String (hashed),
  isPhoneVerified: Boolean,
  otp: {
    code: String,
    expiresAt: Date
  },
  
  // Profile
  profilePicture: String,
  dateOfBirth: Date,
  gender: String,
  
  // Location
  currentLocation: {
    type: "Point",
    coordinates: [Number, Number] // [longitude, latitude]
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  
  // Vehicles
  vehicles: [{
    type: String,
    brand: String,
    model: String,
    year: Number,
    registrationNumber: String,
    color: String,
    fuelType: String
  }],
  
  // Emergency Contacts
  emergencyContacts: [{
    name: String,
    phoneNumber: String,
    relationship: String,
    isPrimary: Boolean
  }],
  
  // Preferences
  language: String,
  notifications: {
    push: Boolean,
    sms: Boolean,
    email: Boolean
  },
  
  // Statistics
  totalBookings: Number,
  totalSpent: Number,
  rating: Number,
  reviewCount: Number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Key Indexes**:
- `phoneNumber` (unique)
- `currentLocation` (2dsphere)
- `vehicles.registrationNumber`
- `createdAt` (descending)

### 2. Partners Collection

**Purpose**: Store service provider information and business details

```javascript
{
  _id: ObjectId,
  
  // Basic Information
  phoneNumber: String (unique),
  name: String,
  email: String,
  
  // Business Information
  businessName: String,
  businessType: String,
  businessDescription: String,
  
  // Location
  location: {
    type: "Point",
    coordinates: [Number, Number]
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    country: String
  },
  
  // Services
  services: [{
    name: String,
    description: String,
    price: Number,
    currency: String,
    isAvailable: Boolean,
    estimatedTime: Number,
    category: String
  }],
  
  // Business Hours
  businessHours: [{
    day: String,
    isOpen: Boolean,
    openTime: String,
    closeTime: String,
    breakStart: String,
    breakEnd: String
  }],
  
  // Status
  isOnline: Boolean,
  isApproved: Boolean,
  approvalStatus: String,
  
  // Financial
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String
  },
  commissionRate: Number,
  
  // Statistics
  totalBookings: Number,
  completedBookings: Number,
  totalEarnings: Number,
  rating: Number,
  reviewCount: Number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Key Indexes**:
- `phoneNumber` (unique)
- `location` (2dsphere)
- `businessType`
- `isOnline` + `isApproved` (compound)
- `rating` (descending)

### 3. Bookings Collection

**Purpose**: Track service bookings and transactions

```javascript
{
  _id: ObjectId,
  
  // Booking Information
  bookingId: String (unique),
  bookingType: String,
  
  // User Information
  userId: ObjectId (ref: users),
  userLocation: {
    type: "Point",
    coordinates: [Number, Number]
  },
  userAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  
  // Partner Information
  partnerId: ObjectId (ref: partners),
  partnerLocation: {
    type: "Point",
    coordinates: [Number, Number]
  },
  
  // Service Information
  serviceId: ObjectId (ref: services),
  serviceName: String,
  serviceDescription: String,
  serviceCategory: String,
  
  // Vehicle Information
  vehicleDetails: {
    type: String,
    brand: String,
    model: String,
    registrationNumber: String,
    color: String,
    fuelType: String
  },
  
  // Booking Details
  scheduledDate: Date,
  scheduledTime: String,
  estimatedDuration: Number,
  actualDuration: Number,
  
  // Status
  status: String,
  statusHistory: [{
    status: String,
    timestamp: Date,
    updatedBy: String,
    reason: String
  }],
  
  // Pricing
  basePrice: Number,
  additionalCharges: [{
    name: String,
    amount: Number,
    description: String
  }],
  discount: Number,
  totalAmount: Number,
  commissionAmount: Number,
  partnerEarnings: Number,
  
  // Payment
  paymentStatus: String,
  paymentMethod: String,
  transactionId: String,
  
  // Tracking
  estimatedArrivalTime: Date,
  actualArrivalTime: Date,
  serviceStartTime: Date,
  serviceEndTime: Date,
  
  // Feedback
  userRating: Number,
  userReview: String,
  partnerRating: Number,
  partnerReview: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date,
  cancelledAt: Date
}
```

**Key Indexes**:
- `bookingId` (unique)
- `userId`
- `partnerId`
- `status`
- `createdAt` (descending)
- `scheduledDate`
- `userLocation` (2dsphere)
- `partnerLocation` (2dsphere)

### 4. Emergencies Collection

**Purpose**: Handle emergency requests and SOS functionality

```javascript
{
  _id: ObjectId,
  
  // Emergency Information
  emergencyId: String (unique),
  emergencyType: String,
  priority: String,
  
  // User Information
  userId: ObjectId (ref: users),
  userLocation: {
    type: "Point",
    coordinates: [Number, Number]
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
    type: String,
    brand: String,
    model: String,
    registrationNumber: String,
    color: String,
    fuelType: String
  },
  
  // Emergency Details
  description: String,
  photos: [{
    url: String,
    caption: String
  }],
  
  // Status
  status: String,
  statusHistory: [{
    status: String,
    timestamp: Date,
    updatedBy: String,
    notes: String
  }],
  
  // Assigned Partner
  assignedPartnerId: ObjectId (ref: partners),
  assignedPartnerName: String,
  assignedPartnerPhone: String,
  
  // Response Times
  requestTime: Date,
  responseTime: Date,
  arrivalTime: Date,
  resolutionTime: Date,
  
  // Communication
  userNotes: String,
  partnerNotes: String,
  resolutionNotes: String,
  
  // Emergency Contacts
  contactsNotified: [{
    name: String,
    phoneNumber: String,
    relationship: String,
    notifiedAt: Date,
    notificationStatus: String
  }],
  
  // Cost Information
  estimatedCost: Number,
  actualCost: Number,
  costBreakdown: [{
    item: String,
    amount: Number,
    description: String
  }],
  
  // Feedback
  userRating: Number,
  userFeedback: String,
  partnerRating: Number,
  partnerFeedback: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  resolvedAt: Date,
  cancelledAt: Date
}
```

**Key Indexes**:
- `emergencyId` (unique)
- `userId`
- `assignedPartnerId`
- `status`
- `priority`
- `createdAt` (descending)
- `userLocation` (2dsphere)
- `emergencyType`

### 5. Admins Collection

**Purpose**: Administrative users and system management

```javascript
{
  _id: ObjectId,
  
  // Basic Information
  username: String (unique),
  email: String (unique),
  name: String,
  
  // Authentication
  password: String (hashed),
  isEmailVerified: Boolean,
  isActive: Boolean,
  
  // Role & Permissions
  role: String,
  permissions: [{
    module: String,
    actions: [String]
  }],
  
  // Profile
  profilePicture: String,
  phoneNumber: String,
  department: String,
  
  // Activity Tracking
  lastLogin: Date,
  lastActive: Date,
  loginHistory: [{
    timestamp: Date,
    ipAddress: String,
    userAgent: String,
    location: String
  }],
  
  // Actions Performed
  actionsPerformed: [{
    action: String,
    target: String,
    targetId: ObjectId,
    details: String,
    timestamp: Date
  }],
  
  // Statistics
  totalActions: Number,
  usersManaged: Number,
  partnersApproved: Number,
  issuesResolved: Number,
  
  // Security
  twoFactorEnabled: Boolean,
  twoFactorSecret: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  failedLoginAttempts: Number,
  accountLocked: Boolean,
  accountLockedUntil: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Key Indexes**:
- `username` (unique)
- `email` (unique)
- `role`
- `isActive`
- `createdAt` (descending)

### 6. Services Collection

**Purpose**: Define service types and configurations

```javascript
{
  _id: ObjectId,
  
  // Service Information
  name: String,
  description: String,
  category: String,
  subCategory: String,
  
  // Service Details
  serviceType: String,
  estimatedDuration: Number,
  complexity: String,
  
  // Pricing
  basePrice: Number,
  currency: String,
  pricingModel: String,
  additionalCharges: [{
    name: String,
    amount: Number,
    description: String,
    isOptional: Boolean
  }],
  
  // Vehicle Compatibility
  compatibleVehicles: [{
    type: String,
    brands: [String],
    models: [String],
    fuelTypes: [String]
  }],
  
  // Requirements
  requirements: [{
    name: String,
    description: String,
    isMandatory: Boolean
  }],
  
  // Materials & Parts
  materials: [{
    name: String,
    quantity: Number,
    unit: String,
    cost: Number,
    isIncluded: Boolean
  }],
  
  // Warranty
  warranty: {
    duration: Number,
    description: String,
    terms: [String]
  },
  
  // Availability
  isAvailable: Boolean,
  availabilityHours: {
    startTime: String,
    endTime: String,
    days: [String]
  },
  
  // Emergency Services
  isEmergencyService: Boolean,
  emergencyResponseTime: Number,
  emergencyRadius: Number,
  
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
    isPrimary: Boolean
  }],
  videos: [{
    url: String,
    title: String,
    description: String
  }],
  
  // Statistics
  totalBookings: Number,
  averageRating: Number,
  reviewCount: Number,
  
  // Status
  isActive: Boolean,
  isApproved: Boolean,
  approvalStatus: String,
  
  // Metadata
  tags: [String],
  keywords: [String],
  seoDescription: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Key Indexes**:
- `name`
- `category`
- `subCategory`
- `isActive` + `isApproved` (compound)
- `averageRating` (descending)
- `tags`
- `createdAt` (descending)

## Indexes & Performance

### Geospatial Indexes
```javascript
// Users - Current location
db.users.createIndex({ currentLocation: "2dsphere" })

// Partners - Business location
db.partners.createIndex({ location: "2dsphere" })

// Bookings - User and partner locations
db.bookings.createIndex({ userLocation: "2dsphere" })
db.bookings.createIndex({ partnerLocation: "2dsphere" })

// Emergencies - User location
db.emergencies.createIndex({ userLocation: "2dsphere" })
```

### Compound Indexes
```javascript
// Partners - Online and approved status
db.partners.createIndex({ isOnline: 1, isApproved: 1 })

// Bookings - Status and creation date
db.bookings.createIndex({ status: 1, createdAt: -1 })

// Services - Active and approved status
db.services.createIndex({ isActive: 1, isApproved: 1 })
```

### Text Indexes
```javascript
// Partners - Business name and description
db.partners.createIndex({ businessName: "text", businessDescription: "text" })

// Services - Name and description
db.services.createIndex({ name: "text", description: "text" })
```

## Relationships & References

### Primary Relationships
1. **User → Bookings**: One-to-Many
2. **Partner → Bookings**: One-to-Many
3. **User → Emergencies**: One-to-Many
4. **Partner → Emergencies**: One-to-Many
5. **Service → Bookings**: One-to-Many

### Reference Strategy
- **Embedded Documents**: For small, frequently accessed data
- **Referenced Documents**: For large, less frequently accessed data
- **Hybrid Approach**: For complex relationships

### Data Consistency
- **Application-level validation** for referential integrity
- **Database-level constraints** where possible
- **Cascade updates** handled in application logic

## Data Flow

### 1. User Registration Flow
```
User Input → Validation → User Document → OTP Verification → Profile Completion
```

### 2. Booking Flow
```
Service Selection → Partner Matching → Booking Creation → Status Updates → Completion
```

### 3. Emergency Flow
```
SOS Trigger → Emergency Creation → Partner Assignment → Resolution → Feedback
```

### 4. Partner Onboarding Flow
```
Registration → Document Upload → Admin Review → Approval → Service Activation
```

## Security Considerations

### Data Protection
- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: Secure token-based authentication
- **Field-level Encryption**: For sensitive data
- **Access Control**: Role-based permissions

### Privacy Compliance
- **GDPR Compliance**: Data retention policies
- **PII Protection**: Encrypted personal information
- **Consent Management**: User consent tracking
- **Data Portability**: Export capabilities

### Audit Trail
- **Action Logging**: All admin actions tracked
- **Change History**: Document modification tracking
- **Access Logs**: Login and access monitoring

## Scalability Strategy

### Horizontal Scaling
- **Sharding**: By geographic region
- **Read Replicas**: For read-heavy operations
- **Load Balancing**: Application-level distribution

### Performance Optimization
- **Indexing Strategy**: Optimized for common queries
- **Caching**: Redis for session and cache data
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Aggregation pipelines

### Data Archiving
- **TTL Indexes**: For temporary data
- **Archive Collections**: For old bookings
- **Backup Strategy**: Regular automated backups

## Backup & Recovery

### Backup Strategy
- **Daily Backups**: Full database backup
- **Hourly Incrementals**: For critical data
- **Point-in-Time Recovery**: For disaster recovery
- **Cross-Region Backup**: Geographic redundancy

### Recovery Procedures
- **Automated Recovery**: Script-based restoration
- **Data Validation**: Post-recovery verification
- **Rollback Procedures**: Version control for schema changes

### Monitoring
- **Performance Metrics**: Query execution times
- **Storage Monitoring**: Disk space and growth
- **Connection Monitoring**: Active connections
- **Error Tracking**: Failed operations logging

---

## Database Statistics Dashboard

### Real-time Metrics
- **Active Users**: Users online in last 24 hours
- **Active Partners**: Partners online and available
- **Pending Bookings**: Bookings awaiting confirmation
- **Active Emergencies**: Emergency requests in progress

### Performance Metrics
- **Query Response Time**: Average query execution time
- **Index Usage**: Most used indexes
- **Storage Growth**: Monthly data growth rate
- **Connection Pool**: Database connection utilization

### Business Metrics
- **Booking Conversion Rate**: Successful bookings vs requests
- **Partner Response Time**: Average partner response time
- **User Satisfaction**: Average ratings and reviews
- **Revenue Metrics**: Transaction volumes and amounts

---

*This database architecture is designed to support the Rollon platform's mission of connecting every vehicle owner to essential services across India.* 🇮🇳
