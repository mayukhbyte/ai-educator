import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
  CircularProgress,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
  Divider,
  Paper,
  Grid,
  Link,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HistoryIcon from '@mui/icons-material/History';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { tutoringAPI } from '../services/api';
import { TeacherVoicePlayer } from '../components/TeacherVoicePlayer';

const levels = [
  { value: 'basic', label: 'Basic & Simple', description: 'Plain English & everyday analogies' },
  { value: 'medium', label: 'Step-by-Step (Board Level)', description: 'NCERT & S. Chand comprehensive' },
  { value: 'overview', label: 'Conceptual Overview', description: 'Core principles & memory hooks' },
];

interface RelatedVideo {
  title: string;
  channel?: string;
  videoUrl?: string;
  watchUrl?: string;
  topic?: string;
}

interface PracticeQuestion {
  question: string;
  answer: string;
  explanation?: string;
  difficulty?: string;
}

interface TeacherVideoInfo {
  hasVideo: boolean;
  videoUrl?: string;
  watchUrl?: string;
  directSearchUrl?: string;
  title?: string;
  teacherName?: string;
  channel?: string;
  notes?: string;
  topic?: string;
  attachedQuestions?: PracticeQuestion[];
  relatedVideos?: RelatedVideo[];
}

const DoubtSolving: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [explanationLevel, setExplanationLevel] = useState('medium');
  const [teacherVideo, setTeacherVideo] = useState<TeacherVideoInfo | null>(null);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [revealedAnswers, setRevealedAnswers] = useState<{ [key: number]: boolean }>({});
  const [subject, setSubject] = useState('Physics');
  const [classLevel, setClassLevel] = useState('10');

  const [history, setHistory] = useState<Array<{ question: string; answer: string; level: string; timestamp: string }>>([]);

  // Helper function to convert YouTube URL to embed format
  const convertYouTubeUrlToEmbed = (url: string | undefined): string | undefined => {
    if (!url) return undefined;

    // Handle youtu.be/VIDEO_ID format
    const youtuBeMatch = url.match(/^https?:\/\/(www\.)?youtu\.be\/([^?&]+)/);
    if (youtuBeMatch) {
      return `https://www.youtube.com/embed/${youtuBeMatch[2]}`;
    }

    // Handle youtube.com/watch?v=VIDEO_ID format
    const watchMatch = url.match(/^https?:\/\/(www\.)?youtube\.com\/watch\?v=([^&]+)/);
    if (watchMatch) {
      return `https://www.youtube.com/embed/${watchMatch[2]}`;
    }

    // Handle youtube.com/v/VIDEO_ID format (older embed format)
    const vMatch = url.match(/^https?:\/\/(www\.)?youtube\.com\/v\/([^&]+)/);
    if (vMatch) {
      return `https://www.youtube.com/embed/${vMatch[2]}`;
    }

    // If it's already an embed URL, return as-is
    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    // If we can't parse it, return original (will likely fail but better than nothing)
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer(null);
    setRequestError(null);
    setTeacherVideo(null);
    setPrerequisites([]);
    setPracticeQuestions([]);
    setRevealedAnswers({});

    const userEmail = localStorage.getItem('user_email');
    if (!userEmail) {
      setRequestError('Sign in to use the doubt solver.');
      setLoading(false);
      return;
    }

    try {
      const res = await tutoringAPI.solveDoubt(
        question.trim(),
        explanationLevel,
        userEmail,
        { subject, classLevel }
      );

      if (res?.data?.answer) {
        setAnswer(res.data.answer);
        if (res.data.prerequisites && Array.isArray(res.data.prerequisites)) {
          setPrerequisites(res.data.prerequisites);
        }
        const video = res.data.youtubeVideo || res.data.teacherVideo;
        if (video && video.hasVideo && video.videoUrl) {
          setTeacherVideo(video);
        }
        const attached = res.data.attachedPracticeQuestions || video?.attachedQuestions || [];
        setPracticeQuestions(attached);

        setHistory((prev) => [
          { question: question.trim(), answer: res.data.answer, level: explanationLevel, timestamp: new Date().toLocaleTimeString() },
          ...prev.slice(0, 5),
        ]);
        setQuestion('');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Backend doubt solving failed:', err);
      setRequestError('The doubt solver could not reach the backend. Please try again.');
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 8, maxWidth: 1140, mx: 'auto', px: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          AI Doubt Solver with YouTube Video & Teacher Voiceover
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ask any concept, derivation, or complex question. Get in-depth explanations with verified NCERT/S. Chand citations, automatic YouTube video lectures, and AI voiceover narration.
        </Typography>
      </Box>
      {requestError && <Alert severity="error" sx={{ mb: 2 }}>{requestError}</Alert>}

      {/* Subject Selector Bar */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        {['Physics', 'Chemistry', 'Biology', 'Mathematics'].map((s) => (
          <Chip
            key={s}
            label={s}
            clickable
            color={subject === s ? 'primary' : 'default'}
            variant={subject === s ? 'filled' : 'outlined'}
            onClick={() => setSubject(s)}
            sx={{ fontWeight: 700, px: 1, height: 36, fontSize: '0.9rem' }}
          />
        ))}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>Class:</Typography>
          {['9', '10', '11', '12'].map((c) => (
            <Chip
              key={c}
              label={`Class ${c}`}
              size="small"
              clickable
              color={classLevel === c ? 'secondary' : 'default'}
              variant={classLevel === c ? 'filled' : 'outlined'}
              onClick={() => setClassLevel(c)}
              sx={{ fontWeight: 700 }}
            />
          ))}
        </Box>
      </Stack>

      <Grid container spacing={3}>
        {/* Main Left Column: Form & Solution */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0', mb: 3 }}>
            <CardHeader
              avatar={<AutoAwesomeIcon color="primary" />}
              title={<Typography variant="h6" sx={{ fontWeight: 800 }}>Ask Your Academic Doubt</Typography>}
              subheader="Aligned with NCERT textbooks, S. Chand references, YouTube video finder & voice narration"
            />
            <Divider />
            <CardContent sx={{ p: 3 }}>
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  label="Type Your Question, Numerical, or Concept"
                  placeholder="e.g. Explain how Snell's law formula works and why refractive index has no units"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  sx={{ mb: 2.5 }}
                  required
                />

                <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                  <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>
                    Explanation Depth:
                  </FormLabel>
                  <RadioGroup
                    row
                    value={explanationLevel}
                    onChange={(e) => setExplanationLevel(e.target.value)}
                  >
                    {levels.map((lvl) => (
                      <FormControlLabel
                        key={lvl.value}
                        value={lvl.value}
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{lvl.label}</Typography>
                            <Typography variant="caption" color="text.secondary">{lvl.description}</Typography>
                          </Box>
                        }
                        sx={{ mr: 2, mb: 1 }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || !question.trim()}
                  endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    bgcolor: '#2563eb',
                    '&:hover': { bgcolor: '#1d4ed8' },
                  }}
                >
                  {loading ? 'Analyzing with AI & NCERT Engine...' : 'Solve Doubt with AI Teacher'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Solution & Video Display */}
          {answer && (
            <Box>
              {/* Prerequisite Knowledge Scaffolding Banner (Adapted to Past Tests) */}
              {prerequisites && prerequisites.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: 3,
                    bgcolor: '#fffbeb',
                    border: '1.5px solid #fcd34d',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                  }}
                >
                  <AutoAwesomeIcon sx={{ color: '#d97706', fontSize: 28, mt: 0.2 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#92400e', mb: 0.5 }}>
                      🎯 Prerequisite Knowledge Scaffolding (Adapted to Your Past Test Performance)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#78350f', mb: 1.5, lineHeight: 1.6 }}>
                      Based on your previous quiz and test submissions in the database, our AI tutor identified foundational concepts you should review. The explanation below specifically scaffolds these prerequisite foundations before solving your doubt:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {prerequisites.map((topic, i) => (
                        <Chip
                          key={i}
                          icon={<CheckCircleIcon sx={{ fontSize: '16px !important', color: '#b45309 !important' }} />}
                          label={topic}
                          size="small"
                          sx={{
                            bgcolor: '#ffffff',
                            color: '#92400e',
                            fontWeight: 700,
                            border: '1px solid #fde68a',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Paper>
              )}

              {/* Teacher Voiceover Narration Bar */}
              <TeacherVoicePlayer textToSpeak={answer} title="🎙️ AI Teacher Voiceover Explanation (Absence of Teacher)" />

              {/* Teacher Video Solution & Closer YouTube Reference Links */}
              {teacherVideo && teacherVideo.hasVideo && !teacherVideo.videoUrl && teacherVideo.directSearchUrl && (
                <Card sx={{ mb: 3, borderRadius: 3.5, border: '2px solid #f97316', bgcolor: '#fff7ed', overflow: 'hidden' }}>
                  <CardHeader
                    avatar={<VideoLibraryIcon sx={{ color: '#ea580c' }} />}
                    title={
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#9a3412' }}>
                        🔍 {teacherVideo.title}
                      </Typography>
                    }
                    subheader={
                      <Typography variant="caption" color="text.secondary">
                        Search Channel: <strong>{teacherVideo.channel}</strong> • {teacherVideo.topic}
                      </Typography>
                    }
                    sx={{ bgcolor: '#ffedd5', pb: 1.5 }}
                  />
                  <CardContent sx={{ p: 2 }}>
                    {teacherVideo.notes && (
                      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        <Typography variant="body2">{teacherVideo.notes}</Typography>
                      </Alert>
                    )}
                    <Button
                      href={teacherVideo.directSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      size="large"
                      startIcon={<OpenInNewIcon />}
                      sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, fontWeight: 700, borderRadius: 2 }}
                    >
                      🔍 Search YouTube Videos for This Question
                    </Button>
                  </CardContent>
                </Card>
              )}
              {teacherVideo && teacherVideo.hasVideo && teacherVideo.videoUrl && (
                <Card sx={{ mb: 3, borderRadius: 3.5, border: '2px solid #2563eb', bgcolor: '#f8fafc', overflow: 'hidden' }}>
                  <CardHeader
                    avatar={<VideoLibraryIcon color="primary" />}
                    title={
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e3a8a' }}>
                        🎬 {teacherVideo.title || 'Curriculum Video Lecture Walkthrough'}
                      </Typography>
                    }
                    subheader={
                      <Typography variant="caption" color="text.secondary">
                        Publisher / Faculty: <strong>{teacherVideo.channel || teacherVideo.teacherName || 'NCERT Official'}</strong> • Topic: {teacherVideo.topic || subject}
                      </Typography>
                    }
                    sx={{ bgcolor: '#eff6ff', pb: 1.5 }}
                  />
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', mb: 2, borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
                      <iframe
                        src={convertYouTubeUrlToEmbed(teacherVideo.videoUrl)}
                        title={teacherVideo.title || 'Video Solution'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 0,
                        }}
                      />
                    </Box>

                    {/* Direct YouTube Links & Action Buttons */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2, alignItems: 'center' }}>
                      {teacherVideo.watchUrl && (
                        <Button
                          href={teacherVideo.watchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="contained"
                          size="small"
                          startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                          sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, fontWeight: 700, borderRadius: 2 }}
                        >
                          Watch Full Video on YouTube
                        </Button>
                      )}

                      {teacherVideo.directSearchUrl && (
                        <Button
                          href={teacherVideo.directSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="outlined"
                          size="small"
                          endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                          sx={{ borderColor: '#2563eb', color: '#2563eb', fontWeight: 700, borderRadius: 2 }}
                        >
                          🔍 More YouTube Videos on this Exact Doubt
                        </Button>
                      )}
                    </Box>

                    {/* Closely Related Reference Videos */}
                    {teacherVideo.relatedVideos && teacherVideo.relatedVideos.length > 0 && (
                      <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 2.5, border: '1px solid #e2e8f0', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 1 }}>
                          📺 More Closely Related YouTube Lessons for this Topic:
                        </Typography>
                        <Stack spacing={1}>
                          {teacherVideo.relatedVideos.map((rv, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                flexWrap: 'wrap',
                                gap: 1,
                              }}
                            >
                              <Box sx={{ flex: 1, minWidth: 200 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                  {rv.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {rv.channel || 'Educational Partner'} • {rv.topic}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    setTeacherVideo((prev) => (prev ? { ...prev, videoUrl: rv.videoUrl, title: rv.title, channel: rv.channel, watchUrl: rv.watchUrl } : null));
                                  }}
                                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                                >
                                  ▶ Play in Player
                                </Button>
                                {rv.watchUrl && (
                                  <Button
                                    href={rv.watchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: '#dc2626' }}
                                  >
                                    Open YouTube ↗
                                  </Button>
                                )}
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    )}

                    {teacherVideo.notes && (
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.3 }}>
                          Teacher Chalkboard Notes:
                        </Typography>
                        <Typography variant="body2">{teacherVideo.notes}</Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step-by-Step Answer Card */}
              <Card sx={{ borderRadius: 3.5, border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <CardHeader
                  avatar={<LightbulbIcon sx={{ color: '#d97706' }} />}
                  title={<Typography variant="h6" sx={{ fontWeight: 800 }}>Easy Step-by-Step Teacher Explanation</Typography>}
                  subheader="Simplified conceptual breakdown with NCERT & S. Chand citations"
                />
                <Divider />
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: '#1e293b', fontSize: '1.02rem', mb: 3 }}>
                    {answer}
                  </Typography>

                  {/* Free e-Book Portals & Reference Links */}
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.5 }}>
                      📖 Official NCERT & S. Chand Digital Reference Portals:
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      <Link
                        href="https://ncert.nic.in/textbook.php"
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        sx={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                      >
                        NCERT Textbooks Portal <OpenInNewIcon sx={{ fontSize: 13 }} />
                      </Link>
                      <Link
                        href="https://diksha.gov.in/explore"
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        sx={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                      >
                        DIKSHA National Portal <OpenInNewIcon sx={{ fontSize: 13 }} />
                      </Link>
                      <Link
                        href="https://www.schandpublishing.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        sx={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                      >
                        S. Chand Reference Library (Lakhmir Singh / RS Aggarwal) <OpenInNewIcon sx={{ fontSize: 13 }} />
                      </Link>
                    </Stack>
                  </Paper>
                </CardContent>
              </Card>

              {/* Teacher's Follow-up Practice Questions Card (Prerequisite Mastery) */}
              {practiceQuestions && practiceQuestions.length > 0 && (
                <Card sx={{ mt: 3, borderRadius: 3.5, border: '2px solid #10b981', bgcolor: '#f0fdf4', overflow: 'hidden' }}>
                  <CardHeader
                    avatar={<SchoolIcon sx={{ color: '#059669' }} />}
                    title={
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#065f46' }}>
                        📝 Teacher's Follow-Up Practice Questions (Verify Your Mastery)
                      </Typography>
                    }
                    subheader={
                      <Typography variant="caption" color="text.secondary">
                        Attached by course faculty according to this video walkthrough • Solve right now to test your prerequisite understanding!
                      </Typography>
                    }
                    sx={{ bgcolor: '#dcfce7', pb: 1.5 }}
                  />
                  <Divider sx={{ borderColor: '#bbf7d0' }} />
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={2}>
                      {practiceQuestions.map((pq, idx) => (
                        <Paper key={idx} elevation={0} sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2.5, border: '1px solid #cbd5e1' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                              Question #{idx + 1}: {pq.question}
                            </Typography>
                            {pq.difficulty && (
                              <Chip
                                label={pq.difficulty.toUpperCase()}
                                size="small"
                                color={pq.difficulty === 'hard' ? 'error' : pq.difficulty === 'easy' ? 'success' : 'primary'}
                                sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                              />
                            )}
                          </Box>

                          <Box sx={{ mt: 1.5 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                              sx={{
                                fontWeight: 700,
                                textTransform: 'none',
                                borderColor: '#059669',
                                color: '#059669',
                                '&:hover': { bgcolor: '#ecfdf5', borderColor: '#047857' },
                              }}
                            >
                              {revealedAnswers[idx] ? '▲ Hide Solution' : '▼ Check Answer & Step-by-Step Logic'}
                            </Button>

                            {revealedAnswers[idx] && (
                              <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#166534', mb: 0.5 }}>
                                  ✅ Correct Answer: {pq.answer}
                                </Typography>
                                {pq.explanation && (
                                  <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
                                    <strong>Step-by-Step Explanation:</strong> {pq.explanation}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </Grid>

        {/* Right Sidebar: Recent Doubts */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
            <CardHeader
              avatar={<HistoryIcon color="action" />}
              title={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Recent Questions</Typography>}
              subheader="Click to reload solution & voice"
            />
            <Divider />
            <CardContent sx={{ p: 2 }}>
              <Stack spacing={2}>
                {history.map((item, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid #e2e8f0',
                      bgcolor: '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#eff6ff', borderColor: '#93c5fd' },
                    }}
                    onClick={() => {
                      setAnswer(item.answer);
                      setExplanationLevel(item.level);
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
                      {item.question}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip label={item.level.toUpperCase()} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                      <Typography variant="caption" color="text.secondary">
                        {item.timestamp}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DoubtSolving;