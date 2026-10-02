import { Box, Button, Card, CardContent, CardHeader, Typography, Grid, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';

const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    subjectsCompleted: 0,
    averageScore: 0,
    timeSpent: 0,
    doubtsSolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // In a real app, we'd fetch this data from the backend API
    // For now, we'll simulate with mock data
    const loadStudentData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data - in real app, this would come from Supabase
        setStats({
          subjectsCompleted: 5,
          averageScore: 85,
          timeSpent: 12, // hours
          doubtsSolved: 23,
        });

        setRecentActivity([
          { id: 1, type: 'quiz', title: 'Math Quiz', score: 90, date: 'Today' },
          { id: 2, type: 'doubt', title: 'Physics Question', date: 'Yesterday' },
          { id: 3, type: 'homework', title: 'Chemistry Assignment', date: '2 days ago' },
        ]);
      } catch (error) {
        console.error('Failed to load student data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">Loading your dashboard...</Typography>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Student Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Subjects Completed" />
            <CardContent>
              <Typography variant="h3">{stats.subjectsCompleted}</Typography>
              <Typography variant="body2" color="text.secondary">
                topics mastered
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Average Score" />
            <CardContent>
              <Typography variant="h3">{stats.averageScore}%</Typography>
              <Typography variant="body2" color="text.secondary">
                across all subjects
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Time Spent" />
            <CardContent>
              <Typography variant="h3">{stats.timeSpent} hrs</Typography>
              <Typography variant="body2" color="text.secondary">
                learning time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Doubts Solved" />
            <CardContent>
              <Typography variant="h3">{stats.doubtsSolved}</Typography>
              <Typography variant="body2" color="text.secondary">
                questions answered
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Box>
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        {recentActivity.length > 0 ? (
          <Grid container spacing={3}>
            {recentActivity.map(activity => (
              <Grid item xs={12} sm={6} md={4} key={activity.id}>
                <Card>
                  <CardHeader
                    title={activity.title}
                    subheader={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          {activity.type === 'quiz' && `Score: ${activity.score}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activity.date}
                        </Typography>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Completed {activity.type} activity
                    </Typography>
                  </CardContent>
                </Card>
              }
            ))}
          </Grid>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            No recent activity
          </Box>
        )}
      </Box>

      {/* Quick Actions */}
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              component="a"
              href="/doubt-solving"
            >
              Solve a Doubt
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              component="a"
              href="/quiz"
            >
              Take a Quiz
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              component="a"
              href="/homework"
            >
              Get Homework Help
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default StudentDashboard;