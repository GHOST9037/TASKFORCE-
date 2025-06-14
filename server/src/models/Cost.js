const mongoose = require('mongoose');

const costSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  rawMaterials: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  labor: {
    hours: {
      type: Number,
      required: true,
      min: 0
    },
    ratePerHour: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0
    }
  },
  overheads: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  miscellaneous: {
    type: [
      {
        name: {
          type: String,
          required: true,
          trim: true
        },
        cost: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],
    default: []
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total cost before saving
costSchema.pre('save', function(next) {
  const rawMaterials = this.rawMaterials || [];
  const overheads = this.overheads || [];
  const miscellaneous = this.miscellaneous || [];

  const rawMaterialsTotal = rawMaterials.reduce((sum, material) => sum + (material.totalCost || 0), 0);
  const overheadsTotal = overheads.reduce((sum, overhead) => sum + (overhead.cost || 0), 0);
  const miscellaneousTotal = miscellaneous.reduce((sum, misc) => sum + (misc.cost || 0), 0);

  this.totalCost = rawMaterialsTotal + (this.labor?.totalCost || 0) + overheadsTotal + miscellaneousTotal;
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cost', costSchema); 