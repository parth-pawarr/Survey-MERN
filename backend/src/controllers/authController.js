const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create surveyor (role: 'surveyor')
    const surveyor = new User({
      username,
      password: hashedPassword,
      // password,
      role: 'surveyor',
      assignedVillages,
      createdBy: req.user?.userId // From JWT middleware (admin only)
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

// Surveyor login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user || user.role !== 'surveyor' || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = generateToken(user._id);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        assignedVillages: user.assignedVillages
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
