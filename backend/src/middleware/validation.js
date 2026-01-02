const { body, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * Validation rules for user registration (customer)
 */
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .custom((value) => {
      // Accept both formats: +919876543210 or 9876543210
      const normalized = value.replace(/^\+91/, '').replace(/\D/g, '');
      if (normalized.length === 10 && /^[6-9]/.test(normalized)) {
        return true;
      }
      throw new Error('Please provide a valid 10-digit Indian mobile number (e.g., 9876543210 or +919876543210)');
    }),
  
  body('phoneNumber')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian mobile number starting with 6-9'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other'),
  
  // Optional fields
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  
  body('profilePicture')
    .optional()
    .isString()
    .withMessage('Profile picture must be a string'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Street address must be between 1 and 200 characters'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City must be between 1 and 100 characters'),
  
  body('address.state')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State must be between 1 and 100 characters'),
  
  body('address.pincode')
    .optional()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be 6 digits'),
  
  body('language')
    .optional()
    .isIn(['en', 'hi', 'gu'])
    .withMessage('Language must be one of: en, hi, gu'),
  
  body('vehicleDetails.make')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Vehicle make must be between 1 and 30 characters'),
  
  body('vehicleDetails.model')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Vehicle model must be between 1 and 30 characters'),
  
  body('vehicleDetails.year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Vehicle year must be between 1900 and next year'),
  
  body('vehicleDetails.registrationNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Registration number must be between 5 and 20 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for user login (supports email or phone)
 */
const validateLogin = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .custom((value) => {
      // Accept both formats: +919876543210 or 9876543210
      const normalized = value.replace(/^\+91/, '').replace(/\D/g, '');
      if (normalized.length === 10 && /^[6-9]/.test(normalized)) {
        return true;
      }
      throw new Error('Please provide a valid 10-digit Indian mobile number');
    }),
  
  body('phoneNumber')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian mobile number starting with 6-9'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  // Custom validation: at least one of email, phone, or phoneNumber must be provided
  body().custom((value) => {
    const hasEmail = value.email && value.email.trim() !== '';
    const hasPhone = (value.phone && value.phone.trim() !== '') || (value.phoneNumber && value.phoneNumber.trim() !== '');
    
    if (!hasEmail && !hasPhone) {
      throw new Error('Either email or phone number is required');
    }
    return true;
  }),
  
  handleValidationErrors
];

/**
 * Validation rules for customer profile updates
 */
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .custom((value) => {
      const normalized = value.replace(/^\+91/, '').replace(/\D/g, '');
      if (normalized.length === 10 && /^[6-9]/.test(normalized)) {
        return true;
      }
      throw new Error('Please provide a valid 10-digit Indian mobile number');
    }),
  
  body('phoneNumber')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian mobile number'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  
  body('profilePicture')
    .optional()
    .isString()
    .withMessage('Profile picture must be a string'),
  
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Street address must be between 1 and 200 characters'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City must be between 1 and 100 characters'),
  
  body('address.state')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State must be between 1 and 100 characters'),
  
  body('address.pincode')
    .optional()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be 6 digits'),
  
  body('address.country')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country must be between 1 and 100 characters'),
  
  body('language')
    .optional()
    .isIn(['en', 'hi', 'gu'])
    .withMessage('Language must be one of: en, hi, gu'),
  
  body('emergencyContacts')
    .optional()
    .isArray({ min: 0, max: 5 })
    .withMessage('Emergency contacts must be an array with maximum 5 contacts'),
  
  body('emergencyContacts.*.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Emergency contact name must be between 2 and 50 characters'),
  
  body('emergencyContacts.*.phoneNumber')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Emergency contact phone must be a valid 10-digit Indian mobile number'),
  
  body('emergencyContacts.*.phone')
    .optional()
    .custom((value) => {
      const normalized = value.replace(/^\+91/, '').replace(/\D/g, '');
      if (normalized.length === 10 && /^[6-9]/.test(normalized)) {
        return true;
      }
      throw new Error('Emergency contact phone must be a valid 10-digit Indian mobile number');
    }),
  
  body('emergencyContacts.*.relationship')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Emergency contact relationship must be between 2 and 30 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for location updates
 */
const validateLocationUpdate = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for vehicle updates
 */
const validateVehicleUpdate = [
  body('make')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Vehicle make must be between 1 and 30 characters'),
  
  body('model')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Vehicle model must be between 1 and 30 characters'),
  
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Vehicle year must be between 1900 and next year'),
  
  body('registrationNumber')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Registration number must be between 5 and 20 characters'),
  
  body('color')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Vehicle color must be between 1 and 20 characters'),
  
  body('fuelType')
    .optional()
    .isIn(['petrol', 'diesel', 'electric', 'hybrid'])
    .withMessage('Fuel type must be one of: petrol, diesel, electric, hybrid'),
  
  handleValidationErrors
];

