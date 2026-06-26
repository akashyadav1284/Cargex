const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const Agency = require('../models/Agency');

const extractToken = (req, role = 'user') => {
  const prefix = role.includes('admin') ? 'admin' : role === 'driver' ? 'driver' : role === 'agency' ? 'agency' : 'user';
  // Primary: HTTP-Only Cookie
  if (req.cookies && req.cookies[`accessToken_${prefix}`]) {
    return req.cookies[`accessToken_${prefix}`];
  }
  // Fallback: Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

const protectUser = async (req, res, next) => {
  const token = extractToken(req, 'user');
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'user') return res.status(403).json({ message: 'Forbidden: Requires user role' });
    
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'Not authorized, user not found' });
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const protectDriver = async (req, res, next) => {
  const token = extractToken(req, 'driver');
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'driver') return res.status(403).json({ message: 'Forbidden: Requires driver role' });

    req.driver = await Driver.findById(decoded.id).select('-password');
    if (!req.driver) return res.status(401).json({ message: 'Not authorized, driver not found' });
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const protectAdmin = async (req, res, next) => {
  const token = extractToken(req, 'admin');
  if (!token) return res.status(401).json({ message: 'Not authorized, no admin token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden: Requires admin role' });
    }

    req.admin = await Admin.findById(decoded.id).select('-password');
    if (!req.admin) return res.status(401).json({ message: 'Not authorized, admin not found' });
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const protectAgency = async (req, res, next) => {
  const token = extractToken(req, 'agency');
  if (!token) return res.status(401).json({ message: 'Not authorized, no agency token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'agency') {
      return res.status(403).json({ message: 'Forbidden: Requires agency role' });
    }

    req.user = await Agency.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'Not authorized, agency not found' });
    
    // Attach to req.agency for clarity in specific routes, and req.user for generic routes
    req.agency = req.user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Generic role-based generic middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    // Determine the active role
    let currentRole;
    if (req.user) currentRole = req.user.role || 'user';
    else if (req.driver) currentRole = 'driver';
    else if (req.admin) currentRole = req.admin.role || 'admin';
    else if (req.agency) currentRole = 'agency';

    if (!roles.includes(currentRole)) {
      return res.status(403).json({ message: `Forbidden: Requires one of [${roles.join(', ')}]` });
    }
    next();
  };
};

module.exports = { protectUser, protectDriver, protectAdmin, protectAgency, requireRole };
