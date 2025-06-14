const mongoose = require('mongoose');

const calculationHistorySchema = new mongoose.Schema({
  templateName: { type: String, required: true },
  totalCost: { type: Number, required: true },
  quantity: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  breakdown: {
    rawMaterials: { type: Number, default: 0 },
    overheads: { type: Number, default: 0 },
    labor: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('CalculationHistory', calculationHistorySchema); 