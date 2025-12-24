const express = require('express');
const router = express.Router();
const Emergency = require('../models/Emergency');
const User = require('../models/User');
const Partner = require('../models/Partner');
const { authenticateToken } = require('../middleware/auth');
const { validateEmergencyCreate, validateLocationUpdate } = require('../middleware/validation');

/**
 * @swagger
 * /emergency/sos:
 *   post:
 *     summary: Create emergency SOS request
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emergencyType
 *               - latitude
 *               - longitude
 *             properties:
 *               emergencyType:
 *                 type: string
 *                 enum: ["breakdown", "accident", "flat-tire", "out-of-fuel", "other"]
 *                 example: "breakdown"
 *               priority:
 *                 type: string
 *                 enum: ["low", "medium", "high", "critical"]
 *                 default: "medium"
 *                 example: "high"
 *               latitude:
 *                 type: number
 *                 example: 28.6139
 *               longitude:
 *                 type: number
 *                 example: 77.2090
 *               address:
 *                 type: string
 *                 example: "Connaught Place, New Delhi"
 *               description:
 *                 type: string
 *                 example: "Car won't start, battery seems dead"
 *               vehicleDetails:
 *                 type: object
 *                 properties:
 *                   make:
 *                     type: string
 *                     example: "Honda"
 *                   model:
 *                     type: string
 *                     example: "City"
 *                   year:
 *                     type: number
 *                     example: 2020
 *                   registrationNumber:
 *                     type: string
 *                     example: "DL01AB1234"
 *     responses:
 *       201:
 *         description: Emergency request created successfully
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
 *                   example: "Emergency request created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Emergency'
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
router.post('/sos', authenticateToken, validateEmergencyCreate, async (req, res) => {
  try {
    // Verify user role
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role required.'
      });
    }

    const { emergencyType, priority = 'medium', latitude, longitude, address, description, vehicleDetails } = req.body;
    const userId = req.user.userId;

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    // Check if user already has an active emergency
    const activeEmergency = await Emergency.findOne({
      userId,
      status: { $in: ['pending', 'assigned', 'responding'] }
    });

    if (activeEmergency) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active emergency request. Please wait for assistance or cancel the existing request.',
        data: activeEmergency
      });
    }

    // Get user details for vehicle information
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create emergency request
    const emergency = new Emergency({
      userId,
      emergencyType,
      priority,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude] // MongoDB expects [longitude, latitude]
      },
      address: address || '',
      description: description || '',
      vehicleDetails: vehicleDetails || user.vehicleDetails || {},
      status: 'pending',
      createdAt: new Date()
    });

    await emergency.save();

    // TODO: Notify nearby emergency service providers
    // await notifyEmergencyProviders(emergency);

    // TODO: Send SMS/email notification to user
    // await sendEmergencyNotification(user.phone, user.email, emergency);

    res.status(201).json({
      success: true,
      message: 'Emergency request created successfully. Help is on the way.',
      data: emergency
    });
  } catch (error) {
    console.error('Create emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating emergency request'
    });
  }
});

/**
 * @swagger
 * /emergency/{emergencyId}:
 *   get:
 *     summary: Get emergency details by ID
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emergencyId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439015"
 *         description: Emergency ID
 *     responses:
 *       200:
 *         description: Emergency details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Emergency'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Emergency not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:emergencyId', authenticateToken, async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Validate emergency ID format
    if (!emergencyId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emergency ID format'
      });
    }

    // Build query based on user role
    let query = { _id: emergencyId };
    if (userRole === 'user') {
      query.userId = userId;
    } else if (userRole === 'partner') {
      query.assignedPartner = req.user.partnerId;
    }

    const emergency = await Emergency.findById(query)
      .populate('userId', 'name email phone')
      .populate('assignedPartner', 'businessName email phone address');

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: emergency
    });
  } catch (error) {
    console.error('Get emergency details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving emergency details'
    });
  }
});

/**
 * @swagger
 * /emergency/{emergencyId}/update-location:
 *   put:
 *     summary: Update emergency location
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emergencyId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439015"
 *         description: Emergency ID
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
 *                 example: "Updated location address"
 *     responses:
 *       200:
 *         description: Emergency location updated successfully
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
 *       404:
 *         description: Emergency not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:emergencyId/update-location', authenticateToken, validateLocationUpdate, async (req, res) => {
  try {
    // Verify user role
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role required.'
      });
    }

    const { emergencyId } = req.params;
    const { latitude, longitude, address } = req.body;
    const userId = req.user.userId;

    // Validate emergency ID format
    if (!emergencyId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emergency ID format'
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    // Find emergency
    const emergency = await Emergency.findOne({ _id: emergencyId, userId });
    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found or access denied'
      });
    }

    // Check if emergency can be updated
    if (['resolved', 'cancelled'].includes(emergency.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update resolved or cancelled emergency'
      });
    }

    // Update location
    emergency.location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    if (address) {
      emergency.address = address;
    }
    emergency.updatedAt = new Date();

    await emergency.save();

    // TODO: Notify assigned partner about location update
    // if (emergency.assignedPartner) {
    //   await notifyPartnerLocationUpdate(emergency);
    // }

    res.status(200).json({
      success: true,
      message: 'Emergency location updated successfully',
      data: {
        latitude,
        longitude,
        address: emergency.address
      }
    });
  } catch (error) {
    console.error('Update emergency location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating emergency location'
    });
  }
});

/**
 * @swagger
 * /emergency/{emergencyId}/cancel:
 *   post:
 *     summary: Cancel emergency request
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emergencyId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439015"
 *         description: Emergency ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Problem resolved by myself"
 *     responses:
 *       200:
 *         description: Emergency cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Cannot cancel emergency
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
 *         description: Emergency not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:emergencyId/cancel', authenticateToken, async (req, res) => {
  try {
    // Verify user role
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role required.'
      });
    }

    const { emergencyId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    // Validate emergency ID format
    if (!emergencyId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emergency ID format'
      });
    }

    // Find emergency
    const emergency = await Emergency.findOne({ _id: emergencyId, userId });
    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found or access denied'
      });
    }

    // Check if emergency can be cancelled
    if (['resolved', 'cancelled'].includes(emergency.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel already resolved or cancelled emergency'
      });
    }

    if (emergency.status === 'responding') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel emergency while help is responding'
      });
    }

    // Cancel emergency
    emergency.status = 'cancelled';
    emergency.cancellationReason = reason || 'Cancelled by user';
    emergency.cancelledAt = new Date();
    emergency.updatedAt = new Date();

    await emergency.save();

    // TODO: Notify assigned partner about cancellation
    // if (emergency.assignedPartner) {
    //   await notifyPartnerCancellation(emergency);
    // }

    res.status(200).json({
      success: true,
      message: 'Emergency cancelled successfully',
      data: {
        emergencyId,
        status: 'cancelled',
        cancellationReason: emergency.cancellationReason
      }
    });
  } catch (error) {
    console.error('Cancel emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while cancelling emergency'
    });
  }
});

/**
 * @swagger
 * /emergency/nearby-partners:
 *   get:
 *     summary: Get nearby emergency service providers
 *     tags: [Emergency]
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
 *           default: 20
 *         example: 20
 *         description: Search radius in kilometers
 *       - in: query
 *         name: emergencyType
 *         schema:
 *           type: string
 *           enum: ["breakdown", "accident", "flat-tire", "out-of-fuel", "other"]
 *         example: "breakdown"
 *         description: Filter by emergency type
 *     responses:
 *       200:
 *         description: Nearby emergency partners retrieved successfully
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
router.get('/nearby-partners', authenticateToken, async (req, res) => {
  try {
    // Verify user role
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role required.'
      });
    }

    const { latitude, longitude, radius = 20, emergencyType } = req.query;

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

    // Build query for emergency service providers
    const query = {
      status: 'approved',
      'services.serviceId': { $exists: true, $ne: [] } // Has services
    };

    // Add emergency type filter if provided
    if (emergencyType) {
      // Find partners that offer emergency services
      query.services = {
        $elemMatch: {
          serviceId: { $in: await getEmergencyServiceIds(emergencyType) }
        }
      };
    }

    // Add location-based search
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat] // MongoDB expects [longitude, latitude]
        },
        $maxDistance: searchRadius * 1000 // Convert km to meters
      }
    };

    // Find nearby emergency partners
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
    console.error('Get nearby emergency partners error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving nearby emergency partners'
    });
  }
});

// Helper function to get emergency service IDs based on emergency type
async function getEmergencyServiceIds(emergencyType) {
  const Service = require('../models/Service');
  
  const emergencyServices = await Service.find({
    category: 'emergency',
    isActive: true,
    name: { $regex: emergencyType, $options: 'i' }
  }).select('_id');
  
  return emergencyServices.map(service => service._id);
}

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
