import { Box, Button, TextField, Typography, Link } from '@mui/material';
import { useState } from 'react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // In a real app, we'd call Supabase auth API here
    // For now, we'll simulate a successful login
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Set auth state (in real app, we'd get token from Supabase)
      localStorage.setItem('token', 'fake-jwt-token');
      // In a real app, we'd also set user role based on auth response

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 8, width: '100%', maxWidth: 400 }}>
      <Typography component="h1" variant="h4" align="center" mb={4}>
        AI Tutor Login
      </Typography>

      {error && (
        <Box color="error.text" mb={2}>
          {error}
        </Box>
      )}

      <TextField
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        mb={2}
        autoFocus
      />

      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        mb={3}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      <Box mt={3}>
        <Typography variant="body2" color="text.secondary" align="center">
          Don't have an account?{' '}
          <Link href="/register" color="primary">
            Register here
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;