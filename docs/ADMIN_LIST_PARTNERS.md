# Admin API - List Partners with Filters

This document explains how to get a list of partners with filtering options, especially by `approvalStatus`.

## Endpoint

```
GET /api/admin/partners
```

## Authentication

Requires admin authentication token in the Authorization header.

## Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | integer | Page number (default: 1) | `1` |
| `limit` | integer | Items per page (default: 20) | `20` |
| `approvalStatus` | string | Filter by approval status | `pending`, `approved`, `rejected`, `suspended` |
| `isApproved` | boolean | Filter by approval boolean | `true`, `false` |
| `search` | string | Search by shop name, business name, owner name, mobile, or email | `ABC Tire` |
| `mobileNumber` | string | Filter by exact mobile number | `9876543210` |

## Response

### Success (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "shopName": "ABC Tire Shop",
      "ownerName": "Rajesh Kumar",
      "mobileNumber": "9876543210",
      "whatsappNumber": "9876543210",
      "shopAddress": "123 Main Street, Ahmedabad, Gujarat 380001",
      "tyreBrands": ["MRF", "Apollo", "CEAT"],
      "isApproved": false,
      "approvalStatus": "pending",
      "storePhoto": {
        "contentType": "image/jpeg",
        "filename": "store-photo.jpg",
        "size": 245678
      },
      "priceList": {
        "contentType": "application/pdf",
        "filename": "price-list.pdf",
        "size": 456789
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 85,
    "pages": 5
  },
  "filters": {
    "approvalStatus": "pending",
    "isApproved": null,
    "search": null,
    "mobileNumber": null
  }
}
```

---

## Examples

### 1. Get All Partners (Default)

```bash
curl -X GET "http://localhost:5000/api/admin/partners" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 2. Get Pending Partners Only

```bash
curl -X GET "http://localhost:5000/api/admin/partners?approvalStatus=pending" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 3. Get Approved Partners Only

```bash
curl -X GET "http://localhost:5000/api/admin/partners?approvalStatus=approved" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 4. Get Rejected Partners

```bash
curl -X GET "http://localhost:5000/api/admin/partners?approvalStatus=rejected" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 5. Get Suspended Partners

```bash
curl -X GET "http://localhost:5000/api/admin/partners?approvalStatus=suspended" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 6. Filter by isApproved (Boolean)

```bash
# Get only approved partners (isApproved = true)
curl -X GET "http://localhost:5000/api/admin/partners?isApproved=true" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Get only non-approved partners (isApproved = false)
curl -X GET "http://localhost:5000/api/admin/partners?isApproved=false" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 7. Search Partners

```bash
# Search by shop name, owner name, mobile, or email
curl -X GET "http://localhost:5000/api/admin/partners?search=ABC" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 8. Filter by Mobile Number

```bash
curl -X GET "http://localhost:5000/api/admin/partners?mobileNumber=9876543210" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 9. Combined Filters

```bash
# Get pending partners with pagination
curl -X GET "http://localhost:5000/api/admin/partners?approvalStatus=pending&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Search for "Tire" in pending partners
curl -X GET "http://localhost:5000/api/admin/partners?approvalStatus=pending&search=Tire" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Get approved partners with search
curl -X GET "http://localhost:5000/api/admin/partners?approvalStatus=approved&search=Rajesh&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

## Postman Examples

### Basic Request
1. **Method**: `GET`
2. **URL**: `http://localhost:5000/api/admin/partners`
3. **Headers**:
   - `Authorization`: `Bearer YOUR_ADMIN_JWT_TOKEN`
4. **Params** (optional):
   - `approvalStatus`: `pending`
   - `page`: `1`
   - `limit`: `20`
   - `search`: `ABC`

### Filter by Approval Status
1. **Method**: `GET`
2. **URL**: `http://localhost:5000/api/admin/partners`
3. **Headers**: `Authorization: Bearer YOUR_ADMIN_JWT_TOKEN`
4. **Params**:
   - `approvalStatus`: `pending` (or `approved`, `rejected`, `suspended`)

---

## JavaScript Examples

### Basic Fetch
```javascript
const getPartners = async (adminToken, filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
  if (filters.isApproved !== undefined) params.append('isApproved', filters.isApproved);
  if (filters.search) params.append('search', filters.search);
  if (filters.mobileNumber) params.append('mobileNumber', filters.mobileNumber);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  
  const url = `http://localhost:5000/api/admin/partners?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

