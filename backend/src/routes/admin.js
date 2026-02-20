const express = require('express');
const { protect, adminOnly } = require('../middlewares/auth');
const router = express.Router();

// Admin-only protection
router.use(protect, adminOnly);

// Surveyor management
router.post('/surveyors', (req, res) => res.json({ message: 'Create surveyor' }));
router.get('/surveyors', (req, res) => res.json({ message: 'List surveyors' }));
router.put('/surveyors/:id', (req, res) => res.json({ message: 'Update surveyor' }));
router.put('/surveyors/:id/villages', (req, res) => res.json({ message: 'Assign villages' }));

// Delete

// Dashboard stats
router.get('/dashboard', (req, res) => res.json({ message: 'Admin dashboard' }));

module.exports = router;
