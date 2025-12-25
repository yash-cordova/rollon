const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Partner = require('../models/Partner');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const { authenticateToken } = require('../middleware/auth');
const { validatePartnerRegistration, validatePartnerLogin, validatePartnerProfileUpdate, validateServiceAdd } = require('../middleware/validation');
const { uploadPartnerFiles, handleUploadError } = require('../middleware/upload');

/**
 * @swagger
 * /partners/register:
 *   post:
 *     summary: Register a new tire shop partner
 *     description: |
 *       Register a new tire shop partner with shop details, contact information, and optional file uploads.
 *       Files are stored as binary data in MongoDB.
 *       
 *       **Required Fields:**
 *       - Shop Name (દુકાનનું નામ / दुकान का नામ)
 *       - Owner Name (વ્યવસાય માલિકનું નામ / व्यवसाय मालिक का नाम)
 *       - Mobile Number (મોબાઈલ નંબર / मोबाइल नंबर) - 10 digit Indian number
 *       - WhatsApp Number (વોટ્સએપ નંબર / व्हाट्सएप नंबर) - 10 digit Indian number
 *       - Shop Address (દુકાનનું સરનામું / दुकान का पता)
 *       - Email Address - Valid email address
 *       - Tyre Brands (વેચાતા ટાયર બ્રાન્ડ / बेचे जाने वाले टायर ब्रांड) - At least one brand required
 *       - Store Photo (દુકાનનો ફોટો / दुकान का फोटो) - Max 10 MB (JPEG, PNG, GIF, WebP)
 *       - Price List (ટાયર ભાવ યાદી / टायर प्राइस लिस्ट) - Max 10 MB (PDF, Excel)
 *       - Password (min 6 chars, must contain uppercase, lowercase, and number)
 *       
 *       **Optional Fields:**
 *       - Google Maps Location Link
 *     tags: [Partners]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - shopName
 *               - ownerName
 *               - mobileNumber
 *               - whatsappNumber
 *               - shopAddress
 *               - email
 *               - tyreBrands
 *               - storePhoto
 *               - priceList
 *               - password
 *             properties:
 *               shopName:
 *                 type: string
 *                 description: દુકાનનું નામ / दुकान का नाम (Shop Name)
 *                 example: "ABC Tire Shop"
 *                 minLength: 2
 *                 maxLength: 100
 *               ownerName:
 *                 type: string
 *                 description: વ્યવસાય માલિકનું નામ / व्यवसाय मालिक का नाम (Owner Name)
 *                 example: "Rajesh Kumar"
 *                 minLength: 2
 *                 maxLength: 100
 *               mobileNumber:
 *                 type: string
 *                 description: મોબાઈલ નંબર / मोबाइल नंबर (Mobile Number) - 10 digit Indian number starting with 6-9
 *                 pattern: '^[6-9]\d{9}$'
 *                 example: "9876543210"
 *               whatsappNumber:
 *                 type: string
 *                 description: વોટ્સએપ નંબર / व्हाट्सएप नंबर (WhatsApp Number) - 10 digit Indian number starting with 6-9
 *                 pattern: '^[6-9]\d{9}$'
 *                 example: "9876543210"
 *               shopAddress:
 *                 type: string
 *                 description: દુકાનનું સરનામું / दुकान का पता (Shop Address)
 *                 example: "123 Main Street, Ahmedabad, Gujarat 380001"
 *                 minLength: 10
 *                 maxLength: 500
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (Required)
 *                 example: "service@abcauto.com"
 *               googleMapsLink:
 *                 type: string
 *                 format: uri
 *                 description: Google Maps Location Link (Optional) - Will extract coordinates automatically
 *                 example: "https://maps.google.com/?q=23.0225,72.5714"
 *               tyreBrands:
 *                 type: array
 *                 description: વેચાતા ટાયર બ્રાન્ડ / बेचे जाने वाले टायर ब्रांड (Tyre Brands Sold) - Required, at least one brand. Can be array or comma-separated string
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                   enum: [MRF, Apollo, CEAT, Michelin, JK Tyre, Other]
 *                 example: ["MRF", "Apollo", "CEAT"]
 *               storePhoto:
 *                 type: string
 *                 format: binary
 *                 required: true
 *                 description: "દુકાનનો ફોટો / दुकान का फोटो (Upload Store Photo) - Required. Max 10 MB. Allowed: JPEG, PNG, GIF, WebP"
 *               priceList:
 *                 type: string
 *                 format: binary
 *                 required: true
 *                 description: "ટાયર ભાવ યાદી અપલોડ કરો / टायर प्राइस लिस्ट अपलोड करें (Upload Price List) - Required. Max 10 MB. Allowed: PDF, Excel"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Password (must contain at least one uppercase letter, one lowercase letter, and one number)
 *                 example: "Password123"
 *     responses:
 *       201:
 *         description: Partner registered successfully. Account is pending admin approval.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Partner registered successfully. Please wait for admin approval."
 *                 data:
 *                   $ref: '#/components/schemas/Partner'
 *             examples:
 *               success:
 *                 summary: Successful registration
 *                 value:
 *                   success: true
 *                   message: "Partner registered successfully. Please wait for admin approval."
 *                   data:
 *                     _id: "507f1f77bcf86cd799439012"
 *                     shopName: "ABC Tire Shop"
 *                     ownerName: "Rajesh Kumar"
 *                     mobileNumber: "9876543210"
 *                     whatsappNumber: "9876543210"
 *                     shopAddress: "123 Main Street, Ahmedabad, Gujarat 380001"
 *                     googleMapsLink: "https://maps.google.com/?q=23.0225,72.5714"
 *                     tyreBrands: ["MRF", "Apollo", "CEAT"]
 *                     storePhoto:
 *                       contentType: "image/jpeg"
 *                       filename: "store-photo.jpg"
 *                       size: 245678
 *                     priceList:
 *                       contentType: "application/pdf"
 *                       filename: "price-list.pdf"
 *                       size: 456789
 *                     approvalStatus: "pending"
 *                     businessType: "tire_shop"
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Validation error or file upload error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "mobileNumber"
 *                       message: "Please provide a valid 10-digit Indian mobile number"
 *               file_error:
 *                 summary: File upload error
 *                 value:
 *                   success: false
 *                   message: "File size too large. Maximum size is 10 MB."
 *       409:
 *         description: Partner already exists with the provided mobile number or email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Mobile number or email already registered"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', uploadPartnerFiles, handleUploadError, validatePartnerRegistration, async (req, res) => {
  try {
    // Extract new registration fields
    const { 
      shopName, 
      ownerName, 
      mobileNumber, 
      whatsappNumber, 
      shopAddress, 
      googleMapsLink, 
      tyreBrands,
      // Legacy fields (optional)
      businessName,
      email,
      phone,
      password,
      address,
      latitude,
      longitude,
      services,
      businessHours
    } = req.body;

    // Check if partner already exists by mobile number
    const existingPartner = await Partner.findOne({
      $or: [
        { mobileNumber },
        { phoneNumber: mobileNumber },
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    });

    if (existingPartner) {
      return res.status(409).json({
        success: false,
        message: 'Mobile number or email already registered'
      });
    }

    // Validate required fields
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Validate tyre brands (required)
    if (!tyreBrands || (Array.isArray(tyreBrands) && tyreBrands.length === 0) || (typeof tyreBrands === 'string' && tyreBrands.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'At least one tyre brand is required'
      });
    }

    // Validate required files
    if (!req.files || !req.files.storePhoto || !req.files.storePhoto[0]) {
      return res.status(400).json({
        success: false,
        message: 'Store photo is required'
      });
    }

    if (!req.files.priceList || !req.files.priceList[0]) {
      return res.status(400).json({
        success: false,
        message: 'Price list is required'
      });
    }

    // IMPORTANT: Don't hash the password here - the Partner model's pre-save hook will hash it automatically
    // Just set the plain password and let the pre-save hook handle hashing

    // Handle file uploads (both are required, so we can safely access them)
    const storePhotoFile = req.files.storePhoto[0];
    const storePhotoData = {
      data: storePhotoFile.buffer,
      contentType: storePhotoFile.mimetype,
      filename: storePhotoFile.originalname,
      size: storePhotoFile.size
    };

    const priceListFile = req.files.priceList[0];
    const priceListData = {
      data: priceListFile.buffer,
      contentType: priceListFile.mimetype,
      filename: priceListFile.originalname,
      size: priceListFile.size
    };

    // Parse tyre brands (handle both array and comma-separated string)
    let parsedTyreBrands = [];
    if (Array.isArray(tyreBrands)) {
      parsedTyreBrands = tyreBrands.filter(brand => brand && brand.trim() !== '');
    } else if (typeof tyreBrands === 'string') {
      parsedTyreBrands = tyreBrands.split(',').map(brand => brand.trim()).filter(brand => brand !== '');
    }

    // Validate parsed tyre brands
    if (parsedTyreBrands.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid tyre brand is required'
      });
    }

    // Extract coordinates from Google Maps link if provided
    let locationCoordinates = null;
    if (googleMapsLink) {
      // Try to extract coordinates from Google Maps URL
      // Format: https://maps.google.com/?q=lat,lng or https://www.google.com/maps/place/.../@lat,lng
      const coordMatch = googleMapsLink.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/) || 
                        googleMapsLink.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (coordMatch) {
        locationCoordinates = {
          type: 'Point',
          coordinates: [parseFloat(coordMatch[2]), parseFloat(coordMatch[1])] // [longitude, latitude]
        };
      }
    }

    // Use provided coordinates if available, otherwise use Google Maps link coordinates
    if (latitude && longitude) {
      locationCoordinates = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    // Create new partner with new fields
    // NOTE: Set password as plain text - the Partner model's pre-save hook will hash it automatically
    const partnerData = {
      shopName,
      ownerName,
      mobileNumber,
      whatsappNumber,
      shopAddress,
      password: password.trim(), // Plain password - pre-save hook will hash it
      tyreBrands: parsedTyreBrands,
      storePhoto: storePhotoData,
      priceList: priceListData,
      ...(googleMapsLink && { googleMapsLink }),
      ...(locationCoordinates && { location: locationCoordinates }),
      // Legacy fields (for backward compatibility)
      ...(businessName && { businessName }),
      ...(email && { email }),
      ...(phone && { phoneNumber: phone }),
      name: ownerName, // Map ownerName to name for legacy
      ...(address && { address }),
      ...(services && { services }),
      ...(businessHours && { businessHours }),
      businessType: 'tire_shop', // Default for tire shop registration
      approvalStatus: 'pending' // Default status, requires admin approval
    };

    const partner = new Partner(partnerData);
    await partner.save();

    // Remove sensitive data from response
    const partnerResponse = partner.toObject();
    delete partnerResponse.password;
    delete partnerResponse.storePhoto?.data;
    delete partnerResponse.priceList?.data;

    res.status(201).json({
      success: true,
      message: 'Partner registered successfully. Please wait for admin approval.',
      data: partnerResponse
    });
  } catch (error) {
    console.error('Partner registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during partner registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /partners/login:
 *   post:
 *     summary: Login partner with email or phone
 *     description: Login partner using email or mobile number (phone/mobileNumber) and password. JWT token is stored in HTTP-only cookie.
 *     tags: [Partners]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             oneOf:
 *               - required:
 *                   - email
 *               - required:
 *                   - phone
 *               - required:
 *                   - mobileNumber
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "service@abcauto.com"
 *                 description: Email address (required if phone/mobileNumber not provided)
 *               phone:
 *                 type: string
 *                 pattern: '^[6-9]\d{9}$'
 *                 example: "9876543210"
 *                 description: 10-digit Indian mobile number (required if email not provided)
 *               mobileNumber:
 *                 type: string
 *                 pattern: '^[6-9]\d{9}$'
 *                 example: "9876543210"
 *                 description: 10-digit Indian mobile number (required if email not provided)
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *                 description: Partner password
 *     responses:
 *       200:
 *         description: Login successful. JWT token stored in HTTP-only cookie (web) and returned in response body (mobile).
 *         headers:
 *           Set-Cookie:
 *             description: JWT token in HTTP-only cookie (for web browsers)
 *             schema:
 *               type: string
 *               example: "partnerToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful. Token stored in cookie (web) and returned in response (mobile)."
 *                 data:
 *                   type: object
 *                   properties:
 *                     partner:
 *                       $ref: '#/components/schemas/Partner'
 *                     token:
 *                       type: string
 *                       description: JWT token for mobile apps (store in secure storage)
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials or account not approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validatePartnerLogin, async (req, res) => {
  try {
    const { email, phone, mobileNumber, password } = req.body;

    // Normalize phone number (remove spaces, dashes, country code if present)
    const normalizePhone = (phoneNum) => {
      if (!phoneNum) return null;
      // Remove all non-digit characters
      let normalized = phoneNum.replace(/\D/g, '');
      // Remove country code if present (91 for India)
      if (normalized.length === 12 && normalized.startsWith('91')) {
        normalized = normalized.substring(2);
      }
      // Should be 10 digits
      return normalized.length === 10 ? normalized : phoneNum.trim();
    };

    // Build query to find partner by email or phone
    const query = {};
    if (email) {
      query.email = email.toLowerCase().trim();
    } else if (phone || mobileNumber) {
      const phoneNum = normalizePhone(phone || mobileNumber);
      query.$or = [
        { mobileNumber: phoneNum },
        { phoneNumber: phoneNum },
        { mobileNumber: phone || mobileNumber }, // Also try original format
        { phoneNumber: phone || mobileNumber }
      ];
    }

    // Debug: Log the query (remove in production)
    console.log('Login query:', JSON.stringify(query, null, 2));
    console.log('Searching for:', email || phone || mobileNumber);

    // Find partner
    const partner = await Partner.findOne(query).select('+password');
    
    if (!partner) {
      console.log('Partner not found with query:', query);
      // Try to find any partner with similar phone to help debug
      if (phone || mobileNumber) {
        const phoneNum = normalizePhone(phone || mobileNumber);
        const allPartners = await Partner.find({
          $or: [
            { mobileNumber: { $regex: phoneNum.slice(-4) } },
            { phoneNumber: { $regex: phoneNum.slice(-4) } }
          ]
        }).select('mobileNumber phoneNumber email');
        console.log('Similar partners found:', allPartners.length);
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password',
        debug: process.env.NODE_ENV === 'development' ? { query, searched: email || phone || mobileNumber } : undefined
      });
    }

    console.log('Partner found:', partner._id, 'Mobile:', partner.mobileNumber || partner.phoneNumber, 'Has password:', !!partner.password);

    // Check if partner is approved
    // COMMENTED OUT: Allow login regardless of approval status for now
    // if (partner.approvalStatus !== 'approved' || partner.isApproved !== true) {
    //   return res.status(401).json({
    //     success: false,
    //     message: `Account is ${partner.approvalStatus || 'pending'}. Please contact admin for approval.`
    //   });
    // }

    // Verify password
    if (!partner.password) {
      console.log('Partner has no password set');
      return res.status(401).json({
        success: false,
        message: 'Password not set for this account. Please reset your password.'
      });
    }

    // Try password comparison (trim whitespace from input)
    const trimmedPassword = (password || '').trim();
    console.log('=== PASSWORD COMPARISON DEBUG ===');
    console.log('Input password length:', trimmedPassword.length);
    console.log('Input password (first 3 chars):', trimmedPassword.substring(0, 3));
    console.log('Stored hash exists:', !!partner.password);
    console.log('Stored hash length:', partner.password?.length);
    console.log('Stored hash (first 20 chars):', partner.password?.substring(0, 20));
    
    // Compare password (try trimmed first, then original if different)
    let isPasswordValid = await bcrypt.compare(trimmedPassword, partner.password);
    console.log('Password comparison result (trimmed):', isPasswordValid);
    
    // If trimmed password fails and original is different, try original
    if (!isPasswordValid && password !== trimmedPassword) {
      console.log('Trying original password (with spaces)...');
      isPasswordValid = await bcrypt.compare(password, partner.password);
      console.log('Password comparison result (original):', isPasswordValid);
    }
    
    // Additional test: Try to hash the input and see if it matches format
    if (!isPasswordValid) {
      const testHash = await bcrypt.hash(trimmedPassword, 12);
      const testCompare = await bcrypt.compare(trimmedPassword, testHash);
      console.log('Test hash/compare with same password:', testCompare);
      console.log('Test hash format matches stored:', testHash.substring(0, 7) === partner.password?.substring(0, 7));
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        partnerId: partner._id, 
        email: partner.email || partner.mobileNumber, 
        role: 'partner' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    partner.lastLogin = new Date();
    await partner.save();

    // Remove password from response
    const partnerResponse = partner.toObject();
    delete partnerResponse.password;
    delete partnerResponse.storePhoto?.data;
    delete partnerResponse.priceList?.data;

    // Set JWT token in HTTP-only cookie (for web browsers)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    };

    res.cookie('partnerToken', token, cookieOptions);

    // Return token in response body as well (for mobile apps)
    // Mobile apps should store this in secure storage (Keychain/Keystore)
    res.status(200).json({
      success: true,
      message: 'Login successful. Token stored in cookie (web) and returned in response (mobile).',
      data: {
        partner: partnerResponse,
        token // Include token for mobile apps to store securely
      }
    });
  } catch (error) {
    console.error('Partner login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /partners/logout:
 *   post:
 *     summary: Logout partner
 *     description: Clears the authentication cookie
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie('partnerToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Partner logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
});

/**
 * @swagger
 * /partners/profile:
 *   get:
 *     summary: Get partner profile
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Partner'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Verify partner role
    if (req.user.role !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partner role required.'
      });
    }

    const partner = await Partner.findById(req.user.partnerId)
      .populate('services.serviceId', 'name description category');
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: partner
    });
  } catch (error) {
    console.error('Get partner profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving profile'
    });
  }
});

/**
 * @swagger
 * /partners/profile:
 *   put:
 *     summary: Update partner profile
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *                 example: "ABC Auto Service"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "service@abcauto.com"
 *               phone:
 *                 type: string
 *                 example: "+919876543211"
 *               address:
 *                 type: string
 *                 example: "123 Service Road, Delhi"
 *               description:
 *                 type: string
 *                 example: "Professional auto service center"
 *               businessHours:
 *                 type: object
 *                 properties:
 *                   monday:
 *                     type: object
 *                     properties:
 *                       open:
 *                         type: string
 *                         example: "09:00"
 *                       close:
 *                         type: string
 *                         example: "18:00"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Partner'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/profile', authenticateToken, validatePartnerProfileUpdate, async (req, res) => {
  try {
    // Verify partner role
    if (req.user.role !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partner role required.'
      });
    }

    const { businessName, email, phone, address, description, businessHours } = req.body;
    const partnerId = req.user.partnerId;

    // Check if email is already taken by another partner
    if (email) {
      const existingPartner = await Partner.findOne({ email, _id: { $ne: partnerId } });
      if (existingPartner) {
        return res.status(409).json({
          success: false,
          message: 'Email already taken by another partner'
        });
      }
    }

    // Check if phone is already taken by another partner
    if (phone) {
      const existingPartner = await Partner.findOne({ phone, _id: { $ne: partnerId } });
      if (existingPartner) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already taken by another partner'
        });
      }
    }

    // Update partner profile
    const updatedPartner = await Partner.findByIdAndUpdate(
      partnerId,
      {
        $set: {
          ...(businessName && { businessName }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(address && { address }),
          ...(description && { description }),
          ...(businessHours && { businessHours })
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedPartner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedPartner
    });
  } catch (error) {
    console.error('Update partner profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating profile'
    });
  }
});

/**
 * @swagger
 * /partners/services:
 *   get:
 *     summary: Get partner's services
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/services', authenticateToken, async (req, res) => {
  try {
    // Verify partner role
    if (req.user.role !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partner role required.'
      });
    }

    const partner = await Partner.findById(req.user.partnerId)
      .populate('services.serviceId', 'name description category price');
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: partner.services
    });
  } catch (error) {
    console.error('Get partner services error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving services'
    });
  }
});

/**
 * @swagger
 * /partners/services:
 *   post:
 *     summary: Add service to partner
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - price
 *             properties:
 *               serviceId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439013"
 *               price:
 *                 type: number
 *                 example: 1200
 *               description:
 *                 type: string
 *                 example: "Professional oil change service"
 *     responses:
 *       201:
 *         description: Service added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/services', authenticateToken, validateServiceAdd, async (req, res) => {
  try {
    // Verify partner role
    if (req.user.role !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partner role required.'
      });
    }

    const { serviceId, price, description } = req.body;
    const partnerId = req.user.partnerId;

    // Validate service ID format
    if (!serviceId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    // Check if service exists and is active
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    // Check if partner already offers this service
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    const existingService = partner.services.find(s => s.serviceId.toString() === serviceId);
    if (existingService) {
      return res.status(409).json({
        success: false,
        message: 'Service already added to partner'
      });
    }

    // Add service to partner
    partner.services.push({
      serviceId,
      price,
      description: description || ''
    });

    await partner.save();

    res.status(201).json({
      success: true,
      message: 'Service added successfully',
      data: {
        serviceId,
        price,
        description: description || ''
      }
    });
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding service'
    });
  }
});

/**
 * @swagger
 * /partners/bookings:
 *   get:
 *     summary: Get partner's bookings
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["pending", "confirmed", "in-progress", "completed", "cancelled"]
 *         description: Filter by booking status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Partner bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     pages:
 *                       type: integer
 *                       example: 2
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/bookings', authenticateToken, async (req, res) => {
  try {
    // Verify partner role
    if (req.user.role !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partner role required.'
      });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const partnerId = req.user.partnerId;

    // Build query
    const query = { partnerId };
    if (status) {
      query.status = status;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Booking.countDocuments(query);

    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone')
      .populate('serviceId', 'name description category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get partner bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving bookings'
    });
  }
});

/**
 * @swagger
 * /partners/bookings/{bookingId}/status:
 *   put:
 *     summary: Update booking status
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439014"
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["confirmed", "in-progress", "completed", "cancelled"]
 *                 example: "confirmed"
 *               notes:
 *                 type: string
 *                 example: "Service completed successfully"
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/bookings/:bookingId/status', authenticateToken, async (req, res) => {
  try {
    // Verify partner role
    if (req.user.role !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partner role required.'
      });
    }

    const { bookingId } = req.params;
    const { status, notes } = req.body;
    const partnerId = req.user.partnerId;

    // Validate status
    const validStatuses = ['confirmed', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: confirmed, in-progress, completed, cancelled'
      });
    }

    // Validate booking ID format
    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    // Find and update booking
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, partnerId },
      {
        $set: {
          status,
          ...(notes && { notes }),
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        bookingId,
        status,
        notes: notes || ''
      }
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating booking status'
    });
  }
});

/**
 * @swagger
 * /partners/reset-password-test:
 *   post:
 *     summary: [TEST ONLY] Reset partner password by mobile number
 *     description: Temporary endpoint for testing. Resets partner password by mobile number. Remove in production.
 *     tags: [Partners]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *               - newPassword
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "Test123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       404:
 *         description: Partner not found
 */
