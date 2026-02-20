const express = require('express');
const { registerSurveyor, login, otpLogin, verifyOTP } = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerSurveyor); // completed
router.post('/login', login);   // completed
router.post('/otp-login', otpLogin);
router.post('/verify-otp', verifyOTP);

module.exports = router;