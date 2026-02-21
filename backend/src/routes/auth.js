const express = require('express');
const { protect, adminOnly } = require('../middlewares/auth');
const { 
  registerSurveyor, 
  login, 
  adminLogin, 
  otpLogin, 
  verifyOTP, 
  createInitialAdmin,
  getProfile 
} = require('../controllers/authController');
const router = express.Router();

// Public routes
router.post('/login', login); // Universal login for both admin and surveyor
router.post('/admin-login', adminLogin); // Dedicated admin login
router.post('/setup-admin', createInitialAdmin); // One-time admin setup
router.post('/otp-login', otpLogin);
router.post('/verify-otp', verifyOTP);

// Protected routes
router.get('/profile', protect, getProfile);

// Admin-only routes
router.post('/register', protect, adminOnly, registerSurveyor); // Admin creates surveyor

module.exports = router;