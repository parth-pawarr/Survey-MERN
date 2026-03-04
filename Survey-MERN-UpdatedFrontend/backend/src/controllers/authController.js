const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateAdminToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Admin creates surveyor account
exports.registerSurveyor = async (req, res) => {
  try {
    const { username, password, assignedVillages = [] } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create surveyor (role: 'surveyor')
    // Password will be hashed by the pre-save hook in the User model
    const surveyor = new User({
      username,
      password,
      role: 'surveyor',
      assignedVillages,
      createdBy: req.user._id // From JWT middleware (admin only)
    });
    
    await surveyor.save();
    
    res.status(201).json({ 
      message: 'Surveyor created successfully',
      surveyorId: surveyor._id 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Universal login for both admin and surveyor
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT (different expiry for admin vs surveyor)
    const token = user.role === 'admin' ? generateAdminToken(user._id) : generateToken(user._id);
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Response based on user role
    const responseData = {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    };
    
    // Add assigned villages only for surveyors
    if (user.role === 'surveyor') {
      responseData.user.assignedVillages = user.assignedVillages;
    }
    
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin login (separate endpoint for clarity)
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find admin user
    const user = await User.findOne({ username, role: 'admin' });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    // Generate admin JWT (30 days expiry)
    const token = generateAdminToken(user._id);
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// OTP Login (placeholder - implement SMS service later)
exports.otpLogin = async (req, res) => {
  const { mobileNumber } = req.body;
  // TODO: Send OTP via WhatsApp/SMS, store in Redis/cache
  res.json({ message: 'OTP sent to WhatsApp', otpId: 'temp-otp-id' });
};

exports.verifyOTP = async (req, res) => {
  const { otpId, otp } = req.body;
  // TODO: Verify OTP, generate token
  const token = generateToken('user-id-from-otp');
  res.json({ token, message: 'OTP verified' });
};

// Create initial admin (for setup)
exports.createInitialAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }
    
    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create admin user
    const admin = new User({
      username,
      password,
      role: 'admin',
      assignedVillages: [], // Admins don't need village assignments
      isActive: true
    });
    
    await admin.save();
    
    res.status(201).json({ 
      message: 'Initial admin created successfully',
      adminId: admin._id 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        assignedVillages: user.assignedVillages,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
