const mongoose = require('mongoose');

const productTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['furniture', 'electronics', 'clothing', 'food', 'other'],
    trim: true
  },
  rawMaterials: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RawMaterial',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  overheads: [{
    overhead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Overhead',
      required: true
    },
    allocation: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  estimatedLaborHours: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for calculating base cost (without labor)
productTemplateSchema.virtual('baseCost').get(function() {
  let totalCost = 0;
  
  // Calculate raw materials cost
  this.rawMaterials.forEach(item => {
    totalCost += item.material.costPerUnit * item.quantity;
  });
  
  // Calculate overheads cost
  this.overheads.forEach(item => {
    totalCost += (item.overhead.cost * item.allocation) / 100;
  });
  
  return totalCost;
});

module.exports = mongoose.model('ProductTemplate', productTemplateSchema); 