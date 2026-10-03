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
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Chip,
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
  const [regClassLevel, setRegClassLevel] = useState<number>(10);
  const [regSection, setRegSection] = useState('Section A (Maths & Science)');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Real Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const email = loginEmail.trim();
    const password = loginPassword.trim();

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
      if (res?.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user_role', res.data.user?.role || 'student');
        localStorage.setItem('user_name', res.data.user?.name || email.split('@')[0]);
        localStorage.setItem('user_email', res.data.user?.email || email);
        if (res.data.user?.studentId) {
          localStorage.setItem('student_id', res.data.user.studentId);
        }

        window.dispatchEvent(new Event('auth-changed'));

        setSuccessMsg('Authentication verified! Redirecting to your dashboard...');
        setTimeout(() => {
          if (res.data.user?.role === 'teacher') {
            navigate('/teacher');
          } else {
            navigate('/student');
          }
        }, 700);
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error || 'Authentication failed. Please check your credentials.';
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
    const password = regPassword.trim();

    if (!name || !email || !password) {
      setError('Full name, real email address, and password are required.');
      return;
    }

    if (!REAL_EMAIL_REGEX.test(email)) {
      setError('Please enter a valid real email address (e.g. yourname@domain.com).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.signup({
        name,
        email,
        password,
        role: regRole,
        classLevel: regClassLevel,
        section: regSection,
      });

      if (res?.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user_role', res.data.user?.role || regRole);
        localStorage.setItem('user_name', res.data.user?.name || name);
        localStorage.setItem('user_email', res.data.user?.email || email);

        window.dispatchEvent(new Event('auth-changed'));

        setSuccessMsg('Account registered successfully! Loading your classroom environment...');
        setTimeout(() => {
          if (regRole === 'teacher') {
            navigate('/teacher');
          } else {
            navigate('/student');
          }
        }, 800);
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error || 'Registration failed. Please try again.';
      setError(serverMsg);
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
            {tabIndex === 0 ? 'Sign In with Real Credentials' : 'Create Real Academic Account'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {tabIndex === 0
              ? 'Enter your verified school or student email and secure password'
              : 'Register your genuine email to access personalized tutoring & rank tracking'}
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
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
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
                label="Registered Real Email Address"
                type="email"
                placeholder="e.g. student@school.edu or teacher@school.edu"
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Authenticate & Sign In'}
              </Button>

              <Divider sx={{ my: 3 }} />

              {/* Reference Credentials Box with 1-Click Autofill */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  bgcolor: '#f8fafc',
                  borderRadius: 2.5,
                  border: '1px solid #e2e8f0',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 1 }}>
                  🔑 1-Click Quick Fill for Registered School System Accounts:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                  <Chip
                    label="👨‍🏫 Teacher: teacher@school.edu"
                    clickable
                    onClick={() => {
                      setLoginEmail('teacher@school.edu');
                      setLoginPassword('TeacherPassword#2026');
                    }}
                    color="secondary"
                    variant="outlined"
                    sx={{ fontWeight: 700, cursor: 'pointer' }}
                  />
                  <Chip
                    label="🎓 Student: student@example.com"
                    clickable
                    onClick={() => {
                      setLoginEmail('student@example.com');
                      setLoginPassword('password123');
                    }}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700, cursor: 'pointer' }}
                  />
                  <Chip
                    label="🥇 Scholar: alice.johnson@school.edu"
                    clickable
                    onClick={() => {
                      setLoginEmail('alice.johnson@school.edu');
                      setLoginPassword('Student#Alice2026');
                    }}
                    variant="outlined"
                    sx={{ fontWeight: 700, cursor: 'pointer' }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.74rem' }}>
                  💡 You can also enter <strong>any genuine email address</strong> and password (e.g. your personal email). If you are new, it will automatically activate your academic profile.
                </Typography>
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
                  onChange={(e) => setRegRole(e.target.value as 'student' | 'teacher')}
                >
                  <MenuItem value="student">Student (Access Quizzes, Doubt Solver & Rank Board)</MenuItem>
                  <MenuItem value="teacher">Teacher / Faculty (Manage Students, Video Uploads & Curriculum)</MenuItem>
                </Select>
              </FormControl>

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