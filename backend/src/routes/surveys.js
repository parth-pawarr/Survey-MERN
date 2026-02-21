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
  getSurveyHistory
} = require('../controllers/surveyController');
const router = express.Router({ mergeParams: true });

// ALL routes protected - surveyor must be logged in
router.use(protect);

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
