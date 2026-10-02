import { Box, Button, Typography } from '@mui/material';

const NotFound: React.FC = () => {
  return (
    <Box sx={{ p: 4, textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        The page you are looking for does not exist.
      </Typography>
      <Button variant="contained" color="primary" component="a" href="/">
        Go Home
      </Button>
    </Box>
  );
};

export default NotFound;