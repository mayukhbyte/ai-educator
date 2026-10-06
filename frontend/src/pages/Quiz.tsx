import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Stack,
  MenuItem,
  Select,
  Chip,
  LinearProgress,
  Paper,
  Divider,
  Grid,
  Link,
  Alert,
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SchoolIcon from '@mui/icons-material/School';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TimerIcon from '@mui/icons-material/Timer';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import WarningIcon from '@mui/icons-material/Warning';
import SpeedIcon from '@mui/icons-material/Speed';
import { quizAPI } from '../services/api';

interface QuestionItem {
  id: number | string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic?: string;
  chapterReference?: string;
  classLevel?: number;
  difficulty?: 'basic' | 'medium' | 'hard' | string;
  source?: string;
}

interface TopicStat {
  topic: string;
  total: number;
  correct: number;
  chapter: string;
  sourceUrl: string;
}

interface RevisionPlanItem {
  topic: string;
  accuracy: string;
  recommendedChapter: string;
  ebookUrl: string;
  action: string;
}

interface SubmitResult {
  setId: string;
  classLevel: number;
  subject: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  masteryLevel: string;
  topicBreakdown: TopicStat[];
  weakTopics: TopicStat[];
  strongTopics: TopicStat[];
  revisionPlan: RevisionPlanItem[];
  ebookLinks: Record<string, string>;
}

// Helper: 15s for basic, 30s for medium, 60s for hard
const getDifficultyDuration = (diff?: string): number => {
  const d = (diff || '').toLowerCase();
  if (d === 'basic' || d === 'easy') return 15;
  if (d === 'hard' || d === 'advanced') return 60;
  return 30; // Medium is default
};

