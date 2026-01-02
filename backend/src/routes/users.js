const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Partner = require('../models/Partner');
const Booking = require('../models/Booking');
const Emergency = require('../models/Emergency');
const { authenticateToken } = require('../middleware/auth');
const { validateProfileUpdate, validateLocationUpdate, validateVehicleUpdate } = require('../middleware/validation');

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving profile'
    });
  }
});

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               phoneNumber:
 *                 type: string
 *                 example: "9876543210"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: "male"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-15"
 *               profilePicture:
 *                 type: string
 *                 example: "https://example.com/profile.jpg"
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "123 Main Street"
 *                   city:
 *                     type: string
 *                     example: "Ahmedabad"
 *                   state:
 *                     type: string
 *                     example: "Gujarat"
 *                   pincode:
 *                     type: string
 *                     example: "380001"
 *                   country:
 *                     type: string
 *                     example: "India"
 *               language:
 *                 type: string
 *                 enum: [en, hi, gu]
 *                 example: "en"
 *               emergencyContacts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Emergency Contact"
 *                     phoneNumber:
 *                       type: string
 *                       example: "9876543211"
 *                     phone:
 *                       type: string
 *                       example: "9876543211"
 *                     relationship:
 *                       type: string
 *                       example: "Spouse"
 *                     isPrimary:
 *                       type: boolean
 *                       example: false
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
 *                   $ref: '#/components/schemas/User'
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
router.put('/profile', authenticateToken, validateProfileUpdate, async (req, res) => {
  try {
    // Verify user role - JWT verification is required
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role required.'
      });
    }

    const { 
      name, 
      email, 
      phone, 
      phoneNumber,
      gender,
      dateOfBirth,
      profilePicture,
      address,
      language,
      emergencyContacts 
    } = req.body;
    
    const userId = req.user.userId;

    // Normalize phone number if provided
    let normalizedPhone = phoneNumber || phone;
    if (normalizedPhone) {
      if (normalizedPhone.startsWith('+')) {
        normalizedPhone = normalizedPhone.replace(/^\+91/, '').replace(/\D/g, '');
      } else {
        normalizedPhone = normalizedPhone.replace(/\D/g, '');
      }
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase().trim(), 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already taken by another user'
        });
      }
    }

    // Check if phone number is already taken by another user
    if (normalizedPhone && normalizedPhone.match(/^[6-9]\d{9}$/)) {
      const existingUser = await User.findOne({ 
        phoneNumber: normalizedPhone,
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already taken by another user'
        });
      }
    }

    // Normalize emergency contacts phone numbers
    let normalizedEmergencyContacts = emergencyContacts;
    if (emergencyContacts && Array.isArray(emergencyContacts)) {
      normalizedEmergencyContacts = emergencyContacts.map(contact => {
        if (contact.phone || contact.phoneNumber) {
          let phone = contact.phoneNumber || contact.phone;
          if (phone.startsWith('+')) {
            phone = phone.replace(/^\+91/, '').replace(/\D/g, '');
          } else {
            phone = phone.replace(/\D/g, '');
          }
          return {
            ...contact,
            phoneNumber: phone.match(/^[6-9]\d{9}$/) ? phone : contact.phoneNumber
          };
        }
        return contact;
      });
    }

    // Build update object
    const updateData = {};
    
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (normalizedPhone && normalizedPhone.match(/^[6-9]\d{9}$/)) {
      updateData.phoneNumber = normalizedPhone;
    }
    if (gender) updateData.gender = gender;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (profilePicture) updateData.profilePicture = profilePicture;
    if (address) updateData.address = address;
    if (language) updateData.language = language;
    if (normalizedEmergencyContacts) updateData.emergencyContacts = normalizedEmergencyContacts;

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive data from response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    delete userResponse.otp;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
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
      message: 'Internal server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /users/location:
 *   put:
 *     summary: Update user location
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 28.6139
 *               longitude:
 *                 type: number
 *                 example: 77.2090
 *               address:
 *                 type: string
 *                 example: "Connaught Place, New Delhi"
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid coordinates
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
router.put('/location', authenticateToken, validateLocationUpdate, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const userId = req.user.userId;

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude value'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid longitude value'
      });
    }

    // Update user location
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude] // MongoDB expects [longitude, latitude]
          },
          address: address || ''
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        latitude,
        longitude,
        address: updatedUser.address
      }
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating location'
    });
  }
});

