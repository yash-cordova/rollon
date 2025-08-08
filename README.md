# Rollon - Bharat Ka Seva Mission 🚗🇮🇳

> **हर वाहनधारक तक आवश्यक सेवाएं पहुँचाना** - Connecting every vehicle owner to essential services

## 📋 Table of Contents

- [Overview](#overview)
- [Mission](#mission)
- [MVP Features](#mvp-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Contact](#contact)

## 🎯 Overview

Rollon is a comprehensive vehicle service platform designed to bridge the gap between vehicle owners and service providers across India. Our mission is to ensure that every vehicle owner has access to essential services like tire shops, garages, EV battery swaps, and petrol pumps through a simple, user-friendly application.

## 🚀 Mission

**Bharat Ka Seva Mission** - To reach every vehicle owner with essential services, making vehicle maintenance and emergency assistance accessible to all.

## ✨ MVP Features

### 1. User App (Public) 📱

#### Core Features:
- **📍 Nearby Services Finder** - GPS-based location services
  - Tire shops
  - Garages
  - EV battery swap stations
  - Petrol pumps
  - Emergency services

- **🔧 Book a Service** 
  - Service booking with real-time ETA
  - Service tracking
  - Feedback and rating system

- **🚨 Emergency Button (SOS)**
  - Quick emergency assistance
  - Family alert system
  - Nearby help coordination

- **👤 User Authentication**
  - Mobile OTP-based login
  - Secure user registration

- **🌐 Multilingual Support**
  - Hindi
  - Gujarati
  - English

### 2. Dealer/Partner App 🏪

#### Partner Features:
- **🏪 Register Shop in 5 Clicks**
  - Shop name and details
  - Address and location
  - Service types offered
  - Shop photos

- **📱 Service Request Management**
  - Accept/reject service requests
  - View customer location
  - Real-time notifications

- **💰 Earnings & History**
  - Daily/weekly reports
  - Transaction history
  - Performance analytics

- **🔄 Online/Offline Toggle**
  - Control service availability
  - Status management

### 3. Admin Dashboard 👨‍💼

#### Administrative Features:
- **👥 User & Partner Management**
  - View and manage users
  - Partner approval system
  - Account monitoring

- **📊 Analytics Dashboard**
  - Request analytics
  - Active partner tracking
  - Feedback analysis
  - Performance metrics

## 🏗️ Architecture

```
Rollon Application
├── Frontend (React Native)
│   ├── User App
│   ├── Partner App
│   └── Admin Dashboard
├── Backend (Node.js + Express)
│   ├── RESTful APIs
│   ├── Real-time Communication (Socket.io)
│   ├── Authentication & Authorization
│   ├── File Upload (AWS S3)
│   ├── Push Notifications (Firebase)
│   ├── SMS/OTP (Twilio)
│   └── API Documentation (Swagger)
└── Database (MongoDB)
    ├── User Management
    ├── Partner Management
    ├── Service Bookings
    ├── Emergency Requests
    └── Analytics Data
```
│   └── Admin Dashboard
├── Backend (Node.js/Express)
│   ├── REST APIs
│   ├── Authentication
│   └── Business Logic
├── Database (MongoDB)
│   ├── User Management
│   ├── Service Bookings
│   └── Partner Data
└── Infrastructure
    ├── AWS/Cloud Services
    ├── Push Notifications
    └── Payment Gateway (Future)
```

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Redux/Context API** - State management
- **React Navigation** - Navigation handling
- **Maps Integration** - GPS and location services

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MongoDB** - Primary database
- **Mongoose** - ODM for MongoDB
- **Redis** - Caching and sessions
- **JWT** - Authentication
- **Socket.io** - Real-time communication
- **Swagger** - API documentation

### Infrastructure
- **AWS/Cloud Platform** - Hosting and services
- **AWS S3** - File storage
- **Firebase** - Push notifications
- **Google Maps API** - Location services
- **Twilio** - SMS/OTP services

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- React Native development environment
- Android Studio / Xcode

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rollon-tech/rollon-app.git
   cd rollon-app
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install

   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp .env.example .env
   # Configure your environment variables
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB service
   mongod
   
   # Create database and collections
   npm run db:setup
   
   # Seed initial data
   npm run seed
   ```

5. **Start Development Servers**
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend (in new terminal)
   cd frontend
   npm start
   ```

## 📁 Project Structure

```
rollon-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── database-setup.js
│   │   │   └── swagger.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Partner.js
│   │   │   ├── Booking.js
│   │   │   ├── Emergency.js
│   │   │   ├── Admin.js
│   │   │   └── Service.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── partners.js
│   │   │   ├── services.js
│   │   │   ├── bookings.js
│   │   │   ├── emergency.js
│   │   │   └── admin.js
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── notFound.js
│   │   └── server.js
│   ├── tests/
│   ├── env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── services/
│   │   └── utils/
│   ├── android/
│   ├── ios/
│   └── package.json
├── docs/
│   ├── DATABASE_ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   └── PROJECT_SUMMARY.md
├── README.md
└── package.json
```

## 📚 API Documentation

The Rollon API is fully documented using **Swagger/OpenAPI 3.0**. You can access the interactive API documentation at:

### Development Environment
- **Swagger UI**: `http://localhost:5000/api-docs`
- **API Base URL**: `http://localhost:5000/api`

### Production Environment
- **Swagger UI**: `https://api.rollon.in/api-docs`
- **API Base URL**: `https://api.rollon.in/api`

### API Features
- **Authentication**: JWT Bearer tokens
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Error Handling**: Standardized error responses
- **Pagination**: Consistent pagination across all endpoints
- **Real-time**: WebSocket support for live updates

### API Categories
- **Authentication** (`/auth`) - User/Partner registration, login, OTP
- **Users** (`/users`) - User profile management, nearby services
- **Partners** (`/partners`) - Partner registration, profile management
- **Services** (`/services`) - Service listings, categories
- **Bookings** (`/bookings`) - Service booking management
- **Emergency** (`/emergency`) - SOS requests, emergency assistance
- **Admin** (`/admin`) - Administrative operations, analytics

## 📱 App Screens (MVP)

| Screen | Purpose | Features |
|--------|---------|----------|
| **Splash/Login** | User authentication | OTP-based login |
| **Home** | Main dashboard | Nearby services, emergency button |
| **Book Service** | Service booking | Select type, map, confirm |
| **Partner Profile** | Service provider info | View garage/shop details |
| **My Bookings** | Booking management | Past and active bookings |
| **Register as Partner** | Partner onboarding | Shop registration form |

## 🔮 Future Phase Features

- **💳 Payment Gateway Integration**
- **💬 Chat Support System**
- **🤖 AI-based Service Matching**
- **🛡️ Insurance Integration**
- **📷 Smart Camera Detection**
- **💼 Digital Wallet**
- **🆔 Government ID Integration**

## 🤝 Contributing

We welcome contributions to make Rollon better! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📞 Contact

**Rollon Technologies Pvt. Ltd.**

- **Founder**: Rajveer Singh
- **Email**: [contact@rollon.in](mailto:contact@rollon.in)
- **Website**: [www.rollon.in](https://www.rollon.in)

---

## 🇮🇳 Jai Hind, Jai Bharat! 🇮🇳

*Building the future of vehicle services in India, one connection at a time.*

---

**Note**: This is an MVP (Minimum Viable Product) focused on core features. Additional features will be added in future phases based on user feedback and business requirements.
