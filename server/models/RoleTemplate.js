const mongoose = require('mongoose');

const roleTemplateSchema = new mongoose.Schema({
  role: { type: String, required: true, unique: true },
  description: { type: String },
  requiredSkills: [{ type: String }],
  weeklyRoadmap: [{
    week: { type: Number },
    title: { type: String },
    tasks: [{ type: String }],
    resources: [{
      title: { type: String },
      link: { type: String },
      type: { type: String, enum: ['video', 'article', 'practice', 'course'] }
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('RoleTemplate', roleTemplateSchema);