/**
 * @swagger
 * /users/vehicle:
 *   put:
 *     summary: Update vehicle details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - make
 *               - model
 *               - year
 *               - registrationNumber
 *             properties:
 *               make:
 *                 type: string
 *                 example: "Honda"
 *               model:
 *                 type: string
 *                 example: "City"
 *               year:
 *                 type: number
 *                 example: 2020
 *               registrationNumber:
 *                 type: string
 *                 example: "DL01AB1234"
 *               color:
 *                 type: string
 *                 example: "White"
 *               fuelType:
 *                 type: string
 *                 enum: ["petrol", "diesel", "electric", "hybrid"]
 *                 example: "petrol"
 *     responses:
 *       200:
 *         description: Vehicle details updated successfully
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
router.put('/vehicle', authenticateToken, validateVehicleUpdate, async (req, res) => {
  try {
    const { make, model, year, registrationNumber, color, fuelType } = req.body;
    const userId = req.user.userId;

    // Validate year
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle year'
      });
    }

    // Check if registration number is already taken by another user
    if (registrationNumber) {
      const existingUser = await User.findOne({
        'vehicleDetails.registrationNumber': registrationNumber,
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Vehicle registration number already registered by another user'
        });
      }
    }

    // Update vehicle details
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          vehicleDetails: {
            make,
            model,
            year,
            registrationNumber,
            color: color || '',
            fuelType: fuelType || 'petrol'
          }
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle details updated successfully',
      data: updatedUser.vehicleDetails
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating vehicle details'
    });
  }
});

/**
 * @swagger
 * /users/nearby-services:
 *   get:
 *     summary: Get nearby service providers
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         example: 28.6139
 *         description: User's latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         example: 77.2090
 *         description: User's longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         example: 10
 *         description: Search radius in kilometers
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439013"
 *         description: Service ID to filter by
 *     responses:
 *       200:
 *         description: Nearby services retrieved successfully
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
 *                     $ref: '#/components/schemas/Partner'
 *       400:
 *         description: Invalid coordinates
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
router.get('/nearby-services', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, service } = req.query;

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const searchRadius = parseFloat(radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(searchRadius)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate or radius values'
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate values'
      });
    }

    // Build query for nearby partners
    const query = {
      status: 'approved',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat] // MongoDB expects [longitude, latitude]
          },
          $maxDistance: searchRadius * 1000 // Convert km to meters
        }
      }
    };

    // Add service filter if provided
    if (service) {
      query.services = service;
    }

    // Find nearby partners
    const nearbyPartners = await Partner.find(query)
      .populate('services.serviceId', 'name description category')
      .limit(50)
      .sort({ rating: -1, 'location.coordinates': 1 });

    // Calculate distances and format response
    const partnersWithDistance = nearbyPartners.map(partner => {
      const partnerObj = partner.toObject();
      const distance = calculateDistance(lat, lng, partner.location.coordinates[1], partner.location.coordinates[0]);
      return {
        ...partnerObj,
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    });

    // Sort by distance
    partnersWithDistance.sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      success: true,
      data: partnersWithDistance
    });
  } catch (error) {
    console.error('Get nearby services error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving nearby services'
    });
  }
});

/**
 * @swagger
 * /users/bookings:
 *   get:
 *     summary: Get user's booking history
 *     tags: [Users]
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
 *         description: Booking history retrieved successfully
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
 *                       example: 25
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/bookings', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;

    // Build query
    const query = { userId };
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
      .populate('partnerId', 'businessName email phone address')
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
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving bookings'
    });
  }
});

/**
 * @swagger
 * /users/emergencies:
 *   get:
 *     summary: Get user's emergency history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["pending", "assigned", "responding", "resolved", "cancelled"]
 *         description: Filter by emergency status
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
 *         description: Emergency history retrieved successfully
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
 *                     $ref: '#/components/schemas/Emergency'
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
 *                       example: 5
 *                     pages:
 *                       type: integer
 *                       example: 1
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/emergencies', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;

    // Build query
    const query = { userId };
    if (status) {
      query.status = status;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Emergency.countDocuments(query);

    // Get emergencies with pagination
    const emergencies = await Emergency.find(query)
      .populate('assignedPartner', 'businessName email phone address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: emergencies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get emergencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving emergencies'
    });
  }
});

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

module.exports = router;