const Quiz: React.FC = () => {
  const [classLevel, setClassLevel] = useState<number>(10);
  const [subject, setSubject] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [setId, setSetId] = useState<string>('');
  const [sourceTag, setSourceTag] = useState<string>('supabase-realtime');
  const [totalPool, setTotalPool] = useState<number>(0);

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  // Difficulty-based Quiz Timer State
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [answeredTimeSpent, setAnsweredTimeSpent] = useState<number | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Compute maximum allowed time for current question
  const currentQ = questions[currentQuestion] || null;
  const currentDuration = getDifficultyDuration(currentQ?.difficulty || difficulty);

  // Load a fresh dynamic set of questions every time the user enters or changes options
  const fetchFreshQuizSet = useCallback(async () => {
    setLoading(true);
    setQuizFinished(false);
    setCurrentQuestion(0);
    setIsAnswerSubmitted(false);
    setIsTimedOut(false);
    setShowHint(false);
    setAnsweredTimeSpent(null);
    setSubmitResult(null);

    try {
      const res = await quizAPI.generateQuiz({
        classLevel,
        subject,
        difficulty,
        numQuestions,
        userId: 'student-session-' + Date.now(),
      });

      if (res?.data?.questions && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
        setQuestions(res.data.questions);
        setSetId(res.data.setId || `SET-${Date.now()}`);
        setSourceTag(res.data.source || 'supabase-realtime');
        setTotalPool(res.data.totalPoolSize || res.data.questions.length);
        setSelectedAnswers(new Array(res.data.questions.length).fill(-1));
        const initDuration = getDifficultyDuration(res.data.questions[0]?.difficulty || difficulty);
        setTimeLeft(initDuration);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Could not fetch dynamic quiz set:', err);
    }

    // Fallback if API fails
    setLoading(false);
  }, [classLevel, subject, difficulty, numQuestions]);

  // Trigger real-time dynamic fetch on mount or when class/subject/difficulty changes
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchFreshQuizSet();
  }, [fetchFreshQuizSet]);

  // Reset timer & hints on question switch
  useEffect(() => {
    if (questions.length > 0 && currentQ) {
      const dur = getDifficultyDuration(currentQ.difficulty || difficulty);
      // oxlint-disable-next-line react/set-state-in-effect
      setTimeLeft(dur);
      setIsTimedOut(false);
      setShowHint(false);
      setAnsweredTimeSpent(null);
      setIsAnswerSubmitted(false);
    }
  }, [currentQuestion, questions, difficulty, currentQ]);

  // Active Timer Countdown Effect
  useEffect(() => {
    if (quizFinished || isAnswerSubmitted || loading || !questions.length) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimedOut(true);
          setIsAnswerSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, isAnswerSubmitted, quizFinished, loading, questions.length]);

  const handleSelectAnswer = (optionIndex: number) => {
    if (isAnswerSubmitted) return;
    const updated = [...selectedAnswers];
    updated[currentQuestion] = optionIndex;
    setSelectedAnswers(updated);
  };

  const handleConfirmCurrentAnswer = () => {
    if (selectedAnswers[currentQuestion] === -1) return;
    setAnsweredTimeSpent(currentDuration - timeLeft);
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setIsAnswerSubmitted(false);
      setIsTimedOut(false);
      setAnsweredTimeSpent(null);
    } else {
      // Quiz Finished: Evaluate with server-side analysis
      setLoading(true);
      try {
        const res = await quizAPI.submitQuiz({
          setId,
          classLevel,
          subject,
          answers: selectedAnswers,
          questionsData: questions,
          userId: 'student-session',
        });
        if (res?.data) {
          setSubmitResult(res.data);
        }
      } catch (err) {
        console.warn('Error submitting quiz analysis:', err);
      }
      setQuizFinished(true);
      setLoading(false);
    }
  };

  const currentSelected = selectedAnswers[currentQuestion] !== undefined ? selectedAnswers[currentQuestion] : -1;
  const progressPercent = questions.length > 0 ? ((currentQuestion + (quizFinished ? 1 : 0)) / questions.length) * 100 : 0;

  return (
    <Box sx={{ pb: 8, maxWidth: 1080, mx: 'auto', px: { xs: 1, sm: 2 } }}>
      {/* Header & Control Bar */}
      <Card
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <SchoolIcon sx={{ color: '#60a5fa', fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                Adaptive NCERT Quiz System
              </Typography>
              <Chip
                label="Real-Time Set"
                size="small"
                sx={{ bgcolor: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '0.72rem' }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 600 }}>
              Questions dynamically regenerate every time you enter, aligned directly with official NCERT e-Books and government curriculum links.
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<ShuffleIcon />}
            onClick={fetchFreshQuizSet}
            disabled={loading}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2.5,
              px: 2.5,
              py: 1,
              whiteSpace: 'nowrap',
            }}
          >
            Regenerate Fresh Set
          </Button>
        </Stack>

        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.12)' }} />

        {/* Filters: Class, Subject, Difficulty/Timer, Question Count */}
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Target Class / Grade:
            </Typography>
            <Select
              size="small"
              fullWidth
              value={classLevel}
              onChange={(e) => setClassLevel(Number(e.target.value))}
              sx={{
                bgcolor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                borderRadius: 2,
                '.MuiSvgIcon-root': { color: '#fff' },
                fieldset: { borderColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <MenuItem value={10}>Class 10 (NCERT Board Sets)</MenuItem>
              <MenuItem value={9}>Class 9 (NCERT Sets)</MenuItem>
              <MenuItem value={11}>Class 11 (NCERT Sets)</MenuItem>
              <MenuItem value={12}>Class 12 (NCERT Sets)</MenuItem>
            </Select>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Subject:
            </Typography>
            <Select
              size="small"
              fullWidth
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                borderRadius: 2,
                '.MuiSvgIcon-root': { color: '#fff' },
                fieldset: { borderColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <MenuItem value="all">All Subjects (Combined)</MenuItem>
              <MenuItem value="mathematics">Mathematics</MenuItem>
              <MenuItem value="physics">Physics</MenuItem>
              <MenuItem value="chemistry">Chemistry</MenuItem>
              <MenuItem value="biology">Biology</MenuItem>
            </Select>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Difficulty & Timer:
            </Typography>
            <Select
              size="small"
              fullWidth
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                borderRadius: 2,
                '.MuiSvgIcon-root': { color: '#fff' },
                fieldset: { borderColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <MenuItem value="basic">🟢 Basic (15s / Question)</MenuItem>
              <MenuItem value="medium">🟡 Medium (30s / Question)</MenuItem>
              <MenuItem value="hard">🔴 Hard (60s / Question)</MenuItem>
            </Select>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Question Set Size:
            </Typography>
            <Select
              size="small"
              fullWidth
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              sx={{
                bgcolor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                borderRadius: 2,
                '.MuiSvgIcon-root': { color: '#fff' },
                fieldset: { borderColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <MenuItem value={3}>3 Questions (Sprint)</MenuItem>
              <MenuItem value={5}>5 Questions (Standard)</MenuItem>
              <MenuItem value={10}>10 Questions (Full Test)</MenuItem>
              <MenuItem value={15}>15 Questions (Intensive Bank)</MenuItem>
            </Select>
          </Grid>
        </Grid>
      </Card>

      {/* Set Badge and Status Info */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Chip
          icon={<AutoStoriesIcon />}
          label={`Set: ${setId || 'Loading...'}`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, borderColor: '#cbd5e1' }}
        />
        <Chip
          label={`Class ${classLevel} Curriculum`}
          size="small"
          color="secondary"
          sx={{ fontWeight: 600 }}
        />
        <Chip
          icon={<TimerIcon />}
          label={
            difficulty === 'basic'
              ? '15s Timer (Basic)'
              : difficulty === 'hard'
              ? '60s Timer (Hard)'
              : '30s Timer (Medium)'
          }
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor:
              difficulty === 'basic'
                ? '#dcfce7'
                : difficulty === 'hard'
                ? '#fee2e2'
                : '#fef3c7',
            color:
              difficulty === 'basic'
                ? '#15803d'
                : difficulty === 'hard'
                ? '#b91c1c'
                : '#b45309',
          }}
        />
        <Chip
          label={
            sourceTag.includes('gemini-generated')
              ? sourceTag.includes('supabase')
                ? '🟣 Supabase + Gemini AI'
                : '🟣 Gemini AI Generated'
              : sourceTag.includes('openai')
              ? sourceTag.includes('supabase')
                ? '🟡 Supabase + OpenAI'
                : '🟡 OpenAI Generated'
              : sourceTag === 'supabase-realtime'
              ? '🟢 Supabase Real-Time'
              : '🔵 Static NCERT Bank'
          }
          size="small"
          variant="outlined"
          sx={{
            borderColor: sourceTag.includes('gemini') ? '#9333ea' : sourceTag.includes('openai') ? '#f59e0b' : sourceTag === 'supabase-realtime' ? '#22c55e' : '#60a5fa',
            color: sourceTag.includes('gemini') ? '#9333ea' : sourceTag.includes('openai') ? '#f59e0b' : sourceTag === 'supabase-realtime' ? '#22c55e' : '#60a5fa',
            fontWeight: 700,
          }}
        />
        {totalPool > 0 && (
          <Typography variant="caption" color="text.secondary">
            Pool available: {totalPool} questions
          </Typography>
        )}
      </Stack>

      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            {quizFinished ? 'Assessment Finished' : `Question ${currentQuestion + 1} of ${questions.length}`}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Progress: {Math.round(progressPercent)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0' }}
        />
      </Box>

      {/* Content Body */}
      {loading ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3.5, background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#fff' }}>
          <CircularProgress size={52} thickness={4} sx={{ color: '#a855f7' }} />
          <Typography variant="h6" sx={{ mt: 2, fontWeight: 700, color: '#f8fafc' }}>
            🟣 Generating fresh NCERT questions with Gemini AI...
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
            Class {classLevel} · {subject === 'all' ? 'All Subjects' : subject.charAt(0).toUpperCase() + subject.slice(1)} · {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty
          </Typography>
        </Card>
      ) : quizFinished && submitResult ? (
        /* ========================================================= */
        /* DETAILED NCERT ANALYSIS & REVISION SCREEN                 */
        /* ========================================================= */
        <Box>
          <Card sx={{ p: 4, borderRadius: 4, mb: 3, border: '1px solid #e2e8f0' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <QuizIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Performance Analysis & Mastery Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set Code: <strong>{submitResult.setId}</strong> | Grade: Class {submitResult.classLevel}
              </Typography>
            </Box>

            {/* Score Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    textAlign: 'center',
                    borderRadius: 3,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    SCORE
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', my: 0.5 }}>
                    {submitResult.score} / {submitResult.totalQuestions}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Accuracy: {submitResult.percentage}%
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    textAlign: 'center',
                    borderRadius: 3,
                    bgcolor:
                      submitResult.percentage >= 70
                        ? '#f0fdf4'
                        : submitResult.percentage >= 40
                        ? '#fffbeb'
                        : '#fef2f2',
                    border: '1px solid',
                    borderColor:
                      submitResult.percentage >= 70
                        ? '#bbf7d0'
                        : submitResult.percentage >= 40
                        ? '#fde68a'
                        : '#fecaca',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    MASTERY LEVEL
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      my: 1.2,
                      color:
                        submitResult.percentage >= 70
                          ? '#16a34a'
                          : submitResult.percentage >= 40
                          ? '#d97706'
                          : '#dc2626',
                    }}
                  >
                    {submitResult.masteryLevel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Based on NCERT Class {submitResult.classLevel} standards
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    textAlign: 'center',
                    borderRadius: 3,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    TOPIC MASTERY
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, my: 1.2, color: '#334155' }}>
                    {submitResult.strongTopics.length} / {submitResult.topicBreakdown.length} Topics
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Topics cleared at ≥ 70% threshold
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Topic-by-Topic Breakdown Matrix */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="primary" /> Chapter & Topic Breakdown
            </Typography>

            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {submitResult.topicBreakdown.map((tb, idx) => {
                const pct = Math.round((tb.correct / tb.total) * 100);
                return (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid #e2e8f0',
                      bgcolor: '#ffffff',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {tb.topic}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Reference: {tb.chapter}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${tb.correct}/${tb.total} Correct (${pct}%)`}
                        size="small"
                        color={pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'error'}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444',
                        },
                      }}
                    />
                  </Paper>
                );
              })}
            </Stack>

            {/* Targeted NCERT Revision Recommendations */}
            {submitResult.revisionPlan && submitResult.revisionPlan.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon color="warning" /> NCERT Recommended Study Actions
                </Typography>
                <Stack spacing={1.5}>
                  {submitResult.revisionPlan.map((rp, idx) => (
                    <Alert
                      key={idx}
                      severity="info"
                      icon={<MenuBookIcon />}
                      action={
                        <Button
                          color="inherit"
                          size="small"
                          href={rp.ebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          endIcon={<OpenInNewIcon />}
                        >
                          Read e-Book
                        </Button>
                      }
                      sx={{ borderRadius: 2.5 }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {rp.topic} ({rp.accuracy} accuracy)
                      </Typography>
                      <Typography variant="body2">{rp.action}</Typography>
                    </Alert>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Official Government e-Book & Resource Links */}
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: '#f1f5f9', mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
                📖 Free Government e-Books & Digital Portals (NCERT / DIKSHA):
              </Typography>
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Link
                  href="https://ncert.nic.in/textbook.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}
                >
                  NCERT Official e-Textbooks <OpenInNewIcon fontSize="small" />
                </Link>
                <Link
                  href="https://diksha.gov.in/explore"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}
                >
                  DIKSHA National Portal <OpenInNewIcon fontSize="small" />
                </Link>
                <Link
                  href="https://ndl.iitkgp.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}
                >
                  National Digital Library of India (NDLI) <OpenInNewIcon fontSize="small" />
                </Link>
              </Stack>
            </Box>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<RestartAltIcon />}
                onClick={fetchFreshQuizSet}
                sx={{ px: 4, py: 1.2, borderRadius: 2.5, fontWeight: 700 }}
              >
                Take Another Dynamic Class {classLevel} Set
              </Button>
            </Stack>
          </Card>
        </Box>
      ) : currentQ ? (
        /* ========================================================= */
        /* ACTIVE QUESTION CARD                                      */
        /* ========================================================= */
        <Card sx={{ borderRadius: 3.5, border: '1px solid rgba(226, 232, 240, 0.9)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            {/* Question Badges & Live Timer HUD */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{
                mb: 2,
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
              }}
            >
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={`Question ${currentQuestion + 1} of ${questions.length}`}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  icon={<SpeedIcon />}
                  label={
                    currentDuration === 15
                      ? 'Basic (15s)'
                      : currentDuration === 60
                      ? 'Hard (60s)'
                      : 'Medium (30s)'
                  }
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor:
                      currentDuration === 15
                        ? '#dcfce7'
                        : currentDuration === 60
                        ? '#fee2e2'
                        : '#fef3c7',
                    color:
                      currentDuration === 15
                        ? '#15803d'
                        : currentDuration === 60
                        ? '#b91c1c'
                        : '#b45309',
                  }}
                />
                {currentQ.topic && (
                  <Chip
                    label={currentQ.topic}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
                {currentQ.chapterReference && (
                  <Chip
                    icon={<MenuBookIcon />}
                    label={currentQ.chapterReference}
                    size="small"
                    sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}
                  />
                )}
              </Stack>

              {/* Dynamic Live Countdown Timer HUD */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isTimedOut ? (
                  <Chip
                    icon={<HourglassBottomIcon />}
                    label="⏰ Time's Up!"
                    color="error"
                    sx={{ fontWeight: 800, fontSize: '0.85rem' }}
                  />
                ) : isAnswerSubmitted && answeredTimeSpent !== null ? (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`⚡ Answered in ${answeredTimeSpent}s`}
                    color="success"
                    sx={{ fontWeight: 700, fontSize: '0.85rem' }}
                  />
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                      px: 2,
                      py: 0.8,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      border: '1.5px solid',
                      borderColor:
                        timeLeft <= 5
                          ? '#ef4444'
                          : timeLeft <= 10
                          ? '#f59e0b'
                          : '#3b82f6',
                      bgcolor:
                        timeLeft <= 5
                          ? '#fef2f2'
                          : timeLeft <= 10
                          ? '#fffbeb'
                          : '#eff6ff',
                      color:
                        timeLeft <= 5
                          ? '#dc2626'
                          : timeLeft <= 10
                          ? '#b45309'
                          : '#1d4ed8',
                      boxShadow:
                        timeLeft <= 5
                          ? '0 0 12px rgba(239, 68, 68, 0.4)'
                          : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {timeLeft <= 5 ? (
                      <WarningIcon sx={{ fontSize: 20, color: '#dc2626' }} />
                    ) : (
                      <AccessTimeFilledIcon sx={{ fontSize: 20 }} />
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.5px' }}>
                      00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}s
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.8 }}>
                      ({currentDuration}s limit)
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Stack>

            {/* Time Remaining Progress Bar for Active Question */}
            {!isAnswerSubmitted && (
              <Box sx={{ mb: 2.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(0, Math.min(100, (timeLeft / currentDuration) * 100))}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor:
                        timeLeft <= 5
                          ? '#ef4444'
                          : timeLeft <= 10
                          ? '#f59e0b'
                          : '#2563eb',
                      transition: 'transform 0.4s linear',
                    },
                  }}
                />
              </Box>
            )}

            {/* Timeout Banner when question expires */}
            {isTimedOut && (
              <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  ⏰ Time's up! The {currentDuration}-second time limit for this question has expired.
                </Typography>
                <Typography variant="caption">
                  Review the correct answer and step-by-step NCERT explanation below, then proceed to the next question.
                </Typography>
              </Alert>
            )}

            {/* Question Statement */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.5, color: '#0f172a' }}>
              {currentQ.question}
            </Typography>

            {/* Interactive NCERT Concept Hint (Available for all questions, especially Hard ones) */}
            {currentQ.hint && (
              <Box sx={{ mb: 2.5 }}>
                {!showHint ? (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LightbulbIcon sx={{ color: '#ca8a04' }} />}
                    onClick={() => setShowHint(true)}
                    sx={{
                      borderColor: '#fde047',
                      bgcolor: '#fefce8',
                      color: '#854d0e',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 2,
                      py: 0.7,
                      '&:hover': { bgcolor: '#fef9c3', borderColor: '#facc15' },
                    }}
                  >
                    💡 Need an NCERT Hint / Formula Clue? (Scaffolded Learning)
                  </Button>
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: '#fefce8',
                      border: '1.5px solid #fde047',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                    }}
                  >
                    <LightbulbIcon sx={{ color: '#ca8a04', fontSize: 24, mt: 0.2 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#854d0e' }}>
                          NCERT Conceptual Hint:
                        </Typography>
                        <Chip
                          label="Scaffolded Learning"
                          size="small"
                          sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#fef08a', color: '#713f12', fontWeight: 700 }}
                        />
                      </Stack>
                      <Typography variant="body2" sx={{ color: '#713f12', lineHeight: 1.5 }}>
                        {currentQ.hint}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => setShowHint(false)}
                      sx={{ minWidth: 'auto', px: 1, py: 0.3, color: '#854d0e', fontWeight: 700, textTransform: 'none' }}
                    >
                      Hide
                    </Button>
                  </Paper>
                )}
              </Box>
            )}

            {/* Options List */}
            <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
              <RadioGroup
                value={currentSelected}
                onChange={(e) => {
                  if (!isAnswerSubmitted) {
                    handleSelectAnswer(Number(e.target.value));
                  }
                }}
              >
                {currentQ.options.map((option, index) => {
                  let borderStyle = '1.5px solid #e2e8f0';
                  let bgColor = '#ffffff';

                  if (isAnswerSubmitted) {
                    if (index === currentQ.correctAnswer) {
                      borderStyle = '2px solid #22c55e';
                      bgColor = '#f0fdf4';
                    } else if (index === currentSelected) {
                      borderStyle = '2px solid #ef4444';
                      bgColor = '#fef2f2';
                    }
                  } else if (currentSelected === index) {
                    borderStyle = '2px solid #2563eb';
                    bgColor = '#eff6ff';
                  }

                  return (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 1.8,
                        mb: 1.8,
                        borderRadius: 2.5,
                        border: borderStyle,
                        backgroundColor: bgColor,
                        cursor: isAnswerSubmitted ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: isAnswerSubmitted ? undefined : '#93c5fd',
                          bgcolor: isAnswerSubmitted ? undefined : '#f8fafc',
                        },
                      }}
                      onClick={() => {
                        if (!isAnswerSubmitted) handleSelectAnswer(index);
                      }}
                    >
                      <FormControlLabel
                        value={index}
                        control={<Radio checked={currentSelected === index} />}
                        label={
                          <Typography variant="body1" sx={{ fontWeight: currentSelected === index ? 600 : 400 }}>
                            {option}
                          </Typography>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </Paper>
                  );
                })}
              </RadioGroup>
            </FormControl>

            {/* Step-by-Step NCERT Explanation (Shows after answering) */}
            {isAnswerSubmitted && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 2.5,
                  backgroundColor: currentSelected === currentQ.correctAnswer ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${currentSelected === currentQ.correctAnswer ? '#86efac' : '#fca5a5'}`,
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  {currentSelected === currentQ.correctAnswer ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {currentSelected === currentQ.correctAnswer
                      ? 'Correct Answer!'
                      : 'Incorrect Answer'}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6, mb: 1 }}>
                  {currentQ.explanation}
                </Typography>
                {currentQ.source && (
                  <Link
                    href={currentQ.source.split(' ')[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="caption"
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#2563eb', fontWeight: 600 }}
                  >
                    📖 Read in official NCERT e-Book: {currentQ.chapterReference} <OpenInNewIcon sx={{ fontSize: 13 }} />
                  </Link>
                )}
              </Paper>
            )}

            {/* Bottom Action Controls */}
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Button
                variant="text"
                color="secondary"
                startIcon={<ShuffleIcon />}
                onClick={fetchFreshQuizSet}
                size="small"
                sx={{ textTransform: 'none', color: '#64748b' }}
              >
                Discard & Get New Random Set
              </Button>

              {!isAnswerSubmitted ? (
                <Button
                  variant="contained"
                  size="large"
                  disabled={currentSelected === -1}
                  onClick={handleConfirmCurrentAnswer}
                  sx={{ px: 4, borderRadius: 2.5, fontWeight: 700 }}
                >
                  Confirm Answer
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleNextQuestion}
                  sx={{ px: 4, borderRadius: 2.5, fontWeight: 700 }}
                >
                  {currentQuestion < questions.length - 1 ? 'Next Question →' : 'Complete & View NCERT Analysis'}
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1">No questions found for this filter combination.</Typography>
          <Button sx={{ mt: 2 }} variant="contained" onClick={fetchFreshQuizSet}>
            Reset Filters
          </Button>
        </Card>
      )}
    </Box>
  );
};

export default Quiz;