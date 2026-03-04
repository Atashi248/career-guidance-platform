const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  weeklyProgress: [{
    week: { type: Number },
    completedTasks: [{ type: String }],
    totalTasks: { type: Number },
    completionPercentage: { type: Number, default: 0 },
    completedAt: { type: Date }
  }],
  overallCompletionPercentage: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Progress', progressSchema);