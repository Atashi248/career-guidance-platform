const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  url: { type: String, required: true },
  type: { type: String, enum: ['video', 'article', 'practice', 'course', 'book'], default: 'article' },
  category: {
    type: String,
    enum: ['Development', 'DSA', 'Aptitude', 'Core CS'],
    required: true
  },
  subCategory: { type: String, trim: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  isFree: { type: Boolean, default: true },
  tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);