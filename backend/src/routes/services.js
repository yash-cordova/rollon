const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const Partner = require('../models/Partner');

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Get all available services
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: ["maintenance", "repair", "emergency", "inspection"]
 *         description: Filter by service category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search services by name or description
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
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Services retrieved successfully
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     pages:
 *                       type: integer
 *                       example: 3
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Service.countDocuments(query);

    // Get services with pagination
    const services = await Service.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: services,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving services'
    });
  }
});

/**
 * @swagger
 * /services/{serviceId}:
 *   get:
 *     summary: Get service details by ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439013"
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Validate service ID format
    if (!serviceId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (!service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service is not available'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Get service details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving service details'
    });
  }
});

/**
 * @swagger
 * /services/categories:
 *   get:
 *     summary: Get all service categories
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: Service categories retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "maintenance"
 *                       name:
 *                         type: string
 *                         example: "Maintenance"
 *                       description:
 *                         type: string
 *                         example: "Regular maintenance services"
 *                       icon:
 *                         type: string
 *                         example: "wrench"
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        id: 'maintenance',
        name: 'Maintenance',
        description: 'Regular maintenance services for your vehicle',
        icon: 'wrench',
        services: await Service.countDocuments({ category: 'maintenance', isActive: true })
      },
      {
        id: 'repair',
        name: 'Repair',
        description: 'Vehicle repair and troubleshooting services',
        icon: 'tools',
        services: await Service.countDocuments({ category: 'repair', isActive: true })
      },
      {
        id: 'emergency',
        name: 'Emergency',
        description: '24/7 emergency roadside assistance',
        icon: 'exclamation-triangle',
        services: await Service.countDocuments({ category: 'emergency', isActive: true })
      },
      {
        id: 'inspection',
        name: 'Inspection',
        description: 'Vehicle inspection and diagnostic services',
        icon: 'search',
        services: await Service.countDocuments({ category: 'inspection', isActive: true })
      }
    ];

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get service categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving service categories'
    });
  }
});

/**
 * @swagger
 * /services/{serviceId}/providers:
 *   get:
 *     summary: Get providers offering a specific service
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439013"
 *         description: Service ID
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         example: 28.6139
 *         description: User's latitude for nearby search
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         example: 77.2090
 *         description: User's longitude for nearby search
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         example: 10
 *         description: Search radius in kilometers
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         example: 4
 *         description: Minimum rating filter
 *     responses:
 *       200:
 *         description: Service providers retrieved successfully
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
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:serviceId/providers', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { latitude, longitude, radius = 10, rating } = req.query;

    // Validate service ID format
    if (!serviceId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Build query for partners offering this service
    const query = {
      status: 'approved',
      'services.serviceId': serviceId
    };

    // Add rating filter if provided
    if (rating) {
      const minRating = parseFloat(rating);
      if (!isNaN(minRating) && minRating >= 1 && minRating <= 5) {
        query.rating = { $gte: minRating };
      }
    }

    let partners;

    // If coordinates provided, search by location
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const searchRadius = parseFloat(radius);

      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || isNaN(searchRadius) ||
          lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinate or radius values'
        });
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

      // Find nearby partners with location sorting
      partners = await Partner.find(query)
        .populate('services.serviceId', 'name description category')
        .limit(50)
        .sort({ rating: -1, 'location.coordinates': 1 });

      // Calculate distances
      partners = partners.map(partner => {
        const partnerObj = partner.toObject();
        const distance = calculateDistance(lat, lng, partner.location.coordinates[1], partner.location.coordinates[0]);
        return {
          ...partnerObj,
          distance: Math.round(distance * 100) / 100
        };
      });

      // Sort by distance
      partners.sort((a, b) => a.distance - b.distance);
    } else {
      // Find all partners offering this service (no location filter)
      partners = await Partner.find(query)
        .populate('services.serviceId', 'name description category')
        .sort({ rating: -1, businessName: 1 })
        .limit(100);
    }

    res.status(200).json({
      success: true,
      data: partners
    });
  } catch (error) {
    console.error('Get service providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving service providers'
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
