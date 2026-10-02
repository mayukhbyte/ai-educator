import { Box, Button, Card, CardContent, CardHeader, Typography, Grid, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';

const TeacherDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    assignmentsGraded: 0,
    averageClassScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);

  useEffect(() => {
    // In a real app, we'd fetch this data from the backend API
    // For now, we'll simulate with mock data
    const loadTeacherData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data - in real app, this would come from Supabase
        setStats({
          totalStudents: 28,
          activeStudents: 25,
          assignmentsGraded: 45,
          averageClassScore: 82,
        });

        setStudentPerformance([
          { id: 1, name: 'Alice Johnson', score: 95, progress: 88, subjects: 6 },
          { id: 2, name: 'Bob Smith', score: 78, progress: 65, subjects: 4 },
          { id: 3, name: 'Carol Davis', score: 92, progress: 82, subjects: 5 },
          { id: 4, name: 'David Wilson', score: 85, progress: 70, subjects: 5 },
          { id: 5, name: 'Emma Brown', score: 90, progress: 75, subjects: 6 },
        ]);

        setRecentAssignments([
          { id: 1, title: 'Math Assignment 1', dueDate: 'Oct 10', submitted: 25, graded: 25 },
          { id: 2, title: 'Science Quiz Chapter 3', dueDate: 'Oct 12', submitted: 28, graded: 20 },
          { id: 3, title: 'History Essay', dueDate: 'Oct 15', submitted: 18, graded: 15 },
        ]);
      } catch (error) {
        console.error('Failed to load teacher data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">Loading dashboard data...</Typography>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teacher Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Total Students" />
            <CardContent>
              <Typography variant="h3">{stats.totalStudents}</Typography>
              <Typography variant="body2" color="text.secondary">
                enrolled in class
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Active Students" />
            <CardContent>
              <Typography variant="h3">{stats.activeStudents}</Typography>
              <Typography variant="body2" color="text.secondary">
                participating regularly
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Assignments Graded" />
            <CardContent>
              <Typography variant="h3">{stats.assignmentsGraded}</Typography>
              <Typography variant="body2" color="text.secondary">
                completed this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Average Class Score" />
            <CardContent>
              <Typography variant="h3">{stats.averageClassScore}%</Typography>
              <Typography variant="body2" color="text.secondary">
                across all assessments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Student Performance */}
      <Box>
        <Typography variant="h5" gutterBottom>
          Student Performance Overview
        </Typography>
        {studentPerformance.length > 0 ? (
          <Grid container spacing={3}>
            {studentPerformance.map(student => (
              <Grid item xs={12} sm={6} md={4} key={student.id}>
                <Card>
                  <CardHeader
                    title={student.name}
                    subheader={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          Score: {student.score}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Progress: {student.progress}%
                        </Typography>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Subjects completed: {student.subjects}
                    </Typography>
                    <Box mt={2}>
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        component="a"
                        href={`/student/${student.id}`}
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              }
            ))}
          </Grid>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            No student data available
          </Box>
        )}
      </Box>

      {/* Recent Assignments */}
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Recent Assignments
        </Typography>
        {recentAssignments.length > 0 ? (
          <Grid container spacing={3}>
            {recentAssignments.map(assignment => (
              <Grid item xs={12} sm={6} md={4} key={assignment.id}>
                <Card>
                  <CardHeader title={assignment.title} />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Due: {assignment.dueDate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Submitted: {assignment.submitted}/{stats.totalStudents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Graded: {assignment.graded}/{assignment.submitted}
                    </Typography>
                    <Box mt={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        component="a"
                        href={`/assignment/${assignment.id}`}
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              }
            ))}
          </Grid>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            No recent assignments
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
              href="/create-assignment"
            >
              Create Assignment
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              component="a"
              href="/view-students"
            >
              View All Students
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              component="a"
              href="/generate-quiz"
            >
              Generate Class Quiz
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default TeacherDashboard;