const express = require('express');
const { protect, adminOnly } = require('../middlewares/auth');
const {
  getSurveyors,
  createSurveyor,
  updateSurveyor,
  updateSurveyorVillages,
  toggleSurveyorStatus,
  getSurveyor,
  resetSurveyorPassword,
  // Village management
  getVillages,
  createVillage,
  updateVillage,
  assignVillageSurveyors,
  getVillage,
  deleteVillage,
  // Survey verification
  getSubmittedSurveys,
  getSurveyForReview,
  approveSurvey,
  rejectSurvey,
  getVerificationStats,
  // Dashboard analytics
  getDashboardStats,
  getSurveyAnalytics,
  getSurveyorPerformance,
  // Data export
  exportSurveyData,
  exportSurveyorPerformance,
  exportVillageStats
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// Surveyor Management Routes
router.get('/surveyors', getSurveyors); // List with pagination & filters
router.post('/surveyors', createSurveyor); // Create new surveyor
router.get('/surveyors/:id', getSurveyor); // Get single surveyor with details
router.put('/surveyors/:id', updateSurveyor); // Update surveyor details
router.put('/surveyors/:id/villages', updateSurveyorVillages); // Assign/remove villages
router.patch('/surveyors/:id/status', toggleSurveyorStatus); // Activate/deactivate
router.patch('/surveyors/:id/reset-password', resetSurveyorPassword); // Reset password

// Village Management Routes
router.get('/villages', getVillages); // List with progress & pagination
router.post('/villages', createVillage); // Create new village
router.get('/villages/:id', getVillage); // Get single village with details
router.put('/villages/:id', updateVillage); // Update village details
router.put('/villages/:id/surveyors', assignVillageSurveyors); // Assign surveyors
router.delete('/villages/:id', deleteVillage); // Delete village

// Survey Verification Routes
router.get('/surveys/submitted', getSubmittedSurveys); // List submitted surveys for review
router.get('/surveys/:id/review', getSurveyForReview); // Get single survey for detailed review
router.patch('/surveys/:id/approve', approveSurvey); // Approve submitted survey
router.patch('/surveys/:id/reject', rejectSurvey); // Reject submitted survey
router.get('/verification-stats', getVerificationStats); // Get verification statistics

// Dashboard Analytics Routes
router.get('/dashboard/stats', getDashboardStats); // Get dashboard overview
router.get('/analytics/surveys', getSurveyAnalytics); // Get detailed survey analytics
router.get('/analytics/surveyors', getSurveyorPerformance); // Get surveyor performance metrics

// Data Export Routes
router.get('/export/surveys', exportSurveyData); // Export survey data (JSON/CSV)
router.get('/export/surveyor-performance', exportSurveyorPerformance); // Export surveyor performance
router.get('/export/village-stats', exportVillageStats); // Export village statistics

// Placeholder routes for future implementation
router.get('/reports/:reportType', (req, res) => res.json({ message: 'Reports - Coming soon' }));

module.exports = router;
