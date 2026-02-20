const express = require('express');
const { protect } = require('../middlewares/auth');
const { getSurveys, createSurvey, getSurvey, updateSurvey, submitSurvey } = require('../controllers/surveyController');
const router = express.Router({ mergeParams: true });

// ALL routes protected - surveyor must be logged in
router.use(protect);

router.get('/', getSurveys);
router.post('/', createSurvey);
router.get('/:id', getSurvey);
router.put('/:id', updateSurvey);
router.patch('/:id/submit', submitSurvey);

// Delete

module.exports = router;
