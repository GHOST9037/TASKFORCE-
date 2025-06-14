import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Box,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CostCalculator() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templateMsg, setTemplateMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rawMaterials: [{ name: '', quantity: '', unitCost: '' }],
    labor: { hours: '', ratePerHour: '' },
    overheads: [{ name: '', cost: '' }],
    miscellaneous: [{ name: '', cost: '' }]
  });

  const handleChange = (section, index, field, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (section === 'labor') {
        newData.labor = { ...newData.labor, [field]: value };
      } else {
        newData[section] = [...newData[section]];
        newData[section][index] = { ...newData[section][index], [field]: value };
      }
      return newData;
    });
  };

  const addItem = (section) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], { name: '', cost: '' }]
    }));
  };

  const removeItem = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    const rawMaterialsTotal = formData.rawMaterials.reduce(
      (sum, material) => sum + (material.quantity * material.unitCost || 0),
      0
    );
    const laborTotal = formData.labor.hours * formData.labor.ratePerHour || 0;
    const overheadsTotal = formData.overheads.reduce(
      (sum, overhead) => sum + (overhead.cost || 0),
      0
    );
    const miscellaneousTotal = formData.miscellaneous.reduce(
      (sum, misc) => sum + (misc.cost || 0),
      0
    );

    return rawMaterialsTotal + laborTotal + overheadsTotal + miscellaneousTotal;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Filter out empty miscellaneous items
    const filteredMiscellaneous = formData.miscellaneous.filter(
      misc => misc.name.trim() !== '' && !isNaN(parseFloat(misc.cost)) && misc.cost !== ''
    );

    try {
      const response = await axios.post(
        'http://localhost:5000/api/ costs',
        {
          ...formData,
          rawMaterials: formData.rawMaterials.map(material => ({
            ...material,
            quantity: parseFloat(material.quantity) || 0,
            unitCost: parseFloat(material.unitCost) || 0,
            totalCost: material.quantity * material.unitCost
          })),
          labor: {
            hours: parseFloat(formData.labor.hours) || 0,
            ratePerHour: parseFloat(formData.labor.ratePerHour) || 0,
            totalCost: formData.labor.hours * formData.labor.ratePerHour
          },
          overheads: formData.overheads.map(overhead => ({
            ...overhead,
            cost: parseFloat(overhead.cost) || 0
          })),
          miscellaneous: filteredMiscellaneous
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save calculation');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    setError('');
    setTemplateMsg('');
    setLoading(true);
    const filteredMiscellaneous = formData.miscellaneous.filter(
      misc => misc.name.trim() !== '' && !isNaN(parseFloat(misc.cost)) && misc.cost !== ''
    );
    try {
      await axios.post(
        'http://localhost:5000/api/costs',
        {
          ...formData,
          rawMaterials: formData.rawMaterials.map(material => ({
            ...material,
            quantity: parseFloat(material.quantity) || 0,
            unitCost: parseFloat(material.unitCost) || 0,
            totalCost: material.quantity * material.unitCost
          })),
          labor: {
            hours: parseFloat(formData.labor.hours) || 0,
            ratePerHour: parseFloat(formData.labor.ratePerHour) || 0,
            totalCost: formData.labor.hours * formData.labor.ratePerHour
          },
          overheads: formData.overheads.map(overhead => ({
            ...overhead,
            cost: parseFloat(overhead.cost) || 0
          })),
          miscellaneous: filteredMiscellaneous,
          isTemplate: true
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setTemplateMsg('Template saved successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Cost Calculator
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>

            {/* Raw Materials */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Raw Materials
              </Typography>
              {formData.rawMaterials.map((material, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Material Name"
                        value={material.name || ''}
                        onChange={(e) => handleChange('rawMaterials', index, 'name', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Quantity"
                        type="number"
                        value={material.quantity || ''}
                        onChange={(e) => handleChange('rawMaterials', index, 'quantity', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Unit Cost (₹)"
                        type="number"
                        value={material.unitCost || ''}
                        onChange={(e) => handleChange('rawMaterials', index, 'unitCost', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <IconButton
                        color="error"
                        onClick={() => removeItem('rawMaterials', index)}
                        disabled={formData.rawMaterials.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => addItem('rawMaterials')}
                sx={{ mt: 1 }}
              >
                Add Material
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Labor */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Labor
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hours"
                    type="number"
                    value={formData.labor.hours || ''}
                    onChange={(e) => handleChange('labor', null, 'hours', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Rate per Hour (₹)"
                    type="number"
                    value={formData.labor.ratePerHour || ''}
                    onChange={(e) => handleChange('labor', null, 'ratePerHour', e.target.value)}
                    required
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Overheads */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Overheads
              </Typography>
              {formData.overheads.map((overhead, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="Overhead Name"
                        value={overhead.name || ''}
                        onChange={(e) => handleChange('overheads', index, 'name', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="Cost (₹)"
                        type="number"
                        value={overhead.cost || ''}
                        onChange={(e) => handleChange('overheads', index, 'cost', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <IconButton
                        color="error"
                        onClick={() => removeItem('overheads', index)}
                        disabled={formData.overheads.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => addItem('overheads')}
                sx={{ mt: 1 }}
              >
                Add Overhead
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Miscellaneous */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Miscellaneous
              </Typography>
              {formData.miscellaneous.map((misc, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="Item Name"
                        value={misc.name || ''}
                        onChange={(e) => handleChange('miscellaneous', index, 'name', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="Cost (₹)"
                        type="number"
                        value={misc.cost || ''}
                        onChange={(e) => handleChange('miscellaneous', index, 'cost', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <IconButton
                        color="error"
                        onClick={() => removeItem('miscellaneous', index)}
                        disabled={formData.miscellaneous.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => addItem('miscellaneous')}
                sx={{ mt: 1 }}
              >
                Add Item
              </Button>
            </Grid>

            {/* Total Cost */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                <Typography variant="h6">
                  Total Cost: ₹{calculateTotal().toLocaleString()}
                </Typography>
              </Paper>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12} container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Calculation'}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  fullWidth
                  disabled={loading}
                  onClick={handleSaveTemplate}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save as Template'}
                </Button>
              </Grid>
            </Grid>

            {templateMsg && (
              <Grid item xs={12}>
                <Alert severity="success" sx={{ mt: 2 }}>{templateMsg}</Alert>
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default CostCalculator; 