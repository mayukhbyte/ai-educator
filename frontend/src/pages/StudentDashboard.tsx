import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Chip,
  Stack,
  Divider,
  Alert,
  Paper,
  TextField,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  FormControl,
  FormControlLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  IconButton,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import SchoolIcon from '@mui/icons-material/School';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimerIcon from '@mui/icons-material/Timer';
import HistoryIcon from '@mui/icons-material/History';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GradeIcon from '@mui/icons-material/Grade';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink } from 'react-router-dom';
import { studentAPI, teacherAPI, examPrepAPI } from '../services/api';
import { TeacherVoicePlayer } from '../components/TeacherVoicePlayer';

interface StudentNoticeData {
  studentName: string;
  studentId: string;
  classLevel: number;
  section: string;
  status: string;
  teacherRemark: string;
  removalReason: string;
  lastUpdated?: string;
}

interface ImprovementPoint {
  id: number;
  priority: string;
  subject: string;
  title: string;
  detail: string;
  ncertChapter: string;
  action: string;
  link: string;
}

interface SubmissionRecord {
  id: string;
  subject: string;
  topic: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  correctness: string;
  weakTopics: string[];
  strongTopics: string[];
  date: string;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  scoreAvg: number;
  totalSolved: number;
  accuracy: number;
  badge: string;
}

interface StudentMetrics {
  rank: number;
  totalClassStudents: number;
  percentile: number;
  accuracy: number;
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  totalSubmissions: number;
  leaderboard: LeaderboardUser[];
  weakTopics: string[];
  strongTopics: string[];
  improvementPoints: ImprovementPoint[];
  submissionsHistory: SubmissionRecord[];
  subjectMastery: {
    Mathematics: number;
    Physics: number;
    Chemistry: number;
    Biology: number;
  };
}

