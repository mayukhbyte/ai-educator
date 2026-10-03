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
  Chip,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  MenuItem,
  Select,
  Link,
  Alert,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PrintIcon from '@mui/icons-material/Print';
import PsychologyIcon from '@mui/icons-material/Psychology';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { examPrepAPI } from '../services/api';
import { TeacherVoicePlayer } from '../components/TeacherVoicePlayer';

interface ExamQuestion {
  id: number;
  section: string;
  type: string;
  marks: number;
  question: string;
  options?: string[];
  correctAnswer?: number;
  modelAnswer: string;
  markingScheme: string;
  stepByStepSolution: string;
  chapterReference?: string;
  sourceLink?: string;
}

interface ExamPaperData {
  paperId: string;
  paperTitle: string;
  classLevel: number;
  subject: string;
  difficulty: string;
  promptUsed: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  provider: string;
  blueprintSummary: string;
  questions: ExamQuestion[];
  officialEbookLinks?: Record<string, string>;
}

const ExamPrep: React.FC = () => {
  const [prompt, setPrompt] = useState(
    'Create an intensive Class 10 Board exam practice test for Electricity and Optics focusing on 3-mark circuit numericals, lens formula, and assertion-reason questions with step-by-step NCERT solutions'
  );
  const [subject, setSubject] = useState('Physics');
  const [classLevel, setClassLevel] = useState<number>(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState<number>(4);
  const questionType = 'all';
  const syllabus = '';
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState<ExamPaperData | null>(null);

  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !syllabus.trim()) return;

    setLoading(true);

    try {
      const res = await examPrepAPI.generateExamPaper({
        prompt: prompt.trim(),
        syllabus: syllabus.trim(),
        subject,
        classLevel,
        difficulty,
        numQuestions,
        questionType,
        userId: 'student-session-' + Date.now(),
      });

      if (res?.data?.questions && Array.isArray(res.data.questions)) {
        setPaper(res.data);
      }
    } catch (err) {
      console.warn('Exam generation error:', err);
    }

    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ pb: 8, maxWidth: 1100, mx: 'auto', px: { xs: 1, sm: 2 } }}>
      {/* Header Banner */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
          <PsychologyIcon color="primary" sx={{ fontSize: 36 }} />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            AI Exam Preparation & Prompt-Driven Generator
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Enter any custom exam prompt or syllabus outline. The AI pulls from 90+ NCERT curriculum blueprints to synthesize bespoke test papers, numericals, and step-by-step marking rubrics.
        </Typography>
      </Box>

      {/* Generator Control Card */}
      <Card
        sx={{
          borderRadius: 3.5,
          border: '1px solid rgba(226,232,240,0.8)',
          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.06)',
          mb: 4,
        }}
      >
        <CardHeader
          avatar={<MenuBookIcon color="primary" />}
          title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Custom Examination Prompt</Typography>}
          subheader="Provide your specific instructions, focus topics, question types, or target class"
        />
        <Divider />
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleGenerateExam}>
            {/* Main Prompt Input Box */}
            <TextField
              label="Describe the Exam You Want to Generate (Custom Prompt)"
              placeholder="e.g. Generate 5 hard problems for Class 10 Quadratic Equations and Trigonometry identities with detailed proofs..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              fullWidth
              multiline
              rows={3}
              required
              sx={{ mb: 3 }}
            />

            {/* Parameter Selectors */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Target Class / Level:
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={classLevel}
                  onChange={(e) => setClassLevel(Number(e.target.value))}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value={10}>Class 10 (Board Exam Focus)</MenuItem>
                  <MenuItem value={9}>Class 9 (NCERT Foundation)</MenuItem>
                  <MenuItem value={11}>Class 11 (Senior Secondary)</MenuItem>
                  <MenuItem value={12}>Class 12 (Board & Competitive)</MenuItem>
                </Select>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Subject:
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Physics">Physics</MenuItem>
                  <MenuItem value="Mathematics">Mathematics</MenuItem>
                  <MenuItem value="Chemistry">Chemistry</MenuItem>
                  <MenuItem value="Biology">Biology</MenuItem>
                  <MenuItem value="General Science">General Science</MenuItem>
                  <MenuItem value="Computer Science">Computer Science</MenuItem>
                </Select>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Difficulty / Standard:
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="basic">Foundational / Conceptual</MenuItem>
                  <MenuItem value="medium">Standard Board Exam Level</MenuItem>
                  <MenuItem value="hard">Exemplar / High Order Thinking</MenuItem>
                </Select>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Question Count:
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value={4}>4 Questions (Quick Unit Test)</MenuItem>
                  <MenuItem value={6}>6 Questions (Standard Paper)</MenuItem>
                  <MenuItem value={8}>8 Questions (Full Diagnostic)</MenuItem>
                  <MenuItem value={10}>10 Questions (Complete Mock Exam)</MenuItem>
                </Select>
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !prompt.trim()}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoStoriesIcon />}
                sx={{
                  px: 4,
                  py: 1.2,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  bgcolor: '#2563eb',
                  '&:hover': { bgcolor: '#1d4ed8' },
                }}
              >
                {loading ? 'Synthesizing Test Paper from Model...' : 'Generate Exam Paper According to Prompt'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Generated Exam Paper View */}
      {paper && (
        <Box>
          {/* Paper Metadata Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3.5,
              bgcolor: '#f8fafc',
              border: '2px solid #3b82f6',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Chip
                  label={`Paper Code: ${paper.paperId}`}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700, mb: 1 }}
                />
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {paper.paperTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Class: <strong>{paper.classLevel}</strong> • Subject: <strong>{paper.subject}</strong> • Total Marks: <strong>{paper.totalMarks}</strong> • Time: <strong>{paper.durationMinutes} Mins</strong>
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ borderRadius: 2.5, fontWeight: 700 }}
              >
                Print / Export Paper
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Alert severity="info" icon={<AssignmentIcon />} sx={{ borderRadius: 2.5, mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.3 }}>
                EXAM BLUEPRINT & COGNITIVE COVERAGE:
              </Typography>
              <Typography variant="body2">
                {paper.blueprintSummary}
              </Typography>
            </Alert>

            {/* AI Teacher Voiceover Player */}
            <TeacherVoicePlayer
              textToSpeak={`Exam paper: ${paper.paperTitle}. Total marks: ${paper.totalMarks}. Duration: ${paper.durationMinutes} minutes. ${paper.blueprintSummary}. Let's begin reviewing the questions and step-by-step marking rubrics.`}
              title="🎙️ AI Teacher Exam Paper Briefing & Voice Narration"
            />
          </Paper>

          {/* Section-by-Section Questions */}
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormatListNumberedIcon color="primary" /> Questions & Model Marking Schemes ({paper.questions.length})
          </Typography>

          <Stack spacing={2.5}>
            {paper.questions.map((q, idx) => (
              <Accordion
                key={q.id || idx}
                defaultExpanded={idx === 0}
                sx={{
                  borderRadius: 3,
                  '&:before': { display: 'none' },
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ bgcolor: '#ffffff', px: 3, py: 1.5 }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={`Q${idx + 1}`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 800, height: 22 }}
                      />
                      <Chip
                        label={q.type}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, height: 22 }}
                      />
                      <Chip
                        label={`${q.marks} Mark${q.marks > 1 ? 's' : ''}`}
                        size="small"
                        sx={{ bgcolor: '#f1f5f9', fontWeight: 700, height: 22 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto !important' }}>
                        {q.section}
                      </Typography>
                    </Stack>

                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {q.question}
                    </Typography>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0, bgcolor: '#ffffff' }}>
                  <Divider sx={{ mb: 2 }} />

                  {/* Multiple Choice Options if applicable */}
                  {q.options && q.options.length > 0 && (
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                        Options:
                      </Typography>
                      <Grid container spacing={1}>
                        {q.options.map((opt, optIdx) => (
                          <Grid key={optIdx} size={{ xs: 12, sm: 6 }}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                border: '1px solid #e2e8f0',
                                bgcolor: optIdx === q.correctAnswer ? '#f0fdf4' : '#f8fafc',
                                borderColor: optIdx === q.correctAnswer ? '#86efac' : '#e2e8f0',
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: optIdx === q.correctAnswer ? 700 : 400 }}>
                                <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Model Answer & Step-by-Step Marking Scheme */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: '#f0fdf4',
                          border: '1px solid #86efac',
                          height: '100%',
                        }}
                      >
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                          <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#166534' }}>
                            Model Answer & NCERT Derivation
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: '#14532d', mb: 1.5, fontWeight: 600 }}>
                          {q.modelAnswer}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#166534', whiteSpace: 'pre-line', display: 'block' }}>
                          <strong>Step-by-Step Logic:</strong><br />
                          {q.stepByStepSolution}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: '#fffbeb',
                          border: '1px solid #fde68a',
                          height: '100%',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#92400e', mb: 1 }}>
                          Official Marking Scheme
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#78350f', whiteSpace: 'pre-line', display: 'block', mb: 1.5 }}>
                          {q.markingScheme}
                        </Typography>
                        {q.chapterReference && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            📚 Reference: <strong>{q.chapterReference}</strong>
                          </Typography>
                        )}
                        {q.sourceLink && (
                          <Link
                            href={q.sourceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="caption"
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}
                          >
                            Open NCERT Chapter e-Book <OpenInNewIcon sx={{ fontSize: 12 }} />
                          </Link>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default ExamPrep;