const express = require('express');
const { protect, surveyorOnly } = require('../middlewares/auth');
const Village = require('../models/Village');
const HouseholdSurvey = require('../models/HouseholdSurvey');
const User = require('../models/User');

const router = express.Router();

// All village routes require authentication
router.use(protect);

// Get surveyor's assigned villages
router.get('/mine', async (req, res) => {
  try {
    const surveyor = await User.findById(req.user._id).populate('assignedVillages');
    
    if (!surveyor) {
      return res.status(404).json({ message: 'Surveyor not found' });
    }
    
    // Get survey statistics for each assigned village
    const villagesWithStats = await Promise.all(
      surveyor.assignedVillages.map(async (village) => {
        const [totalSurveys, verifiedSurveys, submittedSurveys] = await Promise.all([
          HouseholdSurvey.countDocuments({ 
            village: village.name, 
            surveyorId: req.user._id 
          }),
          HouseholdSurvey.countDocuments({ 
            village: village.name, 
            surveyorId: req.user._id,
            status: 'Verified' 
          }),
          HouseholdSurvey.countDocuments({ 
            village: village.name, 
            surveyorId: req.user._id,
            status: 'Submitted' 
          })
        ]);
        
        return {
          ...village.toObject(),
          surveyStats: {
            totalSurveys,
            verifiedSurveys,
            submittedSurveys,
            draftSurveys: totalSurveys - verifiedSurveys - submittedSurveys
          }
        };
      })
    );
    
    res.json(villagesWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all villages (for reference)
router.get('/', async (req, res) => {
  try {
    const villages = await Village.find()
      .select('name totalHouseholds surveyedHouseholds assignedSurveyors')
      .sort({ name: 1 });
    
    res.json(villages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
