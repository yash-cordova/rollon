# Partner Registration - cURL Examples

This document provides cURL examples for testing the Partner Registration API endpoint.

## Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.rollon.in/api`

## Endpoint
```
POST /partners/register
```

## Required Fields
- `shopName` - Shop Name (દુકાનનું નામ / दुकान का नામ)
- `ownerName` - Owner Name (વ્યવસાય માલિકનું નામ / व्यवसाय मालिक का नाम)
- `mobileNumber` - Mobile Number (મોબાઈલ નંબર / मोबाइल नंबर) - 10 digits
- `whatsappNumber` - WhatsApp Number (વોટ્સએપ નંબર / व्हाट्सएप नंबर) - 10 digits
- `shopAddress` - Shop Address (દુકાનનું સરનામું / दुकान का पता)
- `tyreBrands` - Array of tyre brands (MRF, Apollo, CEAT, Michelin, JK Tyre, Other) - At least one required
- `storePhoto` - Store photo file (Max 10 MB) - Required
- `priceList` - Price list file (Max 10 MB) - Required
- `password` - Password (min 6 chars, must contain uppercase, lowercase, and number)

## Optional Fields
- `googleMapsLink` - Google Maps Location Link (Only optional field)

---

## Example 1: Complete Registration (All Required Fields)

```bash
curl -X POST "http://localhost:5000/api/partners/register" \
  -H "Content-Type: multipart/form-data" \
  -F "shopName=ABC Tire Shop" \
  -F "ownerName=Rajesh Kumar" \
  -F "mobileNumber=9876543210" \
  -F "whatsappNumber=9876543210" \
  -F "shopAddress=123 Main Street, Ahmedabad, Gujarat 380001" \
  -F "password=Password123" \
  -F "tyreBrands=MRF" \
  -F "tyreBrands=Apollo" \
  -F "tyreBrands=CEAT" \
  -F "storePhoto=@/path/to/store-photo.jpg" \
  -F "priceList=@/path/to/price-list.pdf"
```

**Note**: Replace `/path/to/store-photo.jpg` and `/path/to/price-list.pdf` with actual file paths. Both files are **required**.

### Response (Success - 201)
```json
{
  "success": true,
  "message": "Partner registered successfully. Please wait for admin approval.",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "shopName": "ABC Tire Shop",
    "ownerName": "Rajesh Kumar",
    "mobileNumber": "9876543210",
    "whatsappNumber": "9876543210",
    "shopAddress": "123 Main Street, Ahmedabad, Gujarat 380001",
    "tyreBrands": ["MRF", "Apollo", "CEAT"],
    "approvalStatus": "pending",
    "businessType": "tire_shop",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Example 2: Registration with Google Maps Link (Optional)

```bash
curl -X POST "http://localhost:5000/api/partners/register" \
  -H "Content-Type: multipart/form-data" \
  -F "shopName=XYZ Tire Center" \
  -F "ownerName=Mohammed Ali" \
  -F "mobileNumber=9876543211" \
  -F "whatsappNumber=9876543211" \
  -F "shopAddress=456 Business Park, Surat, Gujarat 395001" \
  -F "googleMapsLink=https://maps.google.com/?q=21.1702,72.8311" \
  -F "password=SecurePass123" \
  -F "tyreBrands=Michelin" \
  -F "tyreBrands=JK Tyre" \
  -F "storePhoto=@/path/to/store-photo.jpg" \
  -F "priceList=@/path/to/price-list.pdf"
```

**Note**: `googleMapsLink` is the only optional field. All other fields including files are required.

---

## Example 3: Complete Registration (All Fields + Files)

```bash
curl -X POST "http://localhost:5000/api/partners/register" \
  -H "Content-Type: multipart/form-data" \
  -F "shopName=Super Tire Mart" \
  -F "ownerName=Amit Desai" \
  -F "mobileNumber=9876543214" \
  -F "whatsappNumber=9876543214" \
  -F "shopAddress=555 Highway Road, Gandhinagar, Gujarat 382001" \
  -F "googleMapsLink=https://www.google.com/maps/place/Gandhinagar/@23.2156,72.6369,15z" \
  -F "password=StrongPass123" \
  -F "storePhoto=@/path/to/store-photo.jpg" \
  -F "priceList=@/path/to/price-list.xlsx" \
  -F "tyreBrands=MRF" \
  -F "tyreBrands=Apollo" \
  -F "tyreBrands=CEAT" \
  -F "tyreBrands=Michelin" \
  -F "tyreBrands=JK Tyre"
```

---

## Example 4: Using JSON-like Array Format (Alternative)

If your client supports it, you can send tyreBrands as a JSON array:

```bash
curl -X POST "http://localhost:5000/api/partners/register" \
  -H "Content-Type: multipart/form-data" \
  -F "shopName=Modern Tire Shop" \
  -F "ownerName=Ravi Mehta" \
  -F "mobileNumber=9876543215" \
  -F "whatsappNumber=9876543215" \
  -F "shopAddress=999 Industrial Area, Bhavnagar, Gujarat 364001" \
  -F "password=Test1234" \
  -F 'tyreBrands=["MRF","Apollo","CEAT"]'
```

---

## Error Responses

### 400 - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "mobileNumber",
      "message": "Please provide a valid 10-digit Indian mobile number",
      "value": "123"
    }
  ]
}
```

### 400 - File Upload Error
```json
{
  "success": false,
  "message": "File size too large. Maximum size is 10 MB."
}
```

