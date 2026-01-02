const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegistration, validateLogin } = require('../middleware/validation');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new customer
 *     description: Anyone can register as a customer. Email is optional, but phone number is required.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *               - gender
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *                 description: Email address (required)
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *                 description: 10-digit Indian mobile number (can also be +919876543210)
 *               phoneNumber:
 *                 type: string
 *                 example: "9876543210"
 *                 description: Alternative field for 10-digit Indian mobile number
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: "male"
 *                 description: Gender (required)
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-15"
 *                 description: Date of birth (optional)
 *               profilePicture:
 *                 type: string
 *                 example: "https://example.com/profile.jpg"
 *                 description: Profile picture URL (optional)
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
 *                 description: Address details (optional)
 *               language:
 *                 type: string
 *                 enum: [en, hi, gu]
 *                 example: "en"
 *                 description: Preferred language (optional)
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
 *                 description: Vehicle details (optional)
 *     responses:
 *       201:
 *         description: Customer registered successfully
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
 *                   example: "Customer registered successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      phoneNumber, 
      password, 
      gender,
      dateOfBirth,
      profilePicture,
      address,
      language,
      vehicleDetails 
    } = req.body;

    // Normalize phone number (accept both phone and phoneNumber)
    let normalizedPhone = phoneNumber || phone;
    
    // If phone has country code, extract 10-digit number
    if (normalizedPhone && normalizedPhone.startsWith('+')) {
      // Remove + and country code (91 for India)
      normalizedPhone = normalizedPhone.replace(/^\+91/, '').replace(/\D/g, '');
    } else if (normalizedPhone) {
      // Remove all non-digit characters
      normalizedPhone = normalizedPhone.replace(/\D/g, '');
    }

    // Validate phone number format (10 digits starting with 6-9)
    if (!normalizedPhone || !normalizedPhone.match(/^[6-9]\d{9}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number'
      });
    }

    // Check if user already exists by email or phone
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { phoneNumber: normalizedPhone }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }
      if (existingUser.phoneNumber === normalizedPhone) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already registered'
        });
      }
    }

    // Create new user - password will be hashed by pre-save hook
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: normalizedPhone,
      password: password.trim(), // Will be hashed by pre-save hook
      gender: gender, // Mandatory field
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      ...(profilePicture && { profilePicture }),
      ...(address && { address }),
      ...(language && { language })
    };

    // Add vehicle details if provided
    if (vehicleDetails) {
      if (vehicleDetails.make || vehicleDetails.model || vehicleDetails.year || vehicleDetails.registrationNumber) {
        userData.vehicles = [{
          type: vehicleDetails.type || 'car',
          brand: vehicleDetails.make || vehicleDetails.brand,
          model: vehicleDetails.model,
          year: vehicleDetails.year,
          registrationNumber: vehicleDetails.registrationNumber,
          color: vehicleDetails.color,
          fuelType: vehicleDetails.fuelType || 'petrol'
        }];
      }
    }

    const user = new User(userData);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    
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
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login customer with email or phone
 *     description: Login using either email or phone number along with password
 *     tags: [Authentication]
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
 *                   - phoneNumber
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *                 description: Email address (required if phone not provided)
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *                 description: 10-digit Indian mobile number (can also be +919876543210) - required if email not provided
 *               phoneNumber:
 *                 type: string
 *                 example: "9876543210"
 *                 description: Alternative field for 10-digit Indian mobile number
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
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
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, phone, phoneNumber, password } = req.body;

    // Normalize phone number if provided
    let normalizedPhone = phoneNumber || phone;
    if (normalizedPhone) {
      // Remove country code and non-digits
      if (normalizedPhone.startsWith('+')) {
        normalizedPhone = normalizedPhone.replace(/^\+91/, '').replace(/\D/g, '');
      } else {
        normalizedPhone = normalizedPhone.replace(/\D/g, '');
      }
    }

    // Build query to find user by email or phone
    const query = {};
    if (email) {
      query.email = email.toLowerCase().trim();
    } else if (normalizedPhone) {
      query.phoneNumber = normalizedPhone;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either email or phone number is required'
      });
    }

    // Find user
    const user = await User.findOne(query).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password.trim(), user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email || user.phoneNumber, 
        role: 'user' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login and last active
    user.lastLogin = new Date();
    user.lastActive = new Date();
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP for verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid phone number
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in user document or cache (for demo, we'll just return success)
    // In production, integrate with SMS service like Twilio, AWS SNS, etc.
    
    // TODO: Integrate with SMS service
    // await sendSMS(phone, `Your Rollon verification code is: ${otp}`);
    
    // TODO: Store OTP in database/cache with expiration
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only show OTP in development
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while sending OTP'
    });
  }
});

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validate inputs
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    // TODO: Verify OTP from database/cache
    // const isValidOTP = await verifyOTP(phone, otp);
    
    // For demo purposes, accept any 6-digit OTP
    const isValidOTP = /^\d{6}$/.test(otp);
    
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark phone as verified
    const user = await User.findOne({ phone });
    if (user) {
      user.phoneVerified = true;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while verifying OTP'
    });
  }
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token in user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // TODO: Send email with reset link
    // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await sendEmail(email, 'Password Reset', `Click here to reset your password: ${resetLink}`);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
      data: {
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing password reset'
    });
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: "reset-token-here"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if token matches and is not expired
    if (user.resetPasswordToken !== token || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while resetting password'
    });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You can implement token blacklisting here if needed
    
    // TODO: Add token to blacklist if implementing token invalidation
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
});

module.exports = router;
