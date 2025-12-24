# File Upload Guide - Partner Registration API

This guide shows how to upload files (store photo and price list) to the Partner Registration API endpoint.

## Endpoint
```
POST /api/partners/register
Content-Type: multipart/form-data
```

## Required Files
- **storePhoto**: Store photo (Max 10 MB) - JPEG, PNG, GIF, WebP
- **priceList**: Price list (Max 10 MB) - PDF, Excel (.xls, .xlsx)

---

## Method 1: Using cURL (Command Line)

### Basic Example
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
  -F "storePhoto=@/path/to/your/store-photo.jpg" \
  -F "priceList=@/path/to/your/price-list.pdf"
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
  -F "storePhoto=@./images/store-front.jpg" \
  -F "priceList=@./documents/price-list.xlsx"
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

### Windows CMD Example
```cmd
curl -X POST "http://localhost:5000/api/partners/register" ^
  -F "shopName=ABC Tire Shop" ^
  -F "ownerName=Rajesh Kumar" ^
  -F "mobileNumber=9876543210" ^
  -F "whatsappNumber=9876543210" ^
  -F "shopAddress=123 Main Street, Ahmedabad, Gujarat 380001" ^
  -F "password=Password123" ^
  -F "tyreBrands=MRF" ^
  -F "tyreBrands=Apollo" ^
  -F "tyreBrands=CEAT" ^
  -F "storePhoto=@C:\Users\YourName\Pictures\store-photo.jpg" ^
  -F "priceList=@C:\Users\YourName\Documents\price-list.pdf"
```

---

## Method 2: Using JavaScript (Fetch API)

### Basic Example
```javascript
const formData = new FormData();

// Add text fields
formData.append('shopName', 'ABC Tire Shop');
formData.append('ownerName', 'Rajesh Kumar');
formData.append('mobileNumber', '9876543210');
formData.append('whatsappNumber', '9876543210');
formData.append('shopAddress', '123 Main Street, Ahmedabad, Gujarat 380001');
formData.append('password', 'Password123');

// Add tyre brands (multiple values)
formData.append('tyreBrands', 'MRF');
formData.append('tyreBrands', 'Apollo');
formData.append('tyreBrands', 'CEAT');

// Add files
const storePhotoInput = document.querySelector('#storePhoto'); // File input element
const priceListInput = document.querySelector('#priceList'); // File input element

formData.append('storePhoto', storePhotoInput.files[0]);
formData.append('priceList', priceListInput.files[0]);

// Optional: Google Maps Link
formData.append('googleMapsLink', 'https://maps.google.com/?q=23.0225,72.5714');

// Send request
fetch('http://localhost:5000/api/partners/register', {
  method: 'POST',
  body: formData
})
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### With File Input from HTML Form
```html
<!DOCTYPE html>
<html>
<head>
  <title>Partner Registration</title>
