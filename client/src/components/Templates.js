import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Templates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [calculationDialog, setCalculationDialog] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [laborInputs, setLaborInputs] = useState({
    laborRate: '',
    numberOfWorkers: ''
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/templates');
      setTemplates(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch templates');
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    try {
      const response = await axios.post(
        `/api/templates/${selectedTemplate._id}/calculate`,
        {
          laborRate: parseFloat(laborInputs.laborRate),
          numberOfWorkers: parseInt(laborInputs.numberOfWorkers),
          quantity: parseInt(quantity)
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setCalculationResult(response.data);
    } catch (err) {
      setError('Failed to calculate cost');
    }
  };

  const handleSaveCalculation = async () => {
    if (!calculationResult || !selectedTemplate) return;
    const payload = {
      templateName: selectedTemplate.name,
      totalCost: calculationResult.total.totalCost,
      quantity: calculationResult.quantity,
      breakdown: {
        rawMaterials: calculationResult.total.rawMaterials?.total ?? calculationResult.total.rawMaterials ?? 0,
        overheads: calculationResult.total.overheads?.total ?? calculationResult.total.overheads ?? 0,
        labor: calculationResult.total.labor?.total ?? calculationResult.total.labor ?? 0
      }
    };
    try {
      const response = await axios.post(
        `/api/templates/${selectedTemplate._id}/save`,
        payload,
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      );
      alert("Calculation saved in history.");
    } catch (err) {
      console.error(err);
      alert("Failed to save calculation.");
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setCalculationDialog(true);
    setCalculationResult(null);
    setLaborInputs({ laborRate: '', numberOfWorkers: '' });
    setQuantity(1);
  };

  const handleCloseDialog = () => {
    setCalculationDialog(false);
    setSelectedTemplate(null);
    setCalculationResult(null);
  };

  // Filter templates by search term
  const filteredTemplates = searchTerm.trim() === ""
    ? []
    : templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Product Templates
      </Typography>
      <TextField
        label="Search templates"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />
      <Grid container spacing={3}>
        {searchTerm.trim() === "" ? (
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary" align="center">
              Please enter a search term to find templates.
            </Typography>
          </Grid>
        ) : filteredTemplates.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary" align="center">
              No templates found for "{searchTerm}".
            </Typography>
          </Grid>
        ) : (
          filteredTemplates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {template.name}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Category: {template.category}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {template.description}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Estimated Labor Hours: {template.estimatedLaborHours}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    Calculate Cost
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog
        open={calculationDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Calculate Cost – {selectedTemplate?.name}</DialogTitle>
        <DialogContent>
          {!calculationResult ? (
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Labor Rate per Hour"
                type="number"
                fullWidth
                margin="normal"
                value={laborInputs.laborRate}
                onChange={(e) => setLaborInputs({
                  ...laborInputs,
                  laborRate: e.target.value
                })}
              />
              <TextField
                label="Number of Workers"
                type="number"
                fullWidth
                margin="normal"
                value={laborInputs.numberOfWorkers}
                onChange={(e) => setLaborInputs({
                  ...laborInputs,
                  numberOfWorkers: e.target.value
                })}
              />
              <TextField
                label="Quantity to Produce"
                type="number"
                fullWidth
                margin="normal"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                inputProps={{ min: 1 }}
              />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Cost Breakdown
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Per Unit Cost
              </Typography>
              {/* Per Unit Cost Tables */}
              {/* Raw Materials Table */}
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Cost/Unit</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculationResult.perUnit.rawMaterials.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>₹{item.costPerUnit.toFixed(2)}</TableCell>
                        <TableCell>₹{item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <strong>Raw Materials Total:</strong>
                      </TableCell>
                      <TableCell>
                        <strong>₹{calculationResult.perUnit.rawMaterials.total.toFixed(2)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Overheads Table */}
              <Typography variant="subtitle1" gutterBottom>
                Overheads
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Overhead</TableCell>
                      <TableCell>Allocation %</TableCell>
                      <TableCell>Base Cost</TableCell>
                      <TableCell>Allocated Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculationResult.perUnit.overheads.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.allocation}%</TableCell>
                        <TableCell>₹{item.cost.toFixed(2)}</TableCell>
                        <TableCell>₹{item.allocatedCost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <strong>Overheads Total:</strong>
                      </TableCell>
                      <TableCell>
                        <strong>₹{calculationResult.perUnit.overheads.total.toFixed(2)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Labor Table */}
              <Typography variant="subtitle1" gutterBottom>
                Labor
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Rate per Hour</TableCell>
                      <TableCell>₹{calculationResult.perUnit.labor.rate.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Number of Workers</TableCell>
                      <TableCell>{calculationResult.perUnit.labor.workers}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Hours</TableCell>
                      <TableCell>{calculationResult.perUnit.labor.hours}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Labor Total</strong></TableCell>
                      <TableCell><strong>₹{calculationResult.perUnit.labor.total.toFixed(2)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="subtitle1" gutterBottom>
                Per Unit Total Cost: ₹{calculationResult.perUnit.totalCost.toFixed(2)}
              </Typography>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Total for {calculationResult.quantity} Units
              </Typography>
              {/* Total Cost Tables */}
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Raw Materials</TableCell>
                      <TableCell>Overheads</TableCell>
                      <TableCell>Labor</TableCell>
                      <TableCell>Total Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>₹{calculationResult.total.rawMaterials.toFixed(2)}</TableCell>
                      <TableCell>₹{calculationResult.total.overheads.toFixed(2)}</TableCell>
                      <TableCell>₹{calculationResult.total.labor.toFixed(2)}</TableCell>
                      <TableCell><strong>₹{calculationResult.total.totalCost.toFixed(2)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Grand Total Cost for {calculationResult.quantity} Units: ₹{calculationResult.total.totalCost.toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!calculationResult ? (
            <>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                onClick={handleCalculate}
                variant="contained"
                color="primary"
                disabled={!laborInputs.laborRate || !laborInputs.numberOfWorkers}
              >
                Calculate
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setCalculationResult(null)}>New Calculation</Button>
              <Button onClick={handleSaveCalculation} color="primary">Save Calculation</Button>
              <Button onClick={handleCloseDialog}>Close</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Templates; 