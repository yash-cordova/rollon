const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const Partner = require('../models/Partner');
const Service = require('../models/Service');
const { authenticateToken } = require('../middleware/auth');
const { validateBookingCreate, validateBookingUpdate, validateFeedback } = require('../middleware/validation');

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
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
 *               - scheduledTime
 *             properties:
 *               partnerId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               serviceId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439013"
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-12-15T10:00:00Z"
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
 *               specialInstructions:
 *                 type: string
 *                 example: "Please check the brakes thoroughly"
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 28.6139
 *                   longitude:
 *                     type: number
 *                     example: 77.2090
 *                   address:
 *                     type: string
 *                     example: "Connaught Place, New Delhi"
 *     responses:
 *       201:
 *         description: Booking created successfully
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
 *                   example: "Booking created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
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
 *       409:
 *         description: Booking conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateToken, validateBookingCreate, async (req, res) => {
  try {
    // Verify user role
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role required.'
      });
    }

    const { partnerId, serviceId, scheduledTime, vehicleDetails, specialInstructions, location } = req.body;
    const userId = req.user.userId;

    // Validate partner ID format
    if (!partnerId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid partner ID format'
      });
    }

    // Validate service ID format
    if (!serviceId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    // Check if partner exists and is approved
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    if (partner.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Partner is not approved'
      });
    }

    // Check if partner offers this service
    const partnerService = partner.services.find(s => s.serviceId.toString() === serviceId);
    if (!partnerService) {
      return res.status(400).json({
        success: false,
        message: 'Partner does not offer this service'
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

    // Validate scheduled time
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in the future'
      });
    }

    // Check for booking conflicts (same partner, overlapping time)
    const existingBooking = await Booking.findOne({
      partnerId,
      status: { $in: ['pending', 'confirmed', 'in-progress'] },
      scheduledTime: {
        $gte: new Date(scheduledDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
        $lte: new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
      }
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Time slot not available. Please choose a different time.'
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

    // Create new booking
    const booking = new Booking({
      userId,
      partnerId,
      serviceId,
      scheduledTime: scheduledDate,
      vehicleDetails: vehicleDetails || user.vehicleDetails || {},
      specialInstructions: specialInstructions || '',
      location: location || user.location || {},
      status: 'pending',
      price: partnerService.price
    });

    await booking.save();

    // Populate related data for response
    await booking.populate([
      { path: 'partnerId', select: 'businessName email phone address' },
      { path: 'serviceId', select: 'name description category' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating booking'
    });
  }
});

/**
 * @swagger
 * /bookings/{bookingId}:
 *   get:
 *     summary: Get booking details by ID
 *     tags: [Bookings]
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
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
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
router.get('/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Validate booking ID format
    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    // Build query based on user role
    let query = { _id: bookingId };
    if (userRole === 'user') {
      query.userId = userId;
    } else if (userRole === 'partner') {
      query.partnerId = req.user.partnerId;
    }

    const booking = await Booking.findById(query)
      .populate('userId', 'name email phone')
      .populate('partnerId', 'businessName email phone address')
      .populate('serviceId', 'name description category');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving booking details'
    });
  }
});

/**
 * @swagger
 * /bookings/{bookingId}:
 *   put:
 *     summary: Update booking details
 *     tags: [Bookings]
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
 *             properties:
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-12-15T14:00:00Z"
 *               specialInstructions:
 *                 type: string
 *                 example: "Please check the brakes thoroughly"
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 28.6139
 *                   longitude:
 *                     type: number
 *                     example: 77.2090
 *                   address:
 *                     type: string
 *                     example: "Connaught Place, New Delhi"
 *     responses:
 *       200:
 *         description: Booking updated successfully
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
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:bookingId', authenticateToken, validateBookingUpdate, async (req, res) => {
  try {
    // Verify user role
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role required.'
      });
    }

    const { bookingId } = req.params;
    const { scheduledTime, specialInstructions, location } = req.body;
    const userId = req.user.userId;

    // Validate booking ID format
    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    // Find booking
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Check if booking can be updated
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled booking'
      });
    }

    // Validate scheduled time if provided
    if (scheduledTime) {
      const newScheduledDate = new Date(scheduledTime);
      const now = new Date();
      
      if (newScheduledDate <= now) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled time must be in the future'
        });
      }

      // Check for booking conflicts
      const existingBooking = await Booking.findOne({
        _id: { $ne: bookingId },
        partnerId: booking.partnerId,
        status: { $in: ['pending', 'confirmed', 'in-progress'] },
        scheduledTime: {
          $gte: new Date(newScheduledDate.getTime() - 2 * 60 * 60 * 1000),
          $lte: new Date(newScheduledDate.getTime() + 2 * 60 * 60 * 1000)
        }
      });

      if (existingBooking) {
        return res.status(409).json({
          success: false,
          message: 'Time slot not available. Please choose a different time.'
        });
      }
    }

    // Update booking
    const updateData = {};
    if (scheduledTime) updateData.scheduledTime = new Date(scheduledTime);
    if (specialInstructions !== undefined) updateData.specialInstructions = specialInstructions;
    if (location) updateData.location = location;
    updateData.updatedAt = new Date();

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating booking'
    });
  }
});

/**
 * @swagger
 * /bookings/{bookingId}/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
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
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Change of plans"
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Cannot cancel booking
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
router.post('/:bookingId/cancel', authenticateToken, async (req, res) => {
  try {
    // Verify user role
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role required.'
      });
    }

    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    // Validate booking ID format
    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    // Find booking
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Check if booking can be cancelled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed or already cancelled booking'
      });
    }

    if (booking.status === 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel booking that is in progress'
      });
    }

    // Check cancellation time limit (24 hours before scheduled time)
    const scheduledTime = new Date(booking.scheduledTime);
    const now = new Date();
    const timeDifference = scheduledTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel booking less than 24 hours before scheduled time'
      });
    }

    // Cancel booking
    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by user';
    booking.cancelledAt = new Date();
    booking.updatedAt = new Date();

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        bookingId,
        status: 'cancelled',
        cancellationReason: booking.cancellationReason
      }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while cancelling booking'
    });
  }
});

/**
 * @swagger
 * /bookings/{bookingId}/feedback:
 *   post:
 *     summary: Submit feedback for a completed booking
 *     tags: [Bookings]
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
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Excellent service, very professional"
 *               serviceQuality:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               timeliness:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               communication:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid feedback data
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
router.post('/:bookingId/feedback', authenticateToken, validateFeedback, async (req, res) => {
  try {
    // Verify user role
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role required.'
      });
    }

    const { bookingId } = req.params;
    const { rating, comment, serviceQuality, timeliness, communication } = req.body;
    const userId = req.user.userId;

    // Validate booking ID format
    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    // Find booking
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for completed bookings'
      });
    }

    // Check if feedback already exists
    if (booking.feedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this booking'
      });
    }

    // Validate rating values
    const validateRating = (value, fieldName) => {
      if (value && (value < 1 || value > 5)) {
        throw new Error(`${fieldName} must be between 1 and 5`);
      }
      return value;
    };

    try {
      validateRating(rating, 'Rating');
      validateRating(serviceQuality, 'Service quality');
      validateRating(timeliness, 'Timeliness');
      validateRating(communication, 'Communication');
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    // Add feedback to booking
    booking.feedback = {
      rating,
      comment,
      serviceQuality: serviceQuality || rating,
      timeliness: timeliness || rating,
      communication: communication || rating,
      submittedAt: new Date()
    };

    await booking.save();

    // Update partner rating (calculate average rating)
    const partner = await Partner.findById(booking.partnerId);
    if (partner) {
      const allBookings = await Booking.find({
        partnerId: booking.partnerId,
        'feedback.rating': { $exists: true }
      });

      const totalRating = allBookings.reduce((sum, b) => sum + b.feedback.rating, 0);
      const averageRating = totalRating / allBookings.length;

      partner.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place
      await partner.save();
    }

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        bookingId,
        feedback: booking.feedback
      }
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while submitting feedback'
    });
  }
});

module.exports = router;
