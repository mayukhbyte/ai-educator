import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Chip,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import DoubtSolving from './pages/DoubtSolving';
import Quiz from './pages/Quiz';
import Homework from './pages/Homework';
import ExamPrep from './pages/ExamPrep';
import NotFound from './pages/NotFound';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#7c3aed',
      light: '#8b5cf6',
      dark: '#6d28d9',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(37,99,235,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid rgba(226,232,240,0.8)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          },
        },
      },
    },
  },
});

interface NavProps {
  isAuthenticated: boolean;
  userRole: string;
  userName: string;
  onLogout: () => void;
}

function NavigationBar({ isAuthenticated, userRole, userName, onLogout }: NavProps) {
  const location = useLocation();

  // Role-based navigation links: Students cannot see Teacher Dashboard
  const navLinks = userRole === 'teacher'
    ? [
        { label: 'Overview', path: '/', icon: <DashboardIcon fontSize="small" /> },
        { label: 'Teacher Dashboard', path: '/teacher', icon: <SupervisorAccountIcon fontSize="small" /> },
        { label: 'Doubt Solver', path: '/doubt-solving', icon: <QuestionAnswerIcon fontSize="small" /> },
        { label: 'Exam Prep', path: '/exam-prep', icon: <MenuBookIcon fontSize="small" /> },
      ]
    : [
        { label: 'Overview', path: '/', icon: <DashboardIcon fontSize="small" /> },
        { label: 'Student View', path: '/student', icon: <PersonIcon fontSize="small" /> },
        { label: 'Doubt Solver', path: '/doubt-solving', icon: <QuestionAnswerIcon fontSize="small" /> },
        { label: 'Quiz Practice', path: '/quiz', icon: <QuizIcon fontSize="small" /> },
        { label: 'Homework Help', path: '/homework', icon: <AssignmentIcon fontSize="small" /> },
        { label: 'Exam Prep', path: '/exam-prep', icon: <MenuBookIcon fontSize="small" /> },
      ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        color: '#1e293b',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 64, gap: 1 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: '#0f172a',
              mr: 2,
              gap: 1.2,
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              }}
            >
              <SchoolIcon fontSize="small" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              AI Educator
            </Typography>
            <Chip
              label={userRole === 'teacher' ? 'Faculty Mode' : 'Student Mode'}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 700,
                backgroundColor: userRole === 'teacher' ? '#ede9fe' : '#dcfce7',
                color: userRole === 'teacher' ? '#6d28d9' : '#15803d',
              }}
            />
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexGrow: 1, overflowX: 'auto', py: 0.5 }}>
            {navLinks.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  startIcon={item.icon}
                  size="small"
                  sx={{
                    color: active ? '#2563eb' : '#64748b',
                    backgroundColor: active ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                    fontWeight: active ? 700 : 500,
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.8,
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      backgroundColor: active ? 'rgba(37, 99, 235, 0.12)' : 'rgba(241, 245, 249, 0.8)',
                      color: '#2563eb',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isAuthenticated ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Chip
                  icon={userRole === 'teacher' ? <SupervisorAccountIcon sx={{ fontSize: '18px !important' }} /> : <PersonIcon sx={{ fontSize: '18px !important' }} />}
                  label={`${userName} (${userRole === 'teacher' ? 'Faculty' : 'Student'})`}
                  color={userRole === 'teacher' ? 'secondary' : 'primary'}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 700, display: { xs: 'none', sm: 'inline-flex' } }}
                />
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={onLogout}
                  startIcon={<LogoutIcon />}
                  sx={{
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    borderRadius: 2,
                    '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
                  }}
                >
                  Sign Out
                </Button>
              </Box>
            ) : (
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="small"
                startIcon={<LoginIcon />}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

// Protected Route Guard: Restricts Teacher Dashboard from Students
interface TeacherRouteProps {
  children: React.ReactNode;
  userRole: string;
  isAuthenticated: boolean;
}

function TeacherRoute({ children, userRole, isAuthenticated }: TeacherRouteProps) {
  if (!isAuthenticated || userRole !== 'teacher') {
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto', mt: 6, p: 4, textAlign: 'center' }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2.5,
          }}
        >
          <SupervisorAccountIcon sx={{ fontSize: 38 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#0f172a' }}>
          Access Restricted: Faculty & Teachers Only
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
          Students are not authorized to view the Teacher Dashboard or student progress administrative tools. Please continue to the Student Dashboard or sign in with a verified Faculty account.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            component={RouterLink}
            to="/student"
            variant="contained"
            color="primary"
            startIcon={<PersonIcon />}
            sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
          >
            Go to Student Dashboard
          </Button>
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            startIcon={<LoginIcon />}
            sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
          >
            Sign In as Faculty
          </Button>
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('token')));
  const [userRole, setUserRole] = useState(() => localStorage.getItem('user_role') || 'student');
  const [userName, setUserName] = useState(() => {
    const role = localStorage.getItem('user_role') || 'student';
    return localStorage.getItem('user_name') || (role === 'teacher' ? 'Teacher' : 'Student');
  });

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role') || 'student';
    const name = localStorage.getItem('user_name') || (role === 'teacher' ? 'Teacher' : 'Student');
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
      setUserName(name);
    } else {
      setIsAuthenticated(false);
      setUserRole('student');
      setUserName('Guest');
    }
  };

  useEffect(() => {
    window.addEventListener('auth-changed', checkAuth);
    return () => window.removeEventListener('auth-changed', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('student_id');
    checkAuth();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
          <NavigationBar
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            userName={userName}
            onLogout={handleLogout}
          />
          <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
            <Container maxWidth="xl">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student-dashboard" element={<StudentDashboard />} />
                <Route
                  path="/teacher"
                  element={
                    <TeacherRoute userRole={userRole} isAuthenticated={isAuthenticated}>
                      <TeacherDashboard />
                    </TeacherRoute>
                  }
                />
                <Route
                  path="/teacher-dashboard"
                  element={
                    <TeacherRoute userRole={userRole} isAuthenticated={isAuthenticated}>
                      <TeacherDashboard />
                    </TeacherRoute>
                  }
                />
                <Route path="/doubt-solving" element={<DoubtSolving />} />
                <Route path="/doubt-solver" element={<DoubtSolving />} />
                <Route path="/doubts" element={<DoubtSolving />} />
                <Route path="/doubt" element={<DoubtSolving />} />
                <Route path="/ask-doubt" element={<DoubtSolving />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/quiz-practice" element={<Quiz />} />
                <Route path="/homework" element={<Homework />} />
                <Route path="/homework-help" element={<Homework />} />
                <Route path="/exam-prep" element={<ExamPrep />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Container>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;