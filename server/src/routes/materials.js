const express = require('express');
const router = express.Router();
const RawMaterial = require('../models/RawMaterial');
const { auth, adminOnly } = require('../middleware/auth');

// Get all raw materials
router.get('/', async (req, res) => {
  try {
    const materials = await RawMaterial.find({ isActive: true });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new raw material (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  const material = new RawMaterial({
    name: req.body.name,
    unit: req.body.unit,
    costPerUnit: req.body.costPerUnit,
    category: req.body.category,
    description: req.body.description
  });

  try {
    const newMaterial = await material.save();
    res.status(201).json(newMaterial);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update raw material (admin only)
router.patch('/:id', auth, adminOnly, async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    Object.keys(req.body).forEach(key => {
      material[key] = req.body[key];
    });
    material.lastUpdated = Date.now();

    const updatedMaterial = await material.save();
    res.json(updatedMaterial);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Soft delete raw material (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    material.isActive = false;
    material.lastUpdated = Date.now();
    await material.save();

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 