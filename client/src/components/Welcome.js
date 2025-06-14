import React from 'react';
import { Button, Box, Typography, Container, Stack } from '@mui/material';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Welcome() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #000 60%, #00ff9d 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            bgcolor: 'rgba(26,26,26,0.95)',
            borderRadius: 4,
            p: 5,
            boxShadow: 6,
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" fontWeight={800} color="#00ff9d" gutterBottom>
            SmartCalc AI
          </Typography>
          <Typography variant="h5" color="white" gutterBottom>
            Welcome to Smart Production Cost Calculator
          </Typography>
          <Typography color="#e6e6e6" mb={4}>
            Optimize your production costs with advanced AI insights. Sign in or create an account to get started!
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="large"
              sx={{ bgcolor: '#00ff9d', color: '#000', fontWeight: 700, '&:hover': { bgcolor: '#00cc7e' } }}
            >
              Login
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              variant="outlined"
              size="large"
              sx={{ borderColor: '#00ff9d', color: '#00ff9d', fontWeight: 700, '&:hover': { borderColor: '#00cc7e', color: '#00cc7e' } }}
            >
              Register
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
} 