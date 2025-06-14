import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Paper
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ level: '', text: 'None' });

  useEffect(() => {
    document.body.style.background = '#000';
    return () => { document.body.style.background = ''; };
  }, []);

  useEffect(() => {
    const password = form.password;
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    let level = '', text = 'None';
    if (strength > 0) {
      if (strength <= 20) { level = 'weak'; text = 'Weak'; }
      else if (strength <= 40) { level = 'medium'; text = 'Medium'; }
      else if (strength <= 60) { level = 'strong'; text = 'Strong'; }
      else if (strength <= 80) { level = 'very-strong'; text = 'Very Strong'; }
      else { level = 'excellent'; text = 'Excellent'; }
    }
    setPasswordStrength({ level, text });
  }, [form.password]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!form.terms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setLoading(true);
    try {
      const name = form.firstName + ' ' + form.lastName;
      await register(name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const strengthClass = `strength-meter${passwordStrength.level ? ' ' + passwordStrength.level : ''}`;

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            bgcolor: '#1a1a1a',
            color: '#fff',
            borderRadius: 3,
            boxShadow: '0 10px 15px rgba(0,255,157,0.2)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Typography component="h1" variant="h5" fontWeight={700} color="#00ff9d">
            Sign up
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoComplete="given-name"
              autoFocus
              value={form.firstName}
              onChange={handleChange}
              InputProps={{ style: { color: '#fff', fontFamily: 'Inter, sans-serif' } }}
              InputLabelProps={{ style: { color: '#e6e6e6' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#333' },
                  '&:hover fieldset': { borderColor: '#00ff9d' },
                  '&.Mui-focused fieldset': { borderColor: '#00ff9d' },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              value={form.lastName}
              onChange={handleChange}
              InputProps={{ style: { color: '#fff', fontFamily: 'Inter, sans-serif' } }}
              InputLabelProps={{ style: { color: '#e6e6e6' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#333' },
                  '&:hover fieldset': { borderColor: '#00ff9d' },
                  '&.Mui-focused fieldset': { borderColor: '#00ff9d' },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              InputProps={{ style: { color: '#fff', fontFamily: 'Inter, sans-serif' } }}
              InputLabelProps={{ style: { color: '#e6e6e6' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#333' },
                  '&:hover fieldset': { borderColor: '#00ff9d' },
                  '&.Mui-focused fieldset': { borderColor: '#00ff9d' },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              InputProps={{ style: { color: '#fff', fontFamily: 'Inter, sans-serif' } }}
              InputLabelProps={{ style: { color: '#e6e6e6' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#333' },
                  '&:hover fieldset': { borderColor: '#00ff9d' },
                  '&.Mui-focused fieldset': { borderColor: '#00ff9d' },
                },
              }}
            />
            <div className="password-strength" style={{ marginBottom: 16 }}>
              <div className={strengthClass}></div>
              <div className="strength-text" style={{ color: '#e6e6e6', fontSize: '0.9rem' }}>Password strength: <span>{passwordStrength.text}</span></div>
            </div>
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              InputProps={{ style: { color: '#fff', fontFamily: 'Inter, sans-serif' } }}
              InputLabelProps={{ style: { color: '#e6e6e6' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#333' },
                  '&:hover fieldset': { borderColor: '#00ff9d' },
                  '&.Mui-focused fieldset': { borderColor: '#00ff9d' },
                },
              }}
            />
            <div className="terms" style={{ margin: '16px 0' }}>
              <label className="checkbox-label" style={{ color: '#e6e6e6' }}>
                <input
                  type="checkbox"
                  name="terms"
                  checked={form.terms}
                  onChange={handleChange}
                  required
                  style={{ accentColor: '#00ff9d', marginRight: 8 }}
                />
                <span>
                  I agree to the <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: '#00ff9d' }}>Terms of Service</a> and <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: '#00ff9d' }}>Privacy Policy</a>
                </span>
              </label>
            </div>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, bgcolor: '#00ff9d', color: '#000', fontWeight: 700, '&:hover': { bgcolor: '#00cc7e' } }}
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2" sx={{ color: '#00ff9d', fontWeight: 600 }}>
                {"Already have an account? Sign In"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Register; 