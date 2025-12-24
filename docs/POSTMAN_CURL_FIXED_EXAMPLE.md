# Fixed Partner Registration - Postman & cURL Examples

## Issue Fixed
The error `location.coordinates: Path 'location.coordinates' is required` has been fixed. Location is now optional since Google Maps Link is optional.

---

## ✅ Working cURL Example

### Basic Registration (Without Google Maps Link)

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

### With Google Maps Link (Optional)

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

### Windows PowerShell Example

```powershell
$uri = "http://localhost:5000/api/partners/register"

$formData = @{
    shopName = "ABC Tire Shop"
    ownerName = "Rajesh Kumar"
    mobileNumber = "9876543210"
    whatsappNumber = "9876543210"
    shopAddress = "123 Main Street, Ahmedabad, Gujarat 380001"
    password = "Password123"
    tyreBrands = @("MRF", "Apollo", "CEAT")
    storePhoto = Get-Item -Path "C:\Users\YourName\Pictures\store-photo.jpg"
    priceList = Get-Item -Path "C:\Users\YourName\Documents\price-list.pdf"
}

Invoke-RestMethod -Uri $uri -Method Post -Form $formData
```

---

## ✅ Postman Setup

### Step-by-Step:

1. **Method**: `POST`
2. **URL**: `http://localhost:5000/api/partners/register`

3. **Body Tab**:
   - Select **form-data** (not raw or x-www-form-urlencoded)

4. **Add Fields**:

   | Key | Value | Type |
   |-----|-------|------|
   | shopName | ABC Tire Shop | Text |
   | ownerName | Rajesh Kumar | Text |
   | mobileNumber | 9876543210 | Text |
   | whatsappNumber | 9876543210 | Text |
   | shopAddress | 123 Main Street, Ahmedabad, Gujarat 380001 | Text |
   | password | Password123 | Text |
   | tyreBrands | MRF | Text |
   | tyreBrands | Apollo | Text |
   | tyreBrands | CEAT | Text |
   | storePhoto | [Select File] | **File** ← Important! |
   | priceList | [Select File] | **File** ← Important! |
   | googleMapsLink | https://maps.google.com/?q=23.0225,72.5714 | Text (Optional) |

5. **Important Notes**:
   - For `storePhoto` and `priceList`, change the type from "Text" to **"File"**
   - Then click "Select Files" to choose your files
   - `googleMapsLink` is optional - you can skip it

6. **Click Send**

---

## ✅ Expected Success Response

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
    "approvalStatus": "pending",
    "businessType": "tire_shop",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Common Errors and Solutions

### Error 1: "Store photo is required"
**Solution**: Make sure you've selected a file for `storePhoto` and changed the type to "File" in Postman.

### Error 2: "Price list is required"
**Solution**: Make sure you've selected a file for `priceList` and changed the type to "File" in Postman.

### Error 3: "At least one tyre brand is required"
**Solution**: Add at least one `tyreBrands` field with value: MRF, Apollo, CEAT, Michelin, JK Tyre, or Other.

### Error 4: "File size too large"
**Solution**: Ensure files are under 10 MB. Compress images if needed.

### Error 5: "Invalid file type"
**Solution**: 
- Store Photo: Use JPEG, PNG, GIF, or WebP
- Price List: Use PDF or Excel (.xls, .xlsx)

---

## Quick Test Script

Save this as `test-registration.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:5000/api/partners/register"

# Replace these paths with your actual file paths
STORE_PHOTO="./test-store-photo.jpg"
PRICE_LIST="./test-price-list.pdf"

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
  -F "storePhoto=@$STORE_PHOTO" \
  -F "priceList=@$PRICE_LIST"

echo ""
```

Make it executable:
```bash
chmod +x test-registration.sh
./test-registration.sh
```

---

## What Changed?

- **Before**: `location.coordinates` was required, causing error if Google Maps Link not provided
- **After**: `location.coordinates` is optional, registration works with or without Google Maps Link

The location can be:
- Set automatically if Google Maps Link is provided (coordinates extracted)
- Set manually if latitude/longitude are provided
- Left empty if neither is provided (optional)

