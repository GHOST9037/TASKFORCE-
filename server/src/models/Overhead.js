const mongoose = require('mongoose');

const overheadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['fixed', 'variable'],
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  frequency: {
    type: String,
    required: true,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['rent', 'utilities', 'equipment', 'maintenance', 'insurance', 'other'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Overhead', overheadSchema); 