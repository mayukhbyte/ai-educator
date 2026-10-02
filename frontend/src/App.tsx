import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useEffect } from 'react';

// Import pages (we'll create these later)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import DoubtSolving from './pages/DoubtSolving';
import Quiz from './pages/Quiz';
import Homework from './pages/Homework';
import ExamPrep from './pages/ExamPrep';
import NotFound from './pages/NotFound';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  // In a real app, we'd check auth state from context or Redux
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userRole, setUserRole] = React.useState('student'); // 'student' | 'teacher' | 'admin'

  useEffect(() => {
    // Check auth status from localStorage or context
    // This is a placeholder - in reality we'd use Supabase auth
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // In a real app, we'd decode the token to get user role
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CssBaseline>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline>
        <BrowserRouter>
          <Routes>
            {/* Protected routes */}
            <Route
              element={
                <React.Fragment>
                  {/* In a real app, we'd have a Navbar/Sidebar here */}
                  <main>
                    <Routes>
                      <Route
                        path="/dashboard"
                        element={userRole === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />}
                      />
                      <Route path="/doubt-solving" element={<DoubtSolving />} />
                      <Route path="/quiz" element={<Quiz />} />
                      <Route path="/homework" element={<Homework />} />
                      <Route path="/exam-prep" element={<ExamPrep />} />
                      <Route path="/" element={<Dashboard />} />
                    </Routes>
                  </main>
                </React.Fragment>
              }
            >
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CssBaseline>
    </ThemeProvider>
  );
}

export default App;