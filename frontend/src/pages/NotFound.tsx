import React from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

const NotFound: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ p: 6, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h1" sx={{ fontWeight: 900, color: 'primary.main', fontSize: '6rem', mb: 1 }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 380 }}>
          The requested educational resource or page does not exist or has been relocated.
        </Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
          sx={{ px: 4, py: 1.2 }}
        >
          Return to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;