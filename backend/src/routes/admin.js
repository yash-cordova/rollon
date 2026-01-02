const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Partner = require('../models/Partner');
const Booking = require('../models/Booking');
const Emergency = require('../models/Emergency');
const Service = require('../models/Service');
const Tyre = require('../models/Tyre');
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
    if (!admin.isActive) {
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
 *         name: approvalStatus
 *         schema:
 *           type: string
 *           enum: ["pending", "approved", "rejected", "suspended"]
 *         description: Filter by approval status
 *       - in: query
 *         name: isApproved
 *         schema:
 *           type: boolean
 *         description: Filter by approval boolean (true/false)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by shop name, business name, owner name, mobile number, or email
 *       - in: query
 *         name: mobileNumber
 *         schema:
 *           type: string
 *         description: Filter by mobile number
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
    const { 
      page = 1, 
      limit = 20, 
      approvalStatus, 
      isApproved,
      search,
      mobileNumber
    } = req.query;

    // Build query
    const query = {};
    
    // Filter by approvalStatus
    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }
    
    // Filter by isApproved (boolean)
    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true' || isApproved === true;
    }

    // Filter by mobile number
    if (mobileNumber) {
      query.$or = [
        { mobileNumber },
        { phoneNumber: mobileNumber }
      ];
    }

    // Search functionality
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const searchConditions = [
        { shopName: searchRegex },
        { businessName: searchRegex },
        { ownerName: searchRegex },
        { name: searchRegex },
        { email: searchRegex },
        { mobileNumber: searchRegex },
        { phoneNumber: searchRegex }
      ];
      
      if (query.$or) {
        // If mobileNumber filter exists, combine with search
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Partner.countDocuments(query);

    // Get partners with pagination
    // Exclude password and file binary data for better performance
    const partners = await Partner.find(query)
      .select('-password -storePhoto.data -priceList.data')
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
      },
      filters: {
        approvalStatus: approvalStatus || null,
        isApproved: isApproved !== undefined ? (isApproved === 'true' || isApproved === true) : null,
        search: search || null,
        mobileNumber: mobileNumber || null
      }
    });
  } catch (error) {
    console.error('Get admin partners error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving partners',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /admin/partners/pending:
 *   get:
 *     summary: Get all pending partners with images as bytes
 *     description: Returns list of partners with pending approval status, including store photo and price list as base64 encoded bytes
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
 *     responses:
 *       200:
 *         description: Pending partners retrieved successfully with images
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
 *                       _id:
 *                         type: string
 *                       shopName:
 *                         type: string
 *                       ownerName:
 *                         type: string
 *                       mobileNumber:
 *                         type: string
 *                       email:
 *                         type: string
 *                       shopAddress:
 *                         type: string
 *                       storePhoto:
 *                         type: object
 *                         properties:
 *                           data:
 *                             type: string
 *                             description: Base64 encoded image data
 *                           contentType:
 *                             type: string
 *                           filename:
 *                             type: string
 *                           size:
 *                             type: number
 *                       priceList:
 *                         type: object
 *                         properties:
 *                           data:
 *                             type: string
 *                             description: Base64 encoded file data
 *                           contentType:
 *                             type: string
 *                           filename:
 *                             type: string
 *                           size:
 *                             type: number
 *                       approvalStatus:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/partners/pending', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Build query for pending partners
    const query = {
      $or: [
        { approvalStatus: 'pending' },
        { approvalStatus: { $exists: false } },
        { isApproved: false }
      ]
    };

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Partner.countDocuments(query);

    // Get partners with pagination - include file data
    const partners = await Partner.find(query)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Convert Buffer data to base64 for JSON response
    const partnersWithImages = partners.map(partner => {
      const partnerObj = partner.toObject();
      
      // Convert storePhoto buffer to base64
      if (partnerObj.storePhoto && partnerObj.storePhoto.data) {
        partnerObj.storePhoto.data = partnerObj.storePhoto.data.toString('base64');
      }
      
      // Convert priceList buffer to base64
      if (partnerObj.priceList && partnerObj.priceList.data) {
        partnerObj.priceList.data = partnerObj.priceList.data.toString('base64');
      }
      
      return partnerObj;
    });

    // Calculate pagination info
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: partnersWithImages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get pending partners error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving pending partners',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /admin/partners/approve-by-mobile:
 *   post:
 *     summary: Approve partner by mobile number
 *     description: Search partner by mobile number and approve them (set isApproved to true and approvalStatus to approved)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 pattern: '^[6-9]\d{9}$'
 *                 example: "9876543210"
 *                 description: 10-digit Indian mobile number
 *               notes:
 *                 type: string
 *                 example: "All documents verified and approved"
 *     responses:
 *       200:
 *         description: Partner approved successfully
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
 *                   example: "Partner approved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     partnerId:
 *                       type: string
 *                     mobileNumber:
 *                       type: string
 *                     isApproved:
 *                       type: boolean
 *                       example: true
 *                     approvalStatus:
 *                       type: string
 *                       example: "approved"
 *                     approvedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Partner already approved or invalid mobile number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner not found
 */
router.post('/partners/approve-by-mobile', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { mobileNumber, notes } = req.body;

    // Validate mobile number
    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    if (!mobileNumber.match(/^[6-9]\d{9}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format. Must be 10 digits starting with 6-9'
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
        message: `Partner with mobile number ${mobileNumber} not found`
      });
    }

    // Check if partner is already approved
    if (partner.isApproved === true && partner.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Partner is already approved',
        data: {
          partnerId: partner._id,
          mobileNumber: partner.mobileNumber || partner.phoneNumber,
          isApproved: partner.isApproved,
          approvalStatus: partner.approvalStatus
        }
      });
    }

    // Check if partner was rejected
    if (partner.approvalStatus === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve rejected partner. Please ask them to reapply.'
      });
    }

    // Approve partner
    partner.isApproved = true;
    partner.approvalStatus = 'approved';
    partner.approvalDate = new Date();
    partner.approvedBy = req.user.adminId || req.user._id;
    
    if (notes) {
      partner.approvalNotes = notes;
    }

    await partner.save();

    res.status(200).json({
      success: true,
      message: 'Partner approved successfully',
      data: {
        partnerId: partner._id,
        mobileNumber: partner.mobileNumber || partner.phoneNumber,
        shopName: partner.shopName || partner.businessName,
        ownerName: partner.ownerName || partner.name,
        isApproved: partner.isApproved,
        approvalStatus: partner.approvalStatus,
        approvedAt: partner.approvalDate
      }
    });
  } catch (error) {
    console.error('Approve partner by mobile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while approving partner',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /admin/partners/{partnerId}/approve:
 *   post:
 *     summary: Approve partner registration by ID
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
    if (partner.isApproved === true && partner.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Partner is already approved'
      });
    }

    if (partner.approvalStatus === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve rejected partner. Please ask them to reapply.'
      });
    }

    // Approve partner
    partner.isApproved = true;
    partner.approvalStatus = 'approved';
    partner.approvalDate = new Date();
    partner.approvedBy = req.user.adminId || req.user._id;
    partner.approvalNotes = notes || 'Approved by admin';

    await partner.save();

    // TODO: Send approval notification to partner
    // await sendPartnerApprovalNotification(partner);

    res.status(200).json({
      success: true,
      message: 'Partner approved successfully',
      data: {
        partnerId,
        isApproved: partner.isApproved,
        approvalStatus: partner.approvalStatus,
        approvedAt: partner.approvalDate
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

/**
 * @swagger
 * /admin/services:
 *   post:
 *     summary: Add a new service (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - estimatedDuration
 *               - basePrice
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Oil Change"
 *               description:
 *                 type: string
 *                 example: "Complete engine oil change service"
 *               category:
 *                 type: string
 *                 enum: [repair, maintenance, emergency, cleaning, fuel, battery, other]
 *                 example: "maintenance"
 *               subCategory:
 *                 type: string
 *                 example: "Engine Service"
 *               estimatedDuration:
 *                 type: number
 *                 example: 30
 *               basePrice:
 *                 type: number
 *                 example: 500
 *               serviceType:
 *                 type: string
 *                 enum: [onsite, workshop, mobile, pickup_delivery]
 *                 example: "workshop"
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/services', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subCategory,
      serviceType,
      estimatedDuration,
      complexity,
      basePrice,
      currency,
      pricingModel,
      vehicleType,
      isEmergencyService,
      isActive
    } = req.body;

    // Validate required fields
    if (!name || !category || !estimatedDuration || !basePrice) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, estimatedDuration, and basePrice are required'
      });
    }

    // Check if service with same name already exists
    const existingService = await Service.findOne({ name: name.trim() });
    if (existingService) {
      return res.status(409).json({
        success: false,
        message: 'Service with this name already exists'
      });
    }

    // Create new service
    const service = new Service({
      name: name.trim(),
      description: description?.trim(),
      category,
      subCategory: subCategory?.trim(),
      serviceType: serviceType || 'onsite',
      estimatedDuration,
      complexity: complexity || 'moderate',
      basePrice,
      currency: currency || 'INR',
      pricingModel: pricingModel || 'fixed',
      isEmergencyService: isEmergencyService || false,
      isActive: isActive !== undefined ? isActive : true,
      isApproved: true,
      approvalStatus: 'approved'
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /admin/tyres:
 *   post:
 *     summary: Add a new tyre (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brand
 *               - name
 *               - vehicleType
 *             properties:
 *               brand:
 *                 type: string
 *                 enum: [MRF, Apollo, CEAT, Michelin, JK Tyre, Other]
 *                 example: "MRF"
 *               name:
 *                 type: string
 *                 example: "Zapper Q"
 *               model:
 *                 type: string
 *                 example: "ZQ-185/65 R15"
 *               description:
 *                 type: string
 *                 example: "Premium tubeless tyre for cars"
 *               size:
 *                 type: object
 *                 properties:
 *                   width:
 *                     type: number
 *                     example: 185
 *                   aspectRatio:
 *                     type: number
 *                     example: 65
 *                   rimDiameter:
 *                     type: number
 *                     example: 15
 *                   fullSize:
 *                     type: string
 *                     example: "185/65 R15"
 *               vehicleType:
 *                 type: string
 *                 enum: [car, bike, truck, bus, auto, other]
 *                 example: "car"
 *               basePrice:
 *                 type: number
 *                 example: 3500
 *               type:
 *                 type: string
 *                 enum: [tubeless, tube, tubeless-ready]
 *                 example: "tubeless"
 *     responses:
 *       201:
 *         description: Tyre created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/tyres', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const {
      brand,
      name,
      model,
      description,
      size,
      loadIndex,
      speedRating,
      type,
      pattern,
      vehicleType,
      suitableFor,
      basePrice,
      currency,
      features,
      warranty,
      isActive
    } = req.body;

    // Validate required fields
    if (!brand || !name || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Brand, name, and vehicleType are required'
      });
    }

    // Validate brand
    const validBrands = ['MRF', 'Apollo', 'CEAT', 'Michelin', 'JK Tyre', 'Other'];
    if (!validBrands.includes(brand)) {
      return res.status(400).json({
        success: false,
        message: `Invalid brand. Allowed: ${validBrands.join(', ')}`
      });
    }

    // Validate vehicle type
    const validVehicleTypes = ['car', 'bike', 'truck', 'bus', 'auto', 'other'];
    if (!validVehicleTypes.includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid vehicleType. Allowed: ${validVehicleTypes.join(', ')}`
      });
    }

    // Create new tyre
    const tyre = new Tyre({
      brand,
      name: name.trim(),
      model: model?.trim(),
      description: description?.trim(),
      size: size || {},
      loadIndex,
      speedRating,
      type: type || 'tubeless',
      pattern: pattern?.trim(),
      vehicleType,
      suitableFor: suitableFor || [],
      basePrice,
      currency: currency || 'INR',
      features: features || [],
      warranty: warranty || {},
      isActive: isActive !== undefined ? isActive : true,
      isAvailable: true
    });

    await tyre.save();

    res.status(201).json({
      success: true,
      message: 'Tyre created successfully',
      data: tyre
    });
  } catch (error) {
    console.error('Create tyre error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Tyre with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating tyre',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /admin/customers:
 *   get:
 *     summary: Get all customers with filters (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other]
 *         description: Filter by gender
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by registration date from
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by registration date to
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
 *         description: Customers retrieved successfully
 */
router.get('/customers', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { 
      search, 
      isActive, 
      gender, 
      city, 
      state, 
      dateFrom, 
      dateTo, 
      page = 1, 
      limit = 20 
    } = req.query;

    // Build query
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }

    // Gender filter
    if (gender) {
      query.gender = gender;
    }

    // Location filters
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    if (state) {
      query['address.state'] = { $regex: state, $options: 'i' };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await User.countDocuments(query);

    // Get customers
    const customers = await User.find(query)
      .select('-password -otp')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving customers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /admin/partners/list:
 *   get:
 *     summary: Get all partners with filters (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by shop name, owner name, email, or phone
 *       - in: query
 *         name: approvalStatus
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, suspended]
 *         description: Filter by approval status
 *       - in: query
 *         name: isApproved
 *         schema:
 *           type: boolean
 *         description: Filter by approved status
 *       - in: query
 *         name: businessType
 *         schema:
 *           type: string
 *           enum: [garage, tire_shop, petrol_pump, ev_charging, battery_swap, car_wash, towing, emergency_service, other]
 *         description: Filter by business type
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *         description: Filter by service offered
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by registration date from
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by registration date to
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
 *         description: Partners retrieved successfully
 */
router.get('/partners/list', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { 
      search, 
      approvalStatus, 
      isApproved, 
      businessType, 
      city, 
      state, 
      serviceId,
      dateFrom, 
      dateTo, 
      page = 1, 
      limit = 20 
    } = req.query;

    // Build query
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Approval status filter
    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }

    // Is approved filter
    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true' || isApproved === true;
    }

    // Business type filter
    if (businessType) {
      query.businessType = businessType;
    }

    // Location filters
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    if (state) {
      query['address.state'] = { $regex: state, $options: 'i' };
    }

    // Service filter
    if (serviceId) {
      if (query.$or) {
        // If search filter exists, combine with service filter using $and
        query.$and = [
          { $or: query.$or },
          {
            $or: [
              { 'services.serviceId': serviceId },
              { 'services.name': { $regex: serviceId, $options: 'i' } }
            ]
          }
        ];
        delete query.$or;
      } else {
        query.$or = [
          { 'services.serviceId': serviceId },
          { 'services.name': { $regex: serviceId, $options: 'i' } }
        ];
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Partner.countDocuments(query);

    // Get partners
    const partners = await Partner.find(query)
      .select('-password -storePhoto.data -priceList.data')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: 'Partners retrieved successfully',
      data: partners,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get partners list error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving partners',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
