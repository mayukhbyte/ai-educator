import { Box, Button, Card, CardContent, CardHeader, Typography, Grid } from '@mui/material';
import { useState } from 'react';

const Dashboard: React.FC = () => {
  const [userName, setUserName] = useState('Student'); // In real app, get from auth context

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to AI Tutor, {userName}!
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardHeader title="Doubt Solving" />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Get instant help with your questions
              </Typography>
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  component="a"
                  href="/doubt-solving"
                >
                  Start Solving
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardHeader title="Quizzes & Practice" />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Test your knowledge with adaptive quizzes
              </Typography>
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  component="a"
                  href="/quiz"
                >
                  Take Quiz
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardHeader title="Homework Help" />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Get step-by-step guidance for assignments
              </Typography>
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  component="a"
                  href="/homework"
                >
                  Get Help
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardHeader title="Exam Preparation" />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Prepare for exams with personalized plans
              </Typography>
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  component="a"
                  href="/exam-prep"
                >
                  Start Prep
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardHeader title="Progress Tracking" />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Monitor your learning journey
              </Typography>
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  component="a"
                  href="/dashboard"
                >
                  View Progress
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardHeader title="Resources" />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Access study materials and references
              </Typography>
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                >
                  Browse Resources
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;