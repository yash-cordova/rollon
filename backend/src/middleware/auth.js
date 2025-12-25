const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT token
 * Checks both Authorization header and cookies (partnerToken)
 */
const authenticateToken = (req, res, next) => {
  // Try to get token from Authorization header first
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // If no token in header, try to get from cookie
  if (!token) {
    token = req.cookies?.partnerToken || req.cookies?.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required. Please login again.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again.'
    });
  }
};

/**
 * Middleware to authenticate admin users
 */
const authenticateAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

/**
 * Middleware to authenticate super admin users
 */
const authenticateSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }

  next();
};

/**
 * Middleware to authenticate partner users
 */
const authenticatePartner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'partner') {
    return res.status(403).json({
      success: false,
      message: 'Partner access required'
    });
  }

  next();
};

/**
 * Middleware to authenticate regular users
 */
const authenticateUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'User access required'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  authenticateAdmin,
  authenticateSuperAdmin,
  authenticatePartner,
  authenticateUser
};
