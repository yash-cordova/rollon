# Rollon Backend API

A comprehensive backend API for the Rollon vehicle service booking platform, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **User Management** - Registration, login, profile management, and vehicle details
- **Partner Management** - Service provider registration, approval system, and profile management
- **Service Management** - Service catalog, categories, and provider matching
- **Booking System** - Service booking, scheduling, and status management
- **Emergency Services** - SOS requests, location tracking, and emergency response
- **Admin Panel** - Dashboard, user management, partner approval, and analytics
- **Real-time Features** - Location-based services, distance calculations, and notifications

## 🛠️ Tech Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Security**: bcryptjs, helmet, CORS
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rollon/backend.git
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/rollon
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # Email Configuration (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # SMS Configuration (optional)
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_PHONE_NUMBER=your-twilio-phone
   
   # AWS Configuration (optional)
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-s3-bucket
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB service
   mongod
   
   # Run database setup (if needed)
   npm run db:setup
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🔐 Authentication Endpoints

### User Registration
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "password": "SecurePass123",
  "vehicleDetails": {
    "make": "Honda",
    "model": "City",
    "year": 2020,
    "registrationNumber": "DL01AB1234"
  }
}
```

### User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Send OTP
```http
POST /auth/send-otp
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

### Verify OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-here",
  "newPassword": "NewSecurePass123"
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

## 👤 User Management Endpoints

### Get User Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

### Update User Profile
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "phone": "+919876543211",
  "address": "123 Main Street, Delhi",
  "emergencyContacts": [
    {
      "name": "Emergency Contact",
      "phone": "+919876543212",
      "relationship": "Spouse"
    }
  ]
}
```

### Update User Location
```http
PUT /users/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "Connaught Place, New Delhi"
}
```

### Update Vehicle Details
```http
PUT /users/vehicle
Authorization: Bearer <token>
Content-Type: application/json

{
  "make": "Honda",
  "model": "City",
  "year": 2020,
  "registrationNumber": "DL01AB1234",
  "color": "White",
  "fuelType": "petrol"
}
```

### Get Nearby Services
```http
GET /users/nearby-services?latitude=28.6139&longitude=77.2090&radius=10&service=507f1f77bcf86cd799439013
Authorization: Bearer <token>
```

### Get User Bookings
```http
GET /users/bookings?status=completed&page=1&limit=10
Authorization: Bearer <token>
```

### Get User Emergencies
```http
GET /users/emergencies?status=resolved&page=1&limit=10
Authorization: Bearer <token>
```

## 🏢 Partner Management Endpoints

### Partner Registration
```http
POST /partners/register
Content-Type: application/json

{
  "businessName": "ABC Auto Service",
  "email": "service@abcauto.com",
  "phone": "+919876543211",
  "password": "SecurePass123",
  "address": "123 Service Road, Delhi",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "services": ["507f1f77bcf86cd799439013"],
  "businessHours": {
    "monday": {
      "open": "09:00",
      "close": "18:00"
    }
  }
}
```

### Partner Login
```http
POST /partners/login
Content-Type: application/json

{
  "email": "service@abcauto.com",
  "password": "SecurePass123"
}
```

### Get Partner Profile
```http
GET /partners/profile
Authorization: Bearer <token>
```

### Update Partner Profile
```http
PUT /partners/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "businessName": "ABC Auto Service Center",
  "description": "Professional auto service center with 24/7 support"
}
```

### Get Partner Services
```http
GET /partners/services
Authorization: Bearer <token>
```

### Add Service to Partner
```http
POST /partners/services
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceId": "507f1f77bcf86cd799439013",
  "price": 1200,
  "description": "Professional oil change service"
}
```

### Get Partner Bookings
```http
GET /partners/bookings?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

### Update Booking Status
```http
PUT /partners/bookings/507f1f77bcf86cd799439014/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Service confirmed for tomorrow"
}
```

## 🔧 Service Management Endpoints

### Get All Services
```http
GET /services?category=maintenance&search=oil&page=1&limit=20
```

### Get Service Details
```http
GET /services/507f1f77bcf86cd799439013
```

### Get Service Categories
```http
GET /services/categories
```

### Get Service Providers
```http
GET /services/507f1f77bcf86cd799439013/providers?latitude=28.6139&longitude=77.2090&radius=10&rating=4
```

## 📅 Booking Management Endpoints

### Create Booking
```http
POST /bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "partnerId": "507f1f77bcf86cd799439012",
  "serviceId": "507f1f77bcf86cd799439013",
  "scheduledTime": "2023-12-15T10:00:00Z",
  "vehicleDetails": {
    "make": "Honda",
    "model": "City",
    "year": 2020,
    "registrationNumber": "DL01AB1234"
  },
  "specialInstructions": "Please check the brakes thoroughly",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Connaught Place, New Delhi"
  }
}
```

