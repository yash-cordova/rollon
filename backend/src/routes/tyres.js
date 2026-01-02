const express = require('express');
const router = express.Router();
const Tyre = require('../models/Tyre');

/**
 * @swagger
 * /tyres:
 *   get:
 *     summary: Get all available tyres (Public API - No Auth Required)
 *     tags: [Tyres]
 *     parameters:
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *           enum: [MRF, Apollo, CEAT, Michelin, JK Tyre, Other]
 *         description: Filter by tyre brand
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [car, bike, truck, bus, auto, other]
 *         description: Filter by vehicle type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search tyres by name, model, or description
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
 *         description: Tyres retrieved successfully
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
 *                     $ref: '#/components/schemas/Tyre'
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
    const { brand, vehicleType, search, page = 1, limit = 20 } = req.query;

    // Build query - only active tyres
    const query = { isActive: true };
    
    if (brand) {
      query.brand = brand;
    }

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Tyre.countDocuments(query);

    // Get tyres with pagination
    const tyres = await Tyre.find(query)
      .sort({ brand: 1, name: 1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: tyres,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get tyres error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving tyres',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /tyres/brands:
 *   get:
 *     summary: Get all tyre brands (Public API - No Auth Required)
 *     tags: [Tyres]
 *     responses:
 *       200:
 *         description: Tyre brands retrieved successfully
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
 *                       brand:
 *                         type: string
 *                         example: "MRF"
 *                       count:
 *                         type: number
 *                         example: 15
 */
router.get('/brands', async (req, res) => {
  try {
    const brands = ['MRF', 'Apollo', 'CEAT', 'Michelin', 'JK Tyre', 'Other'];
    
    const brandsWithCount = await Promise.all(
      brands.map(async (brand) => {
        const count = await Tyre.countDocuments({ brand, isActive: true });
        return { brand, count };
      })
    );

    res.status(200).json({
      success: true,
      data: brandsWithCount
    });
  } catch (error) {
    console.error('Get tyre brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving tyre brands',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /tyres/{tyreId}:
 *   get:
 *     summary: Get tyre details by ID (Public API - No Auth Required)
 *     tags: [Tyres]
 *     parameters:
 *       - in: path
 *         name: tyreId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439013"
 *         description: Tyre ID
 *     responses:
 *       200:
 *         description: Tyre details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tyre'
 *       404:
 *         description: Tyre not found
 */
router.get('/:tyreId', async (req, res) => {
  try {
    const { tyreId } = req.params;

    // Validate tyre ID format
    if (!tyreId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tyre ID format'
      });
    }

    const tyre = await Tyre.findById(tyreId);
    
    if (!tyre) {
      return res.status(404).json({
        success: false,
        message: 'Tyre not found'
      });
    }

    if (!tyre.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Tyre is not available'
      });
    }

    res.status(200).json({
      success: true,
      data: tyre
    });
  } catch (error) {
    console.error('Get tyre details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving tyre details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