/**
 * Validation rules for partner registration
 */
const validatePartnerRegistration = [
  body('shopName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Shop name must be between 2 and 100 characters'),
  
  body('ownerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Owner name must be between 2 and 100 characters'),
  
  body('mobileNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian mobile number'),
  
  body('whatsappNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit WhatsApp number'),
  
  body('shopAddress')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Shop address must be between 10 and 500 characters'),
  
  body('googleMapsLink')
    .optional()
    .trim()
    .isURL()
    .withMessage('Google Maps link must be a valid URL'),
  
  // Custom validation: Either tyreBrands or tyreIds must be provided
  body('tyreBrands')
    .optional()
    .custom((value, { req }) => {
      const hasTyreBrands = value && (
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === 'string' && value.trim() !== '')
      );
      
      const hasTyreIds = req.body.tyreIds && (
        (Array.isArray(req.body.tyreIds) && req.body.tyreIds.length > 0) ||
        (typeof req.body.tyreIds === 'string' && req.body.tyreIds.trim() !== '')
      );
      
      // At least one must be provided
      if (!hasTyreBrands && !hasTyreIds) {
        throw new Error('Either tyreBrands or tyreIds is required');
      }
      
      // If tyreBrands is provided, validate format
      if (hasTyreBrands) {
        if (Array.isArray(value)) {
          const validBrands = ['MRF', 'Apollo', 'CEAT', 'Michelin', 'JK Tyre', 'Other'];
          for (const brand of value) {
            if (brand && !validBrands.includes(brand)) {
              throw new Error(`Invalid tyre brand: ${brand}. Allowed: ${validBrands.join(', ')}`);
            }
          }
        } else if (typeof value === 'string') {
          const brands = value.split(',').map(b => b.trim()).filter(b => b);
          if (brands.length === 0) {
            throw new Error('Tyre brands string cannot be empty');
          }
          const validBrands = ['MRF', 'Apollo', 'CEAT', 'Michelin', 'JK Tyre', 'Other'];
          for (const brand of brands) {
            if (!validBrands.includes(brand)) {
              throw new Error(`Invalid tyre brand: ${brand}. Allowed: ${validBrands.join(', ')}`);
            }
          }
        }
      }
      
      return true;
    }),
  
  body('tyreIds')
    .optional()
    .custom((value, { req }) => {
      const hasTyreBrands = req.body.tyreBrands && (
        (Array.isArray(req.body.tyreBrands) && req.body.tyreBrands.length > 0) ||
        (typeof req.body.tyreBrands === 'string' && req.body.tyreBrands.trim() !== '')
      );
      
      const hasTyreIds = value && (
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === 'string' && value.trim() !== '')
      );
      
      // At least one must be provided
      if (!hasTyreBrands && !hasTyreIds) {
        throw new Error('Either tyreBrands or tyreIds is required');
      }
      
      // If tyreIds is provided, validate format
      if (hasTyreIds) {
        let idsArray = [];
        if (Array.isArray(value)) {
          idsArray = value;
        } else if (typeof value === 'string') {
          try {
            idsArray = JSON.parse(value);
          } catch (e) {
            idsArray = value.split(',').map(id => id.trim()).filter(id => id);
          }
        }
        
        // Validate each ID is a valid MongoDB ObjectId
        const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
        for (const id of idsArray) {
          if (!mongoIdRegex.test(id)) {
            throw new Error(`Invalid tyre ID format: ${id}`);
          }
        }
      }
      
      return true;
    }),
  
  // Legacy fields (optional for backward compatibility)
  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number with country code'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be between 10 and 200 characters'),
  
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('serviceIds')
    .optional()
    .isArray({ min: 0 })
    .withMessage('Service IDs must be an array'),
  
  body('serviceIds.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid service ID format'),
  
  body('services')
    .optional()
    .isArray()
    .withMessage('Services must be an array'),
  
  body('services.*.serviceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid service ID format in services array'),
  
  body('services.*.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Service price must be a positive number'),
  
  body('businessHours')
    .optional()
    .isObject()
    .withMessage('Business hours must be an object'),
  
  handleValidationErrors
];

/**
 * Validation rules for partner login
 * Accepts either email or phone (mobileNumber)
 */
const validatePartnerLogin = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian mobile number'),
  
  body('mobileNumber')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian mobile number'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  // Custom validation: at least one of email, phone, or mobileNumber must be provided
  body().custom((value) => {
    if (!value.email && !value.phone && !value.mobileNumber) {
      throw new Error('Either email, phone, or mobileNumber is required');
    }
    return true;
  }),
  
  handleValidationErrors
];

/**
 * Validation rules for partner profile updates
 */
