const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, uppercase: true },
  assignedSurveyors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalHouseholds: { type: Number, default: 0 },
  surveyedHouseholds: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Village', villageSchema, 'villages');
