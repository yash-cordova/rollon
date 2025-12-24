# Database File Storage - How Files are Stored in MongoDB

This document explains how files (store photos and price lists) are stored in the MongoDB database for partner registration.

## Storage Method: Binary Data (Buffer)

Files are stored **directly in MongoDB** as **binary data (Buffer)** within the document. This is also known as "GridFS alternative" or "embedded file storage."

---

## Database Schema Structure

### Partner Document Structure

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  shopName: "ABC Tire Shop",
  ownerName: "Rajesh Kumar",
  mobileNumber: "9876543210",
  whatsappNumber: "9876543210",
  shopAddress: "123 Main Street, Ahmedabad, Gujarat 380001",
  
  // File Storage - Store Photo
  storePhoto: {
    data: Buffer,           // Binary file data
    contentType: "image/jpeg",  // MIME type
    filename: "store-photo.jpg",  // Original filename
    size: 245678            // File size in bytes
  },
  
  // File Storage - Price List
  priceList: {
    data: Buffer,           // Binary file data
    contentType: "application/pdf",  // MIME type
    filename: "price-list.pdf",  // Original filename
    size: 456789            // File size in bytes
  },
  
  tyreBrands: ["MRF", "Apollo", "CEAT"],
  approvalStatus: "pending",
  createdAt: ISODate("2024-01-15T10:30:00.000Z"),
  updatedAt: ISODate("2024-01-15T10:30:00.000Z")
}
```

---

## How Files are Stored

### 1. Upload Process

When a file is uploaded:

```javascript
// File comes from multer middleware as Buffer
const storePhotoFile = req.files.storePhoto[0];

// Converted to MongoDB document structure
const storePhotoData = {
  data: storePhotoFile.buffer,        // Binary data (Buffer object)
  contentType: storePhotoFile.mimetype,  // e.g., "image/jpeg"
  filename: storePhotoFile.originalname, // e.g., "store-photo.jpg"
  size: storePhotoFile.size            // e.g., 245678 bytes
};

// Stored in MongoDB
const partner = new Partner({
  shopName: "...",
  storePhoto: storePhotoData,  // Embedded in document
  // ...
});
```

### 2. MongoDB Storage Format

In MongoDB, the Buffer is stored as **Binary (BinData)** type:

```json
{
  "storePhoto": {
    "data": {
      "$binary": {
        "base64": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoADwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmamqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKAP//Z",
        "subType": "00"
      }
    },
    "contentType": "image/jpeg",
    "filename": "store-photo.jpg",
    "size": 245678
  }
}
```

**Note**: The actual binary data is much longer. The example above is truncated for readability.

---

## Database Document Example

### Complete Partner Document in MongoDB

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "shopName": "ABC Tire Shop",
  "ownerName": "Rajesh Kumar",
  "mobileNumber": "9876543210",
  "whatsappNumber": "9876543210",
  "shopAddress": "123 Main Street, Ahmedabad, Gujarat 380001",
  "googleMapsLink": "https://maps.google.com/?q=23.0225,72.5714",
  "tyreBrands": ["MRF", "Apollo", "CEAT"],
  
  "storePhoto": {
    "data": <Binary Data: 245678 bytes>,  // Actual binary file content
    "contentType": "image/jpeg",
    "filename": "store-photo.jpg",
    "size": 245678
  },
  
  "priceList": {
    "data": <Binary Data: 456789 bytes>,  // Actual binary file content
    "contentType": "application/pdf",
    "filename": "price-list.pdf",
    "size": 456789
  },
  
  "password": "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5K5q5q5q5q5q",
  "businessType": "tire_shop",
  "approvalStatus": "pending",
  "isApproved": false,
  "createdAt": ISODate("2024-01-15T10:30:00.000Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00.000Z")
}
```

---

## Retrieving Files from Database

### 1. Get Partner with Files (Full Data)

```javascript
// Get partner document (includes binary data)
const partner = await Partner.findById(partnerId);

// Access file data
const storePhotoBuffer = partner.storePhoto.data;  // Buffer object
const contentType = partner.storePhoto.contentType;  // "image/jpeg"
const filename = partner.storePhoto.filename;  // "store-photo.jpg"
const size = partner.storePhoto.size;  // 245678
```

### 2. Serve File as HTTP Response

