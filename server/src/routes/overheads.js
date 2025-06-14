const express = require('express');
const router = express.Router();
const Overhead = require('../models/Overhead');
const { auth, adminOnly } = require('../middleware/auth');

// Get all overheads
router.get('/', async (req, res) => {
  try {
    const overheads = await Overhead.find({ isActive: true });
    res.json(overheads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new overhead (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  const overhead = new Overhead({
    name: req.body.name,
    type: req.body.type,
    cost: req.body.cost,
    frequency: req.body.frequency,
    category: req.body.category,
    description: req.body.description
  });

  try {
    const newOverhead = await overhead.save();
    res.status(201).json(newOverhead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update overhead (admin only)
router.patch('/:id', auth, adminOnly, async (req, res) => {
  try {
    const overhead = await Overhead.findById(req.params.id);
    if (!overhead) {
      return res.status(404).json({ message: 'Overhead not found' });
    }

    Object.keys(req.body).forEach(key => {
      overhead[key] = req.body[key];
    });
    overhead.lastUpdated = Date.now();

    const updatedOverhead = await overhead.save();
    res.json(updatedOverhead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Soft delete overhead (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const overhead = await Overhead.findById(req.params.id);
    if (!overhead) {
      return res.status(404).json({ message: 'Overhead not found' });
    }

    overhead.isActive = false;
    overhead.lastUpdated = Date.now();
    await overhead.save();

    res.json({ message: 'Overhead deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 