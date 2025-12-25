# Admin API - Approve Partner by Mobile Number

This document explains how to approve a partner using their mobile number.

## Endpoint

```
POST /api/admin/partners/approve-by-mobile
```

## Authentication

Requires admin authentication token in the Authorization header.

## Request

### Headers
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

### Body
```json
{
  "mobileNumber": "9876543210",
  "notes": "All documents verified and approved" // Optional
}
```

## Response

### Success (200)
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
    "approvedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error - Partner Not Found (404)
```json
{
  "success": false,
  "message": "Partner with mobile number 9876543210 not found"
}
```

### Error - Already Approved (400)
```json
{
  "success": false,
  "message": "Partner is already approved",
  "data": {
    "partnerId": "507f1f77bcf86cd799439012",
    "mobileNumber": "9876543210",
    "isApproved": true,
    "approvalStatus": "approved"
  }
}
```

### Error - Invalid Mobile Number (400)
```json
{
  "success": false,
  "message": "Invalid mobile number format. Must be 10 digits starting with 6-9"
}
```

---

## cURL Example

```bash
curl -X POST "http://localhost:5000/api/admin/partners/approve-by-mobile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "mobileNumber": "9876543210",
    "notes": "All documents verified and approved"
  }'
```

---

## Postman Example

1. **Method**: `POST`
2. **URL**: `http://localhost:5000/api/admin/partners/approve-by-mobile`
3. **Headers**:
   - `Authorization`: `Bearer YOUR_ADMIN_JWT_TOKEN`
   - `Content-Type`: `application/json`
4. **Body** (raw JSON):
   ```json
   {
     "mobileNumber": "9876543210",
     "notes": "All documents verified and approved"
   }
   ```
5. **Click Send**

---

## JavaScript Example

```javascript
const approvePartner = async (mobileNumber, adminToken, notes = '') => {
  try {
    const response = await fetch('http://localhost:5000/api/admin/partners/approve-by-mobile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        mobileNumber,
        notes
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Partner approved:', result.data);
      return result.data;
    } else {
      console.error('Error:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
};

// Usage
approvePartner('9876543210', 'your-admin-token', 'Documents verified');
```

---

## Python Example

```python
import requests

def approve_partner(mobile_number, admin_token, notes=''):
    url = "http://localhost:5000/api/admin/partners/approve-by-mobile"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    }
    
    data = {
        "mobileNumber": mobile_number,
        "notes": notes
    }
    
    response = requests.post(url, json=data, headers=headers)
    result = response.json()
    
    if result.get('success'):
        print('Partner approved:', result['data'])
        return result['data']
    else:
        print('Error:', result.get('message'))
        return None

# Usage
approve_partner('9876543210', 'your-admin-token', 'Documents verified')
```

---

## What Gets Updated

When a partner is approved, the following fields are updated:

- `isApproved`: `false` → `true`
- `approvalStatus`: `"pending"` → `"approved"`
- `approvalDate`: Set to current date/time
- `approvedBy`: Set to admin user ID
- `approvalNotes`: Set to provided notes (if any)

---

## Notes

1. **Mobile Number Format**: Must be 10 digits starting with 6, 7, 8, or 9 (Indian format)
2. **Authentication**: Requires admin role token
3. **Search**: Searches both `mobileNumber` and `phoneNumber` fields
4. **Validation**: 
   - Checks if partner exists
   - Checks if already approved
   - Prevents approving rejected partners
5. **Idempotent**: Safe to call multiple times (returns success if already approved)

---

## Alternative: Approve by Partner ID

If you have the partner ID instead of mobile number, use:

```
POST /api/admin/partners/:partnerId/approve
```

Example:
```bash
curl -X POST "http://localhost:5000/api/admin/partners/507f1f77bcf86cd799439012/approve" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Approved"}'
```

