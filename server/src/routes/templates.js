const express = require('express');
const router = express.Router();
const ProductTemplate = require('../models/ProductTemplate');
const { auth, adminOnly } = require('../middleware/auth');
const CalculationHistory = require('../models/CalculationHistory');

// Get all product templates
router.get('/', async (req, res) => {
  try {
    const templates = await ProductTemplate.find({ isActive: true })
      .populate('rawMaterials.material')
      .populate('overheads.overhead')
      .populate('createdBy', 'name email');
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product template
router.get('/:id', async (req, res) => {
  try {
    const template = await ProductTemplate.findById(req.params.id)
      .populate('rawMaterials.material')
      .populate('overheads.overhead')
      .populate('createdBy', 'name email');
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new product template (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  const template = new ProductTemplate({
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    rawMaterials: req.body.rawMaterials,
    overheads: req.body.overheads,
    estimatedLaborHours: req.body.estimatedLaborHours,
    createdBy: req.user._id
  });

  try {
    const newTemplate = await template.save();
    const populatedTemplate = await ProductTemplate.findById(newTemplate._id)
      .populate('rawMaterials.material')
      .populate('overheads.overhead')
      .populate('createdBy', 'name email');
    res.status(201).json(populatedTemplate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Calculate cost for a product
router.post('/:id/calculate', auth, async (req, res) => {
  const { laborRate, numberOfWorkers, quantity = 1 } = req.body;
  const { id } = req.params;
  try {
    const template = await ProductTemplate.findById(id)
      .populate('rawMaterials.material')
      .populate('overheads.overhead');

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Per-unit costs
    const perUnitRawMaterials = template.rawMaterials.reduce((acc, { material, quantity: qty }) => {
      const costPerUnit = material.costPerUnit;
      const total = costPerUnit * qty;
      acc.items.push({ name: material.name, quantity: qty, unit: material.unit, costPerUnit, total });
      acc.total += total;
      return acc;
    }, { items: [], total: 0 });
    const perUnitOverheads = template.overheads.reduce((acc, { overhead, allocation }) => {
      const cost = overhead.cost;
      const allocatedCost = (cost * allocation) / 100;
      acc.items.push({ name: overhead.name, allocation, cost, allocatedCost });
      acc.total += allocatedCost;
      return acc;
    }, { items: [], total: 0 });
    const perUnitLabor = {
      rate: laborRate,
      workers: numberOfWorkers,
      hours: template.estimatedLaborHours,
      total: laborRate * numberOfWorkers * template.estimatedLaborHours
    };
    const perUnitTotalCost = perUnitRawMaterials.total + perUnitOverheads.total + perUnitLabor.total;

    // Total costs for batch
    const totalRawMaterials = perUnitRawMaterials.total * quantity;
    const totalOverheads = perUnitOverheads.total * quantity;
    const totalLabor = perUnitLabor.total * quantity;
    const totalTotalCost = perUnitTotalCost * quantity;

    // Prepare detailed breakdown
    const costBreakdown = {
      perUnit: {
        rawMaterials: perUnitRawMaterials,
        overheads: perUnitOverheads,
        labor: perUnitLabor,
        totalCost: perUnitTotalCost
      },
      total: {
        rawMaterials: totalRawMaterials,
        overheads: totalOverheads,
        labor: totalLabor,
        totalCost: totalTotalCost
      },
      quantity
    };

    res.json(costBreakdown);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product template (admin only)
router.patch('/:id', auth, adminOnly, async (req, res) => {
  try {
    const template = await ProductTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    Object.keys(req.body).forEach(key => {
      template[key] = req.body[key];
    });
    template.lastUpdated = Date.now();

    const updatedTemplate = await template.save();
    const populatedTemplate = await ProductTemplate.findById(updatedTemplate._id)
      .populate('rawMaterials.material')
      .populate('overheads.overhead')
      .populate('createdBy', 'name email');
    res.json(populatedTemplate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Soft delete product template (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const template = await ProductTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    template.isActive = false;
    template.lastUpdated = Date.now();
    await template.save();

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save calculation
router.post('/:id/save', auth, async (req, res) => {
  const { templateName, totalCost, quantity, breakdown } = req.body;
  if (!templateName || !totalCost || !quantity) {
    return res.status(400).json({ error: "Template name, total cost, and quantity are required." });
  }
  try {
    const history = new CalculationHistory({
      templateName,
      totalCost,
      quantity,
      user: req.user._id,
      breakdown: breakdown || { rawMaterials: 0, overheads: 0, labor: 0 }
    });
    await history.save();
    res.status(201).json({ message: "Calculation saved in history.", historyId: history._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router; 