const express = require('express');
const router = express.Router();
const ServiceCall = require('../models/ServiceCall');
const Service = require('../models/Service');
const Partner = require('../models/Partner');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

/**
 * Validation for creating service call
 */
const validateServiceCall = [
  body('partnerId')
    .isMongoId()
    .withMessage('Valid partner ID is required'),
  
  body('serviceId')
    .isMongoId()
    .withMessage('Valid service ID is required'),
  
  body('requestMessage')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Request message must be less than 500 characters'),
  
  body('preferredDate')
    .optional()
    .isISO8601()
    .withMessage('Preferred date must be a valid date'),
  
  body('preferredTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Preferred time must be in HH:MM format'),
  
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high', 'emergency'])
    .withMessage('Urgency must be one of: low, medium, high, emergency'),
  
  body('callType')
    .optional()
    .isIn(['service_request', 'inquiry', 'emergency'])
    .withMessage('Call type must be one of: service_request, inquiry, emergency'),
  
  body('callStatus')
    .optional()
    .isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled'])
    .withMessage('Call status must be one of: pending, accepted, rejected, completed, cancelled'),
  
  body('source')
    .optional()
    .isIn(['app', 'web', 'phone', 'other'])
    .withMessage('Source must be one of: app, web, phone, other'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * @swagger
 * /service-calls:
 *   post:
 *     summary: Create a service call request (Customer Auth Required)
 *     tags: [Service Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partnerId
 *               - serviceId
 *             properties:
 *               partnerId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               serviceId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439013"
 *               requestMessage:
 *                 type: string
 *                 example: "Need urgent tyre replacement"
 *               preferredDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-20"
 *               preferredTime:
 *                 type: string
 *                 example: "14:30"
 *               urgency:
 *                 type: string
 *                 enum: [low, medium, high, emergency]
 *                 example: "high"
 *               callType:
 *                 type: string
 *                 enum: [service_request, inquiry, emergency]
 *                 example: "service_request"
 *               callStatus:
 *                 type: string
 *                 enum: [pending, accepted, rejected, completed, cancelled]
 *                 example: "pending"
 *                 description: "Call status (optional, defaults to 'pending')"
 *               source:
 *                 type: string
 *                 enum: [app, web, phone, other]
 *                 example: "app"
 *                 description: "Source of the call (optional, defaults to 'app'). IP address is auto-calculated from request."
 *               vehicleDetails:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: "car"
 *                   make:
 *                     type: string
 *                     example: "Honda"
 *                   model:
 *                     type: string
 *                     example: "City"
 *                   registrationNumber:
 *                     type: string
 *                     example: "GJ01AB1234"
 *     responses:
 *       201:
 *         description: Service call created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, validateServiceCall, async (req, res) => {
  try {
    // Verify customer role
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customer role required.'
      });
    }

    const {
      partnerId,
      serviceId,
      requestMessage,
      preferredDate,
      preferredTime,
      urgency,
      callType,
      callStatus,
      source,
      vehicleDetails
    } = req.body;

    const customerId = req.user.userId;

    // Get customer details
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Verify partner exists and is approved
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    if (partner.approvalStatus !== 'approved' || !partner.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Partner is not approved'
      });
    }

    // Verify service exists and is active
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (!service.isActive || !service.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Service is not available'
      });
    }

    // Create service call
    const serviceCall = new ServiceCall({
      customerId,
      customerName: customer.name,
      customerPhone: customer.phoneNumber,
      customerEmail: customer.email,
      customerLocation: customer.currentLocation || {
        type: 'Point',
        coordinates: [0, 0]
      },
      partnerId,
      partnerName: partner.shopName || partner.businessName || partner.ownerName,
      partnerPhone: partner.mobileNumber || partner.phoneNumber,
      serviceId,
      serviceName: service.name,
      serviceCategory: service.category,
      requestMessage: requestMessage?.trim(),
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      preferredTime,
      urgency: urgency || 'medium',
      callType: callType || 'service_request',
      callStatus: callStatus || 'pending', // Allow customer to set status, default to pending
      vehicleDetails: vehicleDetails || {},
      source: source || 'app',
      ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown', // Auto-calculate IP
      userAgent: req.get('user-agent') || 'unknown'
    });

    await serviceCall.save();

    // Populate references for response
    await serviceCall.populate('customerId', 'name phoneNumber email');
    await serviceCall.populate('partnerId', 'shopName businessName mobileNumber');
    await serviceCall.populate('serviceId', 'name category basePrice');

    res.status(201).json({
      success: true,
      message: 'Service call created successfully',
      data: serviceCall
    });
  } catch (error) {
    console.error('Create service call error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating service call',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /service-calls/partner/dashboard:
 *   get:
 *     summary: Get partner dashboard with service call statistics (Partner Auth Required)
 *     tags: [Service Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *         description: Filter calls from this date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-31"
 *         description: Filter calls until this date
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *         description: Filter by specific service
 *       - in: query
 *         name: callStatus
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, completed, cancelled]
 *         description: Filter by call status
 *     responses:
 *       200:
 *         description: Partner dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/partner/dashboard', authenticateToken, async (req, res) => {
  try {
    // Verify partner role
    if (req.user.role !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partner role required.'
      });
    }

    const partnerId = req.user.partnerId;
    const { dateFrom, dateTo, serviceId, callStatus } = req.query;

    // Build date filter
    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) {
        dateFilter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Include the entire end date
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = endDate;
      }
    }

    // Build query
    const query = {
      partnerId,
      ...dateFilter
    };

    if (serviceId) {
      query.serviceId = serviceId;
    }

    if (callStatus) {
      query.callStatus = callStatus;
    }

    // Get all service calls for this partner
    const serviceCalls = await ServiceCall.find(query)
      .populate('customerId', 'name phoneNumber email address currentLocation vehicles')
      .populate('partnerId', 'shopName ownerName businessName mobileNumber whatsappNumber shopAddress email address location')
      .populate('serviceId', 'name description category basePrice estimatedDuration serviceType')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalCalls = serviceCalls.length;
    const callsByStatus = {
      pending: serviceCalls.filter(call => call.callStatus === 'pending').length,
      accepted: serviceCalls.filter(call => call.callStatus === 'accepted').length,
      rejected: serviceCalls.filter(call => call.callStatus === 'rejected').length,
      completed: serviceCalls.filter(call => call.callStatus === 'completed').length,
      cancelled: serviceCalls.filter(call => call.callStatus === 'cancelled').length
    };

    // Group calls by service
    const callsByService = {};
    serviceCalls.forEach(call => {
      const serviceName = call.serviceName || 'Unknown Service';
      const serviceId = call.serviceId?._id?.toString() || call.serviceId?.toString() || 'unknown';
      
      if (!callsByService[serviceId]) {
        callsByService[serviceId] = {
          serviceId: call.serviceId?._id || call.serviceId,
          serviceName,
          serviceCategory: call.serviceCategory,
          totalCalls: 0,
          callsByStatus: {
            pending: 0,
            accepted: 0,
            rejected: 0,
            completed: 0,
            cancelled: 0
          },
          calls: []
        };
      }
      
      callsByService[serviceId].totalCalls++;
      callsByService[serviceId].callsByStatus[call.callStatus]++;
      callsByService[serviceId].calls.push({
        id: call._id,
        customerName: call.customerName,
        customerPhone: call.customerPhone,
        callStatus: call.callStatus,
        urgency: call.urgency,
        createdAt: call.createdAt,
        requestMessage: call.requestMessage
      });
    });

    // Convert to array and sort by total calls
    const serviceStats = Object.values(callsByService).sort((a, b) => b.totalCalls - a.totalCalls);

    // Get calls by date (for chart/trend analysis)
    const callsByDate = {};
    serviceCalls.forEach(call => {
      const dateKey = call.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!callsByDate[dateKey]) {
        callsByDate[dateKey] = 0;
      }
      callsByDate[dateKey]++;
    });

    // Recent calls (last 10)
    const recentCalls = serviceCalls.slice(0, 10).map(call => ({
      id: call._id,
      customerName: call.customerName,
      customerPhone: call.customerPhone,
      serviceName: call.serviceName,
      callStatus: call.callStatus,
      urgency: call.urgency,
      createdAt: call.createdAt,
      requestMessage: call.requestMessage
    }));

    res.status(200).json({
      success: true,
      message: 'Partner dashboard data retrieved successfully',
      data: {
        summary: {
          totalCalls,
          callsByStatus,
          dateRange: {
            from: dateFrom || 'all',
            to: dateTo || 'all'
          }
        },
        serviceStatistics: serviceStats,
        callsByDate,
        recentCalls,
        allCalls: serviceCalls.map(call => ({
          id: call._id,
          customer: {
            id: call.customerId?._id || call.customerId,
            name: call.customerId?.name || call.customerName,
            phone: call.customerId?.phoneNumber || call.customerPhone,
            email: call.customerId?.email || call.customerEmail,
            address: call.customerId?.address,
            location: call.customerId?.currentLocation,
            vehicles: call.customerId?.vehicles
          },
          partner: {
            id: call.partnerId?._id || call.partnerId,
            shopName: call.partnerId?.shopName || call.partnerName,
            ownerName: call.partnerId?.ownerName,
            businessName: call.partnerId?.businessName,
            phone: call.partnerId?.mobileNumber || call.partnerId?.phoneNumber || call.partnerPhone,
            whatsappNumber: call.partnerId?.whatsappNumber,
            email: call.partnerId?.email,
            address: call.partnerId?.address,
            location: call.partnerId?.location
          },
          service: {
            id: call.serviceId?._id || call.serviceId,
            name: call.serviceId?.name || call.serviceName,
            description: call.serviceId?.description,
            category: call.serviceId?.category || call.serviceCategory,
            basePrice: call.serviceId?.basePrice,
            estimatedDuration: call.serviceId?.estimatedDuration,
            serviceType: call.serviceId?.serviceType
          },
          callStatus: call.callStatus,
          callType: call.callType,
          urgency: call.urgency,
          requestMessage: call.requestMessage,
          preferredDate: call.preferredDate,
          preferredTime: call.preferredTime,
          vehicleDetails: call.vehicleDetails,
          partnerResponse: call.partnerResponse,
          completedAt: call.completedAt,
          actualPrice: call.actualPrice,
          customerRating: call.customerRating,
          customerFeedback: call.customerFeedback,
          createdAt: call.createdAt,
          updatedAt: call.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get partner dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /service-calls/customer/dashboard:
 *   get:
 *     summary: Get customer dashboard with service call history (Customer Auth Required)
 *     tags: [Service Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *         description: Filter calls from this date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-31"
 *         description: Filter calls until this date
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *         description: Filter by specific service
 *       - in: query
 *         name: partnerId
 *         schema:
 *           type: string
 *         description: Filter by specific partner
 *       - in: query
 *         name: callStatus
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, completed, cancelled]
 *         description: Filter by call status
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
 *         description: Customer dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/customer/dashboard', authenticateToken, async (req, res) => {
  try {
    // Verify customer role
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customer role required.'
      });
    }

    const customerId = req.user.userId;
    const { dateFrom, dateTo, serviceId, partnerId, callStatus, page = 1, limit = 20 } = req.query;

    // Build date filter
    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) {
        dateFilter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Include the entire end date
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = endDate;
      }
    }

    // Build query
    const query = {
      customerId,
      ...dateFilter
    };

    if (serviceId) {
      query.serviceId = serviceId;
    }

    if (partnerId) {
      query.partnerId = partnerId;
    }

    if (callStatus) {
      query.callStatus = callStatus;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await ServiceCall.countDocuments(query);

    // Get all service calls for this customer
    const serviceCalls = await ServiceCall.find(query)
      .populate('customerId', 'name phoneNumber email address currentLocation vehicles')
      .populate('partnerId', 'shopName ownerName businessName mobileNumber whatsappNumber shopAddress email address location rating')
      .populate('serviceId', 'name description category basePrice estimatedDuration serviceType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate statistics
    const totalCalls = await ServiceCall.countDocuments({ customerId });
    const allCallsForStats = await ServiceCall.find({ customerId });
    
    const callsByStatus = {
      pending: allCallsForStats.filter(call => call.callStatus === 'pending').length,
      accepted: allCallsForStats.filter(call => call.callStatus === 'accepted').length,
      rejected: allCallsForStats.filter(call => call.callStatus === 'rejected').length,
      completed: allCallsForStats.filter(call => call.callStatus === 'completed').length,
      cancelled: allCallsForStats.filter(call => call.callStatus === 'cancelled').length
    };

    // Group calls by service
    const callsByService = {};
    allCallsForStats.forEach(call => {
      const serviceName = call.serviceName || 'Unknown Service';
      const serviceId = call.serviceId?._id?.toString() || call.serviceId?.toString() || 'unknown';
      
      if (!callsByService[serviceId]) {
        callsByService[serviceId] = {
          serviceId: call.serviceId?._id || call.serviceId,
          serviceName,
          serviceCategory: call.serviceCategory,
          totalCalls: 0,
          callsByStatus: {
            pending: 0,
            accepted: 0,
            rejected: 0,
            completed: 0,
            cancelled: 0
          }
        };
      }
      
      callsByService[serviceId].totalCalls++;
      callsByService[serviceId].callsByStatus[call.callStatus]++;
    });

    // Convert to array and sort by total calls
    const serviceStats = Object.values(callsByService).sort((a, b) => b.totalCalls - a.totalCalls);

    // Group calls by partner
    const callsByPartner = {};
    allCallsForStats.forEach(call => {
      const partnerName = call.partnerName || 'Unknown Partner';
      const partnerId = call.partnerId?._id?.toString() || call.partnerId?.toString() || 'unknown';
      
      if (!callsByPartner[partnerId]) {
        callsByPartner[partnerId] = {
          partnerId: call.partnerId?._id || call.partnerId,
          partnerName,
          partnerPhone: call.partnerPhone,
          totalCalls: 0,
          callsByStatus: {
            pending: 0,
            accepted: 0,
            rejected: 0,
            completed: 0,
            cancelled: 0
          }
        };
      }
      
      callsByPartner[partnerId].totalCalls++;
      callsByPartner[partnerId].callsByStatus[call.callStatus]++;
    });

    // Convert to array and sort by total calls
    const partnerStats = Object.values(callsByPartner).sort((a, b) => b.totalCalls - a.totalCalls);

    // Group calls by partner-service combination (mapping)
    const partnerServiceMapping = {};
    allCallsForStats.forEach(call => {
      const partnerId = call.partnerId?._id?.toString() || call.partnerId?.toString() || 'unknown';
      const serviceId = call.serviceId?._id?.toString() || call.serviceId?.toString() || 'unknown';
      const mappingKey = `${partnerId}_${serviceId}`;
      
      if (!partnerServiceMapping[mappingKey]) {
        partnerServiceMapping[mappingKey] = {
          partnerId: call.partnerId?._id || call.partnerId,
          partnerName: call.partnerName || 'Unknown Partner',
          partnerPhone: call.partnerPhone,
          serviceId: call.serviceId?._id || call.serviceId,
          serviceName: call.serviceName || 'Unknown Service',
          serviceCategory: call.serviceCategory,
          totalCalls: 0,
          callsByStatus: {
            pending: 0,
            accepted: 0,
            rejected: 0,
            completed: 0,
            cancelled: 0
          },
          recentCalls: []
        };
      }
      
      partnerServiceMapping[mappingKey].totalCalls++;
      partnerServiceMapping[mappingKey].callsByStatus[call.callStatus]++;
      
      // Keep track of recent calls for this partner-service combination (last 5)
      if (partnerServiceMapping[mappingKey].recentCalls.length < 5) {
        partnerServiceMapping[mappingKey].recentCalls.push({
          id: call._id,
          callStatus: call.callStatus,
          urgency: call.urgency,
          createdAt: call.createdAt,
          requestMessage: call.requestMessage
        });
      }
    });

    // Convert to array and sort by total calls
    const partnerServiceStats = Object.values(partnerServiceMapping)
      .sort((a, b) => b.totalCalls - a.totalCalls);

    // Get calls by date (for chart/trend analysis)
    const callsByDate = {};
    allCallsForStats.forEach(call => {
      const dateKey = call.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!callsByDate[dateKey]) {
        callsByDate[dateKey] = 0;
      }
      callsByDate[dateKey]++;
    });

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: 'Customer dashboard data retrieved successfully',
      data: {
        summary: {
          totalCalls,
          callsByStatus,
          dateRange: {
            from: dateFrom || 'all',
            to: dateTo || 'all'
          }
        },
        serviceStatistics: serviceStats,
        partnerStatistics: partnerStats,
        partnerServiceMapping: partnerServiceStats, // Shows which partner was called for which service
        callsByDate,
        calls: serviceCalls.map(call => ({
          id: call._id,
          customer: {
            id: call.customerId?._id || call.customerId,
            name: call.customerId?.name || call.customerName,
            phone: call.customerId?.phoneNumber || call.customerPhone,
            email: call.customerId?.email || call.customerEmail,
            address: call.customerId?.address,
            location: call.customerId?.currentLocation,
            vehicles: call.customerId?.vehicles
          },
          partner: {
            id: call.partnerId?._id || call.partnerId,
            shopName: call.partnerId?.shopName || call.partnerName,
            ownerName: call.partnerId?.ownerName,
            businessName: call.partnerId?.businessName,
            phone: call.partnerId?.mobileNumber || call.partnerId?.phoneNumber || call.partnerPhone,
            whatsappNumber: call.partnerId?.whatsappNumber,
            email: call.partnerId?.email,
            address: call.partnerId?.address,
            location: call.partnerId?.location,
            rating: call.partnerId?.rating
          },
          service: {
            id: call.serviceId?._id || call.serviceId,
            name: call.serviceId?.name || call.serviceName,
            description: call.serviceId?.description,
            category: call.serviceId?.category || call.serviceCategory,
            basePrice: call.serviceId?.basePrice,
            estimatedDuration: call.serviceId?.estimatedDuration,
            serviceType: call.serviceId?.serviceType
          },
          callStatus: call.callStatus,
          callType: call.callType,
          urgency: call.urgency,
          requestMessage: call.requestMessage,
          preferredDate: call.preferredDate,
          preferredTime: call.preferredTime,
          vehicleDetails: call.vehicleDetails,
          partnerResponse: call.partnerResponse,
          completedAt: call.completedAt,
          actualPrice: call.actualPrice,
          customerRating: call.customerRating,
          customerFeedback: call.customerFeedback,
          createdAt: call.createdAt,
          updatedAt: call.updatedAt
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Get customer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