```javascript
// Express route to serve store photo
router.get('/partners/:id/store-photo', async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    
    if (!partner || !partner.storePhoto || !partner.storePhoto.data) {
      return res.status(404).json({ message: 'Store photo not found' });
    }
    
    // Set appropriate headers
    res.set({
      'Content-Type': partner.storePhoto.contentType,
      'Content-Disposition': `inline; filename="${partner.storePhoto.filename}"`,
      'Content-Length': partner.storePhoto.size
    });
    
    // Send binary data
    res.send(partner.storePhoto.data);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving photo' });
  }
});
```

### 3. Get Partner Without File Data (Metadata Only)

```javascript
// Exclude binary data from response to reduce payload size
const partner = await Partner.findById(partnerId).select('-storePhoto.data -priceList.data');

// Response will include metadata but not binary data
{
  "storePhoto": {
    "contentType": "image/jpeg",
    "filename": "store-photo.jpg",
    "size": 245678
    // data field is excluded
  }
}
```

### 4. Convert Buffer to Base64 (for API Response)

```javascript
// If you need to send file as base64 in JSON response
const partner = await Partner.findById(partnerId);

const storePhotoBase64 = partner.storePhoto.data.toString('base64');
const dataUri = `data:${partner.storePhoto.contentType};base64,${storePhotoBase64}`;

// Response
{
  "storePhoto": {
    "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "contentType": "image/jpeg",
    "filename": "store-photo.jpg",
    "size": 245678
  }
}
```

---

## Storage Size Considerations

### Document Size Limits

- **MongoDB Document Limit**: 16 MB per document
- **File Size Limit**: 10 MB per file (enforced in code)
- **Total Files per Partner**: 2 files (storePhoto + priceList)
- **Maximum Total File Size**: ~20 MB (2 × 10 MB)

### Storage Calculation Example

```
Partner Document:
- Text fields: ~500 bytes
- storePhoto: 2.5 MB (binary data)
- priceList: 4.5 MB (binary data)
- Total: ~7 MB per document
```

### Database Size Estimation

```
10,000 partners × 7 MB = ~70 GB
100,000 partners × 7 MB = ~700 GB
```

---

## Pros and Cons

### ✅ Advantages of Buffer Storage

1. **Simplicity**: No separate file system or external storage needed
2. **Atomicity**: Files are part of the document transaction
3. **Backup**: Files are included in database backups automatically
4. **Consistency**: No orphaned files if document is deleted
5. **No External Dependencies**: Works without S3, GridFS, or file servers
6. **Fast Retrieval**: Files load with document (no separate queries)

### ❌ Disadvantages of Buffer Storage

1. **Document Size Limit**: 16 MB MongoDB limit restricts file sizes
2. **Memory Usage**: Entire file loaded into memory when document is retrieved
3. **Network Overhead**: Binary data sent even when not needed
4. **Database Bloat**: Database size grows quickly with many files
5. **Performance**: Large documents can slow down queries
6. **Replication**: Large documents increase replication overhead

---

## Alternative Storage Methods

### Option 1: GridFS (MongoDB's File Storage)

```javascript
// Store files in GridFS
const Grid = require('gridfs-stream');
const mongoose = require('mongoose');

// Upload file to GridFS
const writeStream = gfs.createWriteStream({
  filename: 'store-photo.jpg',
  contentType: 'image/jpeg'
});

// Store only GridFS file ID in document
{
  storePhoto: {
    gridfsId: ObjectId("..."),  // Reference to GridFS file
    filename: "store-photo.jpg",
    contentType: "image/jpeg"
  }
}
```

**Pros**: 
- No 16 MB limit
- Efficient for large files
- Streaming support

**Cons**: 
- More complex setup
- Separate queries needed
- Files not in document backup

### Option 2: External Storage (AWS S3, Cloudinary)

```javascript
// Upload to S3, store URL in database
{
  storePhoto: {
    url: "https://s3.amazonaws.com/bucket/store-photo-123.jpg",
    filename: "store-photo.jpg",
    contentType: "image/jpeg",
    size: 245678
  }
}
```

**Pros**: 
- No size limits
- CDN support
- Reduced database size
- Better performance

**Cons**: 
- External dependency
- Additional costs
- More complex setup
- Files not in database backup

---

## Querying Partners with Files

### Find Partner and Exclude File Data

