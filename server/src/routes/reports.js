const express = require('express');
const router = express.Router();
const Cost = require('../models/Cost');
const { auth } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Generate report
router.post('/generate', auth, async (req, res) => {
  try {
    const { startDate, endDate, reportType, format } = req.body;
    const userId = req.user._id;

    // Fetch cost calculations within date range
    const costs = await Cost.find({
      createdBy: userId,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ createdAt: -1 });

    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=cost-report-${new Date().toISOString().split('T')[0]}.pdf`);
      doc.pipe(res);

      // Add report header
      doc.fontSize(20).text('Production Cost Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`);
      doc.moveDown();

      // Add report content based on type
      if (reportType === 'summary') {
        const totalCost = costs.reduce((sum, cost) => sum + cost.totalCost, 0);
        const avgCostPerUnit = totalCost / costs.length;

        doc.fontSize(14).text('Summary', { underline: true });
        doc.moveDown();
        doc.text(`Total Cost: $${totalCost.toLocaleString()}`);
        doc.text(`Average Cost per Unit: $${avgCostPerUnit.toLocaleString()}`);
        doc.text(`Number of Calculations: ${costs.length}`);
      } else if (reportType === 'detailed') {
        costs.forEach((cost, index) => {
          doc.fontSize(14).text(`Calculation ${index + 1}`, { underline: true });
          doc.moveDown();
          doc.text(`Name: ${cost.name}`);
          doc.text(`Description: ${cost.description}`);
          doc.text(`Total Cost: $${cost.totalCost.toLocaleString()}`);
          doc.text(`Date: ${new Date(cost.createdAt).toLocaleDateString()}`);
          doc.moveDown();
        });
      } else if (reportType === 'comparison') {
        // Group costs by month
        const monthlyCosts = {};
        costs.forEach(cost => {
          const month = new Date(cost.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
          if (!monthlyCosts[month]) {
            monthlyCosts[month] = [];
          }
          monthlyCosts[month].push(cost);
        });

        Object.entries(monthlyCosts).forEach(([month, monthCosts]) => {
          const monthTotal = monthCosts.reduce((sum, cost) => sum + cost.totalCost, 0);
          doc.fontSize(14).text(month, { underline: true });
          doc.moveDown();
          doc.text(`Total Cost: $${monthTotal.toLocaleString()}`);
          doc.text(`Number of Calculations: ${monthCosts.length}`);
          doc.moveDown();
        });
      }

      doc.end();
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Cost Report');

      // Add headers
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Total Cost', key: 'totalCost', width: 15 }
      ];

      // Add data
      costs.forEach(cost => {
        worksheet.addRow({
          date: new Date(cost.createdAt).toLocaleDateString(),
          name: cost.name,
          description: cost.description,
          totalCost: cost.totalCost
        });
      });

      // Style the header row
      worksheet.getRow(1).font = { bold: true };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=cost-report-${new Date().toISOString().split('T')[0]}.xlsx`);

      await workbook.xlsx.write(res);
    }
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Get report summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    const costs = await Cost.find({
      createdBy: userId,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    const totalCost = costs.reduce((sum, cost) => sum + cost.totalCost, 0);
    const averageCostPerUnit = totalCost / (costs.length || 1);

    res.json({
      totalCost,
      averageCostPerUnit,
      numberOfCalculations: costs.length
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ message: 'Error fetching summary' });
  }
});

module.exports = router; 