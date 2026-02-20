const HouseholdSurvey = require('../models/HouseholdSurvey');
const User = require('../models/User');

exports.getSurveys = async (req, res) => {
  try {
    const { village } = req.query;
    const filter = { surveyorId: req.user._id }; // Current surveyor only
    
    if (village) {
      const surveyor = await User.findById(req.user._id);
      if (!surveyor.assignedVillages.includes(village)) {
        return res.status(403).json({ message: 'Village not assigned to you' });
      }
      filter.village = village;
    }
    
    const surveys = await HouseholdSurvey.find(filter)
      .sort({ surveyDate: -1 })
      .limit(50);
    
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSurvey = async (req, res) => {
  try {
    const surveyData = { ...req.body, surveyorId: req.user._id, status: 'Draft' };
    const survey = new HouseholdSurvey(surveyData);
    await survey.save();
    
    res.status(201).json({ 
      message: 'Survey created', 
      surveyId: survey._id 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSurvey = async (req, res) => {
  try {
    const survey = await HouseholdSurvey.findOne({
      _id: req.params.id,
      surveyorId: req.user._id
    });
    
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    res.json(survey);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSurvey = async (req, res) => {
  try {
    const survey = await HouseholdSurvey.findOneAndUpdate(
      { _id: req.params.id, surveyorId: req.user._id, status: 'Draft' },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!survey) {
      return res.status(404).json({ message: 'Draft survey not found' });
    }
    
    res.json(survey);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.submitSurvey = async (req, res) => {
  try {
    const survey = await HouseholdSurvey.findOneAndUpdate(
      { _id: req.params.id, surveyorId: req.user._id },
      { status: 'Submitted' },
      { new: true }
    );
    
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    res.json({ message: 'Survey submitted successfully', survey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
