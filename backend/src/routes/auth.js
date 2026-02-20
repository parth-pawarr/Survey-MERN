const express = require('express');
const { registerSurveyor, login, otpLogin, verifyOTP } = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerSurveyor);
router.post('/login', login);
router.post('/otp-login', otpLogin);
router.post('/verify-otp', verifyOTP);

module.exports = router;