const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { generateTokens, setAuthCookies, clearAuthCookies } = require('../utils/jwt');

// @desc    Register a new user
const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const userExists = await User.findOne({ phone });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    
    const user = await User.create({ fullName: name, email, password, phone });
    const { accessToken, refreshToken } = generateTokens(user._id, user.role || 'user');
    setAuthCookies(res, accessToken, refreshToken, 'user');
    
    res.status(201).json({
      _id: user._id, name: user.fullName, email: user.email, role: user.role || 'user', token: accessToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed, please try again later.' });
  }
};

// @desc    Login user
const loginUser = async (req, res) => {
  const { email, phone, password } = req.body;
  try {
    const user = await User.findOne(email ? { email } : { phone });
    if (user && (await user.matchPassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id, user.role || 'user');
      setAuthCookies(res, accessToken, refreshToken, 'user');
      
      res.json({ _id: user._id, name: user.fullName, email: user.email, role: user.role || 'user', token: accessToken });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Authentication failed, please try again.' });
  }
};

// @desc    Register driver (Public application form)
const registerDriver = async (req, res) => {
  const { fullName, name, email, password, phone, vehicleType } = req.body;
  try {
    const driverExists = await Driver.findOne({ phone });
    if (driverExists) return res.status(400).json({ message: 'A driver with this phone number already exists.' });
    
    // Support both name and fullName fields based on frontend payload
    const actualName = fullName || name;
    
    const driver = await Driver.create({ 
      fullName: actualName, 
      email, 
      password, 
      phone, 
      vehicleDetails: { type: vehicleType },
      status: 'pending',
      isActive: false
    });
    
    // We intentionally DO NOT generate tokens here. Account must be approved first.
    res.status(201).json({
      message: 'Your request has been submitted successfully. Our team will contact you within 24 hours.'
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Driver registration failed, please try again.' });
  }
};

// @desc    Login driver
const loginDriver = async (req, res) => {
  const { email, phone, password } = req.body;
  try {
    const driver = await Driver.findOne(email ? { email } : { phone });
    if (driver && (await driver.matchPassword(password))) {
      
      // SECURITY: Block login if not actively approved by Admin
      if (driver.status !== 'approved' && !driver.isApproved) {
        return res.status(403).json({ message: 'Your application is pending review. You cannot login yet.' });
      }

      const { accessToken, refreshToken } = generateTokens(driver._id, 'driver');
      setAuthCookies(res, accessToken, refreshToken, 'driver');
      
      res.json({ _id: driver._id, name: driver.fullName, email: driver.email, isApproved: driver.isApproved, role: 'driver', token: accessToken });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Authentication failed, please try again.' });
  }
};

// @desc    Login admin
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (admin && (await admin.matchPassword(password))) {
      const { accessToken, refreshToken } = generateTokens(admin._id, admin.role || 'admin');
      setAuthCookies(res, accessToken, refreshToken, 'admin');
      
      res.json({ _id: admin._id, name: admin.name, email: admin.email, role: admin.role || 'admin' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Authentication failed, please try again.' });
  }
};

// @desc    Refresh access token using long-lived refresh token cookie
const refreshContext = async (req, res) => {
  const token = req.cookies.refreshToken_admin || req.cookies.refreshToken_driver || req.cookies.refreshToken_user;
  if (!token) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
    const { id, role } = decoded;
    
    // Create new access token
    const newAccessToken = jwt.sign(
      { id, role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );
    
    // Only set the new access token, keep current refresh token
    const isProd = process.env.NODE_ENV === 'production';
    const prefix = role.includes('admin') ? 'admin' : role === 'driver' ? 'driver' : 'user';
    res.cookie(`accessToken_${prefix}`, newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// @desc    Logout user/driver/admin and clear cookies
const logout = (req, res) => {
  clearAuthCookies(res, 'admin');
  clearAuthCookies(res, 'driver');
  clearAuthCookies(res, 'user');
  res.json({ message: 'Logged out successfully' });
};

// @desc    Sync Clerk user to MongoDB and issue backend JWT session
const clerkSyncUser = async (req, res) => {
  const { clerkId, email, fullName, imageUrl } = req.body;
  if (!clerkId) return res.status(400).json({ message: 'clerkId is required' });

  try {
    // Find by clerkId first, then by email as fallback
    let user = await User.findOne({ clerkId });

    if (!user && email) {
      // Check if an old email-based user exists — link to this Clerk account
      user = await User.findOne({ email });
      if (user) {
        user.clerkId = clerkId;
        if (imageUrl) user.profileImage = imageUrl;
        await user.save();
      }
    }

    if (!user) {
      // Brand new Clerk user — create in MongoDB
      user = await User.create({
        fullName: fullName || email?.split('@')[0] || 'Cargex User',
        email: email || undefined,
        clerkId,
        profileImage: imageUrl || '',
        isVerified: true,
      });
    }

    // Issue backend JWT cookie so all existing API endpoints work
    const { accessToken, refreshToken } = generateTokens(user._id, 'user');
    setAuthCookies(res, accessToken, refreshToken, 'user');

    res.json({
      _id: user._id,
      name: user.fullName,
      email: user.email,
      role: 'user',
      clerkId: user.clerkId,
      token: accessToken
    });
  } catch (error) {
    console.error('Clerk Sync Error:', error);
    res.status(500).json({ message: 'Failed to sync user' });
  }
};

module.exports = { 
  registerUser, loginUser, 
  registerDriver, loginDriver, 
  loginAdmin, 
  refreshContext, logout,
  clerkSyncUser
};