const validatePartnerProfileUpdate = [
  body('shopName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Shop name must be between 2 and 100 characters'),
  
  body('ownerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Owner name must be between 2 and 100 characters'),
  
  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('mobileNumber')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian mobile number'),
  
  body('whatsappNumber')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit WhatsApp number'),
  
  body('phone')
    .optional()
    .custom((value) => {
      const normalized = value.replace(/^\+91/, '').replace(/\D/g, '');
      if (normalized.length === 10 && /^[6-9]/.test(normalized)) {
        return true;
      }
      throw new Error('Please provide a valid 10-digit Indian mobile number');
    }),
  
  body('shopAddress')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Shop address must be between 10 and 500 characters'),
  
  body('googleMapsLink')
    .optional()
    .trim()
    .isURL()
    .withMessage('Google Maps link must be a valid URL'),
  
  body('tyreBrands')
    .optional()
    .isArray()
    .withMessage('Tyre brands must be an array'),
  
  body('tyreBrands.*')
    .optional()
    .isIn(['MRF', 'Apollo', 'CEAT', 'Michelin', 'JK Tyre', 'Other'])
    .withMessage('Invalid tyre brand'),
  
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Street address must be between 1 and 200 characters'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City must be between 1 and 100 characters'),
  
  body('address.state')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State must be between 1 and 100 characters'),
  
  body('address.pincode')
    .optional()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be 6 digits'),
  
  body('businessDescription')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Business description must be between 10 and 500 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('businessHours')
    .optional()
    .isArray()
    .withMessage('Business hours must be an array'),
  
  body('businessType')
    .optional()
    .isIn(['garage', 'tire_shop', 'petrol_pump', 'ev_charging', 'battery_swap', 'car_wash', 'towing', 'emergency_service', 'other'])
    .withMessage('Invalid business type'),
  
  handleValidationErrors
];

/**
 * Validation rules for adding services to partners
 */
const validateServiceAdd = [
  body('serviceId')
    .isMongoId()
    .withMessage('Invalid service ID format'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Service description must be between 5 and 200 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for booking creation
 */
const validateBookingCreate = [
  body('partnerId')
    .isMongoId()
    .withMessage('Invalid partner ID format'),
  
  body('serviceId')
    .isMongoId()
    .withMessage('Invalid service ID format'),
  
  body('scheduledTime')
    .isISO8601()
    .withMessage('Scheduled time must be a valid ISO 8601 date string'),
  
  body('vehicleDetails.make')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Vehicle make must be between 1 and 30 characters'),
  
  body('vehicleDetails.model')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Vehicle model must be between 1 and 30 characters'),
  
  body('vehicleDetails.year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Vehicle year must be between 1900 and next year'),
  
  body('vehicleDetails.registrationNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Registration number must be between 5 and 20 characters'),
  
  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ min: 0, max: 500 })
    .withMessage('Special instructions must not exceed 500 characters'),
  
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Location address must be between 5 and 200 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for booking updates
 */
const validateBookingUpdate = [
  body('scheduledTime')
    .optional()
    .isISO8601()
    .withMessage('Scheduled time must be a valid ISO 8601 date string'),
  
  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ min: 0, max: 500 })
    .withMessage('Special instructions must not exceed 500 characters'),
  
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Location address must be between 5 and 200 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for feedback submission
 */
const validateFeedback = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Comment must be between 5 and 500 characters'),
  
  body('serviceQuality')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Service quality rating must be between 1 and 5'),
  
  body('timeliness')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Timeliness rating must be between 1 and 5'),
  
  body('communication')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Communication rating must be between 1 and 5'),
  
  handleValidationErrors
];

/**
 * Validation rules for emergency creation
 */
const validateEmergencyCreate = [
  body('emergencyType')
    .isIn(['breakdown', 'accident', 'flat-tire', 'out-of-fuel', 'other'])
    .withMessage('Emergency type must be one of: breakdown, accident, flat-tire, out-of-fuel, other'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
  
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Description must be between 5 and 500 characters'),
  
  body('vehicleDetails.make')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Vehicle make must be between 1 and 30 characters'),
  
  body('vehicleDetails.model')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Vehicle model must be between 1 and 30 characters'),
  
  body('vehicleDetails.year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Vehicle year must be between 1900 and next year'),
  
  body('vehicleDetails.registrationNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Registration number must be between 5 and 20 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for admin login
 */
const validateAdminLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateLocationUpdate,
  validateVehicleUpdate,
  validatePartnerRegistration,
  validatePartnerLogin,
  validatePartnerProfileUpdate,
  validateServiceAdd,
  validateBookingCreate,
  validateBookingUpdate,
  validateFeedback,
  validateEmergencyCreate,
  validateAdminLogin,
  handleValidationErrors
};