### 409 - Duplicate Registration
```json
{
  "success": false,
  "message": "Mobile number or email already registered"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Internal server error during partner registration"
}
```

---

## Using Postman or Insomnia

### Postman Setup:
1. Method: `POST`
2. URL: `http://localhost:5000/api/partners/register`
3. Body Type: `form-data`
4. Add fields:
   - `shopName` (Text): "ABC Tire Shop"
   - `ownerName` (Text): "Rajesh Kumar"
   - `mobileNumber` (Text): "9876543210"
   - `whatsappNumber` (Text): "9876543210"
   - `shopAddress` (Text): "123 Main Street, Ahmedabad, Gujarat 380001"
   - `password` (Text): "Password123"
   - `tyreBrands` (Text): "MRF" (add multiple entries)
   - `storePhoto` (File): Select image file
   - `priceList` (File): Select PDF/Excel file

### Insomnia Setup:
1. Method: `POST`
2. URL: `http://localhost:5000/api/partners/register`
3. Body Type: `Multipart Form`
4. Add fields as key-value pairs (files as File type)

---

## Testing with Different Scenarios

### Test 1: Missing Required Field
```bash
curl -X POST "http://localhost:5000/api/partners/register" \
  -H "Content-Type: multipart/form-data" \
  -F "shopName=Test Shop" \
  -F "ownerName=Test Owner"
# Missing mobileNumber, whatsappNumber, shopAddress, password, tyreBrands, storePhoto, priceList
# Expected: 400 Validation Error
```

### Test 1b: Missing Required Files
```bash
curl -X POST "http://localhost:5000/api/partners/register" \
  -H "Content-Type: multipart/form-data" \
  -F "shopName=Test Shop" \
  -F "ownerName=Test Owner" \
  -F "mobileNumber=9876543210" \
  -F "whatsappNumber=9876543210" \
  -F "shopAddress=Test Address, City, State 123456" \
  -F "password=Test123" \
  -F "tyreBrands=MRF"
# Missing storePhoto and priceList files
# Expected: 400 Validation Error - "Store photo is required" or "Price list is required"
```

### Test 2: Invalid Mobile Number
```bash
curl -X POST "http://localhost:5000/api/partners/register" \
  -H "Content-Type: multipart/form-data" \
  -F "shopName=Test Shop" \
  -F "ownerName=Test Owner" \
  -F "mobileNumber=123456789" \
  -F "whatsappNumber=9876543210" \
  -F "shopAddress=Test Address, City, State 123456" \
  -F "password=Test123"
# Invalid mobile number (doesn't start with 6-9)
# Expected: 400 Validation Error
```

### Test 3: Missing Tyre Brands
```bash
curl -X POST "http://localhost:5000/api/partners/register" \
  -H "Content-Type: multipart/form-data" \
  -F "shopName=Test Shop" \
  -F "ownerName=Test Owner" \
  -F "mobileNumber=9876543210" \
  -F "whatsappNumber=9876543210" \
  -F "shopAddress=Test Address, City, State 123456" \
  -F "password=Test123" \
  -F "storePhoto=@/path/to/store-photo.jpg" \
  -F "priceList=@/path/to/price-list.pdf"
# Missing tyreBrands
# Expected: 400 Validation Error - "At least one tyre brand is required"
```

### Test 4: Weak Password
```bash
curl -X POST "http://localhost:5000/api/partners/register" \
  -H "Content-Type: multipart/form-data" \
  -F "shopName=Test Shop" \
  -F "ownerName=Test Owner" \
  -F "mobileNumber=9876543210" \
  -F "whatsappNumber=9876543210" \
  -F "shopAddress=Test Address, City, State 123456" \
  -F "password=weak"
# Password too weak (no uppercase/number)
# Expected: 400 Validation Error
```

---

## Notes

1. **Required Fields**: All fields are mandatory except `googleMapsLink`
2. **File Uploads**: Files are stored as binary data (Buffer) in MongoDB
   - **storePhoto**: Required (Max 10 MB) - JPEG, PNG, GIF, WebP
   - **priceList**: Required (Max 10 MB) - PDF, Excel (.xls, .xlsx)
3. **Tyre Brands**: Required, at least one brand must be provided
   - Can be sent as multiple form fields with same key, or as comma-separated string
   - Valid values: MRF, Apollo, CEAT, Michelin, JK Tyre, Other
4. **Coordinates**: If `googleMapsLink` is provided, coordinates are automatically extracted
5. **Password Requirements**: 
   - Minimum 6 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
6. **Mobile Number Format**: Must be 10 digits starting with 6, 7, 8, or 9 (Indian format)

---

## Quick Test Script

Save this as `test-registration.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:5000/api/partners/register"

curl -X POST "$API_URL" \
  -H "Content-Type: multipart/form-data" \
  -F "shopName=Test Tire Shop" \
  -F "ownerName=Test Owner" \
  -F "mobileNumber=9876543210" \
  -F "whatsappNumber=9876543210" \
  -F "shopAddress=123 Test Street, Test City, Test State 123456" \
  -F "password=Test123" \
  -F "tyreBrands=MRF" \
  -F "tyreBrands=Apollo" \
  -F "storePhoto=@/path/to/store-photo.jpg" \
  -F "priceList=@/path/to/price-list.pdf"

echo ""

# Note: Update the file paths above with actual file paths
```

Make it executable and run:
```bash
chmod +x test-registration.sh
./test-registration.sh
```

