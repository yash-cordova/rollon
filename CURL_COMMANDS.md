# CURL Commands for Rollon APIs

## Base URL
Replace `http://localhost:5000` with your actual server URL if different.

---

# Customer (User) APIs

## 1. Customer Registration

Register a new customer. Anyone can register - no approval needed.

### Register with Email and Phone
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123"
  }'
```

### Register with Phone Only (Email Optional)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Kumar",
    "phone": "9876543210",
    "password": "password123"
  }'
```

### Register with Phone in International Format
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "phone": "+919876543210",
    "password": "password123"
  }'
```

### Register with Vehicle Details
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Amit Patel",
    "email": "amit@example.com",
    "phone": "9876543210",
    "password": "password123",
    "vehicleDetails": {
      "make": "Honda",
      "model": "City",
      "year": 2020,
      "registrationNumber": "GJ01AB1234",
      "color": "White",
      "fuelType": "petrol"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Customer registered successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "9876543210",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 2. Customer Login

Login using email OR phone number.

### Login with Email
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login with Phone Number
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "password123"
  }'
```

### Login with Phone in International Format
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "password": "password123"
  }'
```

### Login with phoneNumber Field
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "9876543210",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token for subsequent requests:**
```bash
# Linux/Mac
export USER_TOKEN="your-token-here"

# Windows PowerShell
$env:USER_TOKEN="your-token-here"
```

---

## 3. Update Customer Profile

Update customer profile. **JWT token is required.**

```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "johnsmith@example.com",
    "phone": "9876543210",
    "gender": "male",
    "dateOfBirth": "1990-01-15",
    "address": {
      "street": "123 Main Street",
      "city": "Ahmedabad",
      "state": "Gujarat",
      "pincode": "380001",
      "country": "India"
    },
    "language": "en"
  }'
```

### Update with Emergency Contacts
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "gender": "male",
    "emergencyContacts": [
      {
        "name": "Jane Doe",
        "phoneNumber": "9876543211",
        "relationship": "Spouse",
        "isPrimary": true
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "johnsmith@example.com",
    "phoneNumber": "9876543210",
    "gender": "male",
    "address": {
      "street": "123 Main Street",
      "city": "Ahmedabad",
      "state": "Gujarat",
      "pincode": "380001",
      "country": "India"
    }
  }
}
```

---

## 4. Request Service from Partner (Customer Auth Required)

Create a service call/request to a partner. **Customer JWT token is required.**

```bash
curl -X POST http://localhost:5000/api/service-calls \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partnerId": "507f1f77bcf86cd799439012",
    "serviceId": "507f1f77bcf86cd799439013",
    "requestMessage": "Need urgent tyre replacement for my car",
    "preferredDate": "2024-01-20",
    "preferredTime": "14:30",
    "urgency": "high",
    "callType": "service_request",
    "vehicleDetails": {
      "type": "car",
      "make": "Honda",
      "model": "City",
      "registrationNumber": "GJ01AB1234"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Service call created successfully",
  "data": {
    "_id": "...",
    "customerId": "...",
    "partnerId": "...",
    "serviceId": "...",
    "serviceName": "Tyre Replacement",
    "callStatus": "pending",
    "urgency": "high",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 5. Get Partners by Service (Customer/Admin Auth Required)

Get list of partners offering a specific service. **Customer or Admin JWT token is required.**

```bash
curl -X GET "http://localhost:5000/api/services/partners?serviceId=507f1f77bcf86cd799439013" \
  -H "Authorization: Bearer YOUR_USER_TOKEN_OR_ADMIN_TOKEN"
```

### With Location Filter (Nearby Partners)
```bash
curl -X GET "http://localhost:5000/api/services/partners?serviceId=507f1f77bcf86cd799439013&latitude=23.0225&longitude=72.5714&radius=10" \
  -H "Authorization: Bearer YOUR_USER_TOKEN_OR_ADMIN_TOKEN"
```

### With Rating Filter
```bash
curl -X GET "http://localhost:5000/api/services/partners?serviceId=507f1f77bcf86cd799439013&rating=4" \
  -H "Authorization: Bearer YOUR_USER_TOKEN_OR_ADMIN_TOKEN"