```javascript
// Get partner without binary data (faster, smaller response)
const partner = await Partner.findById(partnerId)
  .select('-storePhoto.data -priceList.data');

// Or exclude entire file objects
const partner = await Partner.findById(partnerId)
  .select('-storePhoto -priceList');
```

### Find Partner with File Metadata Only

```javascript
// Custom projection
const partner = await Partner.findById(partnerId, {
  shopName: 1,
  ownerName: 1,
  storePhoto: {
    contentType: 1,
    filename: 1,
    size: 1
    // data is excluded
  },
  priceList: {
    contentType: 1,
    filename: 1,
    size: 1
    // data is excluded
  }
});
```

### Count Documents with Files

```javascript
// Count partners with store photos
const count = await Partner.countDocuments({
  'storePhoto.data': { $exists: true, $ne: null }
});
```

---

## Best Practices

### 1. Exclude Binary Data from List Queries

```javascript
// When listing partners, exclude file data
router.get('/partners', async (req, res) => {
  const partners = await Partner.find()
    .select('-storePhoto.data -priceList.data')
    .limit(20);
  
  res.json({ partners });
});
```

### 2. Create Separate Endpoint for File Download

```javascript
// Separate endpoint for file retrieval
router.get('/partners/:id/store-photo', async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  
  if (!partner?.storePhoto?.data) {
    return res.status(404).json({ message: 'Photo not found' });
  }
  
  res.set({
    'Content-Type': partner.storePhoto.contentType,
    'Content-Disposition': `inline; filename="${partner.storePhoto.filename}"`
  });
  
  res.send(partner.storePhoto.data);
});
```

### 3. Implement File Caching

```javascript
// Cache file responses
const cache = require('memory-cache');

router.get('/partners/:id/store-photo', async (req, res) => {
  const cacheKey = `store-photo-${req.params.id}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    res.set(cached.headers);
    return res.send(cached.data);
  }
  
  const partner = await Partner.findById(req.params.id);
  // ... serve file and cache it
});
```

### 4. Validate File Size Before Storage

```javascript
// Already implemented in upload middleware
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

if (file.size > MAX_FILE_SIZE) {
  return res.status(400).json({
    message: 'File size too large. Maximum size is 10 MB.'
  });
}
```

---

## Migration Considerations

### If You Need to Switch to External Storage Later

```javascript
// Migration script example
async function migrateFilesToS3() {
  const partners = await Partner.find({
    'storePhoto.data': { $exists: true }
  });
  
  for (const partner of partners) {
    // Upload to S3
    const s3Url = await uploadToS3(partner.storePhoto.data, partner.storePhoto.filename);
    
    // Update document
    partner.storePhoto = {
      url: s3Url,
      filename: partner.storePhoto.filename,
      contentType: partner.storePhoto.contentType,
      size: partner.storePhoto.size
    };
    
    // Remove binary data
    delete partner.storePhoto.data;
    
    await partner.save();
  }
}
```

---

## Monitoring and Maintenance

### Check Database Size

```javascript
// MongoDB shell command
db.partners.stats()

// Check average document size
db.partners.aggregate([
  { $project: { size: { $bsonSize: "$$ROOT" } } },
  { $group: { _id: null, avgSize: { $avg: "$size" } } }
])
```

### Clean Up Orphaned Files

```javascript
// Find partners with invalid file data
const invalidPartners = await Partner.find({
  $or: [
    { 'storePhoto.data': { $exists: false } },
    { 'storePhoto.size': { $gt: 10 * 1024 * 1024 } }
  ]
});
```

---

## Summary

**Current Implementation:**
- Files stored as **Buffer (binary data)** directly in MongoDB documents
- Each file includes: `data` (Buffer), `contentType`, `filename`, `size`
- Maximum file size: 10 MB per file
- Maximum document size: 16 MB (MongoDB limit)

**Storage Location:**
- MongoDB collection: `partners`
- Field names: `storePhoto`, `priceList`
- Data type: `Buffer` (stored as Binary/BinData in MongoDB)

**Retrieval:**
- Files are retrieved with the document
- Can exclude binary data using `.select()` for performance
- Can serve files directly as HTTP responses

This approach works well for:
- Small to medium files (< 10 MB)
- Applications with moderate file counts
- Simple deployment without external storage
- When files need to be part of document transactions

Consider alternatives (GridFS, S3) if:
- Files exceed 10 MB frequently
- You have millions of files
- You need CDN distribution
- Database size becomes a concern

