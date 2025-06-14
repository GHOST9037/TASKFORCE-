import React from 'react';
import { Container, Typography } from '@mui/material';

function AdminPanel() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>
      <Typography>
        Welcome to the admin panel. Here you can manage users and view system statistics.
      </Typography>
      {/* Add admin features here */}
    </Container>
  );
}

export default AdminPanel; 