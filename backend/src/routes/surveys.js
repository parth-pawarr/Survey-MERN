const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  getSurveys,
  createSurvey,
  getSurvey,
  updateSurvey,
  submitSurvey,
  deleteSurvey,
  getSurveyorStats,
  getSurveyHistory,
  checkMobileNumber,
} = require('../controllers/surveyController');
const router = express.Router({ mergeParams: true });

// ALL routes protected - surveyor must be logged in
router.use(protect);

// Mobile number duplicate check (must be before /:id routes)
router.get('/check-mobile', checkMobileNumber);

router.get('/', getSurveys);
router.post('/', createSurvey);
router.get('/:id', getSurvey);
router.put('/:id', updateSurvey);
router.patch('/:id/submit', submitSurvey);
router.delete('/:id', deleteSurvey);

// Survey statistics and history
router.get('/stats/my', getSurveyorStats);
router.get('/:id/history', getSurveyHistory);

module.exports = router;
