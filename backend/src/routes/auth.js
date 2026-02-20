const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => res.json({ message: 'Login route' }));
router.post('/register', (req, res) => res.json({ message: 'Register surveyor' }));
router.post('/otp-login', (req, res) => res.json({ message: 'OTP login' }));

module.exports = router;
