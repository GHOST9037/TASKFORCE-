const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Cost = require('../models/Cost');
const { auth, adminOnly } = require('../middleware/auth');

// Get all costs for the current user
router.get('/', auth, async (req, res) => {
  try {
    const costs = await Cost.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    res.json(costs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new cost calculation
router.post('/', auth, [
  body('name').trim().notEmpty(),
  body('rawMaterials').isArray(),
  body('rawMaterials.*.name').trim().notEmpty(),
  body('rawMaterials.*.quantity').isFloat({ min: 0 }),
  body('rawMaterials.*.unitCost').isFloat({ min: 0 }),
  body('labor.hours').isFloat({ min: 0 }),
  body('labor.ratePerHour').isFloat({ min: 0 }),
  body('overheads').isArray(),
  body('overheads.*.name').trim().notEmpty(),
  body('overheads.*.cost').isFloat({ min: 0 }),
  body('miscellaneous').isArray(),
  body('miscellaneous.*.name').trim().notEmpty(),
  body('miscellaneous.*.cost').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const costData = {
      ...req.body,
      createdBy: req.user._id,
      miscellaneous: Array.isArray(req.body.miscellaneous) ? req.body.miscellaneous : []
    };

    // Calculate total costs for raw materials
    costData.rawMaterials = costData.rawMaterials.map(material => ({
      ...material,
      totalCost: material.quantity * material.unitCost
    }));

    // Calculate total labor cost
    costData.labor = {
      ...costData.labor,
      totalCost: costData.labor.hours * costData.labor.ratePerHour
    };

    // Calculate totalCost for the document
    const rawMaterialsTotal = costData.rawMaterials.reduce((sum, material) => sum + material.totalCost, 0);
    const overheadsTotal = costData.overheads.reduce((sum, overhead) => sum + overhead.cost, 0);
    const miscellaneousTotal = (costData.miscellaneous || []).reduce((sum, misc) => sum + misc.cost, 0);
    const laborTotal = costData.labor.totalCost || 0;

    costData.totalCost = rawMaterialsTotal + laborTotal + overheadsTotal + miscellaneousTotal;

    const cost = new Cost(costData);
    await cost.save();

    res.status(201).json(cost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cost by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const cost = await Cost.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!cost) {
      return res.status(404).json({ message: 'Cost calculation not found' });
    }

    res.json(cost);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update cost calculation
router.put('/:id', auth, async (req, res) => {
  try {
    const cost = await Cost.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!cost) {
      return res.status(404).json({ message: 'Cost calculation not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'createdBy' && key !== '_id') {
        cost[key] = req.body[key];
      }
    });

    await cost.save();
    res.json(cost);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete cost calculation
router.delete('/:id', auth, async (req, res) => {
  try {
    const cost = await Cost.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!cost) {
      return res.status(404).json({ message: 'Cost calculation not found' });
    }

    res.json({ message: 'Cost calculation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Save as template
router.post('/:id/template', auth, async (req, res) => {
  try {
    const cost = await Cost.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!cost) {
      return res.status(404).json({ message: 'Cost calculation not found' });
    }

    const template = new Cost({
      ...cost.toObject(),
      _id: undefined,
      isTemplate: true,
      name: `${cost.name} (Template)`
    });

    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all templates
router.get('/templates/all', auth, async (req, res) => {
  try {
    const templates = await Cost.find({
      isTemplate: true,
      createdBy: req.user._id
    }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 