```

### With Pagination
```bash
curl -X GET "http://localhost:5000/api/services/partners?serviceId=507f1f77bcf86cd799439013&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_USER_TOKEN_OR_ADMIN_TOKEN"
```

### Combined Filters
```bash
curl -X GET "http://localhost:5000/api/services/partners?serviceId=507f1f77bcf86cd799439013&latitude=23.0225&longitude=72.5714&radius=10&rating=4&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_USER_TOKEN_OR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Partners retrieved successfully",
  "service": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Tyre Replacement",
    "category": "repair"
  },
  "data": [
    {
      "_id": "...",
      "shopName": "ABC Tire Shop",
      "ownerName": "Rajesh Kumar",
      "mobileNumber": "9876543210",
      "shopAddress": "123 Main Street, Ahmedabad",
      "services": [
        {
          "serviceId": "507f1f77bcf86cd799439013",
          "name": "Tyre Replacement",
          "price": 200,
          "description": "Professional tyre replacement"
        }
      ],
      "rating": 4.5,
      "distance": 2.5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

---

# Service Calls APIs

## 1. Create Service Call Request (Customer Auth Required)

Customer requests a service from a partner. **Customer JWT token is required.**

```bash
curl -X POST http://localhost:5000/api/service-calls \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partnerId": "507f1f77bcf86cd799439012",
    "serviceId": "507f1f77bcf86cd799439013",
    "requestMessage": "Need urgent tyre replacement for my car",
    "preferredDate": "2024-01-20",
    "preferredTime": "14:30",
    "urgency": "high",
    "callType": "service_request",
    "vehicleDetails": {
      "type": "car",
      "make": "Honda",
      "model": "City",
      "registrationNumber": "GJ01AB1234"
    }
  }'
```

### Minimal Request (Only Required Fields)
```bash
curl -X POST http://localhost:5000/api/service-calls \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partnerId": "507f1f77bcf86cd799439012",
    "serviceId": "507f1f77bcf86cd799439013"
  }'
```

### Emergency Service Request
```bash
curl -X POST http://localhost:5000/api/service-calls \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partnerId": "507f1f77bcf86cd799439012",
    "serviceId": "507f1f77bcf86cd799439013",
    "requestMessage": "Flat tyre on highway, need immediate assistance",
    "urgency": "emergency",
    "callType": "emergency",
    "vehicleDetails": {
      "type": "car",
      "make": "Honda",
      "model": "City"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Service call created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "customerId": {
      "_id": "...",
      "name": "John Doe",
      "phoneNumber": "9876543210",
      "email": "john@example.com"
    },
    "partnerId": {
      "_id": "...",
      "shopName": "ABC Tire Shop",
      "mobileNumber": "9876543210"
    },
    "serviceId": {
      "_id": "...",
      "name": "Tyre Replacement",
      "category": "repair",
      "basePrice": 200
    },
    "callStatus": "pending",
    "urgency": "high",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 2. Partner Dashboard - Service Calls Statistics (Partner Auth Required)

Get partner dashboard with all service call statistics. **Partner JWT token is required.**

### Get All Service Calls
```bash
curl -X GET http://localhost:5000/api/service-calls/partner/dashboard \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -H "Content-Type: application/json"
```

### Filter by Date Range
```bash
curl -X GET "http://localhost:5000/api/service-calls/partner/dashboard?dateFrom=2024-01-01&dateTo=2024-01-31" \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -H "Content-Type: application/json"
```

### Filter by Service
```bash
curl -X GET "http://localhost:5000/api/service-calls/partner/dashboard?serviceId=507f1f77bcf86cd799439013" \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -H "Content-Type: application/json"
```

### Filter by Status
```bash
curl -X GET "http://localhost:5000/api/service-calls/partner/dashboard?callStatus=pending" \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -H "Content-Type: application/json"
```

### Combined Filters (Date Range + Service + Status)
```bash
curl -X GET "http://localhost:5000/api/service-calls/partner/dashboard?dateFrom=2024-01-01&dateTo=2024-01-31&serviceId=507f1f77bcf86cd799439013&callStatus=pending" \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Partner dashboard data retrieved successfully",
  "data": {
    "summary": {
      "totalCalls": 25,
      "callsByStatus": {
        "pending": 5,
        "accepted": 10,
        "rejected": 2,
        "completed": 7,
        "cancelled": 1
      },
      "dateRange": {
        "from": "2024-01-01",
        "to": "2024-01-31"
      }
    },
    "serviceStatistics": [
      {
        "serviceId": "507f1f77bcf86cd799439013",
        "serviceName": "Tyre Replacement",
        "serviceCategory": "repair",
        "totalCalls": 15,
        "callsByStatus": {
          "pending": 3,
          "accepted": 7,
          "rejected": 1,
          "completed": 4,
          "cancelled": 0
        },
        "calls": [
          {
            "id": "...",
            "customerName": "John Doe",
            "customerPhone": "9876543210",
            "callStatus": "pending",
            "urgency": "high",
            "createdAt": "2024-01-15T10:30:00.000Z",
            "requestMessage": "Need urgent tyre replacement"
          }
        ]
      },
      {
        "serviceId": "...",
        "serviceName": "Oil Change",
        "serviceCategory": "maintenance",
        "totalCalls": 10,
        "callsByStatus": {...}
      }
    ],
    "callsByDate": {
      "2024-01-15": 5,
      "2024-01-16": 3,
      "2024-01-17": 7
    },
    "recentCalls": [
      {
        "id": "...",
        "customerName": "John Doe",
        "customerPhone": "9876543210",
        "serviceName": "Tyre Replacement",
        "callStatus": "pending",
        "urgency": "high",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "allCalls": [
      {
        "id": "...",
        "customer": {
          "id": "...",
          "name": "John Doe",
          "phone": "9876543210",
          "email": "john@example.com",
          "address": {
            "street": "123 Main Street",
            "city": "Ahmedabad",
            "state": "Gujarat"
          },
          "vehicles": [...]
        },
        "partner": {
          "id": "...",
          "shopName": "ABC Tire Shop",
          "ownerName": "Rajesh Kumar",
          "phone": "9876543210",
          "address": {...}
        },
        "service": {
          "id": "...",
          "name": "Tyre Replacement",
          "description": "Replace old tyres with new ones",
          "category": "repair",
          "basePrice": 200
        },
        "callStatus": "pending",
        "urgency": "high",
        "requestMessage": "Need urgent tyre replacement",
        "preferredDate": "2024-01-20",
        "preferredTime": "14:30",
        "vehicleDetails": {
          "type": "car",
          "make": "Honda",
          "model": "City"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## Complete Workflow Example

### Step 1: Customer Creates Service Call
```bash
# Save customer token
export CUSTOMER_TOKEN="your-customer-token-here"

# Create service call
curl -X POST http://localhost:5000/api/service-calls \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partnerId": "507f1f77bcf86cd799439012",
    "serviceId": "507f1f77bcf86cd799439013",
    "requestMessage": "Need tyre replacement",
    "urgency": "high"
  }'
```

### Step 2: Partner Views Dashboard
```bash
# Save partner token
export PARTNER_TOKEN="your-partner-token-here"

# View all calls
curl -X GET http://localhost:5000/api/service-calls/partner/dashboard \
  -H "Authorization: Bearer $PARTNER_TOKEN"

# View calls for today
curl -X GET "http://localhost:5000/api/service-calls/partner/dashboard?dateFrom=$(date +%Y-%m-%d)&dateTo=$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $PARTNER_TOKEN"

# View pending calls
curl -X GET "http://localhost:5000/api/service-calls/partner/dashboard?callStatus=pending" \
  -H "Authorization: Bearer $PARTNER_TOKEN"
```

---

## Windows PowerShell Examples

### Create Service Call
```powershell
$customerToken = "your-customer-token-here"

$body = @{
    partnerId = "507f1f77bcf86cd799439012"
    serviceId = "507f1f77bcf86cd799439013"
    requestMessage = "Need urgent tyre replacement"
    urgency = "high"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/service-calls" `
    -Method POST `
    -Headers @{ "Authorization" = "Bearer $customerToken"; "Content-Type" = "application/json" } `
    -Body $body
```

### Get Partner Dashboard
```powershell
$partnerToken = "your-partner-token-here"

# All calls
Invoke-RestMethod -Uri "http://localhost:5000/api/service-calls/partner/dashboard" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $partnerToken" }

# Filter by date
$dateFrom = "2024-01-01"
$dateTo = "2024-01-31"
Invoke-RestMethod -Uri "http://localhost:5000/api/service-calls/partner/dashboard?dateFrom=$dateFrom&dateTo=$dateTo" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $partnerToken" }

# Filter by status
Invoke-RestMethod -Uri "http://localhost:5000/api/service-calls/partner/dashboard?callStatus=pending" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $partnerToken" }
```

---

# Partner APIs

## 1. Partner Registration

Register a new partner (requires admin approval). You can optionally include service IDs during registration.

### Basic Registration (Without Services)
```bash
curl -X POST http://localhost:5000/api/partners/register \
  -F "shopName=ABC Tire Shop" \
  -F "ownerName=Rajesh Kumar" \
  -F "mobileNumber=9876543210" \
  -F "whatsappNumber=9876543210" \
  -F "shopAddress=123 Main Street, Ahmedabad" \
  -F "email=service@abcauto.com" \
  -F "tyreBrands=MRF,Apollo,CEAT" \
  -F "password=Password123" \
  -F "storePhoto=@/path/to/store-photo.jpg" \
  -F "priceList=@/path/to/price-list.pdf"
```

### Registration with Service IDs
```bash
curl -X POST http://localhost:5000/api/partners/register \
  -F "shopName=ABC Tire Shop" \
  -F "ownerName=Rajesh Kumar" \
  -F "mobileNumber=9876543210" \
  -F "whatsappNumber=9876543210" \
  -F "shopAddress=123 Main Street, Ahmedabad" \
  -F "email=service@abcauto.com" \
  -F "tyreBrands=MRF,Apollo,CEAT" \
  -F "password=Password123" \
  -F "serviceIds[]=507f1f77bcf86cd799439013" \
  -F "serviceIds[]=507f1f77bcf86cd799439014" \
  -F "tyreIds[]=507f1f77bcf86cd799439015" \
  -F "tyreIds[]=507f1f77bcf86cd799439016" \
  -F "storePhoto=@/path/to/store-photo.jpg" \
  -F "priceList=@/path/to/price-list.pdf"
```

### Registration with Services (Custom Prices)
```bash
curl -X POST http://localhost:5000/api/partners/register \
  -F "shopName=ABC Tire Shop" \
  -F "ownerName=Rajesh Kumar" \
  -F "mobileNumber=9876543210" \
  -F "whatsappNumber=9876543210" \
  -F "shopAddress=123 Main Street, Ahmedabad" \
  -F "email=service@abcauto.com" \
  -F "tyreBrands=MRF,Apollo,CEAT" \
  -F "password=Password123" \
  -F "services=[{\"serviceId\":\"507f1f77bcf86cd799439013\",\"price\":250,\"description\":\"Premium service\"}]" \
  -F "storePhoto=@/path/to/store-photo.jpg" \
  -F "priceList=@/path/to/price-list.pdf"
```

**Note:** 
- **Use IDs instead of brands/services:**
  - `serviceIds` - Array of service IDs (uses service base price) - **Recommended**
  - `tyreIds` - Array of tyre IDs (brands will be automatically extracted from tyres) - **Recommended**
- **Alternative (Legacy):**
  - `services` - Array of objects with serviceId, price, and description (allows custom pricing)
  - `tyreBrands` - Array of brand names (optional if tyreIds provided, otherwise required)
- **Location:**
  - `googleMapsLink` - Google Maps link (optional) - coordinates will be automatically extracted
  - Supported formats: `https://maps.google.com/?q=lat,lng` or `https://www.google.com/maps/place/.../@lat,lng`
- Services and Tyres are optional during registration - can be added later via respective endpoints

---

## 2. List Partners (Public API - No Auth Required)

Get list of all approved partners or filter by serviceId. **No authentication required.**

### Get All Partners
```bash
curl -X GET http://localhost:5000/api/partners
```

### Filter by Service ID
```bash
curl -X GET "http://localhost:5000/api/partners?serviceId=507f1f77bcf86cd799439013"
```

### With Pagination
```bash
curl -X GET "http://localhost:5000/api/partners?page=1&limit=10"
```

### Filter by Service with Pagination
```bash
curl -X GET "http://localhost:5000/api/partners?serviceId=507f1f77bcf86cd799439013&page=1&limit=10"
```

**Response:**
```json
{
  "success": true,
  "message": "Partners retrieved successfully",
  "data": [
    {
      "_id": "...",
      "shopName": "ABC Tire Shop",
      "ownerName": "Rajesh Kumar",
      "mobileNumber": "9876543210",
      "shopAddress": "123 Main Street, Ahmedabad",
      "services": [
        {
          "serviceId": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Tyre Replacement",
            "category": "repair",
            "basePrice": 200
          },
          "price": 200,
          "description": "Professional tyre replacement"
        }
      ],
      "tyreBrands": ["MRF", "Apollo", "CEAT"],
      "rating": 4.5,
      "approvalStatus": "approved",
      "isApproved": true
    }
  ],
  "filters": {
    "serviceId": "507f1f77bcf86cd799439013"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

**Note:** 
- Returns only approved partners
- If `serviceId` is provided, only partners offering that service are returned
- The `services` array in the response will only contain the matching service when filtered
- If no `serviceId` is provided, all approved partners are returned

---

## 3. Partner Login

Login as partner (only approved partners can login).

```bash
curl -X POST http://localhost:5000/api/partners/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "service@abcauto.com",
    "password": "Password123"
  }'
```

Or with phone:
```bash
curl -X POST http://localhost:5000/api/partners/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "Password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful. Token stored in cookie (web) and returned in response (mobile).",
  "data": {
    "partner": {
      "_id": "...",
      "shopName": "ABC Tire Shop",
      "ownerName": "Rajesh Kumar"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 3. Customer Dashboard - Service Calls History (Customer Auth Required)

Get customer dashboard with all service calls made by the customer. **Customer JWT token is required.**

### Get All Service Calls
```bash
curl -X GET http://localhost:5000/api/service-calls/customer/dashboard \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json"
```

### Filter by Date Range
```bash
curl -X GET "http://localhost:5000/api/service-calls/customer/dashboard?dateFrom=2024-01-01&dateTo=2024-01-31" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json"
```

### Filter by Service
```bash
curl -X GET "http://localhost:5000/api/service-calls/customer/dashboard?serviceId=507f1f77bcf86cd799439013" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json"
```

### Filter by Partner
```bash
curl -X GET "http://localhost:5000/api/service-calls/customer/dashboard?partnerId=507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json"
```

### Filter by Status
```bash
curl -X GET "http://localhost:5000/api/service-calls/customer/dashboard?callStatus=pending" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json"
```

### Combined Filters with Pagination
```bash
curl -X GET "http://localhost:5000/api/service-calls/customer/dashboard?dateFrom=2024-01-01&dateTo=2024-01-31&serviceId=507f1f77bcf86cd799439013&callStatus=pending&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Customer dashboard data retrieved successfully",
  "data": {
    "summary": {
      "totalCalls": 25,
      "callsByStatus": {
        "pending": 5,
        "accepted": 10,
        "rejected": 2,
        "completed": 7,
        "cancelled": 1
      },
      "dateRange": {
        "from": "2024-01-01",
        "to": "2024-01-31"
      }
    },
    "serviceStatistics": [
      {
        "serviceId": "...",
        "serviceName": "Tyre Replacement",
        "serviceCategory": "repair",
        "totalCalls": 15,
        "callsByStatus": {
          "pending": 3,
          "accepted": 6,
          "rejected": 1,
          "completed": 4,
          "cancelled": 1
        }
      }
    ],
    "partnerStatistics": [
      {
        "partnerId": "...",
        "partnerName": "ABC Tire Shop",
        "partnerPhone": "9876543210",
        "totalCalls": 10,
        "callsByStatus": {
          "pending": 2,
          "accepted": 4,
          "rejected": 1,
          "completed": 3,
          "cancelled": 0
        }
      }
    ],
    "callsByDate": {
      "2024-01-15": 3,
      "2024-01-16": 5,
      "2024-01-17": 2
    },
    "calls": [
      {
        "id": "...",
        "customer": {
          "id": "...",
          "name": "John Doe",
          "phone": "9876543210",
          "email": "john@example.com"
        },
        "partner": {
          "id": "...",
          "shopName": "ABC Tire Shop",
          "ownerName": "Rajesh Kumar",
          "phone": "9876543210",
          "rating": 4.5
        },
        "service": {
          "id": "...",
          "name": "Tyre Replacement",
          "category": "repair",
          "basePrice": 200
        },
        "callStatus": "pending",
        "callType": "service_request",
        "urgency": "high",
        "requestMessage": "Need urgent tyre replacement",
        "preferredDate": "2024-01-20",
        "preferredTime": "14:30",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "pages": 2
    }
  }
}
```

---

## 4. Partner Dashboard - Service Calls Statistics

Get partner dashboard with service call statistics. **Partner JWT token is required.**

### Get All Service Calls
```bash
curl -X GET http://localhost:5000/api/service-calls/partner/dashboard \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -H "Content-Type: application/json"
```

### Filter by Date Range
```bash
curl -X GET "http://localhost:5000/api/service-calls/partner/dashboard?dateFrom=2024-01-01&dateTo=2024-01-31" \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -H "Content-Type: application/json"
```

### Filter by Service
```bash
curl -X GET "http://localhost:5000/api/service-calls/partner/dashboard?serviceId=507f1f77bcf86cd799439013" \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -H "Content-Type: application/json"
```

### Filter by Status
```bash
curl -X GET "http://localhost:5000/api/service-calls/partner/dashboard?callStatus=pending" \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -H "Content-Type: application/json"
```

### Combined Filters
```bash
curl -X GET "http://localhost:5000/api/service-calls/partner/dashboard?dateFrom=2024-01-01&dateTo=2024-01-31&serviceId=507f1f77bcf86cd799439013&callStatus=pending" \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Partner dashboard data retrieved successfully",
  "data": {
    "summary": {
      "totalCalls": 25,
      "callsByStatus": {
        "pending": 5,
        "accepted": 10,
        "rejected": 2,
        "completed": 7,
        "cancelled": 1
      },
      "dateRange": {
        "from": "2024-01-01",
        "to": "2024-01-31"
      }
    },
    "serviceStatistics": [
      {
        "serviceId": "...",
        "serviceName": "Tyre Replacement",
        "serviceCategory": "repair",
        "totalCalls": 15,
        "callsByStatus": {
          "pending": 3,
          "accepted": 7,
          "rejected": 1,
          "completed": 4,
          "cancelled": 0
        },
        "calls": [...]
      },
      {
        "serviceId": "...",
        "serviceName": "Oil Change",
        "serviceCategory": "maintenance",
        "totalCalls": 10,
        "callsByStatus": {...}
      }
    ],
    "callsByDate": {
      "2024-01-15": 5,
      "2024-01-16": 3,
      "2024-01-17": 7
    },
    "recentCalls": [...],
    "allCalls": [...]
  }
}
```

---

## 4. Update Partner Profile

Update partner profile. **JWT token is required.**

```bash
curl -X PUT http://localhost:5000/api/partners/profile \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopName": "Updated Shop Name",
    "ownerName": "Updated Owner Name",
    "email": "updated@example.com",
    "mobileNumber": "9876543210",
    "whatsappNumber": "9876543210",
    "shopAddress": "Updated Address, City",
    "googleMapsLink": "https://maps.google.com/?q=23.0225,72.5714",
    "tyreBrands": ["MRF", "Apollo", "CEAT", "Michelin"],
    "address": {
      "street": "123 Main Street",
      "city": "Ahmedabad",
      "state": "Gujarat",
      "pincode": "380001"
    },
    "businessDescription": "Updated business description",
    "businessType": "tire_shop"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "shopName": "Updated Shop Name",
    "ownerName": "Updated Owner Name",
    "email": "updated@example.com",
    "mobileNumber": "9876543210"
  }
}
```

---

# Public APIs (No Auth Required)

## 1. List Services

Get all available services. **No authentication required.**

```bash
curl -X GET http://localhost:5000/api/services
```

### Filter by Category
```bash
curl -X GET "http://localhost:5000/api/services?category=maintenance"
```

### Search Services
```bash
curl -X GET "http://localhost:5000/api/services?search=tyre"
```

### With Pagination
```bash
curl -X GET "http://localhost:5000/api/services?page=1&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Oil Change",
      "description": "Complete engine oil change with filter replacement",
      "category": "maintenance",
      "basePrice": 500,
      "estimatedDuration": 30
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

---

## 2. List Tyres

Get all available tyres. **No authentication required.**

```bash
curl -X GET http://localhost:5000/api/tyres
```

### Filter by Brand
```bash
curl -X GET "http://localhost:5000/api/tyres?brand=MRF"
```

### Filter by Vehicle Type
```bash
curl -X GET "http://localhost:5000/api/tyres?vehicleType=car"
```

### Search Tyres
```bash
curl -X GET "http://localhost:5000/api/tyres?search=Zapper"
```

### Get Tyre Brands
```bash
curl -X GET http://localhost:5000/api/tyres/brands
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "brand": "MRF",
      "name": "Zapper Q",
      "model": "ZQ-185/65 R15",
      "vehicleType": "car",
      "basePrice": 3500,
      "type": "tubeless"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

---

# Admin APIs

## Base URL
Replace `http://localhost:5000` with your actual server URL if different.

---

## 1. Create Admin User (Run Script)

**Note:** This is a Node.js script, not an API endpoint. Run it from the command line:

```bash
cd backend
npm run create-admin
```

Or directly:
```bash
node backend/src/scripts/create-admin.js
```

---

## 2. Admin Login

Get the JWT token for admin authentication:

```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rollonadmin@admin.com",
    "password": "RollOn@1234"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "admin": {
      "_id": "...",
      "email": "rollonadmin@admin.com",
      "role": "super_admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token for subsequent requests:**
```bash
# Linux/Mac
export ADMIN_TOKEN="your-token-here"

# Windows PowerShell
$env:ADMIN_TOKEN="your-token-here"
```

---

## 3. Get Pending Partners with Images

Get list of all partners pending approval, including store photos and price lists as base64:

```bash
curl -X GET "http://localhost:5000/api/admin/partners/pending?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**With pagination:**
```bash
curl -X GET "http://localhost:5000/api/admin/partners/pending?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "shopName": "ABC Tire Shop",
      "ownerName": "Rajesh Kumar",
      "mobileNumber": "9876543210",
      "email": "service@abcauto.com",
      "shopAddress": "123 Main Street, Ahmedabad",
      "storePhoto": {
        "data": "iVBORw0KGgoAAAANSUhEUgAA...",  // Base64 encoded image
        "contentType": "image/jpeg",
        "filename": "store-photo.jpg",
        "size": 245678
      },
      "priceList": {
        "data": "JVBERi0xLjQKJeLjz9MKMy...",  // Base64 encoded file
        "contentType": "application/pdf",
        "filename": "price-list.pdf",
        "size": 456789
      },
      "approvalStatus": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

## 4. Approve Partner by ID

Approve a partner using their MongoDB ID:

```bash
curl -X POST http://localhost:5000/api/admin/partners/507f1f77bcf86cd799439012/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "All documents verified and approved"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Partner approved successfully",
  "data": {
    "partnerId": "507f1f77bcf86cd799439012",
    "isApproved": true,
    "approvalStatus": "approved",
    "approvedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

## 5. Approve Partner by Mobile Number

Approve a partner using their mobile number:

```bash
curl -X POST http://localhost:5000/api/admin/partners/approve-by-mobile \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "9876543210",
    "notes": "All documents verified and approved"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Partner approved successfully",
  "data": {
    "partnerId": "507f1f77bcf86cd799439012",
    "mobileNumber": "9876543210",
    "shopName": "ABC Tire Shop",
    "ownerName": "Rajesh Kumar",
    "isApproved": true,
    "approvalStatus": "approved",
    "approvedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

## 6. List All Customers (Admin Only)

Get all customers with various filters. **Admin authentication required.**

### Get All Customers
```bash
curl -X GET http://localhost:5000/api/admin/customers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Search Customers
```bash
curl -X GET "http://localhost:5000/api/admin/customers?search=John" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Active Status
```bash
curl -X GET "http://localhost:5000/api/admin/customers?isActive=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Gender
```bash
curl -X GET "http://localhost:5000/api/admin/customers?gender=male" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Location
```bash
curl -X GET "http://localhost:5000/api/admin/customers?city=Ahmedabad&state=Gujarat" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Date Range
```bash
curl -X GET "http://localhost:5000/api/admin/customers?dateFrom=2024-01-01&dateTo=2024-01-31" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Combined Filters with Pagination
```bash
curl -X GET "http://localhost:5000/api/admin/customers?search=John&isActive=true&gender=male&city=Ahmedabad&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "9876543210",
      "gender": "male",
      "isActive": true,
      "address": {
        "city": "Ahmedabad",
        "state": "Gujarat"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 7. List All Partners (Admin Only)

Get all partners with various filters. **Admin authentication required.**

### Get All Partners
```bash
curl -X GET http://localhost:5000/api/admin/partners/list \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Search Partners
```bash
curl -X GET "http://localhost:5000/api/admin/partners/list?search=ABC" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Approval Status
```bash
curl -X GET "http://localhost:5000/api/admin/partners/list?approvalStatus=pending" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Business Type
```bash
curl -X GET "http://localhost:5000/api/admin/partners/list?businessType=tire_shop" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Service
```bash
curl -X GET "http://localhost:5000/api/admin/partners/list?serviceId=507f1f77bcf86cd799439013" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Location
```bash
curl -X GET "http://localhost:5000/api/admin/partners/list?city=Ahmedabad&state=Gujarat" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Combined Filters with Pagination
```bash
curl -X GET "http://localhost:5000/api/admin/partners/list?approvalStatus=approved&businessType=tire_shop&city=Ahmedabad&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Partners retrieved successfully",
  "data": [
    {
      "_id": "...",
      "shopName": "ABC Tire Shop",
      "ownerName": "Rajesh Kumar",
      "mobileNumber": "9876543210",
      "approvalStatus": "approved",
      "isApproved": true,
      "businessType": "tire_shop",
      "address": {
        "city": "Ahmedabad",
        "state": "Gujarat"
      },
      "services": [...],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

## 8. Add Service (Admin Only)

Create a new service. **Admin authentication required.**

```bash
curl -X POST http://localhost:5000/api/admin/services \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Oil Change",
    "description": "Complete engine oil change with filter replacement",
    "category": "maintenance",
    "subCategory": "Engine Service",
    "estimatedDuration": 30,
    "basePrice": 500,
    "serviceType": "workshop",
    "complexity": "simple"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "_id": "...",
    "name": "Oil Change",
    "category": "maintenance",
    "basePrice": 500
  }
}
```

---

## 7. Add Tyre (Admin Only)

Create a new tyre. **Admin authentication required.**

```bash
curl -X POST http://localhost:5000/api/admin/tyres \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "MRF",
    "name": "Zapper Q",
    "model": "ZQ-185/65 R15",
    "description": "Premium tubeless tyre for cars",
    "vehicleType": "car",
    "type": "tubeless",
    "basePrice": 3500,
    "size": {
      "width": 185,
      "aspectRatio": 65,
      "rimDiameter": 15,
      "fullSize": "185/65 R15"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Tyre created successfully",
  "data": {
    "_id": "...",
    "brand": "MRF",
    "name": "Zapper Q",
    "vehicleType": "car",
    "basePrice": 3500
  }
}
```

---

## 8. Get All Partners (with filters)

Get all partners with optional filters:

```bash
# Get all partners
curl -X GET "http://localhost:5000/api/admin/partners?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Get only approved partners
curl -X GET "http://localhost:5000/api/admin/partners?approvalStatus=approved&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Get only pending partners
curl -X GET "http://localhost:5000/api/admin/partners?approvalStatus=pending&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Search partners
curl -X GET "http://localhost:5000/api/admin/partners?search=ABC&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Complete Workflow Example

```bash
# Step 1: Login as admin
TOKEN=$(curl -s -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rollonadmin@admin.com",
    "password": "RollOn@1234"
  }' | jq -r '.data.token')

echo "Admin Token: $TOKEN"

# Step 2: Get pending partners
curl -X GET "http://localhost:5000/api/admin/partners/pending" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Step 3: Approve a partner (replace PARTNER_ID with actual ID from step 2)
curl -X POST "http://localhost:5000/api/admin/partners/PARTNER_ID/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Approved after verification"
  }'
```

---

## Windows PowerShell Examples

```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"rollonadmin@admin.com","password":"RollOn@1234"}'
$token = $response.data.token

# Get pending partners
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/partners/pending" `
  -Method GET `
  -Headers @{Authorization="Bearer $token"}

# Approve partner
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/partners/PARTNER_ID/approve" `
  -Method POST `
  -Headers @{Authorization="Bearer $token"} `
  -ContentType "application/json" `
  -Body '{"notes":"Approved"}'
```

---

---

## Complete Customer Workflow Example

```bash
# Step 1: Register a new customer
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123"
  }'

# Step 2: Login with email
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }' | jq -r '.data.token')

echo "Customer Token: $TOKEN"

# Step 3: Login with phone (alternative)
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "password123"
  }' | jq -r '.data.token')
```

---

## Notes

1. **Base64 Image Decoding:** To decode the base64 image data from the response:
   ```bash
   # Save base64 to file
   echo "BASE64_STRING" | base64 -d > image.jpg
   
   # Or in Node.js
   const fs = require('fs');
   const imageBuffer = Buffer.from(base64String, 'base64');
   fs.writeFileSync('image.jpg', imageBuffer);
   ```

2. **Token Expiration:** 
   - Admin tokens expire after 24 hours
   - Customer tokens expire after 7 days
   - Re-login to get a new token

3. **Error Responses:** All endpoints return error responses in this format:
   ```json
   {
     "success": false,
     "message": "Error message here"
   }
   ```

4. **Pagination:** Default page size is 20. Adjust with `limit` parameter (max recommended: 50).

5. **Phone Number Formats:** All phone number fields accept:
   - `9876543210` (10 digits)
   - `+919876543210` (with country code)
   - Both formats are automatically normalized

6. **Customer Registration:** 
   - Email is optional
   - Phone number is required
   - No approval needed - account is active immediately

