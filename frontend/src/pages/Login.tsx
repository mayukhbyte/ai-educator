import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Container,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { authAPI } from '../services/api';

const REAL_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const DEMO_FACULTY_EMAIL = 'demo.faculty@aieducator.com';
const DEMO_FACULTY_PASSWORD = 'DemoFaculty!2026';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0); // 0 = Login, 1 = Register

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');
  const [facultyCode, setFacultyCode] = useState('');
  const [regClassLevel, setRegClassLevel] = useState<number>(10);
  const [regSection, setRegSection] = useState('Section A (Maths & Science)');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const storeSession = (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('user_role', user?.role || 'student');
    localStorage.setItem('user_name', user?.name || user?.email?.split('@')[0] || 'Student');
    localStorage.setItem('user_email', user?.email || '');
    if (user?.studentId) {
      localStorage.setItem('student_id', user.studentId);
    } else {
      localStorage.removeItem('student_id');
    }
    window.dispatchEvent(new Event('auth-changed'));
  };

  // Handle Real Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const email = loginEmail.trim();
    const password = loginPassword;

    if (!email || !password) {
      setError('Please provide both your registered email address and password.');
      return;
    }

    if (!REAL_EMAIL_REGEX.test(email)) {
      setError('Invalid email format. Please enter a valid real email address (e.g. name@domain.com).');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.login(email, password);
      if (!res?.data?.token) throw new Error('Supabase did not return a sign-in session.');
      storeSession(res.data.token, res.data.user);
      setSuccessMsg('Sign-in successful! Redirecting to your dashboard...');
      setTimeout(() => navigate(res.data.user?.role === 'teacher' ? '/teacher' : '/student'), 700);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message ||
        err?.message || 'Could not sign in. Please try again.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Real Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const name = regName.trim();
    const email = regEmail.trim();
    const password = regPassword;

    if (!name || !email || !password) {
      setError('Full name, real email address, and password are required.');
      return;
    }

    if (!REAL_EMAIL_REGEX.test(email)) {
      setError('Please enter a valid real email address (e.g. yourname@domain.com).');
      return;
    }

    if (password.trim().length === 0 || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (regRole === 'teacher' && !facultyCode.trim()) {
        setError('Enter the faculty access code to register a teacher account.');
        return;
      }
      const res = await authAPI.signup({
        name,
        email,
        password,
        role: regRole,
        classLevel: regClassLevel,
        section: regSection,
        facultyCode: regRole === 'teacher' ? facultyCode : undefined,
      });
      if (!res?.data?.token) throw new Error('Supabase did not return a sign-in session.');
      storeSession(res.data.token, res.data.user);
      setSuccessMsg('Account registered successfully! Loading your dashboard...');
      setTimeout(() => navigate(res.data.user?.role === 'teacher' ? '/teacher' : '/student'), 800);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || '';
      if (err?.response?.status === 409 && /already registered/i.test(serverMsg)) {
        setLoginEmail(email);
        setTabIndex(0);
        setError('This email is already registered. Sign in using the account password.');
        return;
      }
      const fallbackMsg = serverMsg ||
        err?.message || 'Registration failed. Please try again.';
      setError(fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 6 }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Header Banner */}
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            color: '#fff',
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
              backdropFilter: 'blur(4px)',
            }}
          >
            {tabIndex === 0 ? <LockOutlinedIcon sx={{ fontSize: 28 }} /> : <PersonAddIcon sx={{ fontSize: 28 }} />}
          </Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.3px' }}>
            {tabIndex === 0 ? 'Sign In' : 'Create an Account'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {tabIndex === 0
              ? 'Use the email and password you registered with'
              : 'Create an account to access your dashboard'}
          </Typography>
        </Box>

        {/* Tabs: Sign In vs Sign Up */}
        <Paper square elevation={0} sx={{ borderBottom: '1px solid #e2e8f0' }}>
          <Tabs
            value={tabIndex}
            onChange={(_, val) => {
              setTabIndex(val);
              setError(null);
              setSuccessMsg(null);
            }}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{ '& .MuiTab-root': { fontWeight: 700, py: 1.8 } }}
          >
            <Tab label="Sign In" />
            <Tab label="Register New Account" />
          </Tabs>
        </Paper>

        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}

          {successMsg && (
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3, borderRadius: 2 }}>
              {successMsg}
            </Alert>
          )}

          {/* ========================================================= */}
          {/* TAB 0: REAL SIGN IN FORM                                 */}
          {/* ========================================================= */}
          {tabIndex === 0 && (
            <Box component="form" onSubmit={handleLoginSubmit} noValidate>
              <TextField
                label="Email address"
                type="email"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                fullWidth
                sx={{ mb: 2.5 }}
                autoFocus
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your secure password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                fullWidth
                sx={{ mb: 3 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  py: 1.4,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  bgcolor: '#2563eb',
                  '&:hover': { bgcolor: '#1d4ed8' },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mt: 2.5,
                  bgcolor: '#f8fafc',
                  borderRadius: 2.5,
                  border: '1px solid #e2e8f0',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Sign in with your registered Supabase Auth email and password.
                </Typography>
                <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e3a8a' }}>
                    Hackathon Faculty Demo
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Email: <strong>{DEMO_FACULTY_EMAIL}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Password: <strong>{DEMO_FACULTY_PASSWORD}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Shared demo account. Activity may be visible to other visitors.
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => {
                      setLoginEmail(DEMO_FACULTY_EMAIL);
                      setLoginPassword(DEMO_FACULTY_PASSWORD);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    sx={{ textTransform: 'none', fontWeight: 700, px: 0, mt: 0.5 }}
                  >
                    Fill faculty demo sign-in
                  </Button>
                </Box>
                <Button
                  size="small"
                  onClick={() => {
                    setRegRole('teacher');
                    setTabIndex(1);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  sx={{ textTransform: 'none', fontWeight: 700, px: 0 }}
                >
                  Register a faculty account
                </Button>
              </Paper>
            </Box>
          )}

          {/* ========================================================= */}
          {/* TAB 1: REAL REGISTRATION FORM                            */}
          {/* ========================================================= */}
          {tabIndex === 1 && (
            <Box component="form" onSubmit={handleRegisterSubmit} noValidate>
              <TextField
                label="Full Name"
                placeholder="e.g. Aarav Sharma or Dr. Sarah"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                fullWidth
                sx={{ mb: 2 }}
                autoFocus
              />

              <TextField
                label="Real Email Address"
                type="email"
                placeholder="e.g. aarav.sharma@gmail.com or faculty@school.edu"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                fullWidth
                sx={{ mb: 2 }}
                helperText="Must be a valid genuine email address"
              />

              <TextField
                label="Create Password (Min 6 characters)"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter a secure password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                fullWidth
                sx={{ mb: 2.5 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <FormControl fullWidth sx={{ mb: 2.5 }}>
                <InputLabel id="role-select-label">Account Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  label="Account Role"
                  value={regRole}
                  onChange={(e) => {
                    setRegRole(e.target.value as 'student' | 'teacher');
                    setFacultyCode('');
                  }}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="teacher">Teacher / Faculty</MenuItem>
                </Select>
              </FormControl>

              {regRole === 'teacher' && (
                <TextField
                  label="Faculty access code"
                  type="password"
                  value={facultyCode}
                  onChange={(e) => setFacultyCode(e.target.value)}
                  required
                  fullWidth
                  sx={{ mb: 2.5 }}
                  helperText="Required to register this account with faculty permissions"
                />
              )}

              {regRole === 'student' && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel id="class-select-label">Class Level</InputLabel>
                    <Select
                      labelId="class-select-label"
                      label="Class Level"
                      value={regClassLevel}
                      onChange={(e) => setRegClassLevel(Number(e.target.value))}
                    >
                      <MenuItem value={10}>Class 10 (Board Exam Focus)</MenuItem>
                      <MenuItem value={9}>Class 9</MenuItem>
                      <MenuItem value={11}>Class 11</MenuItem>
                      <MenuItem value={12}>Class 12</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Batch / Section"
                    value={regSection}
                    onChange={(e) => setRegSection(e.target.value)}
                    fullWidth
                  />
                </Stack>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  py: 1.4,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  bgcolor: '#059669',
                  '&:hover': { bgcolor: '#047857' },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Register Genuine Account'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;