</head>
<body>
  <form id="partnerForm">
    <input type="text" name="shopName" placeholder="Shop Name" required>
    <input type="text" name="ownerName" placeholder="Owner Name" required>
    <input type="text" name="mobileNumber" placeholder="Mobile Number" required>
    <input type="text" name="whatsappNumber" placeholder="WhatsApp Number" required>
    <input type="text" name="shopAddress" placeholder="Shop Address" required>
    <input type="password" name="password" placeholder="Password" required>
    
    <select name="tyreBrands" multiple required>
      <option value="MRF">MRF</option>
      <option value="Apollo">Apollo</option>
      <option value="CEAT">CEAT</option>
      <option value="Michelin">Michelin</option>
      <option value="JK Tyre">JK Tyre</option>
      <option value="Other">Other</option>
    </select>
    
    <input type="file" name="storePhoto" accept="image/jpeg,image/png,image/gif,image/webp" required>
    <input type="file" name="priceList" accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required>
    
    <input type="text" name="googleMapsLink" placeholder="Google Maps Link (Optional)">
    
    <button type="submit">Register</button>
  </form>

  <script>
    document.getElementById('partnerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      
      // Handle multiple tyre brands
      const tyreBrands = Array.from(e.target.querySelector('[name="tyreBrands"]').selectedOptions)
        .map(option => option.value);
      
      // Remove old tyreBrands from FormData
      formData.delete('tyreBrands');
      
      // Add each tyre brand separately
      tyreBrands.forEach(brand => {
        formData.append('tyreBrands', brand);
      });
      
      try {
        const response = await fetch('http://localhost:5000/api/partners/register', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('Registration successful! ' + data.message);
          console.log('Partner Data:', data.data);
        } else {
          alert('Error: ' + data.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Network error occurred');
      }
    });
  </script>
</body>
</html>
```

### Using Axios (Alternative)
```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const formData = new FormData();

// Add text fields
formData.append('shopName', 'ABC Tire Shop');
formData.append('ownerName', 'Rajesh Kumar');
formData.append('mobileNumber', '9876543210');
formData.append('whatsappNumber', '9876543210');
formData.append('shopAddress', '123 Main Street, Ahmedabad, Gujarat 380001');
formData.append('password', 'Password123');

// Add tyre brands
formData.append('tyreBrands', 'MRF');
formData.append('tyreBrands', 'Apollo');
formData.append('tyreBrands', 'CEAT');

// Add files
formData.append('storePhoto', fs.createReadStream('./store-photo.jpg'));
formData.append('priceList', fs.createReadStream('./price-list.pdf'));

// Optional: Google Maps Link
formData.append('googleMapsLink', 'https://maps.google.com/?q=23.0225,72.5714');

axios.post('http://localhost:5000/api/partners/register', formData, {
  headers: formData.getHeaders()
})
  .then(response => {
    console.log('Success:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.response?.data || error.message);
  });
```

---

## Method 3: Using Postman

### Step-by-Step Instructions:

1. **Set Method and URL**
   - Method: `POST`
   - URL: `http://localhost:5000/api/partners/register`

2. **Set Body Type**
   - Go to **Body** tab
   - Select **form-data** (not x-www-form-urlencoded)

3. **Add Text Fields**
   - Key: `shopName`, Value: `ABC Tire Shop`, Type: Text
   - Key: `ownerName`, Value: `Rajesh Kumar`, Type: Text
   - Key: `mobileNumber`, Value: `9876543210`, Type: Text
   - Key: `whatsappNumber`, Value: `9876543210`, Type: Text
   - Key: `shopAddress`, Value: `123 Main Street, Ahmedabad, Gujarat 380001`, Type: Text
   - Key: `password`, Value: `Password123`, Type: Text

4. **Add Tyre Brands (Multiple)**
   - Key: `tyreBrands`, Value: `MRF`, Type: Text
   - Click **+** to add another row
   - Key: `tyreBrands`, Value: `Apollo`, Type: Text
   - Click **+** to add another row
   - Key: `tyreBrands`, Value: `CEAT`, Type: Text

5. **Add Files**
   - Key: `storePhoto`, Type: **File** (change dropdown from Text to File)
   - Click **Select Files** and choose your store photo
   - Key: `priceList`, Type: **File** (change dropdown from Text to File)
   - Click **Select Files** and choose your price list file

6. **Add Optional Field (if needed)**
   - Key: `googleMapsLink`, Value: `https://maps.google.com/?q=23.0225,72.5714`, Type: Text

7. **Send Request**
   - Click **Send** button

### Postman Screenshot Guide:
```
┌─────────────────────────────────────────┐
│ POST http://localhost:5000/api/partners/register │
├─────────────────────────────────────────┤
│ Body → form-data                         │
├─────────────────────────────────────────┤
│ Key          │ Value              │ Type │
├──────────────┼────────────────────┼──────┤
│ shopName     │ ABC Tire Shop      │ Text │
│ ownerName    │ Rajesh Kumar       │ Text │
│ mobileNumber │ 9876543210         │ Text │
│ whatsapp...  │ 9876543210         │ Text │
│ shopAddress  │ 123 Main Street... │ Text │
│ password     │ Password123        │ Text │
│ tyreBrands   │ MRF                │ Text │
│ tyreBrands   │ Apollo             │ Text │
│ tyreBrands   │ CEAT               │ Text │
│ storePhoto   │ [Select File]      │ File │ ← Change to File
│ priceList    │ [Select File]      │ File │ ← Change to File
│ googleMaps...│ https://maps...    │ Text │
└─────────────────────────────────────────┘
```

---

## Method 4: Using Python (Requests Library)

### Basic Example
```python
import requests

url = "http://localhost:5000/api/partners/register"

# Prepare form data
data = {
    'shopName': 'ABC Tire Shop',
    'ownerName': 'Rajesh Kumar',
    'mobileNumber': '9876543210',
    'whatsappNumber': '9876543210',
    'shopAddress': '123 Main Street, Ahmedabad, Gujarat 380001',
    'password': 'Password123',
    'tyreBrands': ['MRF', 'Apollo', 'CEAT'],  # Can be list
    'googleMapsLink': 'https://maps.google.com/?q=23.0225,72.5714'  # Optional
}

# Prepare files
files = {
    'storePhoto': open('./store-photo.jpg', 'rb'),
    'priceList': open('./price-list.pdf', 'rb')
}

try:
    response = requests.post(url, data=data, files=files)
    result = response.json()
    
    if result.get('success'):
        print('Success:', result.get('message'))
        print('Partner ID:', result.get('data', {}).get('_id'))
    else:
        print('Error:', result.get('message'))
        
finally:
    # Close file handles
    files['storePhoto'].close()
    files['priceList'].close()
```

### With Error Handling
```python
import requests
from requests.exceptions import RequestException

def register_partner(shop_name, owner_name, mobile, whatsapp, address, 
                     password, tyre_brands, store_photo_path, price_list_path, 
                     google_maps_link=None):
    url = "http://localhost:5000/api/partners/register"
    
    data = {
        'shopName': shop_name,
        'ownerName': owner_name,
        'mobileNumber': mobile,
        'whatsappNumber': whatsapp,
        'shopAddress': address,
        'password': password,
        'tyreBrands': tyre_brands if isinstance(tyre_brands, list) else [tyre_brands]
    }
    
    if google_maps_link:
        data['googleMapsLink'] = google_maps_link
    
    files = {
        'storePhoto': open(store_photo_path, 'rb'),
        'priceList': open(price_list_path, 'rb')
    }
    
    try:
        response = requests.post(url, data=data, files=files)
        response.raise_for_status()  # Raises an HTTPError for bad responses
        return response.json()
    except RequestException as e:
        print(f'Request failed: {e}')
        return None
    finally:
        files['storePhoto'].close()
        files['priceList'].close()

# Usage
result = register_partner(
    shop_name='ABC Tire Shop',
    owner_name='Rajesh Kumar',
    mobile='9876543210',
    whatsapp='9876543210',
    address='123 Main Street, Ahmedabad, Gujarat 380001',
    password='Password123',
    tyre_brands=['MRF', 'Apollo', 'CEAT'],
    store_photo_path='./store-photo.jpg',
    price_list_path='./price-list.pdf',
    google_maps_link='https://maps.google.com/?q=23.0225,72.5714'
)

if result and result.get('success'):
    print('Registration successful!')
else:
    print('Registration failed:', result.get('message') if result else 'Unknown error')
```

---

## Method 5: Using React Native / Mobile App

### React Native Example
```javascript
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const PartnerRegistration = () => {
  const [storePhoto, setStorePhoto] = useState(null);
  const [priceList, setPriceList] = useState(null);

  const pickStorePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.cancelled) {
      setStorePhoto(result);
    }
  };

  const pickPriceList = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.ms-excel', 
             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    });

    if (!result.cancelled) {
      setPriceList(result);
    }
  };

  const uploadRegistration = async () => {
    if (!storePhoto || !priceList) {
      Alert.alert('Error', 'Please select both store photo and price list');
      return;
    }

    const formData = new FormData();
    
    formData.append('shopName', 'ABC Tire Shop');
    formData.append('ownerName', 'Rajesh Kumar');
    formData.append('mobileNumber', '9876543210');
    formData.append('whatsappNumber', '9876543210');
    formData.append('shopAddress', '123 Main Street, Ahmedabad, Gujarat 380001');
    formData.append('password', 'Password123');
    formData.append('tyreBrands', 'MRF');
    formData.append('tyreBrands', 'Apollo');
    formData.append('tyreBrands', 'CEAT');

    // Add store photo
    formData.append('storePhoto', {
      uri: storePhoto.uri,
      type: 'image/jpeg',
      name: 'store-photo.jpg',
    });

    // Add price list
    formData.append('priceList', {
      uri: priceList.uri,
      type: priceList.mimeType,
      name: priceList.name,
    });

    try {
      const response = await fetch('http://localhost:5000/api/partners/register', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error: ' + error.message);
    }
  };

  return (
    <View>
      <Button title="Pick Store Photo" onPress={pickStorePhoto} />
      <Button title="Pick Price List" onPress={pickPriceList} />
      <Button title="Register" onPress={uploadRegistration} />
    </View>
  );
};

export default PartnerRegistration;
```

---

## Common Issues and Solutions

### Issue 1: File Not Uploading
**Problem**: File is not being sent or received by the server.

**Solutions**:
- Ensure you're using `multipart/form-data` (not `application/json`)
- Check file path is correct (use `@` prefix in curl)
- Verify file size is under 10 MB
- Check file type is allowed (images: JPEG, PNG, GIF, WebP; documents: PDF, Excel)

### Issue 2: "Store photo is required" Error
**Problem**: Server returns error even though file is attached.

**Solutions**:
- Ensure field name is exactly `storePhoto` (case-sensitive)
- In Postman, change field type from "Text" to "File"
- In JavaScript, ensure file is properly appended to FormData
- Check file input element has `name="storePhoto"`

### Issue 3: "Price list is required" Error
**Problem**: Similar to Issue 2, but for price list.

**Solutions**:
- Ensure field name is exactly `priceList` (case-sensitive)
- Verify file is a PDF or Excel file
- Check file is not corrupted

### Issue 4: File Size Too Large
**Problem**: Error message about file size exceeding 10 MB.

**Solutions**:
- Compress images before uploading
- Reduce PDF file size
- Use image compression tools
- Resize images to reasonable dimensions

### Issue 5: Invalid File Type
**Problem**: Server rejects file due to invalid MIME type.

**Solutions**:
- **Store Photo**: Use JPEG, PNG, GIF, or WebP only
- **Price List**: Use PDF or Excel (.xls, .xlsx) only
- Check file extension matches actual file type
- Re-save file in correct format if needed

---

## File Size and Type Requirements

### Store Photo
- **Max Size**: 10 MB
- **Allowed Types**: 
  - JPEG (.jpg, .jpeg)
  - PNG (.png)
  - GIF (.gif)
  - WebP (.webp)
- **Recommended**: 
  - Resolution: 800x600 to 1920x1080
  - Format: JPEG (for smaller file size)
  - Quality: 80-90%

### Price List
- **Max Size**: 10 MB
- **Allowed Types**:
  - PDF (.pdf)
  - Excel (.xls, .xlsx)
- **Recommended**:
  - Format: PDF (universal compatibility)
  - If Excel: Use .xlsx format

---

## Testing Your File Upload

### Quick Test Script (Node.js)
```javascript
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testFileUpload() {
  const formData = new FormData();
  
  formData.append('shopName', 'Test Shop');
  formData.append('ownerName', 'Test Owner');
  formData.append('mobileNumber', '9876543210');
  formData.append('whatsappNumber', '9876543210');
  formData.append('shopAddress', 'Test Address, City, State 123456');
  formData.append('password', 'Test123');
  formData.append('tyreBrands', 'MRF');
  
  // Add files
  formData.append('storePhoto', fs.createReadStream('./test-store-photo.jpg'));
  formData.append('priceList', fs.createReadStream('./test-price-list.pdf'));
  
  try {
    const response = await fetch('http://localhost:5000/api/partners/register', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testFileUpload();
```

---

## Response Examples

### Success Response (201)
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
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Response - Missing File (400)
```json
{
  "success": false,
  "message": "Store photo is required"
}
```

### Error Response - File Too Large (400)
```json
{
  "success": false,
  "message": "File size too large. Maximum size is 10 MB."
}
```

### Error Response - Invalid File Type (400)
```json
{
  "success": false,
  "message": "Invalid file type. Allowed types: image/jpeg, image/png, image/gif, image/webp, application/pdf, ..."
}
```

---

## Best Practices

1. **Always validate files on client-side** before uploading
2. **Show file size** to user before upload
3. **Display upload progress** for better UX
4. **Handle errors gracefully** with user-friendly messages
5. **Compress images** before uploading to reduce file size
6. **Use appropriate file formats** (JPEG for photos, PDF for documents)
7. **Test with different file sizes** to ensure proper handling
8. **Verify file integrity** after upload if possible

---

## Need Help?

If you encounter issues:
1. Check file size and type requirements
2. Verify field names are correct (case-sensitive)
3. Ensure Content-Type is `multipart/form-data`
4. Check server logs for detailed error messages
5. Test with a simple curl command first
6. Verify network connectivity and server is running

