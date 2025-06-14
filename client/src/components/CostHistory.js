import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography, Box, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Export utility functions
function exportToCSV(data, filename = 'export.csv') {
  if (!data || !data.length) return;
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h] ?? '';
      return '"' + String(val).replace(/"/g, '""') + '"';
    });
    csvRows.push(values.join(','));
  }
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function exportToExcel(data, filename = 'export.xlsx') {
  if (!data || !data.length) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename);
}

function exportToPDF(data, filename = 'export.pdf', title = 'Exported Data') {
  if (!data || !data.length) return;
  const doc = new jsPDF();
  doc.text(title, 14, 16);
  const headers = [Object.keys(data[0])];
  const rows = data.map(row => headers[0].map(h => row[h]));
  autoTable(doc, { head: headers, body: rows, startY: 22 });
  doc.save(filename);
}

function flattenHistory(costs) {
  return costs.map(cost => ({
    TemplateName: cost.templateName,
    TotalCost: cost.totalCost,
    Quantity: cost.quantity,
    Date: new Date(cost.date).toLocaleString(),
    RawMaterials: cost.breakdown?.rawMaterials ?? '',
    Overheads: cost.breakdown?.overheads ?? '',
    LaborCharges: cost.breakdown?.labor ?? ''
  }));
}

function CostHistory() {
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editCost, setEditCost] = useState(null);
  const [editForm, setEditForm] = useState({ quantity: '', totalCost: '' });
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCosts(response.data);
    } catch (err) {
      setError('Failed to fetch cost history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/history/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchCosts();
    } catch (err) {
      setError('Failed to delete record');
    }
  };

  const handleEditOpen = (cost) => {
    setEditCost(cost);
    setEditForm({ quantity: cost.quantity, totalCost: cost.totalCost });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    try {
      await axios.put(`/api/history/${editCost._id}`, {
        quantity: editForm.quantity,
        totalCost: editForm.totalCost
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setEditCost(null);
      fetchCosts();
    } catch (err) {
      setError('Failed to update record');
    }
  };

  const handleExport = (format) => {
    const data = flattenHistory(costs);
    const filename = `calculation_history.${format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'}`;
    const title = 'Calculation History';
    if (format === 'csv') exportToCSV(data, filename);
    if (format === 'excel') exportToExcel(data, filename);
    if (format === 'pdf') exportToPDF(data, filename, title);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>Cost History</Typography>
      <Box display="flex" gap={2} mb={2}>
        <Button variant="outlined" color="primary" onClick={() => handleExport('csv')}>
          EXPORT AS CSV
        </Button>
        <Button variant="outlined" color="primary" onClick={() => handleExport('excel')}>
          EXPORT AS EXCEL
        </Button>
        <Button variant="outlined" color="primary" onClick={() => handleExport('pdf')}>
          EXPORT AS PDF
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Template Name</TableCell>
              <TableCell>Total Cost (₹)</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Date/Time</TableCell>
              <TableCell>Edit</TableCell>
              <TableCell>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {costs.map((cost) => (
              <TableRow key={cost._id}>
                <TableCell>{cost.templateName}</TableCell>
                <TableCell>₹{Number(cost.totalCost).toLocaleString()}</TableCell>
                <TableCell>{cost.quantity}</TableCell>
                <TableCell>{new Date(cost.date).toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditOpen(cost)} color="primary">
                    <EditIcon />
                  </IconButton>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleDelete(cost._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Edit Dialog */}
      <Dialog open={!!editCost} onClose={() => setEditCost(null)}>
        <DialogTitle>Edit Calculation</DialogTitle>
        <DialogContent>
          <TextField
            label="Quantity"
            name="quantity"
            type="number"
            value={editForm.quantity}
            onChange={handleEditChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Total Cost (₹)"
            name="totalCost"
            type="number"
            value={editForm.totalCost}
            onChange={handleEditChange}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditSave} color="primary" startIcon={<SaveIcon />}>Save</Button>
          <Button onClick={() => setEditCost(null)} color="secondary">Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CostHistory; 