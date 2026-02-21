const User = require('../models/User');
const HouseholdSurvey = require('../models/HouseholdSurvey');
const Village = require('../models/Village');

// Get all surveyors with pagination and performance metrics
exports.getSurveyors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = { role: 'surveyor' };
    if (req.query.status === 'active') {
      filter.isActive = true;
    } else if (req.query.status === 'inactive') {
      filter.isActive = false;
    }
    
    if (req.query.village) {
      filter.assignedVillages = { $in: [req.query.village] };
    }
    
    // Get surveyors with pagination
    const surveyors = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username');
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    // Get performance metrics for each surveyor
    const surveyorsWithMetrics = await Promise.all(
      surveyors.map(async (surveyor) => {
        const surveyStats = await HouseholdSurvey.aggregate([
          { $match: { surveyorId: surveyor._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);
        
        const stats = {
          total: 0,
          draft: 0,
          submitted: 0,
          verified: 0
        };
        
        surveyStats.forEach(stat => {
          stats[stat._id] = stat.count;
          stats.total += stat.count;
        });
        
        return {
          ...surveyor.toObject(),
          performance: stats,
          lastLogin: surveyor.lastLogin
        };
      })
    );
    
    res.json({
      surveyors: surveyorsWithMetrics,
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

// Create new surveyor
exports.createSurveyor = async (req, res) => {
  try {
    const { 
      username, 
      password, 
      assignedVillages = [],
      email,
      phone 
    } = req.body;
    
    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Validate assigned villages exist
    if (assignedVillages.length > 0) {
      const villageCount = await Village.countDocuments({ 
        name: { $in: assignedVillages } 
      });
      if (villageCount !== assignedVillages.length) {
        return res.status(400).json({ 
          message: 'One or more assigned villages do not exist' 
        });
      }
    }
    
    // Create surveyor
    const surveyor = new User({
      username,
      password,
      role: 'surveyor',
      assignedVillages,
      email,
      phone,
      createdBy: req.user._id
    });
    
    await surveyor.save();
    
    // Update villages with assigned surveyor
    if (assignedVillages.length > 0) {
      await Village.updateMany(
        { name: { $in: assignedVillages } },
        { $addToSet: { assignedSurveyors: surveyor._id } }
      );
    }
    
    res.status(201).json({
      message: 'Surveyor created successfully',
      surveyor: {
        id: surveyor._id,
        username: surveyor.username,
        assignedVillages: surveyor.assignedVillages,
        isActive: surveyor.isActive,
        createdAt: surveyor.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update surveyor details
exports.updateSurveyor = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, isActive } = req.body;
    
    const surveyor = await User.findOne({ _id: id, role: 'surveyor' });
    if (!surveyor) {
      return res.status(404).json({ message: 'Surveyor not found' });
    }
    
    // Update fields
    if (email !== undefined) surveyor.email = email;
    if (phone !== undefined) surveyor.phone = phone;
    if (isActive !== undefined) surveyor.isActive = isActive;
    
    await surveyor.save();
    
    res.json({
      message: 'Surveyor updated successfully',
      surveyor: {
        id: surveyor._id,
        username: surveyor.username,
        email: surveyor.email,
        phone: surveyor.phone,
        assignedVillages: surveyor.assignedVillages,
        isActive: surveyor.isActive,
        updatedAt: surveyor.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign or remove villages from surveyor
exports.updateSurveyorVillages = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedVillages } = req.body;
    
    const surveyor = await User.findOne({ _id: id, role: 'surveyor' });
    if (!surveyor) {
      return res.status(404).json({ message: 'Surveyor not found' });
    }
    
    // Validate all villages exist
    if (assignedVillages.length > 0) {
      const villageCount = await Village.countDocuments({ 
        name: { $in: assignedVillages } 
      });
      if (villageCount !== assignedVillages.length) {
        return res.status(400).json({ 
          message: 'One or more villages do not exist' 
        });
      }
    }
    
    const oldVillages = surveyor.assignedVillages;
    
    // Update surveyor villages
    surveyor.assignedVillages = assignedVillages;
    await surveyor.save();
    
    // Remove surveyor from old villages
    await Village.updateMany(
      { name: { $in: oldVillages } },
      { $pull: { assignedSurveyors: surveyor._id } }
    );
    
    // Add surveyor to new villages
    if (assignedVillages.length > 0) {
      await Village.updateMany(
        { name: { $in: assignedVillages } },
        { $addToSet: { assignedSurveyors: surveyor._id } }
      );
    }
    
    res.json({
      message: 'Villages assigned successfully',
      assignedVillages: surveyor.assignedVillages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivate/Activate surveyor (soft delete)
exports.toggleSurveyorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const surveyor = await User.findOne({ _id: id, role: 'surveyor' });
    if (!surveyor) {
      return res.status(404).json({ message: 'Surveyor not found' });
    }
    
    surveyor.isActive = isActive;
    await surveyor.save();
    
    const action = isActive ? 'activated' : 'deactivated';
    res.json({
      message: `Surveyor ${action} successfully`,
      surveyor: {
        id: surveyor._id,
        username: surveyor.username,
        isActive: surveyor.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single surveyor with detailed performance
exports.getSurveyor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const surveyor = await User.findOne({ _id: id, role: 'surveyor' })
      .select('-password')
      .populate('createdBy', 'username');
    
    if (!surveyor) {
      return res.status(404).json({ message: 'Surveyor not found' });
    }
    
    // Get detailed performance metrics
    const surveyStats = await HouseholdSurvey.aggregate([
      { $match: { surveyorId: surveyor._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
        }
      }
    ]);
    
    const stats = {
      total: 0,
      draft: 0,
      submitted: 0,
      verified: 0,
      avgTimeMinutes: 0
    };
    
    surveyStats.forEach(stat => {
      stats[stat._id] = stat.count;
      stats.total += stat.count;
      if (stat.avgTime) {
        stats.avgTimeMinutes = Math.round(stat.avgTime / (1000 * 60));
      }
    });
    
    // Get recent surveys
    const recentSurveys = await HouseholdSurvey.find({ surveyorId: surveyor._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('representativeName village status createdAt');
    
    res.json({
      surveyor: {
        ...surveyor.toObject(),
        performance: stats,
        recentSurveys
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset surveyor password
exports.resetSurveyorPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    const surveyor = await User.findOne({ _id: id, role: 'surveyor' });
    if (!surveyor) {
      return res.status(404).json({ message: 'Surveyor not found' });
    }
    
    surveyor.password = newPassword; // Will be hashed by pre-save hook
    await surveyor.save();
    
    res.json({
      message: 'Password reset successfully',
      surveyor: {
        id: surveyor._id,
        username: surveyor.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== VILLAGE MANAGEMENT ====================

// Get all villages with survey progress
exports.getVillages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    
    // Get villages with pagination
    const villages = await Village.find(filter)
      .populate('assignedSurveyors', 'username email isActive')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Village.countDocuments(filter);
    
    // Get survey progress for each village
    const villagesWithProgress = await Promise.all(
      villages.map(async (village) => {
        const surveyStats = await HouseholdSurvey.aggregate([
          { $match: { village: village.name } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);
        
        const stats = {
          total: 0,
          draft: 0,
          submitted: 0,
          verified: 0
        };
        
        surveyStats.forEach(stat => {
          stats[stat._id] = stat.count;
          stats.total += stat.count;
        });
        
        // Calculate completion percentage
        const completionRate = village.totalHouseholds > 0 
          ? Math.round((stats.verified / village.totalHouseholds) * 100)
          : 0;
        
        return {
          ...village.toObject(),
          surveyProgress: stats,
          completionRate,
          activeSurveyors: village.assignedSurveyors?.filter(s => s.isActive).length || 0
        };
      })
    );
    
    res.json({
      villages: villagesWithProgress,
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

// Create new village
exports.createVillage = async (req, res) => {
  try {
    const { 
      name, 
      totalHouseholds = 0,
      population = 0,
      assignedSurveyors = []
    } = req.body;
    
    // Check if village exists
    const existingVillage = await Village.findOne({ 
      name: name.trim().toUpperCase() 
    });
    if (existingVillage) {
      return res.status(400).json({ message: 'Village already exists' });
    }
    
    // Validate assigned surveyors exist and are active
    if (assignedSurveyors.length > 0) {
      const surveyorCount = await User.countDocuments({ 
        _id: { $in: assignedSurveyors },
        role: 'surveyor',
        isActive: true
      });
      if (surveyorCount !== assignedSurveyors.length) {
        return res.status(400).json({ 
          message: 'One or more surveyors are invalid or inactive' 
        });
      }
    }
    
    // Create village
    const village = new Village({
      name: name.trim().toUpperCase(),
      totalHouseholds,
      population,
      assignedSurveyors,
      createdBy: req.user._id
    });
    
    await village.save();
    
    // Update surveyors with village assignment
    if (assignedSurveyors.length > 0) {
      await User.updateMany(
        { _id: { $in: assignedSurveyors } },
        { $addToSet: { assignedVillages: village.name } }
      );
    }
    
    res.status(201).json({
      message: 'Village created successfully',
      village: {
        id: village._id,
        name: village.name,
        totalHouseholds: village.totalHouseholds,
        population: village.population,
        surveyedHouseholds: village.surveyedHouseholds,
        assignedSurveyors: village.assignedSurveyors,
        createdAt: village.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update village details
exports.updateVillage = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      totalHouseholds, 
      population, 
      assignedSurveyors 
    } = req.body;
    
    const village = await Village.findById(id);
    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }
    
    const oldSurveyors = village.assignedSurveyors;
    
    // Validate assigned surveyors if provided
    if (assignedSurveyors && assignedSurveyors.length > 0) {
      const surveyorCount = await User.countDocuments({ 
        _id: { $in: assignedSurveyors },
        role: 'surveyor',
        isActive: true
      });
      if (surveyorCount !== assignedSurveyors.length) {
        return res.status(400).json({ 
          message: 'One or more surveyors are invalid or inactive' 
        });
      }
    }
    
    // Update fields
    if (totalHouseholds !== undefined) village.totalHouseholds = totalHouseholds;
    if (population !== undefined) village.population = population;
    if (assignedSurveyors !== undefined) village.assignedSurveyors = assignedSurveyors;
    
    await village.save();
    
    // Update surveyor assignments (remove old assignments)
    if (oldSurveyors.length > 0) {
      await User.updateMany(
        { _id: { $in: oldSurveyors } },
        { $pull: { assignedVillages: village.name } }
      );
    }
    
    // Add new assignments
    if (assignedSurveyors && assignedSurveyors.length > 0) {
      await User.updateMany(
        { _id: { $in: assignedSurveyors } },
        { $addToSet: { assignedVillages: village.name } }
      );
    }
    
    res.json({
      message: 'Village updated successfully',
      village: {
        id: village._id,
        name: village.name,
        totalHouseholds: village.totalHouseholds,
        population: village.population,
        surveyedHouseholds: village.surveyedHouseholds,
        assignedSurveyors: village.assignedSurveyors,
        updatedAt: village.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign surveyors to village
exports.assignVillageSurveyors = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedSurveyors } = req.body;
    
    const village = await Village.findById(id);
    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }
    
    // Validate surveyors
    if (assignedSurveyors.length > 0) {
      const surveyorCount = await User.countDocuments({ 
        _id: { $in: assignedSurveyors },
        role: 'surveyor',
        isActive: true
      });
      if (surveyorCount !== assignedSurveyors.length) {
        return res.status(400).json({ 
          message: 'One or more surveyors are invalid or inactive' 
        });
      }
    }
    
    const oldSurveyors = village.assignedSurveyors;
    
    // Update village
    village.assignedSurveyors = assignedSurveyors;
    await village.save();
    
    // Remove old assignments
    await User.updateMany(
      { _id: { $in: oldSurveyors } },
      { $pull: { assignedVillages: village.name } }
    );
    
    // Add new assignments
    if (assignedSurveyors.length > 0) {
      await User.updateMany(
        { _id: { $in: assignedSurveyors } },
        { $addToSet: { assignedVillages: village.name } }
      );
    }
    
    res.json({
      message: 'Surveyors assigned successfully',
      assignedSurveyors: village.assignedSurveyors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single village with detailed information
exports.getVillage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const village = await Village.findById(id)
      .populate('assignedSurveyors', 'username email isActive lastLogin');
    
    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }
    
    // Get detailed survey statistics
    const surveyStats = await HouseholdSurvey.aggregate([
      { $match: { village: village.name } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const stats = {
      total: 0,
      draft: 0,
      submitted: 0,
      verified: 0
    };
    
    surveyStats.forEach(stat => {
      stats[stat._id] = stat.count;
      stats.total += stat.count;
    });
    
    // Get recent surveys in this village
    const recentSurveys = await HouseholdSurvey.find({ village: village.name })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('surveyorId', 'username')
      .select('representativeName status createdAt surveyorId');
    
    // Calculate completion rate
    const completionRate = village.totalHouseholds > 0 
      ? Math.round((stats.verified / village.totalHouseholds) * 100)
      : 0;
    
    res.json({
      village: {
        ...village.toObject(),
        surveyProgress: stats,
        completionRate,
        recentSurveys,
        activeSurveyors: village.assignedSurveyors?.filter(s => s.isActive).length || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete village (soft delete by marking as inactive)
exports.deleteVillage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const village = await Village.findById(id);
    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }
    
    // Check if there are active surveys
    const activeSurveys = await HouseholdSurvey.countDocuments({ 
      village: village.name,
      status: { $in: ['Draft', 'Submitted'] }
    });
    
    if (activeSurveys > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete village with active surveys. Please complete or reject all surveys first.' 
      });
    }
    
    // Remove village assignments from all surveyors
    await User.updateMany(
      { assignedVillages: village.name },
      { $pull: { assignedVillages: village.name } }
    );
    
    // Delete the village
    await Village.findByIdAndDelete(id);
    
    res.json({
      message: 'Village deleted successfully',
      village: {
        id: village._id,
        name: village.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== SURVEY VERIFICATION ====================

// Get submitted surveys for admin review
exports.getSubmittedSurveys = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = { status: 'Submitted' };
    
    if (req.query.village) {
      filter.village = req.query.village;
    }
    
    if (req.query.surveyor) {
      filter.surveyorId = req.query.surveyor;
    }
    
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }
    
    // Get submitted surveys with pagination
    const surveys = await HouseholdSurvey.find(filter)
      .populate('surveyorId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await HouseholdSurvey.countDocuments(filter);
    
    // Add data quality checks for each survey
    const surveysWithQualityChecks = await Promise.all(
      surveys.map(async (survey) => {
        const qualityChecks = await performDataQualityChecks(survey);
        
        return {
          ...survey.toObject(),
          qualityChecks,
          verificationStatus: 'pending'
        };
      })
    );
    
    res.json({
      surveys: surveysWithQualityChecks,
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

// Get single survey for detailed review
exports.getSurveyForReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const survey = await HouseholdSurvey.findById(id)
      .populate('surveyorId', 'username email assignedVillages');
    
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    // Perform detailed data quality checks
    const qualityChecks = await performDataQualityChecks(survey);
    
    // Get surveyor performance context
    const surveyorStats = await HouseholdSurvey.aggregate([
      { $match: { surveyorId: survey.surveyorId._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const stats = {
      total: 0,
      draft: 0,
      submitted: 0,
      verified: 0
    };
    
    surveyorStats.forEach(stat => {
      stats[stat._id] = stat.count;
      stats.total += stat.count;
    });
    
    // Check for duplicate mobile numbers in the same village
    const duplicateMobiles = await HouseholdSurvey.find({
      village: survey.village,
      mobileNumber: survey.mobileNumber,
      _id: { $ne: survey._id }
    }).select('representativeName mobileNumber status');
    
    res.json({
      survey: {
        ...survey.toObject(),
        qualityChecks,
        duplicateMobiles,
        surveyorContext: {
          performance: stats,
          totalSurveys: stats.total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve submitted survey
exports.approveSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationNotes } = req.body;
    
    const survey = await HouseholdSurvey.findById(id);
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    if (survey.status !== 'Submitted') {
      return res.status(400).json({ 
        message: 'Only submitted surveys can be approved' 
      });
    }
    
    // Update survey status and add verification details
    survey.status = 'Verified';
    survey.verifiedBy = req.user._id;
    survey.verifiedAt = new Date();
    survey.verificationNotes = verificationNotes || '';
    
    await survey.save();
    
    // Update village surveyed households count
    await Village.updateOne(
      { name: survey.village },
      { $inc: { surveyedHouseholds: 1 } }
    );
    
    res.json({
      message: 'Survey approved successfully',
      survey: {
        id: survey._id,
        status: survey.status,
        verifiedAt: survey.verifiedAt,
        verifiedBy: req.user.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject submitted survey
exports.rejectSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, verificationNotes } = req.body;
    
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Rejection reason is required' 
      });
    }
    
    const survey = await HouseholdSurvey.findById(id);
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    if (survey.status !== 'Submitted') {
      return res.status(400).json({ 
        message: 'Only submitted surveys can be rejected' 
      });
    }
    
    // Update survey status and add rejection details
    survey.status = 'Rejected';
    survey.rejectedBy = req.user._id;
    survey.rejectedAt = new Date();
    survey.rejectionReason = rejectionReason.trim();
    survey.verificationNotes = verificationNotes || '';
    
    await survey.save();
    
    res.json({
      message: 'Survey rejected successfully',
      survey: {
        id: survey._id,
        status: survey.status,
        rejectedAt: survey.rejectedAt,
        rejectedBy: req.user.username,
        rejectionReason: survey.rejectionReason
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get verification statistics
exports.getVerificationStats = async (req, res) => {
  try {
    // Overall verification stats
    const overallStats = await HouseholdSurvey.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const stats = {
      total: 0,
      draft: 0,
      submitted: 0,
      verified: 0,
      rejected: 0
    };
    
    overallStats.forEach(stat => {
      stats[stat._id] = stat.count;
      stats.total += stat.count;
    });
    
    // Pending verification count
    stats.pendingVerification = stats.submitted;
    
    // Verification rate
    stats.verificationRate = stats.total > 0 
      ? Math.round((stats.verified / stats.total) * 100)
      : 0;
    
    // Recent verification activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await HouseholdSurvey.aggregate([
      {
        $match: {
          $or: [
            { verifiedAt: { $gte: sevenDaysAgo } },
            { rejectedAt: { $gte: sevenDaysAgo } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'Verified'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
          }
        }
      }
    ]);
    
    stats.recentActivity = recentActivity[0] || { approved: 0, rejected: 0 };
    
    // Top performers (surveyors with most verified surveys)
    const topPerformers = await HouseholdSurvey.aggregate([
      { $match: { status: 'Verified' } },
      {
        $group: {
          _id: '$surveyorId',
          verifiedCount: { $sum: 1 }
        }
      },
      { $sort: { verifiedCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'surveyor'
        }
      },
      { $unwind: '$surveyor' },
      {
        $project: {
          username: '$surveyor.username',
          verifiedCount: 1
        }
      }
    ]);
    
    stats.topPerformers = topPerformers;
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function for data quality checks
async function performDataQualityChecks(survey) {
  const checks = {
    issues: [],
    warnings: [],
    score: 100
  };
  
  // Check for missing required fields
  if (!survey.representativeName || survey.representativeName.trim().length < 2) {
    checks.issues.push('Representative name is too short or missing');
    checks.score -= 20;
  }
  
  if (!survey.mobileNumber || !/^\d{10}$/.test(survey.mobileNumber)) {
    checks.issues.push('Invalid mobile number format');
    checks.score -= 30;
  }
  
  if (survey.representativeAge < 18 || survey.representativeAge > 120) {
    checks.issues.push('Representative age outside valid range (18-120)');
    checks.score -= 15;
  }
  
  if (survey.totalFamilyMembers < 1 || survey.totalFamilyMembers > 50) {
    checks.issues.push('Total family members outside valid range (1-50)');
    checks.score -= 15;
  }
  
  // Check Ayushman card consistency
  if (survey.ayushmanCardStatus === 'Some Members Have' && 
      (!survey.ayushmanMembersCount || survey.ayushmanMembersCount <= 0)) {
    checks.issues.push('Ayushman card count required when "Some Members Have" is selected');
    checks.score -= 10;
  }
  
  if (survey.ayushmanCardStatus === 'Some Members Have' && 
      survey.ayushmanMembersCount > survey.totalFamilyMembers) {
    checks.issues.push('Ayushman card count cannot exceed total family members');
    checks.score -= 10;
  }
  
  // Check conditional sections
  if (survey.hasHealthIssues === 'Yes' && 
      (!survey.healthMembers || survey.healthMembers.length === 0)) {
    checks.warnings.push('Health issues marked as Yes but no member details provided');
    checks.score -= 5;
  }
  
  if (survey.hasSchoolChildren === 'Yes' && 
      (!survey.educationChildren || survey.educationChildren.length === 0)) {
    checks.warnings.push('School children marked as Yes but no child details provided');
    checks.score -= 5;
  }
  
  // Check for potential data entry errors
  if (survey.totalFamilyMembers === 1 && survey.hasHealthIssues === 'Yes' && 
      survey.healthMembers && survey.healthMembers.length > 1) {
    checks.warnings.push('More health issue members than total family members');
    checks.score -= 5;
  }
  
  // Ensure score doesn't go below 0
  checks.score = Math.max(0, checks.score);
  
  return checks;
}

// ==================== ADMIN DASHBOARD ====================

// Get dashboard overview statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get basic counts
    const [
      totalSurveyors,
      activeSurveyors,
      totalVillages,
      totalSurveys,
      verifiedSurveys
    ] = await Promise.all([
      User.countDocuments({ role: 'surveyor' }),
      User.countDocuments({ role: 'surveyor', isActive: true }),
      Village.countDocuments(),
      HouseholdSurvey.countDocuments(),
      HouseholdSurvey.countDocuments({ status: 'Verified' })
    ]);
    
    // Survey status breakdown
    const surveyStatusStats = await HouseholdSurvey.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const surveyStatus = {
      draft: 0,
      submitted: 0,
      verified: 0,
      rejected: 0
    };
    
    surveyStatusStats.forEach(stat => {
      surveyStatus[stat._id] = stat.count;
    });
    
    // Village coverage statistics
    const villageStats = await Village.aggregate([
      {
        $group: {
          _id: null,
          totalHouseholds: { $sum: '$totalHouseholds' },
          surveyedHouseholds: { $sum: '$surveyedHouseholds' },
          villagesWithSurveyors: {
            $sum: { $cond: [{ $gt: [{ $size: '$assignedSurveyors' }, 0] }, 1, 0] }
          }
        }
      }
    ]);
    
    const villageData = villageStats[0] || {
      totalHouseholds: 0,
      surveyedHouseholds: 0,
      villagesWithSurveyors: 0
    };
    
    const coverageRate = villageData.totalHouseholds > 0
      ? Math.round((villageData.surveyedHouseholds / villageData.totalHouseholds) * 100)
      : 0;
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [recentSurveys, recentVerifications] = await Promise.all([
      HouseholdSurvey.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      HouseholdSurvey.countDocuments({ 
        verifiedAt: { $gte: sevenDaysAgo },
        status: 'Verified'
      })
    ]);
    
    // Top performing surveyors (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const topSurveyors = await HouseholdSurvey.aggregate([
      { $match: { verifiedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$surveyorId',
          verifiedCount: { $sum: 1 }
        }
      },
      { $sort: { verifiedCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'surveyor'
        }
      },
      { $unwind: '$surveyor' },
      {
        $project: {
          username: '$surveyor.username',
          verifiedCount: 1
        }
      }
    ]);
    
    // Monthly survey trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrends = await HouseholdSurvey.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'Verified'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      overview: {
        totalSurveyors,
        activeSurveyors,
        totalVillages,
        totalSurveys,
        verifiedSurveys,
        coverageRate
      },
      surveyStatus,
      villageCoverage: {
        totalHouseholds: villageData.totalHouseholds,
        surveyedHouseholds: villageData.surveyedHouseholds,
        villagesWithSurveyors: villageData.villagesWithSurveyors,
        coverageRate
      },
      recentActivity: {
        recentSurveys,
        recentVerifications
      },
      topSurveyors,
      monthlyTrends
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get detailed survey analytics
exports.getSurveyAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, village, surveyor } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // Build additional filters
    const filter = { ...dateFilter };
    if (village) filter.village = village;
    if (surveyor) filter.surveyorId = surveyor;
    
    // Survey completion trends
    const completionTrends = await HouseholdSurvey.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          total: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'Verified'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 30 }
    ]);
    
    // Village-wise survey distribution
    const villageDistribution = await HouseholdSurvey.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$village',
          total: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'Verified'] }, 1, 0] }
          }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);
    
    // Health issues statistics
    const healthStats = await HouseholdSurvey.aggregate([
      { $match: { ...filter, hasHealthIssues: 'Yes' } },
      { $unwind: '$healthMembers' },
      {
        $group: {
          _id: '$healthMembers.healthIssueType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Education statistics
    const educationStats = await HouseholdSurvey.aggregate([
      { $match: { ...filter, hasSchoolChildren: 'Yes' } },
      { $unwind: '$educationChildren' },
      {
        $group: {
          _id: '$educationChildren.educationLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Employment statistics
    const employmentStats = await HouseholdSurvey.aggregate([
      { $match: { ...filter, hasEmployedMembers: 'Yes' } },
      { $unwind: '$employedMembers' },
      {
        $group: {
          _id: '$employedMembers.employmentType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Ayushman card coverage
    const ayushmanStats = await HouseholdSurvey.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$ayushmanCardStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      completionTrends,
      villageDistribution,
      healthStats,
      educationStats,
      employmentStats,
      ayushmanStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get surveyor performance metrics
exports.getSurveyorPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // Surveyor performance metrics
    const performanceMetrics = await HouseholdSurvey.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$surveyorId',
          totalSurveys: { $sum: 1 },
          verifiedSurveys: {
            $sum: { $cond: [{ $eq: ['$status', 'Verified'] }, 1, 0] }
          },
          rejectedSurveys: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
          },
          pendingSurveys: {
            $sum: { $cond: [{ $eq: ['$status', 'Submitted'] }, 1, 0] }
          },
          avgQualityScore: { $avg: '$qualityScore' },
          lastSurveyDate: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'surveyor'
        }
      },
      { $unwind: '$surveyor' },
      {
        $addFields: {
          verificationRate: {
            $cond: [
              { $eq: ['$totalSurveys', 0] },
              0,
              { $multiply: [{ $divide: ['$verifiedSurveys', '$totalSurveys'] }, 100] }
            ]
          },
          rejectionRate: {
            $cond: [
              { $eq: ['$totalSurveys', 0] },
              0,
              { $multiply: [{ $divide: ['$rejectedSurveys', '$totalSurveys'] }, 100] }
            ]
          }
        }
      },
      { $sort: { verifiedSurveys: -1 } }
    ]);
    
    // Surveyor village coverage
    const villageCoverage = await User.aggregate([
      { $match: { role: 'surveyor' } },
      {
        $project: {
          username: 1,
          assignedVillages: 1,
          isActive: 1,
          villageCount: { $size: '$assignedVillages' }
        }
      },
      { $sort: { villageCount: -1 } }
    ]);
    
    // Performance trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const performanceTrends = await HouseholdSurvey.aggregate([
      { $match: { ...dateFilter, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            surveyorId: '$surveyorId',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          surveys: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'Verified'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.surveyorId',
          foreignField: '_id',
          as: 'surveyor'
        }
      },
      { $unwind: '$surveyor' },
      {
        $project: {
          date: '$_id.date',
          username: '$surveyor.username',
          surveys: 1,
          verified: 1
        }
      },
      { $sort: { date: 1, username: 1 } }
    ]);
    
    res.json({
      performanceMetrics,
      villageCoverage,
      performanceTrends
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== DATA EXPORT ====================

// Export survey data
exports.exportSurveyData = async (req, res) => {
  try {
    const { format = 'json', village, surveyor, status, startDate, endDate } = req.query;
    
    // Build filter
    const filter = {};
    if (village) filter.village = village;
    if (surveyor) filter.surveyorId = surveyor;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Get survey data with populated fields
    const surveys = await HouseholdSurvey.find(filter)
      .populate('surveyorId', 'username email')
      .sort({ createdAt: -1 });
    
    // Transform data for export
    const exportData = surveys.map(survey => ({
      id: survey._id,
      representativeName: survey.representativeName,
      mobileNumber: survey.mobileNumber,
      representativeAge: survey.representativeAge,
      representativeGender: survey.representativeGender,
      totalFamilyMembers: survey.totalFamilyMembers,
      ayushmanCardStatus: survey.ayushmanCardStatus,
      ayushmanMembersCount: survey.ayushmanMembersCount,
      hasHealthIssues: survey.hasHealthIssues,
      hasSchoolChildren: survey.hasSchoolChildren,
      hasEmployedMembers: survey.hasEmployedMembers,
      surveyor: survey.surveyorId?.username,
      village: survey.village,
      status: survey.status,
      createdAt: survey.createdAt,
      verifiedAt: survey.verifiedAt,
      latitude: survey.latitude,
      longitude: survey.longitude
    }));
    
    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=survey_data.csv');
      return res.send(csv);
    }
    
    // Default to JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=survey_data.json');
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export surveyor performance data
exports.exportSurveyorPerformance = async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // Get surveyor performance data
    const performanceData = await HouseholdSurvey.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$surveyorId',
          totalSurveys: { $sum: 1 },
          verifiedSurveys: {
            $sum: { $cond: [{ $eq: ['$status', 'Verified'] }, 1, 0] }
          },
          rejectedSurveys: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
          },
          pendingSurveys: {
            $sum: { $cond: [{ $eq: ['$status', 'Submitted'] }, 1, 0] }
          },
          firstSurvey: { $min: '$createdAt' },
          lastSurvey: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'surveyor'
        }
      },
      { $unwind: '$surveyor' },
      {
        $project: {
          surveyorId: '$_id',
          username: '$surveyor.username',
          email: '$surveyor.email',
          isActive: '$surveyor.isActive',
          assignedVillages: '$surveyor.assignedVillages',
          totalSurveys: 1,
          verifiedSurveys: 1,
          rejectedSurveys: 1,
          pendingSurveys: 1,
          verificationRate: {
            $cond: [
              { $eq: ['$totalSurveys', 0] },
              0,
              { $multiply: [{ $divide: ['$verifiedSurveys', '$totalSurveys'] }, 100] }
            ]
          },
          firstSurvey: 1,
          lastSurvey: 1
        }
      },
      { $sort: { verifiedSurveys: -1 } }
    ]);
    
    if (format === 'csv') {
      const csv = convertToCSV(performanceData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=surveyor_performance.csv');
      return res.send(csv);
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=surveyor_performance.json');
    res.json(performanceData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export village statistics
exports.exportVillageStats = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    // Get village statistics
    const villageStats = await Village.aggregate([
      {
        $lookup: {
          from: 'householdsurveys',
          localField: 'name',
          foreignField: 'village',
          as: 'surveys'
        }
      },
      {
        $addFields: {
          totalSurveys: { $size: '$surveys' },
          verifiedSurveys: {
            $size: {
              $filter: {
                input: '$surveys',
                cond: { $eq: ['$$this.status', 'Verified'] }
              }
            }
          },
          submittedSurveys: {
            $size: {
              $filter: {
                input: '$surveys',
                cond: { $eq: ['$$this.status', 'Submitted'] }
              }
            }
          },
          rejectedSurveys: {
            $size: {
              $filter: {
                input: '$surveys',
                cond: { $eq: ['$$this.status', 'Rejected'] }
              }
            }
          },
          assignedSurveyorCount: { $size: '$assignedSurveyors' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $eq: ['$totalHouseholds', 0] },
              0,
              { $multiply: [{ $divide: ['$surveyedHouseholds', '$totalHouseholds'] }, 100] }
            ]
          },
          verificationRate: {
            $cond: [
              { $eq: ['$totalSurveys', 0] },
              0,
              { $multiply: [{ $divide: ['$verifiedSurveys', '$totalSurveys'] }, 100] }
            ]
          }
        }
      },
      {
        $project: {
          name: 1,
          totalHouseholds: 1,
          surveyedHouseholds: 1,
          completionRate: 1,
          totalSurveys: 1,
          verifiedSurveys: 1,
          submittedSurveys: 1,
          rejectedSurveys: 1,
          verificationRate: 1,
          assignedSurveyorCount: 1,
          assignedSurveyors: 1,
          createdAt: 1,
          createdBy: 1
        }
      },
      { $sort: { name: 1 } }
    ]);
    
    if (format === 'csv') {
      const csv = convertToCSV(villageStats);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=village_statistics.csv');
      return res.send(csv);
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=village_statistics.json');
    res.json(villageStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle nested objects and arrays
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // Handle strings with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}