// Usage examples
getPartners('your-token', { approvalStatus: 'pending' });
getPartners('your-token', { approvalStatus: 'approved', page: 1, limit: 10 });
getPartners('your-token', { search: 'ABC Tire', isApproved: false });
```

### Using Axios
```javascript
const axios = require('axios');

const getPartners = async (adminToken, filters = {}) => {
  try {
    const response = await axios.get('http://localhost:5000/api/admin/partners', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      params: filters
    });
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
};

// Usage
getPartners('your-token', {
  approvalStatus: 'pending',
  page: 1,
  limit: 20
});
```

---

## Python Examples

```python
import requests

def get_partners(admin_token, approval_status=None, is_approved=None, 
                 search=None, mobile_number=None, page=1, limit=20):
    url = "http://localhost:5000/api/admin/partners"
    
    headers = {
        "Authorization": f"Bearer {admin_token}"
    }
    
    params = {
        "page": page,
        "limit": limit
    }
    
    if approval_status:
        params["approvalStatus"] = approval_status
    if is_approved is not None:
        params["isApproved"] = is_approved
    if search:
        params["search"] = search
    if mobile_number:
        params["mobileNumber"] = mobile_number
    
    response = requests.get(url, headers=headers, params=params)
    return response.json()

# Usage examples
# Get pending partners
result = get_partners('your-token', approval_status='pending')

# Get approved partners
result = get_partners('your-token', approval_status='approved', page=1, limit=10)

# Search partners
result = get_partners('your-token', search='ABC Tire')

# Get by mobile number
result = get_partners('your-token', mobile_number='9876543210')
```

---

## Approval Status Values

| Status | Description |
|--------|-------------|
| `pending` | Partner registered but not yet reviewed |
| `approved` | Partner approved by admin |
| `rejected` | Partner registration rejected |
| `suspended` | Partner account suspended |

---

## Response Fields

### Partner Object (File data excluded for performance)
- `_id`: Partner ID
- `shopName`: Shop name
- `ownerName`: Owner name
- `mobileNumber`: Mobile number
- `whatsappNumber`: WhatsApp number
- `shopAddress`: Shop address
- `tyreBrands`: Array of tyre brands
- `isApproved`: Boolean approval status
- `approvalStatus`: String approval status
- `storePhoto`: File metadata (binary data excluded)
- `priceList`: File metadata (binary data excluded)
- `createdAt`: Registration date
- `updatedAt`: Last update date

**Note**: Binary file data (`storePhoto.data` and `priceList.data`) is excluded from the list response for better performance. Use individual partner endpoints to retrieve file data if needed.

---

## Pagination

The response includes pagination information:

```json
{
  "pagination": {
    "page": 1,      // Current page
    "limit": 20,    // Items per page
    "total": 85,    // Total partners matching filters
    "pages": 5      // Total pages
  }
}
```

---

## Filter Combinations

You can combine multiple filters:

```bash
# Pending partners with search
?approvalStatus=pending&search=ABC

# Approved partners, page 2, 10 per page
?approvalStatus=approved&page=2&limit=10

# Non-approved partners with mobile number search
?isApproved=false&search=9876543210

# All filters combined
?approvalStatus=pending&isApproved=false&search=Tire&page=1&limit=20
```

---

## Common Use Cases

### 1. Get All Pending Partners for Review
```bash
GET /api/admin/partners?approvalStatus=pending&page=1&limit=50
```

### 2. Find Specific Partner by Mobile
```bash
GET /api/admin/partners?mobileNumber=9876543210
```

### 3. Search for Partners by Name
```bash
GET /api/admin/partners?search=Rajesh
```

### 4. Get All Approved Partners
```bash
GET /api/admin/partners?approvalStatus=approved
```

### 5. Get Rejected Partners for Review
```bash
GET /api/admin/partners?approvalStatus=rejected
```

---

## Error Responses

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized. Admin access required."
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Internal server error while retrieving partners"
}
```

---

## Notes

1. **Authentication**: Requires admin JWT token
2. **File Data**: Binary file data is excluded from list responses for performance
3. **Search**: Searches across multiple fields (shopName, businessName, ownerName, mobileNumber, email)
4. **Pagination**: Default is 20 items per page, max recommended is 100
5. **Sorting**: Results are sorted by creation date (newest first)
6. **Performance**: Large result sets are paginated automatically

