const multer = require('multer');

// Configure multer to store files in memory (as Buffer) for MongoDB
const storage = multer.memoryStorage();

// File filter to allow all file types (no content type restriction)
const fileFilter = (req, file, cb) => {
  // Accept all file types
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max file size
  },
  fileFilter: fileFilter
});

// Middleware for partner registration file uploads
const uploadPartnerFiles = upload.fields([
  { name: 'storePhoto', maxCount: 1 },
  { name: 'priceList', maxCount: 1 }
]);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10 MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next();
};

module.exports = {
  uploadPartnerFiles,
  handleUploadError
};

