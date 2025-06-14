const express = require('express');
const router = express.Router();
const CalculationHistory = require('../models/CalculationHistory');
const { auth } = require('../middleware/auth');

// Get all calculation history for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const history = await CalculationHistory.find({ user: req.user._id }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Delete a calculation history entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await CalculationHistory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found.' });
    }
    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Edit a calculation history entry (update quantity and totalCost)
router.put('/:id', auth, async (req, res) => {
  const { quantity, totalCost } = req.body;
  try {
    const entry = await CalculationHistory.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { quantity, totalCost } },
      { new: true }
    );
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found.' });
    }
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router; 