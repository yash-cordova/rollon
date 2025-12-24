const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Partner = require('../models/Partner');
const Booking = require('../models/Booking');
const Emergency = require('../models/Emergency');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const { validateAdminLogin } = require('../middleware/validation');

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@rollon.in"
 *               password:
 *                 type: string
 *                 example: "admin123"
 *     responses:
 *       200:
 *         description: Admin login successful
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
 *                   example: "Admin login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439016"
 *                         email:
 *                           type: string
 *                           example: "admin@rollon.in"
 *                         role:
 *                           type: string
 *                           example: "super_admin"
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validateAdminLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if admin is active
    if (admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Admin account is not active. Please contact super admin.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: adminResponse,
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during admin login'
    });
  }
});

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                       example: 1250
 *                     totalPartners:
 *                       type: number
 *                       example: 85
 *                     totalBookings:
 *                       type: number
 *                       example: 3420
 *                     totalEmergencies:
 *                       type: number
 *                       example: 156
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         today:
 *                           type: number
 *                           example: 45000
 *                         thisMonth:
 *                           type: number
 *                           example: 1250000
 *                         thisYear:
 *                           type: number
 *                           example: 15000000
 *                     recentBookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/dashboard', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    // Get current date and calculate date ranges
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get counts
    const totalUsers = await User.countDocuments({ status: 'active' });
    const totalPartners = await Partner.countDocuments({ status: 'approved' });
    const totalBookings = await Booking.countDocuments();
    const totalEmergencies = await Emergency.countDocuments();

    // Get revenue data
    const todayBookings = await Booking.find({
      createdAt: { $gte: startOfDay },
      status: 'completed'
    });

    const monthBookings = await Booking.find({
      createdAt: { $gte: startOfMonth },
      status: 'completed'
    });

    const yearBookings = await Booking.find({
      createdAt: { $gte: startOfYear },
      status: 'completed'
    });

    const calculateRevenue = (bookings) => {
      return bookings.reduce((total, booking) => total + (booking.price || 0), 0);
    };

    const revenue = {
      today: calculateRevenue(todayBookings),
      thisMonth: calculateRevenue(monthBookings),
      thisYear: calculateRevenue(yearBookings)
    };

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('partnerId', 'businessName')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get pending partner approvals
    const pendingPartners = await Partner.countDocuments({ status: 'pending' });

    // Get today's statistics
    const todayUsers = await User.countDocuments({ createdAt: { $gte: startOfDay } });
    const todayBookingsCount = await Booking.countDocuments({ createdAt: { $gte: startOfDay } });
    const todayEmergencies = await Emergency.countDocuments({ createdAt: { $gte: startOfDay } });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPartners,
        totalBookings,
        totalEmergencies,
        revenue,
        recentBookings,
        pendingPartners,
        todayStats: {
          newUsers: todayUsers,
          newBookings: todayBookingsCount,
          newEmergencies: todayEmergencies
        }
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving dashboard statistics'
    });
  }
});

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["active", "inactive", "suspended"]
 *         description: Filter by user status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
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
 *                       example: 1250
 *                     pages:
 *                       type: integer
 *                       example: 63
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving users'
    });
  }
});

/**
 * @swagger
 * /admin/partners:
 *   get:
 *     summary: Get all partners (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["pending", "approved", "rejected", "suspended"]
 *         description: Filter by approval status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by business name or email
 *     responses:
 *       200:
 *         description: Partners retrieved successfully
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
 *                       example: 85
 *                     pages:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/partners', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Partner.countDocuments(query);

    // Get partners with pagination
    const partners = await Partner.find(query)
      .select('-password')
      .populate('services.serviceId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: partners,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get admin partners error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving partners'
    });
  }
});

/**
 * @swagger
 * /admin/partners/{partnerId}/approve:
 *   post:
 *     summary: Approve partner registration
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: Partner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "All documents verified and approved"
 *     responses:
 *       200:
 *         description: Partner approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Partner already approved
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
 *         description: Partner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/partners/:partnerId/approve', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { notes } = req.body;

    // Validate partner ID format
    if (!partnerId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid partner ID format'
      });
    }

    // Find partner
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Check if partner can be approved
    if (partner.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Partner is already approved'
      });
    }

    if (partner.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve rejected partner. Please ask them to reapply.'
      });
    }

    // Approve partner
    partner.status = 'approved';
    partner.approvedAt = new Date();
    partner.approvedBy = req.user.adminId;
    partner.approvalNotes = notes || 'Approved by admin';
    partner.updatedAt = new Date();

    await partner.save();

    // TODO: Send approval notification to partner
    // await sendPartnerApprovalNotification(partner);

    res.status(200).json({
      success: true,
      message: 'Partner approved successfully',
      data: {
        partnerId,
        status: 'approved',
        approvedAt: partner.approvedAt
      }
    });
  } catch (error) {
    console.error('Approve partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while approving partner'
    });
  }
});

/**
 * @swagger
 * /admin/partners/{partnerId}/reject:
 *   post:
 *     summary: Reject partner registration
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: Partner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Incomplete documentation"
 *     responses:
 *       200:
 *         description: Partner rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Partner already processed
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
 *         description: Partner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/partners/:partnerId/reject', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Validate partner ID format
    if (!partnerId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid partner ID format'
      });
    }

    // Find partner
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Check if partner can be rejected
    if (['approved', 'rejected'].includes(partner.status)) {
      return res.status(400).json({
        success: false,
        message: 'Partner is already processed'
      });
    }

    // Reject partner
    partner.status = 'rejected';
    partner.rejectedAt = new Date();
    partner.rejectedBy = req.user.adminId;
    partner.rejectionReason = reason;
    partner.updatedAt = new Date();

    await partner.save();

    // TODO: Send rejection notification to partner
    // await sendPartnerRejectionNotification(partner, reason);

    res.status(200).json({
      success: true,
      message: 'Partner rejected successfully',
      data: {
        partnerId,
        status: 'rejected',
        rejectedAt: partner.rejectedAt,
        reason: partner.rejectionReason
      }
    });
  } catch (error) {
    console.error('Reject partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while rejecting partner'
    });
  }
});

/**
 * @swagger
 * /admin/bookings:
 *   get:
 *     summary: Get all bookings (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["pending", "confirmed", "in-progress", "completed", "cancelled"]
 *         description: Filter by booking status
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         example: "2023-12-01"
 *         description: Filter from date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         example: "2023-12-31"
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
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
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 3420
 *                     pages:
 *                       type: integer
 *                       example: 171
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/bookings', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
      }
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
      .populate('partnerId', 'businessName email phone')
      .populate('serviceId', 'name category')
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
    console.error('Get admin bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving bookings'
    });
  }
});

/**
 * @swagger
 * /admin/emergencies:
 *   get:
 *     summary: Get all emergency requests (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["pending", "assigned", "responding", "resolved", "cancelled"]
 *         description: Filter by emergency status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: ["low", "medium", "high", "critical"]
 *         description: Filter by priority
 *     responses:
 *       200:
 *         description: Emergency requests retrieved successfully
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
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 156
 *                     pages:
 *                       type: integer
 *                       example: 8
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/emergencies', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Emergency.countDocuments(query);

    // Get emergencies with pagination
    const emergencies = await Emergency.find(query)
      .populate('userId', 'name email phone')
      .populate('assignedPartner', 'businessName email phone')
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
    console.error('Get admin emergencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving emergencies'
    });
  }
});

module.exports = router;
