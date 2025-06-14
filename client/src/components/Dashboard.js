import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [barView, setBarView] = useState('template'); // 'template' or 'date'
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('/api/history', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setHistory(response.data);
      } catch (error) {
        setError('Failed to fetch dashboard data');
        console.error('Dashboard data error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Aggregate by template name
  const templateTotals = history.reduce((acc, entry) => {
    acc[entry.templateName] = (acc[entry.templateName] || 0) + entry.totalCost;
    return acc;
  }, {});
  const templateBarData = {
    labels: Object.keys(templateTotals),
    datasets: [
      {
        label: 'Total Cost',
        data: Object.values(templateTotals),
        backgroundColor: '#1976d2',
      }
    ]
  };

  // By date/time (each calculation as a bar)
  const dateBarData = {
    labels: history.map(entry => new Date(entry.date).toLocaleString()),
    datasets: [
      {
        label: 'Total Cost',
        data: history.map(entry => entry.totalCost),
        backgroundColor: '#dc004e',
      }
    ]
  };

  // Find all unique template names
  const templateNames = Array.from(new Set(history.map(h => h.templateName)));

  // When template is selected, find the most recent calculation for that template
  useEffect(() => {
    if (!selectedTemplate) {
      setSelectedBreakdown(null);
      return;
    }
    // Find the most recent calculation for the selected template
    const filtered = history.filter(h => h.templateName === selectedTemplate);
    if (filtered.length === 0) {
      setSelectedBreakdown(null);
      return;
    }
    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    // If breakdown is stored, use it; else, show null
    const breakdown = filtered[0].breakdown || null;
    setSelectedBreakdown(breakdown);
  }, [selectedTemplate, history]);

  // Pie chart data for selected breakdown (for Recharts)
  const selectedCalculation = history
    .filter(h => h.templateName === selectedTemplate && h.breakdown)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const pieData = selectedCalculation
    ? [
        { name: 'Raw Materials', value: selectedCalculation.breakdown.rawMaterials || 0 },
        { name: 'Overheads', value: selectedCalculation.breakdown.overheads || 0 },
        { name: 'Labor', value: selectedCalculation.breakdown.labor || 0 }
      ]
    : [];
  const COLORS = ['#FF6384', '#FFCE56', '#36A2EB'];

  // Debug logs
  console.log('Selected Template:', selectedTemplate);
  console.log('Selected Calculation:', selectedCalculation);
  console.log('Pie Data:', pieData);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h1" variant="h4" color="primary" gutterBottom>
              Welcome, {user.name}!
            </Typography>
            <Typography variant="subtitle1">
              Here's your production cost overview
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant={chartType === 'bar' ? 'contained' : 'outlined'}
              onClick={() => setChartType('bar')}
              sx={{ mr: 1 }}
            >
              Bar Graph
            </Button>
            <Button
              variant={chartType === 'pie' ? 'contained' : 'outlined'}
              onClick={() => setChartType('pie')}
            >
              Pie Chart
            </Button>
          </Box>
          {chartType === 'bar' ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant={barView === 'template' ? 'contained' : 'outlined'}
                  onClick={() => setBarView('template')}
                  sx={{ mr: 1 }}
                >
                  By Template
                </Button>
                <Button
                  variant={barView === 'date' ? 'contained' : 'outlined'}
                  onClick={() => setBarView('date')}
                >
                  By Date/Time
                </Button>
              </Box>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Total Production Cost ({barView === 'template' ? 'By Template' : 'By Date/Time'})
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={barView === 'template'
                        ? Object.keys(templateTotals).map(name => ({
                            name,
                            totalCost: templateTotals[name]
                          }))
                        : history.map(entry => ({
                            name: new Date(entry.date).toLocaleString(),
                            totalCost: entry.totalCost
                          }))
                      }
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalCost" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </>
          ) : (
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Template Cost Breakdown
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Template</InputLabel>
                <Select
                  value={selectedTemplate}
                  label="Select Template"
                  onChange={e => setSelectedTemplate(e.target.value)}
                >
                  {templateNames.map(name => (
                    <MenuItem key={name} value={name}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedTemplate && selectedCalculation ? (
                <Box sx={{ flex: 1, minHeight: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <Typography align="center" sx={{ mt: 2 }}>
                    Total Cost: ₹{pieData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                  </Typography>
                </Box>
              ) : selectedTemplate ? (
                <Typography align="center" color="textSecondary">
                  No breakdown data available for this template.
                </Typography>
              ) : (
                <Typography align="center" color="textSecondary">
                  Please select a template to view breakdown.
                </Typography>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard; 