### Get Booking Details
```http
GET /bookings/507f1f77bcf86cd799439014
Authorization: Bearer <token>
```

### Update Booking
```http
PUT /bookings/507f1f77bcf86cd799439014
Authorization: Bearer <token>
Content-Type: application/json

{
  "scheduledTime": "2023-12-15T14:00:00Z",
  "specialInstructions": "Updated instructions"
}
```

### Cancel Booking
```http
POST /bookings/507f1f77bcf86cd799439014/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Change of plans"
}
```

### Submit Feedback
```http
POST /bookings/507f1f77bcf86cd799439014/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent service, very professional",
  "serviceQuality": 5,
  "timeliness": 4,
  "communication": 5
}
```

## 🚨 Emergency Services Endpoints

### Create Emergency SOS
```http
POST /emergency/sos
Authorization: Bearer <token>
Content-Type: application/json

{
  "emergencyType": "breakdown",
  "priority": "high",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "Connaught Place, New Delhi",
  "description": "Car won't start, battery seems dead",
  "vehicleDetails": {
    "make": "Honda",
    "model": "City",
    "year": 2020,
    "registrationNumber": "DL01AB1234"
  }
}
```

### Get Emergency Details
```http
GET /emergency/507f1f77bcf86cd799439015
Authorization: Bearer <token>
```

### Update Emergency Location
```http
PUT /emergency/507f1f77bcf86cd799439015/update-location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 28.6140,
  "longitude": 77.2091,
  "address": "Updated location address"
}
```

### Cancel Emergency
```http
POST /emergency/507f1f77bcf86cd799439015/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Problem resolved by myself"
}
```

### Get Nearby Emergency Partners
```http
GET /emergency/nearby-partners?latitude=28.6139&longitude=77.2090&radius=20&emergencyType=breakdown
Authorization: Bearer <token>
```

## 👨‍💼 Admin Management Endpoints

### Admin Login
```http
POST /admin/login
Content-Type: application/json

{
  "email": "admin@rollon.in",
  "password": "admin123"
}
```

### Get Admin Dashboard
```http
GET /admin/dashboard
Authorization: Bearer <token>
```

### Get All Users
```http
GET /admin/users?page=1&limit=20&search=john&status=active
Authorization: Bearer <token>
```

### Get All Partners
```http
GET /admin/partners?page=1&limit=20&status=pending&search=abc
Authorization: Bearer <token>
```

### Approve Partner
```http
POST /admin/partners/507f1f77bcf86cd799439012/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "All documents verified and approved"
}
```

### Reject Partner
```http
POST /admin/partners/507f1f77bcf86cd799439012/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Incomplete documentation"
}
```

### Get All Bookings
```http
GET /admin/bookings?page=1&limit=20&status=completed&dateFrom=2023-12-01&dateTo=2023-12-31
Authorization: Bearer <token>
```

### Get All Emergencies
```http
GET /admin/emergencies?page=1&limit=20&status=resolved&priority=high
Authorization: Bearer <token>
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs for secure password storage
- **Input Validation** - Comprehensive validation using express-validator
- **Rate Limiting** - Protection against brute force attacks
- **CORS Protection** - Configurable cross-origin resource sharing
- **Helmet Security** - Security headers and protection
- **Role-based Access Control** - Different permissions for users, partners, and admins

## 📊 Database Models

- **User** - Customer information, vehicle details, and preferences
- **Partner** - Service provider information and services
- **Service** - Available service types and categories
- **Booking** - Service appointments and status tracking
- **Emergency** - Emergency requests and response tracking
- **Admin** - Administrative users and permissions

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.js
```

## 📝 API Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api-docs
```

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production.

### Database
- Use MongoDB Atlas or a production MongoDB instance
- Set up proper indexes for performance
- Configure backup and monitoring

### Security
- Use strong JWT secrets
- Enable HTTPS in production
- Set up proper CORS configuration
- Implement rate limiting
- Use environment-specific configurations

### Performance
- Enable compression
- Set up caching (Redis recommended)
- Use PM2 or similar process manager
- Monitor application performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the API documentation

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete API implementation
- Authentication and authorization
- User and partner management
- Booking and emergency services
- Admin panel
- Comprehensive validation
- Security features

---

**Note**: This is a comprehensive backend API implementation. Make sure to implement proper error handling, logging, and monitoring in production environments.
