# Rollon API Documentation 📚

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Endpoints](#api-endpoints)
- [WebSocket Events](#websocket-events)
- [Testing](#testing)

## Overview

The Rollon API is a RESTful service built with Node.js and Express, designed to support the Rollon vehicle service platform. The API provides endpoints for user management, partner operations, booking services, emergency handling, and administrative functions.

### API Version
- **Current Version**: v1.0.0
- **Base URL**: `https://api.rollon.in/v1` (production)
- **Development URL**: `http://localhost:5000/api`

### Response Format
All API responses follow a consistent JSON format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

## Authentication

### JWT Token Authentication
Most endpoints require authentication using JWT tokens.

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Token Structure
```javascript
{
  "userId": "user_id",
  "userType": "user|partner|admin",
  "phoneNumber": "9876543210",
  "iat": 1642234567,
  "exp": 1642839367
}
```

### OTP Authentication
For user registration and login, OTP-based authentication is used.

#### OTP Flow
1. **Send OTP**: `POST /auth/send-otp`
2. **Verify OTP**: `POST /auth/verify-otp`
3. **Get Token**: `POST /auth/login`

## Base URL

### Development
```
http://localhost:5000/api
```

### Production
```
https://api.rollon.in/v1
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

### Error Codes
| Code | Description |
|------|-------------|
| `INVALID_INPUT` | Invalid request parameters |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Data validation failed |
| `DUPLICATE_ENTRY` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## Rate Limiting

- **Rate Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information included in response headers
- **Exceeded Response**: 429 status code with retry-after header

## API Endpoints

### Authentication Endpoints

#### 1. Send OTP
```http
POST /auth/send-otp
```

**Request Body:**
```json
{
  "phoneNumber": "9876543210",
  "userType": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phoneNumber": "9876543210",
    "expiresIn": 600
  }
}
```

#### 2. Verify OTP
```http
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "phoneNumber": "9876543210",
  "otp": "123456",
  "userType": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "phoneNumber": "9876543210",
      "isPhoneVerified": true
    }
  }
}
```

#### 3. Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "phoneNumber": "9876543210",
  "password": "password123",
  "userType": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "phoneNumber": "9876543210"
    }
  }
}
```

#### 4. Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new_jwt_token_here",
    "refreshToken": "new_refresh_token_here"
  }
}
```

### User Endpoints

#### 1. Get User Profile
```http
GET /users/profile
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "phoneNumber": "9876543210",
    "email": "john@example.com",
    "profilePicture": "https://example.com/profile.jpg",
    "currentLocation": {
      "type": "Point",
      "coordinates": [72.8777, 19.0760]
    },
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "vehicles": [
      {
        "type": "car",
        "brand": "Honda",
        "model": "City",
        "registrationNumber": "MH01AB1234"
      }
    ],
    "emergencyContacts": [
      {
        "name": "Emergency Contact",
        "phoneNumber": "9876543211",
        "relationship": "spouse"
      }
    ],
    "language": "en",
    "totalBookings": 5,
    "totalSpent": 2500,
    "rating": 4.5,
    "reviewCount": 3
  }
}
```

#### 2. Update User Profile
```http
PUT /users/profile
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "currentLocation": {
    "type": "Point",
    "coordinates": [72.8777, 19.0760]
  },
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 3. Add Vehicle
```http
POST /users/vehicles
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "type": "car",
  "brand": "Honda",
  "model": "City",
  "year": 2020,
  "registrationNumber": "MH01AB1234",
  "color": "White",
  "fuelType": "petrol"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vehicle added successfully",
  "data": {
    "id": "vehicle_id",
    "type": "car",
    "brand": "Honda",
    "model": "City",
    "registrationNumber": "MH01AB1234"
  }
}
```

### Partner Endpoints

#### 1. Get Nearby Partners
```http
GET /partners/nearby?latitude=19.0760&longitude=72.8777&radius=10&serviceType=garage
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Nearby partners retrieved successfully",
  "data": {
    "partners": [
      {
        "id": "partner_id",
        "businessName": "ABC Garage",
        "businessType": "garage",
        "location": {
          "type": "Point",
          "coordinates": [72.8777, 19.0760]
        },
        "address": {
          "street": "456 Service Rd",
          "city": "Mumbai",
          "state": "Maharashtra"
        },
        "rating": 4.5,
        "reviewCount": 25,
        "isOnline": true,
        "distance": 2.5,
        "services": [
          {
            "name": "Oil Change",
            "price": 500,
            "estimatedTime": 30
          }
        ]
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10
  }
}
```

