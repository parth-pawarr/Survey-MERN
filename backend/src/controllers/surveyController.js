const HouseholdSurvey = require('../models/HouseholdSurvey');
const User = require('../models/User');

exports.getSurveys = async (req, res) => {
  try {
    const { village, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { surveyorId: req.user._id }; // Current surveyor only

    if (village) {
      const surveyor = await User.findById(req.user._id);
      if (!surveyor.assignedVillages.includes(village)) {
        return res.status(403).json({ message: 'Village not assigned to you' });
      }
      filter.village = village;
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { representativeName: searchRegex },
        { mobileNumber: searchRegex }
      ];

      // If search is a valid MongoDB ID, include it in the $or search
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        filter.$or.push({ _id: search });
      }
    }

    const surveys = await HouseholdSurvey.find(filter)
      .sort({ surveyDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await HouseholdSurvey.countDocuments(filter);

    res.json({
      surveys,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
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
      { _id: req.params.id, surveyorId: req.user._id, status: { $ne: 'Verified' } },
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

// Delete draft survey
exports.deleteSurvey = async (req, res) => {
  try {
    const survey = await HouseholdSurvey.findOneAndDelete({
      _id: req.params.id,
      surveyorId: req.user._id,
      status: 'Draft'
    });

    if (!survey) {
      return res.status(404).json({
        message: 'Draft survey not found or cannot be deleted'
      });
    }

    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get surveyor's statistics
exports.getSurveyorStats = async (req, res) => {
  try {
    const surveyorId = req.user._id;

    // Get overall statistics
    const [
      totalSurveys,
      draftSurveys,
      submittedSurveys,
      verifiedSurveys,
      rejectedSurveys
    ] = await Promise.all([
      HouseholdSurvey.countDocuments({ surveyorId }),
      HouseholdSurvey.countDocuments({ surveyorId, status: 'Draft' }),
      HouseholdSurvey.countDocuments({ surveyorId, status: 'Submitted' }),
      HouseholdSurvey.countDocuments({ surveyorId, status: 'Verified' }),
      HouseholdSurvey.countDocuments({ surveyorId, status: 'Rejected' })
    ]);

    // Get village-wise statistics
    const villageStats = await HouseholdSurvey.aggregate([
      { $match: { surveyorId } },
      {
        $group: {
          _id: '$village',
          total: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'Verified'] }, 1, 0] }
          },
          submitted: {
            $sum: { $cond: [{ $eq: ['$status', 'Submitted'] }, 1, 0] }
          },
          draft: {
            $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await HouseholdSurvey.aggregate([
      { $match: { surveyorId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          created: { $sum: 1 },
          submitted: {
            $sum: { $cond: [{ $eq: ['$status', 'Submitted'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Calculate rates
    const verificationRate = totalSurveys > 0
      ? Math.round((verifiedSurveys / totalSurveys) * 100)
      : 0;

    const rejectionRate = totalSurveys > 0
      ? Math.round((rejectedSurveys / totalSurveys) * 100)
      : 0;

    res.json({
      overview: {
        totalSurveys,
        draftSurveys,
        submittedSurveys,
        verifiedSurveys,
        rejectedSurveys,
        verificationRate,
        rejectionRate
      },
      villageStats,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get survey modification history
exports.getSurveyHistory = async (req, res) => {
  try {
    const survey = await HouseholdSurvey.findOne({
      _id: req.params.id,
      surveyorId: req.user._id
    }).select('createdAt updatedAt status village representativeName');

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    // Get all surveys by this surveyor for timeline context
    const surveyTimeline = await HouseholdSurvey.find({
      surveyorId: req.user._id,
      village: survey.village
    })
      .select('id createdAt updatedAt status representativeName')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      currentSurvey: survey,
      timeline: surveyTimeline
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if a mobile number already exists in any survey
exports.checkMobileNumber = async (req, res) => {
  try {
    const { mobile, excludeSurveyId } = req.query;

    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    const query = { mobileNumber: mobile.trim() };

    // When editing a survey, exclude the current survey so it doesn't
    // flag itself as a duplicate
    if (excludeSurveyId) {
      query._id = { $ne: excludeSurveyId };
    }

    const existing = await HouseholdSurvey.findOne(query)
      .select('_id representativeName village');

    if (existing) {
      return res.json({
        exists: true,
        message: 'Mobile number already used.',
        survey: {
          id: existing._id,
          representativeName: existing.representativeName,
          village: existing.village,
        },
      });
    }

    return res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