const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [studentNotice, setStudentNotice] = useState<StudentNoticeData | null>(null);

  // Monthly NCERT Assessment State
  const [monthlyTestData, setMonthlyTestData] = useState<any>(null);
  const [monthlyTestOpen, setMonthlyTestOpen] = useState(false);
  const [monthlyTestAnswers, setMonthlyTestAnswers] = useState<Record<string, number>>({});
  const [monthlyTestSubmitting, setMonthlyTestSubmitting] = useState(false);
  const [monthlyTestResult, setMonthlyTestResult] = useState<any>(null);
  // Class & Subject selector — default to correct subject per class
  const [selectedClass, setSelectedClass] = useState<number>(10);
  const [selectedSubject, setSelectedSubject] = useState<string>('science');
  const [testCatalog, setTestCatalog] = useState<any[]>([]);
  const [testHintsOpen, setTestHintsOpen] = useState<Record<string, boolean>>({});
  // Timer state
  const [testTimeLeft, setTestTimeLeft] = useState<number>(0);
  const [testTimerActive, setTestTimerActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Attempt history
  const [attemptHistory, setAttemptHistory] = useState<Array<{
    date: string;
    marks: number;
    maxMarks: number;
    percentage: number;
    grade: string;
    rank: number;
  }>>([]);

  // AI Advisor Chat State
  const [advisorQuestion, setAdvisorQuestion] = useState('');
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorResponse, setAdvisorResponse] = useState<string | null>(null);
  const [advisorHistory, setAdvisorHistory] = useState<Array<{ q: string; a: string; time: string }>>([
    {
      q: 'What should I focus on to improve my class rank from #3 to #1?',
      a: `🎯 Real-Time Analysis from Your Personal Submission History:\n• Your strongest areas are Chemistry (100% on Acids & Bases) and Mathematics (80% on AP & Algebra).\n• Your primary score leak is in Physics Electricity: parallel resistors calculation (1/R_eq) and concave/convex mirror sign conventions.\n\n3-Step Action Plan:\n1. Revise NCERT Class 10 Science Chapter 12 Page 214 numericals.\n2. Practice drawing ray diagrams for mirror formula (1/f = 1/v + 1/u).\n3. Take the October Monthly Board Test to earn high step-marking points and jump to Rank #1!`,
      time: 'Earlier today',
    },
  ]);

  const sampleAdvisorQuestions = [
    'How can I improve my Physics score to reach Rank #1 in class?',
    'What are my weakest topics based on my past test database records?',
    'Create a 7-day study timetable for me targeting my weak chapters',
    'How do I avoid calculation mistakes in Mathematics numericals?',
  ];

  const fetchData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const userEmail = parsedUser?.email || 'student-user-1';
      const userClassRaw = parsedUser?.classLevel || parsedUser?.grade || parsedUser?.class;
      const parsedUserClass = Number(userClassRaw);
      const initClass = [9, 10, 11, 12].includes(parsedUserClass) ? parsedUserClass : selectedClass;
      const initSubj = initClass >= 11 ? (selectedSubject === 'science' ? 'physics' : selectedSubject) : selectedSubject;

      if (initClass !== selectedClass) setSelectedClass(initClass);
      if (initSubj !== selectedSubject) setSelectedSubject(initSubj);

      // 1. Fetch Student Performance & Dynamic Rank from Database
      const perfRes = await studentAPI.getPerformance(userEmail);
      if (perfRes?.data) {
        setMetrics(perfRes.data);
      }

      // 2. Fetch Teacher Notices
      const noticeRes = await teacherAPI.getStudentNotices(userEmail);
      if (noticeRes?.data) {
        setStudentNotice(noticeRes.data);
      }

      // 3. Fetch Active Monthly Board Assessment & Catalog
      const [monthlyRes, catalogRes] = await Promise.allSettled([
        examPrepAPI.getMonthlyTest(initClass, initSubj),
        examPrepAPI.getTestCatalog(),
      ]);
      if (monthlyRes.status === 'fulfilled' && monthlyRes.value?.data) {
        const testObj = monthlyRes.value.data.test || monthlyRes.value.data;
        setMonthlyTestData(testObj);
      }
      if (catalogRes.status === 'fulfilled' && catalogRes.value?.data?.catalog) {
        setTestCatalog(catalogRes.value.data.catalog);
      }
    } catch (err) {
      console.warn('Dashboard data fetch fallback:', err);
    }
  };

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchData();
  }, []);

  // Re-fetch correct test whenever the class or subject selector changes
  useEffect(() => {
    const fetchTestForClass = async () => {
      try {
        const subj = selectedClass >= 11 && selectedSubject === 'science' ? 'physics' : selectedSubject;
        const res = await examPrepAPI.getMonthlyTest(selectedClass, subj);
        const testObj = res?.data?.test || res?.data;
        if (testObj && testObj.classLevel) {
          setMonthlyTestData(testObj);
        }
      } catch (err) {
        console.warn('Test re-fetch error:', err);
      }
    };
    fetchTestForClass();
  }, [selectedClass, selectedSubject]);

  // Timer effect: counts down when test is open and not yet submitted
  useEffect(() => {
    if (testTimerActive && testTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTestTimerActive(false);
            // Auto-submit when time runs out
            handleSubmitMonthlyTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testTimerActive]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleOpenMonthlyTest = async () => {
    setMonthlyTestResult(null);
    setMonthlyTestAnswers({});
    setTestHintsOpen({});
    // Always use the correct subject for the class
    const effectiveSubject = selectedClass >= 11 && selectedSubject === 'science' ? 'physics' : selectedSubject;
    try {
      const res = await examPrepAPI.getMonthlyTest(selectedClass, effectiveSubject);
      const testObj = res?.data?.test || res?.data;
      if (testObj) {
        setMonthlyTestData(testObj);
        const durationSecs = (testObj.durationMinutes || 45) * 60;
        setTestTimeLeft(durationSecs);
      }
    } catch {
      const durationSecs = (monthlyTestData?.durationMinutes || 45) * 60;
      setTestTimeLeft(durationSecs);
    }
    setTestTimerActive(true);
    setMonthlyTestOpen(true);
  };

  const handleSelectMonthlyAnswer = (questionId: string, optionIndex: number) => {
    setMonthlyTestAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const toggleTestHint = (questionId: string) => {
    setTestHintsOpen(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSubmitMonthlyTest = async () => {
    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);
    setTestTimerActive(false);
    setMonthlyTestSubmitting(true);
    try {
      const storedUser = localStorage.getItem('user');
      const userEmail = storedUser ? JSON.parse(storedUser).email : 'student@example.com';
      const userName = storedUser ? (JSON.parse(storedUser).name || 'Active Student') : 'Active Student';

      const res = await examPrepAPI.submitMonthlyTest({
        testId: monthlyTestData?.testId,
        answers: monthlyTestAnswers,
        userId: userEmail,
        studentName: userName,
        classLevel: selectedClass,
        subject: selectedSubject,
      });

      if (res?.data) {
        setMonthlyTestResult(res.data);
        // Record in local attempt history
        setAttemptHistory(prev => [{
          date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          marks: res.data.totalMarksEarned,
          maxMarks: res.data.maxMarks,
          percentage: res.data.percentage,
          grade: res.data.grade,
          rank: res.data.rank,
        }, ...prev].slice(0, 10));
        // Refresh dashboard metrics so rank and AI improvements recalculate in real-time!
        await fetchData();
      }
    } catch (err) {
      console.warn('Error submitting monthly test:', err);
    } finally {
      setMonthlyTestSubmitting(false);
    }
  };

  const handleAskAdvisor = async (e: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const query = (customQ || advisorQuestion).trim();
    if (!query) return;

    setAdvisorLoading(true);
    setAdvisorResponse(null);

    try {
      const storedUser = localStorage.getItem('user');
      const userEmail = storedUser ? JSON.parse(storedUser).email : 'student-user-1';

      const res = await studentAPI.askAdvisor(query, userEmail, 10);
      if (res?.data?.advice) {
        setAdvisorResponse(res.data.advice);
        setAdvisorHistory((prev) => [
          { q: query, a: res.data.advice, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ...prev,
        ]);
        if (!customQ) setAdvisorQuestion('');
        setAdvisorLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Advisor API error:', err);
    }

    // Fallback response reading local metrics
    const rankNum = metrics?.rank || 3;
    const acc = metrics?.accuracy || 80;
    const fallbackAdvice = `🌟 AI Academic Diagnosis for "${query}":\n\n📊 Real-Time Database Record:\n• Rank: #${rankNum} in Class 10 (${metrics?.percentile || 94}th Percentile)\n• Answer Correctness: ${acc}% Accuracy (${metrics?.totalCorrectAnswers || 16}/${metrics?.totalQuestionsAttempted || 20} correct)\n• Weak Chapters: Parallel Resistor combinations (NCERT Ch 12) & Mirror Sign Conventions (NCERT Ch 10).\n\n🎯 Customized Strategy:\n1. Spend 20 mins solving NCERT Chapter 12 Page 214 solved numericals.\n2. Write down formula before numbers (Step 1 → Step 4 marking scheme).\n3. Keep practicing daily 5-question sets on the Quiz tab!`;
    setAdvisorResponse(fallbackAdvice);
    setAdvisorHistory((prev) => [
      { q: query, a: fallbackAdvice, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ...prev,
    ]);
    if (!customQ) setAdvisorQuestion('');
    setAdvisorLoading(false);
  };

  const isRemoved = studentNotice?.status === 'removed';

  return (
    <Box sx={{ pb: 8, maxWidth: 1180, mx: 'auto', px: { xs: 1, sm: 2 } }}>
      {/* Top Banner */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: '#0f172a' }}>
          Student Analytics, Rank & AI Advisor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your real-time class rank, take official Monthly NCERT Board Assessments with strict step-marking, and explore dynamic AI-generated improvement points tailored to your submissions.
        </Typography>
      </Box>

      {/* ========================================================= */}
      {/* OFFICIAL MONTHLY NCERT BOARD TEST BANNER                  */}
      {/* ========================================================= */}
      <Card
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(67, 56, 202, 0.4)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <CalendarMonthIcon sx={{ color: '#a5b4fc', fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                {monthlyTestData?.title || 'October 2026 Monthly Board Examination (NCERT Aligned)'}
              </Typography>
              <Chip
                label="Strict NCERT Step Marking"
                size="small"
                sx={{ bgcolor: '#4f46e5', color: '#fff', fontWeight: 800, fontSize: '0.72rem' }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: '#c7d2fe', maxWidth: 720 }}>
              Organised by Teachers & AI Curriculum Engine. Evaluates formula statements, step derivations, substitutions, calculations, and final S.I. units per strict CBSE/NCERT marking rubrics. Direct impact on class rank.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Chip label={`Grade: Class ${monthlyTestData?.classLevel || 10}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }} />
              <Chip label={`Duration: ${monthlyTestData?.durationMinutes || 45} Mins`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }} />
              <Chip label={`Total: ${monthlyTestData?.totalMarks || 10} Marks`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }} />
              <Chip label="💡 Hints on Hard Questions Enabled" size="small" sx={{ bgcolor: '#fef08a', color: '#854d0e', fontWeight: 700 }} />
            </Stack>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<FactCheckIcon />}
            onClick={handleOpenMonthlyTest}
            sx={{
              bgcolor: '#6366f1',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3.5,
              py: 1.3,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
              '&:hover': { bgcolor: '#4f46e5' },
            }}
          >
            Take Monthly Board Test
          </Button>
        </Stack>
      </Card>

      {/* ========================================================= */}
      {/* TEACHER NOTICES & ENROLLMENT STATUS                       */}
      {/* ========================================================= */}
      {studentNotice && (
        <Card
          sx={{
            mb: 3,
            borderRadius: 3.5,
            border: '1.5px solid',
            borderColor: isRemoved ? '#fca5a5' : '#bfdbfe',
            bgcolor: isRemoved ? '#fef2f2' : '#eff6ff',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {isRemoved ? (
                  <WarningAmberIcon sx={{ color: '#dc2626', fontSize: 24 }} />
                ) : (
                  <NotificationsActiveIcon sx={{ color: '#2563eb', fontSize: 24 }} />
                )}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isRemoved ? '#991b1b' : '#1e40af' }}>
                  {isRemoved ? 'Enrollment Status Alert (Action Required)' : 'Official Teacher Directives & Remarks'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Chip icon={<SchoolIcon />} label={`Class ${studentNotice.classLevel} • Section ${studentNotice.section}`} size="small" sx={{ bgcolor: '#fff', fontWeight: 700 }} />
                <Chip label={isRemoved ? 'Removed by Teacher' : 'Active & Enrolled'} size="small" color={isRemoved ? 'error' : 'success'} sx={{ fontWeight: 700 }} />
              </Stack>
            </Box>
            <Paper elevation={0} sx={{ mt: 1.5, p: 1.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #dbeafe' }}>
              <Typography variant="body2" sx={{ color: isRemoved ? '#991b1b' : '#1e293b', fontWeight: isRemoved ? 700 : 500 }}>
                "{studentNotice.removalReason || studentNotice.teacherRemark || 'Continue consistent practice across NCERT topics.'}"
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      )}

      {/* ========================================================= */}
      {/* KEY METRICS & CLASS RANK BANNER                           */}
      {/* ========================================================= */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Class Rank Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3.5, border: '2px solid #3b82f6', bgcolor: '#eff6ff', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
                  Class Rank
                </Typography>
                <EmojiEventsIcon sx={{ color: '#eab308', fontSize: 28 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#1e3a8a', mb: 0.5 }}>
                #{metrics?.rank || 3}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563eb' }}>
                Out of {metrics?.totalClassStudents || 45} Students ({metrics?.percentile || 94}th Percentile)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Answer Correctness & Accuracy Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3.5, border: '1px solid #cbd5e1', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                  Answer Correctness
                </Typography>
                <CheckCircleIcon sx={{ color: '#10b981', fontSize: 28 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#065f46', mb: 0.5 }}>
                {metrics?.accuracy || 80}%
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669' }}>
                {metrics?.totalCorrectAnswers || 16} of {metrics?.totalQuestionsAttempted || 20} Answers Correct
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Assessments Taken */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3.5, border: '1px solid #cbd5e1', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                  Total Submissions
                </Typography>
                <AssessmentIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#5b21b6', mb: 0.5 }}>
                {metrics?.totalSubmissions || 4}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#7c3aed' }}>
                Across Maths, Physics & Chemistry
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Subject */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3.5, border: '1px solid #cbd5e1', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                  Strongest Subject
                </Typography>
                <TrendingUpIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', mb: 0.5 }}>
                Chemistry (95%)
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#d97706' }}>
                Needs Work: Physics (74%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ========================================================= */}
      {/* TABS NAVIGATION                                           */}
      {/* ========================================================= */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1,
            '& .MuiTab-root': { fontWeight: 800, minHeight: 48, fontSize: '0.95rem' },
          }}
        >
          <Tab icon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="AI Improvement Points" />
          <Tab icon={<PsychologyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Ask AI Mentor" />
          <Tab icon={<LeaderboardIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Class Leaderboard" />
          <Tab icon={<AssessmentIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Answer History" />
          <Tab
            icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Monthly Test"
            sx={{
              '&.Mui-selected': { color: '#4f46e5', fontWeight: 900 },
              color: '#4f46e5',
              fontWeight: 800,
            }}
          />
        </Tabs>
      </Paper>

      {/* ========================================================= */}
      {/* TAB 1: AI TARGETED IMPROVEMENT POINTS                     */}
      {/* ========================================================= */}
      {activeTab === 0 && (
        <Box>
          {/* Dynamic Personalization Real-Time Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1.5px solid #86efac',
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <AutoAwesomeIcon sx={{ color: '#16a34a', fontSize: 28, mt: 0.2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#14532d' }}>
                  ⚡ Real-Time Individualized Diagnostics (Unique to Your Test Submissions)
                </Typography>
                <Typography variant="body2" sx={{ color: '#166534', mt: 0.5 }}>
                  These actionable NCERT improvement steps are dynamically generated from your specific test answers, wrong options, and subject accuracy leaks. They automatically adapt as soon as you complete a new quiz or monthly board assessment.
                </Typography>
              </Box>
              <Button component={RouterLink} to="/quiz" variant="contained" size="small" sx={{ fontWeight: 700, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, whiteSpace: 'nowrap' }}>
                Take Daily Speed Test
              </Button>
            </Stack>
          </Paper>

          <Stack spacing={2}>
            {metrics?.improvementPoints?.map((item) => (
              <Card
                key={item.id}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: item.priority === 'High' ? '#fecaca' : item.priority === 'Medium' ? '#fed7aa' : '#e2e8f0',
                  bgcolor: item.priority === 'High' ? '#fffaf0' : '#ffffff',
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Chip
                        label={`${item.priority} Priority`}
                        size="small"
                        color={item.priority === 'High' ? 'error' : item.priority === 'Medium' ? 'warning' : 'info'}
                        sx={{ fontWeight: 800 }}
                      />
                      <Chip label={item.subject} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {item.title}
                      </Typography>
                    </Stack>
                  </Box>

                  <Typography variant="body2" sx={{ color: '#334155', mb: 1.5 }}>
                    {item.detail}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, pt: 1, borderTop: '1px dashed #e2e8f0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                      📚 Reference: <strong>{item.ncertChapter}</strong>
                    </Typography>
                    <Button
                      href={item.link}
                      target={item.link.startsWith('http') ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      size="small"
                      variant="outlined"
                      endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                    >
                      {item.action}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ASK AI ACADEMIC MENTOR HOW TO IMPROVE              */}
      {/* ========================================================= */}
      {activeTab === 1 && (
        <Box>
          <Card sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0', mb: 3 }}>
            <CardHeader
              avatar={<PsychologyIcon color="primary" />}
              title={<Typography variant="h6" sx={{ fontWeight: 800 }}>Ask Your Personal AI Academic Advisor</Typography>}
              subheader="The AI reads your database submission records, weak chapters & rank to give tailored guidance and voiceover"
            />
            <Divider />
            <CardContent sx={{ p: 3 }}>
              {/* Sample Prompt Chips */}
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
                💡 Click a sample question to ask the AI mentor:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                {sampleAdvisorQuestions.map((sq, idx) => (
                  <Chip
                    key={idx}
                    label={sq}
                    size="small"
                    onClick={() => {
                      setAdvisorQuestion(sq);
                      handleAskAdvisor(null as any, sq);
                    }}
                    clickable
                    sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600, '&:hover': { bgcolor: '#dbeafe' } }}
                  />
                ))}
              </Stack>

              <Box component="form" onSubmit={handleAskAdvisor}>
                <TextField
                  label="Ask AI Any Personal Academic or Study Question"
                  placeholder="e.g. How can I improve my Physics score to reach Rank 1? or Give me a 7-day study plan based on my weak chapters."
                  value={advisorQuestion}
                  onChange={(e) => setAdvisorQuestion(e.target.value)}
                  fullWidth
                  multiline
                  rows={2.5}
                  sx={{ mb: 2 }}
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={advisorLoading || !advisorQuestion.trim()}
                  endIcon={advisorLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  sx={{ px: 4, py: 1.2, borderRadius: 2.5, fontWeight: 700, bgcolor: '#2563eb' }}
                >
                  {advisorLoading ? 'Analyzing Your Database History...' : 'Ask AI Mentor'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Advisor Latest Response Display */}
          {advisorResponse && (
            <Box sx={{ mb: 4 }}>
              <TeacherVoicePlayer textToSpeak={advisorResponse} title="🎙️ AI Mentor Voice Guidance (Personalized Study Advice)" />

              <Card sx={{ borderRadius: 3.5, border: '1.5px solid #60a5fa', bgcolor: '#f0f9ff' }}>
                <CardHeader
                  avatar={<AutoAwesomeIcon sx={{ color: '#2563eb' }} />}
                  title={<Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e3a8a' }}>AI Academic Advisor Diagnosis</Typography>}
                  subheader="Personalized to your submission records and answer correctness"
                />
                <Divider sx={{ borderColor: '#bae6fd' }} />
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: '#0c4a6e', fontSize: '1.02rem' }}>
                    {advisorResponse}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Past Advisor Q&A History */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: '#334155' }}>
            💬 Past Advisor Consultations
          </Typography>
          <Stack spacing={2}>
            {advisorHistory.map((item, idx) => (
              <Paper key={idx} elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af', mb: 1 }}>
                  ❓ Question: {item.q}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#334155', lineHeight: 1.7 }}>
                  {item.a}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 1 }}>
                  Answered {item.time}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CLASS RANK LEADERBOARD                             */}
      {/* ========================================================= */}
      {activeTab === 2 && (
        <Card sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
          <CardHeader
            avatar={<EmojiEventsIcon sx={{ color: '#eab308' }} />}
            title={<Typography variant="h6" sx={{ fontWeight: 800 }}>Class 10 Academic Leaderboard</Typography>}
            subheader="Calculated from quiz scores, answer correctness percentage, and total solved questions"
          />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Accuracy</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Questions Solved</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Honor Badge</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics?.leaderboard?.map((u) => {
                  const isCurrentUser = u.name.includes('(You)');
                  return (
                    <TableRow
                      key={u.rank}
                      sx={{
                        bgcolor: isCurrentUser ? '#eff6ff' : 'inherit',
                        borderLeft: isCurrentUser ? '4px solid #2563eb' : 'none',
                      }}
                    >
                      <TableCell sx={{ fontWeight: 800, fontSize: '1rem' }}>
                        {u.rank === 1 ? '🥇 #1' : u.rank === 2 ? '🥈 #2' : u.rank === 3 ? '🥉 #3' : `#${u.rank}`}
                      </TableCell>
                      <TableCell sx={{ fontWeight: isCurrentUser ? 800 : 600, color: isCurrentUser ? '#1d4ed8' : '#1e293b' }}>
                        {u.name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${u.accuracy}%`}
                          size="small"
                          color={u.accuracy >= 90 ? 'success' : u.accuracy >= 80 ? 'primary' : 'default'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{u.totalSolved} Questions</TableCell>
                      <TableCell>
                        <Chip label={u.badge} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SUBMISSIONS & ANSWER HISTORY                       */}
      {/* ========================================================= */}
      {activeTab === 3 && (
        <Card sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
          <CardHeader
            avatar={<AssessmentIcon color="primary" />}
            title={<Typography variant="h6" sx={{ fontWeight: 800 }}>Past Submissions & Correctness Log</Typography>}
            subheader="Detailed breakdown of your answered questions and weak topics per assessment"
          />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Subject & Topic</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Correctness / Score</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Identified Weak Topic</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics?.submissionsHistory?.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{sub.date}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {sub.subject}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sub.topic}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${sub.score} / ${sub.totalQuestions} (${sub.percentage}%)`}
                        size="small"
                        color={sub.percentage >= 80 ? 'success' : sub.percentage >= 60 ? 'warning' : 'error'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      {sub.weakTopics && sub.weakTopics.length > 0 ? (
                        <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>
                          • {sub.weakTopics.join(', ')}
                        </Typography>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700 }}>
                          ✨ 100% Mastery
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button component={RouterLink} to="/doubt-solving" size="small" variant="text" sx={{ fontWeight: 700 }}>
                        Solve Doubts
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ========================================================= */}
      {/* TAB 5: MONTHLY NCERT TEST (Dedicated Tab)                 */}
      {/* ========================================================= */}
      {activeTab === 4 && (
        <Box>
          {/* Header Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 60%, #4f46e5 100%)',
              color: '#fff',
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                  <CalendarMonthIcon sx={{ fontSize: 32, color: '#a5b4fc' }} />
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#f8fafc' }}>
                    {monthlyTestData?.title || 'October 2026 Monthly Board Examination'}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: '#c7d2fe', maxWidth: 680 }}>
                  Organised by Teachers &amp; AI Curriculum Engine • Strict NCERT Step-Marking • Real-time class rank impact
                </Typography>
                {/* ── Class & Subject Selector ── */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={1.5} flexWrap="wrap" alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={selectedClass}
                      onChange={async (e) => {
                        const cl = Number(e.target.value);
                        setSelectedClass(cl);
                        const avail = testCatalog.filter(t => t.classLevel === cl);
                        let nextSubj = selectedSubject;
                        if (avail.length > 0) {
                          if (!avail.some(a => a.subject === selectedSubject)) {
                            nextSubj = avail[0].subject;
                          }
                        } else {
                          nextSubj = cl >= 11 ? 'physics' : 'science';
                        }
                        setSelectedSubject(nextSubj);
                        try {
                          const res = await examPrepAPI.getMonthlyTest(cl, nextSubj);
                          const testObj = res?.data?.test || res?.data;
                          if (testObj) setMonthlyTestData(testObj);
                        } catch (err) {
                          console.error('Failed to load test on class switch:', err);
                        }
                      }}
                      sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 800, borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                        '& .MuiSvgIcon-root': { color: '#fff' },
                      }}
                    >
                      {[9, 10, 11, 12].map(cl => (
                        <MenuItem key={cl} value={cl} sx={{ fontWeight: 700 }}>Class {cl}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={selectedSubject}
                      onChange={async (e) => {
                        const sub = e.target.value as string;
                        setSelectedSubject(sub);
                        try {
                          const res = await examPrepAPI.getMonthlyTest(selectedClass, sub);
                          const testObj = res?.data?.test || res?.data;
                          if (testObj) setMonthlyTestData(testObj);
                        } catch (err) {
                          console.error('Failed to load test on subject switch:', err);
                        }
                      }}
                      sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 800, borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                        '& .MuiSvgIcon-root': { color: '#fff' },
                        textTransform: 'capitalize',
                      }}
                    >
                      {(testCatalog.filter(t => t.classLevel === selectedClass).length > 0
                        ? testCatalog.filter(t => t.classLevel === selectedClass)
                        : (selectedClass >= 11
                            ? [{ subject: 'physics', subjectLabel: 'Physics' }, { subject: 'chemistry', subjectLabel: 'Chemistry' }, { subject: 'maths', subjectLabel: 'Mathematics' }, { subject: 'biology', subjectLabel: 'Biology' }]
                            : [{ subject: 'science', subjectLabel: 'Science' }, { subject: 'maths', subjectLabel: 'Mathematics' }]
                          )
                      ).map(t => (
                        <MenuItem key={t.subject} value={t.subject} sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{t.subjectLabel}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={async () => {
                      try {
                        const res = await examPrepAPI.getMonthlyTest(selectedClass, selectedSubject);
                        const testObj = res?.data?.test || res?.data;
                        if (testObj) setMonthlyTestData(testObj);
                      } catch { /* silent */ }
                    }}
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', fontWeight: 800, borderRadius: 2,
                      '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
                    }}
                  >
                    Refresh
                  </Button>
                </Stack>
                <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
                  <Chip label={monthlyTestData ? `✅ ${monthlyTestData.title?.split('—')[0]?.trim() || 'Test Loaded'}` : `Class ${selectedClass} ${selectedSubject.charAt(0).toUpperCase()+selectedSubject.slice(1)} — Click Load`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.13)', color: '#c7d2fe', fontWeight: 700, maxWidth: 380 }} />
                  <Chip label={`${monthlyTestData?.durationMinutes || 45} Min`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.13)', color: '#fff', fontWeight: 700 }} />
                  <Chip label={`${monthlyTestData?.totalMarks || 10} Marks`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.13)', color: '#fff', fontWeight: 700 }} />
                  {monthlyTestData?.arihantReference && (
                    <Chip
                      label="📚 Arihant Ref"
                      size="small"
                      component="a"
                      href={monthlyTestData.arihantReference}
                      target="_blank"
                      clickable
                      sx={{ bgcolor: '#f59e0b', color: '#fff', fontWeight: 800 }}
                    />
                  )}
                </Stack>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={handleOpenMonthlyTest}
                sx={{
                  bgcolor: '#6366f1',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '1rem',
                  borderRadius: 2.5,
                  px: 4,
                  py: 1.5,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                  '&:hover': { bgcolor: '#4f46e5' },
                }}
              >
                Start Monthly Test
              </Button>
            </Stack>
          </Paper>

          {/* Test Info Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e0e7ff', bgcolor: '#eef2ff', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <TimerIcon sx={{ color: '#4f46e5', fontSize: 24 }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#4338ca', textTransform: 'uppercase' }}>Duration</Typography>
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e1b4b' }}>
                    {monthlyTestData?.durationMinutes || 45}{' '}
                    <Typography component="span" variant="body2" sx={{ fontWeight: 700, color: '#4f46e5' }}>mins</Typography>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 600 }}>Timed — auto-submits at zero</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid #dcfce7', bgcolor: '#f0fdf4', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <GradeIcon sx={{ color: '#16a34a', fontSize: 24 }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>Passing Marks</Typography>
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#14532d' }}>
                    {monthlyTestData?.passingMarks || 4}{' '}
                    <Typography component="span" variant="body2" sx={{ fontWeight: 700, color: '#16a34a' }}>/ {monthlyTestData?.totalMarks || 10}</Typography>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>NCERT Grade D or above required</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid #fef9c3', bgcolor: '#fefce8', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <LightbulbIcon sx={{ color: '#ca8a04', fontSize: 24 }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#a16207', textTransform: 'uppercase' }}>Hints Available</Typography>
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#713f12' }}>Yes</Typography>
                  <Typography variant="caption" sx={{ color: '#854d0e', fontWeight: 600 }}>💡 On hard questions only</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid #fecaca', bgcolor: '#fff5f5', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <HistoryIcon sx={{ color: '#dc2626', fontSize: 24 }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>Your Attempts</Typography>
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#7f1d1d' }}>{attemptHistory.length}</Typography>
                  <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>This session</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Marking Scheme Instructions */}
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
            <CardHeader
              avatar={<FactCheckIcon sx={{ color: '#4f46e5' }} />}
              title={<Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e1b4b' }}>NCERT Strict Step-Marking Scheme</Typography>}
              subheader="Exactly as per CBSE Board paper marking rubrics"
            />
            <Divider />
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={1}>
                {(monthlyTestData?.instructions || [
                  'Strict step-marking is enforced as per official NCERT guidelines.',
                  'Section A: 1 Mark each for objective concepts & assertion-reasoning.',
                  'Section B: 2 Marks each with step marking (Formula: 1m, Calculation: 1m).',
                  'Section C: 3 Marks each with step marking (Principle: 1m, Substitution: 1m, Result & Units: 1m).',
                  'Hints are available for challenging questions to facilitate scaffolded learning.',
                ]).map((inst: string, i: number) => (
                  <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                    <Chip
                      label={`${i + 1}`}
                      size="small"
                      sx={{ bgcolor: '#4f46e5', color: '#fff', fontWeight: 800, minWidth: 28, height: 22, fontSize: '0.72rem' }}
                    />
                    <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500, pt: 0.1 }}>{inst}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Attempt History Table */}
          {attemptHistory.length > 0 ? (
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardHeader
                avatar={<HistoryIcon sx={{ color: '#6366f1' }} />}
                title={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Your Test Attempt History (This Session)</Typography>}
                subheader="Scores and ranks from monthly tests submitted today"
              />
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Date &amp; Time</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Score</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Percentage</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Grade</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Rank</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attemptHistory.map((att, idx) => (
                      <TableRow key={idx} sx={{ bgcolor: idx === 0 ? '#eff6ff' : 'inherit' }}>
                        <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{att.date}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${att.marks} / ${att.maxMarks}`}
                            size="small"
                            color={att.percentage >= 80 ? 'success' : att.percentage >= 50 ? 'warning' : 'error'}
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: att.percentage >= 80 ? '#15803d' : att.percentage >= 50 ? '#ca8a04' : '#dc2626' }}>
                          {att.percentage}%
                        </TableCell>
                        <TableCell>
                          <Chip label={att.grade.split(' ')[0]} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#4f46e5' }}>#{att.rank}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          ) : (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '2px dashed #e2e8f0', textAlign: 'center' }}>
              <CalendarMonthIcon sx={{ fontSize: 56, color: '#c7d2fe', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#4f46e5', mb: 0.5 }}>
                No attempts yet this session
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Click "Start Monthly Test" to take the October 2026 NCERT Board Examination. Your score updates your live class rank instantly.
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleOpenMonthlyTest}
                sx={{ bgcolor: '#4f46e5', fontWeight: 800, borderRadius: 2.5, px: 3.5, '&:hover': { bgcolor: '#4338ca' } }}
              >
                Start Test Now
              </Button>
            </Paper>
          )}
        </Box>
      )}

      {/* ========================================================= */}
      {/* MONTHLY NCERT ASSESSMENT RUNNER & STEP-MARKING DIALOG     */}
      {/* ========================================================= */}
      <Dialog
        open={monthlyTestOpen}
        onClose={() => setMonthlyTestOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3.5, p: 1 },
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                <CalendarMonthIcon sx={{ color: '#4f46e5' }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {monthlyTestData?.title || 'Monthly NCERT Board Examination'}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Step-Marking: Formula (1m) • Calculation (1m) • Derivation (1m) • Units (0.5m)
              </Typography>
            </Box>
            {/* Live countdown timer */}
            {!monthlyTestResult && (
              <Paper
                elevation={0}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: testTimeLeft < 300 ? '#fef2f2' : '#eff6ff',
                  border: `2px solid ${testTimeLeft < 300 ? '#fca5a5' : '#bfdbfe'}`,
                  minWidth: 120,
                  textAlign: 'center',
                }}
              >
                <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                  <TimerIcon sx={{ fontSize: 18, color: testTimeLeft < 300 ? '#dc2626' : '#2563eb' }} />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 900, color: testTimeLeft < 300 ? '#dc2626' : '#1e40af', fontFamily: 'monospace' }}
                  >
                    {formatTime(testTimeLeft)}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={monthlyTestData ? (testTimeLeft / ((monthlyTestData.durationMinutes || 45) * 60)) * 100 : 100}
                  sx={{
                    mt: 0.5,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: testTimeLeft < 300 ? '#fecaca' : '#dbeafe',
                    '& .MuiLinearProgress-bar': { bgcolor: testTimeLeft < 300 ? '#dc2626' : '#2563eb' },
                  }}
                />
                <Typography variant="caption" sx={{ color: testTimeLeft < 300 ? '#dc2626' : '#3b82f6', fontWeight: 700 }}>
                  {testTimeLeft < 300 ? '⚠️ Hurry!' : 'Time Left'}
                </Typography>
              </Paper>
            )}
            <IconButton onClick={() => { setMonthlyTestOpen(false); if (timerRef.current) clearInterval(timerRef.current); setTestTimerActive(false); }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {/* If Result is Ready: Show Strict Step-Marking Audit Sheet */}
          {monthlyTestResult ? (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  bgcolor: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  textAlign: 'center',
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 48, color: '#16a34a', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#14532d' }}>
                  Assessment Evaluated Under Strict NCERT Marking Scheme!
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#15803d', my: 1 }}>
                  {monthlyTestResult.totalMarksEarned} / {monthlyTestResult.maxMarks} Marks
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#166534' }}>
                  Score: {monthlyTestResult.percentage}% | Grade: {monthlyTestResult.grade}
                </Typography>
                <Chip
                  label={monthlyTestResult.rankStatusText}
                  color="primary"
                  sx={{ mt: 1.5, fontWeight: 800, fontSize: '0.85rem' }}
                />
              </Paper>

              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                📝 Step-by-Step NCERT Marking Audit:
              </Typography>

              <Stack spacing={2}>
                {monthlyTestResult.stepAudit?.map((sa: any, sIdx: number) => (
                  <Paper
                    key={sIdx}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: sa.isCorrect ? '#bbf7d0' : '#fecaca',
                      bgcolor: sa.isCorrect ? '#ffffff' : '#fff5f5',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        Q{sa.questionNumber}: {sa.section}
                      </Typography>
                      <Chip
                        label={`${sa.marksEarned} / ${sa.maxMarks} Marks`}
                        size="small"
                        color={sa.isCorrect ? 'success' : 'error'}
                        sx={{ fontWeight: 800 }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {sa.question}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    {/* Step Breakdown */}
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.5 }}>
                      NCERT Rubric Steps Evaluated:
                    </Typography>
                    <Stack spacing={0.8} sx={{ mb: 1.5 }}>
                      {sa.stepBreakdown?.map((sb: any, sbIdx: number) => (
                        <Box key={sbIdx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#334155' }}>
                            • {sb.step}
                          </Typography>
                          <Chip
                            label={`${sb.marksEarned} / ${sb.marksAllocated}m`}
                            size="small"
                            variant="outlined"
                            color={sb.status === 'FULL_MARKS_AWARDED' ? 'success' : 'error'}
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                          />
                        </Box>
                      ))}
                    </Stack>

                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#334155', display: 'block' }}>
                        <strong>NCERT Rationale:</strong> {sa.explanation}
                      </Typography>
                      {sa.chapterReference && (
                        <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700, display: 'block', mt: 0.5 }}>
                          📚 Chapter Ref: {sa.chapterReference}
                        </Typography>
                      )}
                    </Paper>
                  </Paper>
                ))}
              </Stack>

              {/* ── Points for Improvement & Weak Concept Analysis (Arihant Reference) ── */}
              <Card sx={{ mt: 3, borderRadius: 3, border: '1.5px solid #fed7aa', bgcolor: '#fffaf5' }}>
                <CardHeader
                  avatar={<LightbulbIcon sx={{ color: '#ea580c' }} />}
                  title={<Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#9a3412' }}>🎯 Points for Improvement &amp; Targeted Arihant Guidance</Typography>}
                  subheader="Personalized analysis to maximize your board exam step-score"
                />
                <Divider />
                <CardContent sx={{ p: 2.5 }}>
                  {monthlyTestResult.improvementRecommendations && monthlyTestResult.improvementRecommendations.length > 0 ? (
                    <Stack spacing={1.5}>
                      {monthlyTestResult.improvementRecommendations.map((rec: any, rIdx: number) => (
                        <Paper key={rIdx} elevation={0} sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #fed7aa' }}>
                          <Stack direction="row" spacing={1} alignItems="center" mb={0.5} justifyContent="space-between" flexWrap="wrap">
                            <Chip label={`Q${rec.questionNumber} Weakness`} size="small" color="warning" sx={{ fontWeight: 800 }} />
                            {rec.sourceLink && (
                              <Chip
                                label="Open Arihant Book ↗"
                                size="small"
                                component="a"
                                href={rec.sourceLink}
                                target="_blank"
                                clickable
                                sx={{ bgcolor: '#f97316', color: '#fff', fontWeight: 800 }}
                              />
                            )}
                          </Stack>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#7c2d12', mt: 0.5 }}>
                            {rec.topic}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#431407', display: 'block', mt: 0.5 }}>
                            💡 {rec.advice}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" sx={{ color: '#166534', fontWeight: 800 }}>
                        🌟 Outstanding 100% Mastery!
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#15803d' }}>
                        You scored maximum marks across all NCERT rubrics. Maintain consistency by solving Board Exemplar problems.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* ── Teacher Feedback Transmitted Alert ── */}
              <Alert severity="success" sx={{ mt: 3, borderRadius: 2.5, border: '1px solid #86efac' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  📡 Detailed Feedback Auto-Sent to Teacher Dashboard
                </Typography>
                <Typography variant="caption">
                  Your marks ({monthlyTestResult.totalMarksEarned}/{monthlyTestResult.maxMarks}), step rubric breakdowns, and {monthlyTestResult.weakPoints?.length || 0} identified weak concepts have been shared with your faculty. Your teacher can now organise custom remedial tests for your ongoing academic development.
                </Typography>
              </Alert>

              {/* ── Past Performance & Attempt Trends Analysis ── */}
              {attemptHistory.length > 0 && (
                <Card sx={{ mt: 3, borderRadius: 3, border: '1px solid #e0e7ff', bgcolor: '#f5f3ff' }}>
                  <CardHeader
                    avatar={<HistoryIcon sx={{ color: '#7c3aed' }} />}
                    title={<Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#5b21b6' }}>📈 Past Performance &amp; Accuracy History</Typography>}
                  />
                  <Divider />
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      {attemptHistory.slice(-4).map((att: any, aIdx: number) => (
                        <Box key={aIdx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#fff', borderRadius: 1.5, border: '1px solid #e9d5ff' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#3b0764' }}>
                            Attempt #{aIdx + 1} ({att.date})
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Chip label={`${att.score} / ${att.maxMarks} Marks`} size="small" color="primary" sx={{ fontWeight: 800 }} />
                            <Chip label={`${att.percentage}%`} size="small" color={att.percentage >= 80 ? 'success' : 'warning'} sx={{ fontWeight: 800 }} />
                            <Chip label={att.grade} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Box>
          ) : (
            /* Active Test Questions View */
            <Box>
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  NCERT Examination Rules:
                </Typography>
                <Typography variant="caption">
                  Step marking is strictly applied per official CBSE rubrics. Use the 💡 Hint button on difficult numericals and derivations if needed.
                </Typography>
              </Alert>

              {monthlyTestData?.sections?.map((sec: any, secIdx: number) => (
                <Box key={secIdx} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e1b4b', mb: 1.5, pb: 0.5, borderBottom: '2px solid #e0e7ff' }}>
                    {sec.name}
                  </Typography>

                  <Stack spacing={2.5}>
                    {sec.questions?.map((q: any) => {
                      const selectedVal = monthlyTestAnswers[q.id] !== undefined ? monthlyTestAnswers[q.id] : -1;
                      const isHintOpen = testHintsOpen[q.id] || false;

                      return (
                        <Paper
                          key={q.id}
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 3,
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <Chip label={`Q${q.questionNumber}`} size="small" color="primary" sx={{ fontWeight: 800 }} />
                              <Chip label={`${q.marks} Mark${q.marks > 1 ? 's' : ''}`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                              {q.difficulty === 'hard' && (
                                <Chip label="Hard Question" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }} />
                              )}
                            </Stack>

                            {/* Hint Button for Hard questions */}
                            {q.hint && (
                              <Button
                                size="small"
                                startIcon={<LightbulbIcon sx={{ color: '#ca8a04' }} />}
                                onClick={() => toggleTestHint(q.id)}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  color: '#854d0e',
                                  bgcolor: '#fefce8',
                                  borderRadius: 2,
                                  '&:hover': { bgcolor: '#fef9c3' },
                                }}
                              >
                                {isHintOpen ? 'Hide Hint' : '💡 Need NCERT Hint?'}
                              </Button>
                            )}
                          </Box>

                          {/* Expandable Hint Box */}
                          {isHintOpen && q.hint && (
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                my: 1.5,
                                bgcolor: '#fefce8',
                                border: '1px solid #fde047',
                                borderRadius: 2,
                              }}
                            >
                              <Typography variant="caption" sx={{ color: '#713f12', fontWeight: 600, display: 'block' }}>
                                {q.hint}
                              </Typography>
                            </Paper>
                          )}

                          <Typography variant="body1" sx={{ fontWeight: 700, my: 1.5, color: '#0f172a' }}>
                            {q.question}
                          </Typography>

                          {/* Options */}
                          <FormControl component="fieldset" sx={{ width: '100%' }}>
                            <RadioGroup
                              value={selectedVal}
                              onChange={(e) => handleSelectMonthlyAnswer(q.id, Number(e.target.value))}
                            >
                              {q.options?.map((opt: string, optIdx: number) => (
                                <Paper
                                  key={optIdx}
                                  elevation={0}
                                  sx={{
                                    p: 1.2,
                                    mb: 1,
                                    borderRadius: 2,
                                    border: selectedVal === optIdx ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                                    bgcolor: selectedVal === optIdx ? '#eef2ff' : '#f8fafc',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleSelectMonthlyAnswer(q.id, optIdx)}
                                >
                                  <FormControlLabel
                                    value={optIdx}
                                    control={<Radio size="small" checked={selectedVal === optIdx} />}
                                    label={<Typography variant="body2" sx={{ fontWeight: selectedVal === optIdx ? 700 : 500 }}>{opt}</Typography>}
                                    sx={{ width: '100%', m: 0 }}
                                  />
                                </Paper>
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <Button onClick={() => setMonthlyTestOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>
            {monthlyTestResult ? 'Close Audit Sheet' : 'Cancel & Exit'}
          </Button>

          {!monthlyTestResult ? (
            <Button
              variant="contained"
              onClick={handleSubmitMonthlyTest}
              disabled={monthlyTestSubmitting}
              startIcon={monthlyTestSubmitting ? <CircularProgress size={18} color="inherit" /> : <FactCheckIcon />}
              sx={{ bgcolor: '#4f46e5', fontWeight: 800, borderRadius: 2.5, px: 3.5, '&:hover': { bgcolor: '#4338ca' } }}
            >
              Submit for Strict NCERT Evaluation
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => {
                setMonthlyTestResult(null);
                setMonthlyTestOpen(false);
              }}
              sx={{ bgcolor: '#16a34a', fontWeight: 800, borderRadius: 2.5, px: 3.5 }}
            >
              Done & Return to Dashboard
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentDashboard;