router.post('/reset-password-test', async (req, res) => {
  try {
    const { mobileNumber, newPassword } = req.body;

    if (!mobileNumber || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find partner by mobile number
    const partner = await Partner.findOne({
      $or: [
        { mobileNumber },
        { phoneNumber: mobileNumber }
      ]
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found with this mobile number'
      });
    }

    // Set password as plain text - the pre-save hook will hash it automatically
    // IMPORTANT: Don't hash it here, the model's pre-save hook will do it
    const trimmedPassword = newPassword.trim();
    console.log(`Password reset - Setting plain password, length: ${trimmedPassword.length}`);

    // Set the plain password - the pre-save hook will hash it
    partner.password = trimmedPassword;
    await partner.save();

    // Verify it was saved correctly
    const savedPartner = await Partner.findById(partner._id).select('+password');
    const verifyAfterSave = await bcrypt.compare(trimmedPassword, savedPartner.password);
    console.log(`Password reset for partner: ${partner._id}, Mobile: ${mobileNumber}`);
    console.log(`Password verification after save: ${verifyAfterSave}`);
    
    if (!verifyAfterSave) {
      console.error('WARNING: Password verification failed after save!');
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with the new password.',
      data: {
        partnerId: partner._id,
        mobileNumber: partner.mobileNumber || partner.phoneNumber
      }
    });
  } catch (error) {
    console.error('Reset password test error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
