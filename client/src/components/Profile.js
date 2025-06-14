import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Box, Typography, Paper, TextField, Button, Avatar, Alert, Switch, FormControlLabel, Select, MenuItem, CircularProgress, Snackbar, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const currencyOptions = [
  { label: 'Rupees (₹)', value: 'INR' },
  { label: 'Dollars ($)', value: 'USD' },
];

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

export default function Profile() {
  const [tab, setTab] = useState(0);

  // Profile Info State
  const [profile, setProfile] = useState({ name: '', email: '', avatar: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileInitialLoading, setProfileInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editMode, setEditMode] = useState(false);
  const [editProfile, setEditProfile] = useState({ name: '', email: '' });

  // Change Password State
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Preferences State
  const [currency, setCurrency] = useState('INR');
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);
  const [locale, setLocale] = useState('en-IN');
  const [prefMsg, setPrefMsg] = useState('');

  // Activity Log State (mock)
  const [activityLog] = useState([
    { action: 'Logged in', date: '2024-06-01 10:00' },
    { action: 'Created a calculation', date: '2024-06-01 10:05' },
    { action: 'Saved a template', date: '2024-06-01 10:10' },
  ]);

  // API Keys State (mock)
  const [apiKeys, setApiKeys] = useState([
    { key: '1234-5678-ABCD', created: '2024-06-01', active: true },
  ]);
  const [apiMsg, setApiMsg] = useState('');

  // Account Management State
  const [accountMsg, setAccountMsg] = useState('');

  // Add templates state
  const [templates, setTemplates] = useState([]);

  // Fetch profile info on mount
  useEffect(() => {
    setProfileInitialLoading(true);
    axios.get('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => {
        setProfile({ name: res.data.name, email: res.data.email, avatar: res.data.avatar || '' });
        setEditProfile({ name: res.data.name, email: res.data.email });
      })
      .catch(() => setProfileError('Failed to load profile'))
      .finally(() => setProfileInitialLoading(false));
  }, []);

  // Fetch preferences on mount
  useEffect(() => {
    axios.get('http://localhost:5000/api/auth/preferences', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        setCurrency(res.data.currency || 'INR');
        setTheme(res.data.theme || 'light');
        setNotifications(typeof res.data.notifications === 'boolean' ? res.data.notifications : true);
        setLocale(res.data.locale || 'en-IN');
      })
      .catch(() => setPrefMsg('Failed to load preferences'));
  }, []);

  // Fetch templates on mount
  useEffect(() => {
    axios.get('/api/templates')
      .then(res => setTemplates(res.data))
      .catch(() => {});
  }, []);

  const handleProfileChange = (e) => {
    setEditProfile({ ...editProfile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfile((prev) => ({ ...prev, avatar: ev.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async () => {
    setProfileMsg(''); setProfileError(''); setProfileLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', editProfile.name);
      formData.append('email', editProfile.email);
      if (avatarFile) formData.append('avatar', avatarFile);
      const res = await axios.put('http://localhost:5000/api/auth/me', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfile({ ...profile, name: editProfile.name, email: editProfile.email, avatar: res.data.user.avatar });
      setAvatarFile(null);
      setEditMode(false);
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
    } catch (err) {
      setProfileError('Failed to update profile');
      setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditProfile({ name: profile.name, email: profile.email });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditProfile({ name: profile.name, email: profile.email });
    setEditMode(false);
  };

  const handlePwChange = (e) => {
    setPwForm({ ...pwForm, [e.target.name]: e.target.value });
  };

  const handlePwSave = async () => {
    setPwMsg(''); setPwError(''); setPwLoading(true);
    if (pwForm.new !== pwForm.confirm) {
      setPwError('New passwords do not match');
      setPwLoading(false);
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/auth/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.new
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPwMsg('Password changed successfully!');
      setPwForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handlePrefSave = async () => {
    setPrefMsg('');
    try {
      await axios.put('http://localhost:5000/api/auth/preferences', {
        currency,
        theme,
        notifications,
        locale
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPrefMsg('Preferences saved!');
    } catch (err) {
      setPrefMsg('Failed to save preferences');
    }
    setTimeout(() => setPrefMsg(''), 1500);
  };

  const handleGenerateApiKey = () => {
    setApiKeys([...apiKeys, { key: Math.random().toString(36).slice(2, 18), created: new Date().toISOString().slice(0, 10), active: true }]);
    setApiMsg('API Key generated!');
    setTimeout(() => setApiMsg(''), 1500);
  };

  const handleRevokeApiKey = (key) => {
    setApiKeys(apiKeys.filter(k => k.key !== key));
    setApiMsg('API Key revoked!');
    setTimeout(() => setApiMsg(''), 1500);
  };

  const handleDeleteAccount = () => {
    setAccountMsg('Account deleted (mock).');
    setTimeout(() => setAccountMsg(''), 2000);
  };

  // Gather all profile data for export
  const getAllProfileData = () => {
    const profileData = {
      Section: 'Profile Info',
      Name: profile.name,
      Email: profile.email,
      Avatar: profile.avatar || ''
    };
    const preferencesData = {
      Section: 'Preferences',
      Currency: currency,
      Theme: theme,
      Notifications: notifications ? 'Yes' : 'No',
      Locale: locale
    };
    const activityRows = activityLog.map(log => ({
      Section: 'Activity Log',
      Action: log.action,
      Date: log.date
    }));
    const apiKeyRows = apiKeys.map(key => ({
      Section: 'API Key',
      Key: key.key,
      Created: key.created,
      Active: key.active ? 'Yes' : 'No'
    }));
    return [profileData, preferencesData, ...activityRows, ...apiKeyRows];
  };

  // Gather all templates data for export
  const getAllTemplatesData = () => {
    const rows = [];
    templates.forEach(template => {
      const rawMaterials = template.rawMaterials || [];
      const overheads = template.overheads || [];
      const labor = template.laborCharges || template.labor || {};
      const maxRows = Math.max(rawMaterials.length, overheads.length, 1);
      for (let i = 0; i < maxRows; i++) {
        const rm = rawMaterials[i] || {};
        const oh = overheads[i] || {};
        rows.push({
          TemplateName: template.name,
          Description: template.description,
          Category: template.category,
          EstimatedLaborHours: template.estimatedLaborHours,
          TotalCost: template.totalCost || 0,
          // Raw Material fields
          RawMaterialName: rm.material?.name || rm.name || '',
          RawMaterialQty: rm.quantity || '',
          RawMaterialUnit: rm.material?.unit || rm.unit || '',
          RawMaterialCostPerUnit: rm.material?.costPerUnit || rm.costPerUnit || '',
          RawMaterialTotal: rm.material?.costPerUnit && rm.quantity ? (rm.material.costPerUnit * rm.quantity) : '',
          // Overhead fields
          OverheadName: oh.overhead?.name || oh.name || '',
          OverheadType: oh.overhead?.type || oh.type || '',
          OverheadCost: oh.overhead?.cost || oh.cost || '',
          OverheadAllocation: oh.allocation || '',
          OverheadAllocatedCost: oh.overhead?.cost && oh.allocation ? (oh.overhead.cost * oh.allocation / 100) : '',
          // Labor fields
          LaborRate: labor.rate || labor.laborRate || '',
          LaborWorkers: labor.workers || labor.numberOfWorkers || '',
          LaborHours: labor.hours || template.estimatedLaborHours || '',
          LaborTotal: labor.total || '',
        });
      }
    });
    return rows;
  };

  const handleExport = (format, type = 'profile') => {
    let data = [];
    let filename = '';
    let title = '';
    if (type === 'profile') {
      data = getAllProfileData();
      filename = `profile_all.${format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'}`;
      title = 'Profile Data';
    } else if (type === 'templates') {
      data = getAllTemplatesData();
      filename = `all_templates.${format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'}`;
      title = 'All Templates';
    }
    if (format === 'csv') exportToCSV(data, filename);
    if (format === 'excel') exportToExcel(data, filename);
    if (format === 'pdf') exportToPDF(data, filename, title);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>Profile</Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Profile Info" />
          <Tab label="Change Password" />
          <Tab label="Preferences" />
          <Tab label="Activity Log" />
          <Tab label="Export Data" />
          <Tab label="API Keys" />
          <Tab label="Account Management" />
        </Tabs>
        <TabPanel value={tab} index={0}>
          <Typography variant="h6" gutterBottom>Profile Info</Typography>
          {profileInitialLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography>Loading profile...</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 64, height: 64, mr: 2 }} src={profile.avatar} />
                <Button variant="outlined" component="label">
                  Upload Picture
                  <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                </Button>
                {/* Placeholder for avatar cropper */}
              </Box>
              {editMode ? (
                <>
                  <TextField
                    label="Name"
                    name="name"
                    value={editProfile.name}
                    onChange={handleProfileChange}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Email"
                    name="email"
                    value={editProfile.email}
                    onChange={handleProfileChange}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleProfileSave}
                      disabled={profileLoading}
                      startIcon={<CheckIcon />}
                    >
                      {profileLoading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleCancelEdit}
                      startIcon={<CloseIcon />}
                    >
                      Cancel
                    </Button>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1"><strong>Name:</strong> {profile.name}</Typography>
                  <Typography variant="body1"><strong>Email:</strong> {profile.email}</Typography>
                  <IconButton color="primary" onClick={handleEditClick}><EditIcon /></IconButton>
                </Box>
              )}
              {profileMsg && <Alert severity="success" sx={{ mt: 2 }}>{profileMsg}</Alert>}
              {profileError && <Alert severity="error" sx={{ mt: 2 }}>{profileError}</Alert>}
            </>
          )}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            message={snackbar.message}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            ContentProps={{ sx: { bgcolor: snackbar.severity === 'success' ? 'success.main' : 'error.main', color: 'white' } }}
          />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <Typography variant="h6" gutterBottom>Change Password</Typography>
          <TextField
            label="Current Password"
            name="current"
            type="password"
            value={pwForm.current}
            onChange={handlePwChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="New Password"
            name="new"
            type="password"
            value={pwForm.new}
            onChange={handlePwChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Confirm New Password"
            name="confirm"
            type="password"
            value={pwForm.confirm}
            onChange={handlePwChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" onClick={handlePwSave} disabled={pwLoading}>
            {pwLoading ? 'Saving...' : 'Change Password'}
          </Button>
          {pwMsg && <Alert severity="success" sx={{ mt: 2 }}>{pwMsg}</Alert>}
          {pwError && <Alert severity="error" sx={{ mt: 2 }}>{pwError}</Alert>}
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <Typography variant="h6" gutterBottom>Preferences</Typography>
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={<Select value={currency} onChange={e => setCurrency(e.target.value)} size="small">
                {currencyOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </Select>}
              label="Currency"
              labelPlacement="start"
              sx={{ mr: 3 }}
            />
            <FormControlLabel
              control={<Switch checked={theme === 'dark'} onChange={e => setTheme(e.target.checked ? 'dark' : 'light')} />}
              label="Dark Mode"
              labelPlacement="start"
              sx={{ mr: 3 }}
            />
            <FormControlLabel
              control={<Switch checked={notifications} onChange={e => setNotifications(e.target.checked)} />}
              label="Notifications"
              labelPlacement="start"
            />
          </Box>
          <TextField
            label="Locale (e.g. en-IN, en-US)"
            value={locale}
            onChange={e => setLocale(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" onClick={handlePrefSave}>
            Save Preferences
          </Button>
          {prefMsg && <Alert severity="success" sx={{ mt: 2 }}>{prefMsg}</Alert>}
        </TabPanel>
        <TabPanel value={tab} index={3}>
          <Typography variant="h6" gutterBottom>Activity Log</Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
            {activityLog.map((log, idx) => (
              <Typography key={idx} variant="body2">{log.date}: {log.action}</Typography>
            ))}
          </Box>
        </TabPanel>
        <TabPanel value={tab} index={4}>
          <Typography variant="h6" gutterBottom>Export Data</Typography>
          <Box display="flex" gap={2}>
            <Button variant="outlined" color="primary" onClick={() => handleExport('csv', 'profile')}>
              EXPORT PROFILE AS CSV
            </Button>
            <Button variant="outlined" color="primary" onClick={() => handleExport('excel', 'profile')}>
              EXPORT PROFILE AS EXCEL
            </Button>
            <Button variant="outlined" color="primary" onClick={() => handleExport('pdf', 'profile')}>
              EXPORT PROFILE AS PDF
            </Button>
          </Box>
        </TabPanel>
        <TabPanel value={tab} index={5}>
          <Typography variant="h6" gutterBottom>API Keys</Typography>
          <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={handleGenerateApiKey}>Generate API Key</Button>
          {apiMsg && <Alert severity="success" sx={{ mb: 2 }}>{apiMsg}</Alert>}
          <Box>
            {apiKeys.map((k, idx) => (
              <Box key={k.key} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 2 }}>{k.key} (created: {k.created})</Typography>
                <Button size="small" color="error" onClick={() => handleRevokeApiKey(k.key)}>Revoke</Button>
              </Box>
            ))}
          </Box>
        </TabPanel>
        <TabPanel value={tab} index={6}>
          <Typography variant="h6" gutterBottom>Account Management</Typography>
          <Button variant="contained" color="error" onClick={handleDeleteAccount}>Delete Account</Button>
          {accountMsg && <Alert severity="success" sx={{ mt: 2 }}>{accountMsg}</Alert>}
        </TabPanel>
      </Paper>
    </Container>
  );
} 