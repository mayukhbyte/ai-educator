import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Stack,
  Avatar,
} from '@mui/material';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const modules = [
  {
    title: 'Doubt Solving',
    description: 'Instant multi-level AI explanations (Basic, Medium, Overview) powered by GPT-4o.',
    path: '/doubt-solving',
    icon: <QuestionAnswerIcon fontSize="medium" />,
    color: '#2563eb',
    badge: 'Realtime AI',
    actionText: 'Ask Question',
  },
  {
    title: 'Adaptive Quizzes',
    description: 'Dynamic practice quizzes across Mathematics, Physics, Chemistry, and more with instant scoring.',
    path: '/quiz',
    icon: <QuizIcon fontSize="medium" />,
    color: '#7c3aed',
    badge: 'Practice Mode',
    actionText: 'Take Quiz',
  },
  {
    title: 'Homework Assistant',
    description: 'Step-by-step problem deconstruction with guided methodology and verification.',
    path: '/homework',
    icon: <AssignmentIcon fontSize="medium" />,
    color: '#059669',
    badge: 'Step-by-Step',
    actionText: 'Solve Problem',
  },
  {
    title: 'Exam Preparation',
    description: 'Personalized syllabus breakdown and targeted question bank generator.',
    path: '/exam-prep',
    icon: <MenuBookIcon fontSize="medium" />,
    color: '#d97706',
    badge: 'Exam Ready',
    actionText: 'Generate Bank',
  },
  {
    title: 'Student Dashboard',
    description: 'Track your subject completion, average quiz scores, and learning progress.',
    path: '/student',
    icon: <TrendingUpIcon fontSize="medium" />,
    color: '#0891b2',
    badge: 'Analytics',
    actionText: 'View Dashboard',
  },
  {
    title: 'Teacher Dashboard',
    description: 'Monitor active classroom performance, grading distribution, and student achievements.',
    path: '/teacher',
    icon: <SmartToyIcon fontSize="medium" />,
    color: '#4f46e5',
    badge: 'Classroom',
    actionText: 'View Classroom',
  },
];

const Dashboard: React.FC = () => {
  const [backendHealth, setBackendHealth] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    fetch('http://localhost:5000/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'OK') {
          setBackendHealth('connected');
        } else {
          setBackendHealth('disconnected');
        }
      })
      .catch(() => {
        setBackendHealth('disconnected');
      });
  }, []);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Hero Section */}
      <Box
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #7c3aed 100%)',
          color: '#ffffff',
          mb: 4,
          boxShadow: '0 12px 36px rgba(30, 58, 138, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
          }}
        >
          <Box sx={{ maxWidth: 680 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
              <Chip
                label={backendHealth === 'connected' ? 'Backend Live on :5000' : 'Backend Connecting...'}
                size="small"
                icon={<CheckCircleIcon style={{ color: '#fff' }} />}
                sx={{
                  backgroundColor: backendHealth === 'connected' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                }}
              />
              <Chip
                label="OpenAI GPT-4o Ready"
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                }}
              />
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, letterSpacing: '-0.5px' }}>
              Empowering Personalized Learning with AI
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.6, fontSize: '1.05rem' }}>
              Welcome to the AI Educator platform. Connect with intelligent doubt solving, custom-tailored practice exams, and comprehensive classroom analytics.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              component={RouterLink}
              to="/doubt-solving"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: '#ffffff',
                color: '#1e3a8a',
                fontWeight: 700,
                '&:hover': { bgcolor: '#f1f5f9' },
              }}
            >
              Ask a Doubt
            </Button>
            <Button
              component={RouterLink}
              to="/quiz"
              variant="outlined"
              size="large"
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.6)',
                fontWeight: 600,
                '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Start Quiz
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Main Grid Modules */}
      <Grid container spacing={3}>
        {modules.map((item) => (
          <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3.5,
                p: 1,
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${item.color}15`,
                      color: item.color,
                      width: 48,
                      height: 48,
                      borderRadius: 2.5,
                    }}
                  >
                    {item.icon}
                  </Avatar>
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      bgcolor: `${item.color}12`,
                      color: item.color,
                      fontWeight: 700,
                      fontSize: '0.72rem',
                    }}
                  />
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1, lineHeight: 1.6 }}>
                  {item.description}
                </Typography>

                <Button
                  component={RouterLink}
                  to={item.path}
                  variant="contained"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: item.color,
                    '&:hover': { bgcolor: item.color, filter: 'brightness(0.92)' },
                  }}
                >
                  {item.actionText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;