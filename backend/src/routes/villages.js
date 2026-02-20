const express = require('express');
const router = express.Router();

router.get('/mine', (req, res) => res.json({ message: 'My assigned villages' }));
router.get('/', (req, res) => res.json({ message: 'All villages' }));

module.exports = router;