#### 2. Get Partner Details
```http
GET /partners/:partnerId
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Partner details retrieved successfully",
  "data": {
    "id": "partner_id",
    "businessName": "ABC Garage",
    "businessType": "garage",
    "businessDescription": "Professional auto repair services",
    "location": {
      "type": "Point",
      "coordinates": [72.8777, 19.0760]
    },
    "address": {
      "street": "456 Service Rd",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "contactPerson": {
      "name": "Rajesh Kumar",
      "phone": "9876543210",
      "email": "rajesh@abcgarage.com"
    },
    "services": [
      {
        "name": "Oil Change",
        "description": "Complete oil change service",
        "price": 500,
        "currency": "INR",
        "estimatedTime": 30,
        "category": "maintenance"
      }
    ],
    "businessHours": [
      {
        "day": "monday",
        "isOpen": true,
        "openTime": "09:00",
        "closeTime": "18:00"
      }
    ],
    "rating": 4.5,
    "reviewCount": 25,
    "totalBookings": 150,
    "isOnline": true,
    "photos": [
      {
        "url": "https://example.com/garage1.jpg",
        "caption": "Workshop Area"
      }
    ]
  }
}
```

### Booking Endpoints

#### 1. Create Booking
```http
POST /bookings
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "partnerId": "partner_id",
  "serviceId": "service_id",
  "vehicleDetails": {
    "type": "car",
    "brand": "Honda",
    "model": "City",
    "registrationNumber": "MH01AB1234"
  },
  "scheduledDate": "2024-01-20",
  "scheduledTime": "10:00",
  "userLocation": {
    "type": "Point",
    "coordinates": [72.8777, 19.0760]
  },
  "userAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "userNotes": "Please check brakes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "bookingId": "RB202401151234567890",
    "status": "pending",
    "partnerId": "partner_id",
    "serviceName": "Oil Change",
    "totalAmount": 500,
    "scheduledDate": "2024-01-20",
    "scheduledTime": "10:00",
    "estimatedArrivalTime": "2024-01-20T10:15:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. Get User Bookings
```http
GET /bookings?status=active&page=1&limit=10
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": {
    "bookings": [
      {
        "bookingId": "RB202401151234567890",
        "status": "accepted",
        "serviceName": "Oil Change",
        "partnerName": "ABC Garage",
        "totalAmount": 500,
        "scheduledDate": "2024-01-20",
        "scheduledTime": "10:00",
        "estimatedArrivalTime": "2024-01-20T10:15:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

#### 3. Cancel Booking
```http
PUT /bookings/:bookingId/cancel
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "reason": "Change of plans"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "bookingId": "RB202401151234567890",
    "status": "cancelled",
    "cancelledAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Emergency Endpoints

#### 1. Create Emergency Request
```http
POST /emergency
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "emergencyType": "breakdown",
  "description": "Car won't start",
  "vehicleDetails": {
    "type": "car",
    "brand": "Honda",
    "model": "City",
    "registrationNumber": "MH01AB1234"
  },
  "userLocation": {
    "type": "Point",
    "coordinates": [72.8777, 19.0760]
  },
  "userAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "photos": [
    {
      "url": "https://example.com/emergency1.jpg",
      "caption": "Engine compartment"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Emergency request created successfully",
  "data": {
    "emergencyId": "EM202401151234567890",
    "status": "active",
    "priority": "medium",
    "emergencyType": "breakdown",
    "estimatedResponseTime": 15,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. Get Emergency Status
```http
GET /emergency/:emergencyId
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Emergency status retrieved successfully",
  "data": {
    "emergencyId": "EM202401151234567890",
    "status": "assigned",
    "emergencyType": "breakdown",
    "priority": "medium",
    "assignedPartner": {
      "id": "partner_id",
      "name": "ABC Garage",
      "phone": "9876543210"
    },
    "estimatedArrivalTime": "2024-01-15T10:45:00.000Z",
    "requestTime": "2024-01-15T10:30:00.000Z",
    "responseTime": "2024-01-15T10:32:00.000Z"
  }
}
```

### Admin Endpoints

#### 1. Get Dashboard Statistics
```http
GET /admin/dashboard
```

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "users": {
      "total": 15000,
      "active": 8500,
      "newThisMonth": 1200
    },
    "partners": {
      "total": 500,
      "active": 350,
      "pendingApproval": 25
    },
    "bookings": {
      "total": 25000,
      "completed": 22000,
      "pending": 1500,
      "cancelled": 1500
    },
    "emergencies": {
      "total": 500,
      "active": 15,
      "resolved": 485
    },
    "revenue": {
      "total": 2500000,
      "thisMonth": 150000,
      "averagePerBooking": 100
    }
  }
}
```

#### 2. Get Partner Approval Requests
```http
GET /admin/partners/pending?page=1&limit=10
```

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Pending partner requests retrieved successfully",
  "data": {
    "partners": [
      {
        "id": "partner_id",
        "businessName": "New Garage",
        "businessType": "garage",
        "phoneNumber": "9876543210",
        "email": "contact@newgarage.com",
        "location": {
          "type": "Point",
          "coordinates": [72.8777, 19.0760]
        },
        "address": {
          "city": "Mumbai",
          "state": "Maharashtra"
        },
        "submittedAt": "2024-01-15T10:30:00.000Z",
        "documents": [
          {
            "name": "Business License",
            "url": "https://example.com/license.pdf"
          }
        ]
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

#### 3. Approve Partner
```http
PUT /admin/partners/:partnerId/approve
```

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "notes": "All documents verified and approved"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Partner approved successfully",
  "data": {
    "partnerId": "partner_id",
    "status": "approved",
    "approvedAt": "2024-01-15T10:30:00.000Z",
    "approvedBy": "admin_id"
  }
}
```

## WebSocket Events

### Connection
```javascript
const socket = io('https://api.rollon.in', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Events

#### 1. Booking Updates
```javascript
// Listen for booking status updates
socket.on('booking:updated', (data) => {
  console.log('Booking updated:', data);
  // data: { bookingId, status, updatedAt }
});

// Listen for new booking assignments (for partners)
socket.on('booking:assigned', (data) => {
  console.log('New booking assigned:', data);
  // data: { bookingId, userDetails, serviceDetails }
});
```

#### 2. Emergency Updates
```javascript
// Listen for emergency status updates
socket.on('emergency:updated', (data) => {
  console.log('Emergency updated:', data);
  // data: { emergencyId, status, assignedPartner }
});

// Listen for new emergency assignments (for partners)
socket.on('emergency:assigned', (data) => {
  console.log('New emergency assigned:', data);
  // data: { emergencyId, userDetails, emergencyType }
});
```

#### 3. Partner Status Updates
```javascript
// Listen for partner online/offline status
socket.on('partner:status', (data) => {
  console.log('Partner status changed:', data);
  // data: { partnerId, isOnline, lastActive }
});
```

#### 4. Real-time Location Updates
```javascript
// Update user location
socket.emit('location:update', {
  coordinates: [72.8777, 19.0760],
  timestamp: new Date()
});

// Listen for nearby partner updates
socket.on('partners:nearby', (data) => {
  console.log('Nearby partners updated:', data);
  // data: { partners: [...] }
});
```

## Testing

### Postman Collection
Download the complete Postman collection: [Rollon API Collection](https://api.rollon.in/postman/rollon-api.json)

### Test Environment
- **Base URL**: `https://test-api.rollon.in/v1`
- **Test Credentials**: Available in the test environment documentation

### API Testing Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Rollon API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

#### API Status
```http
GET /status
```

**Response:**
```json
{
  "success": true,
  "message": "API status retrieved successfully",
  "data": {
    "database": "connected",
    "redis": "connected",
    "services": {
      "sms": "operational",
      "email": "operational",
      "push": "operational"
    },
    "uptime": "7d 12h 30m",
    "version": "1.0.0"
  }
}
```

---

## SDKs and Libraries

### JavaScript/Node.js
```bash
npm install rollon-api-client
```

```javascript
const RollonAPI = require('rollon-api-client');

const api = new RollonAPI({
  baseURL: 'https://api.rollon.in/v1',
  token: 'your_jwt_token'
});

// Get nearby partners
const partners = await api.partners.getNearby({
  latitude: 19.0760,
  longitude: 72.8777,
  radius: 10
});
```

### React Native
```bash
npm install @rollon/react-native-sdk
```

```javascript
import { RollonSDK } from '@rollon/react-native-sdk';

const sdk = new RollonSDK({
  apiKey: 'your_api_key',
  environment: 'production'
});

// Create booking
const booking = await sdk.bookings.create({
  partnerId: 'partner_id',
  serviceId: 'service_id',
  scheduledDate: '2024-01-20'
});
```

---

*This API documentation covers all the essential endpoints for the Rollon vehicle service platform. For additional support, contact the development team.* 🇮🇳
