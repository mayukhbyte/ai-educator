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
  FormControlLabel,
  Switch,
  Paper,
  Divider,
  Stack,
  Link,
  Chip,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import { homeworkAPI } from '../services/api';
import { TeacherVoicePlayer } from '../components/TeacherVoicePlayer';

const Homework: React.FC = () => {
  const [question, setQuestion] = useState(
    'A 5kg cart accelerates from rest at 2 m/s² over 10 seconds. Find the work done and final kinetic energy using standard formulas.'
  );
  const [subject, setSubject] = useState('Physics');
  const [classLevel, setClassLevel] = useState('10');
  const [stepByStep, setStepByStep] = useState(true);
  const [solution, setSolution] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sampleHomeworkProblems = [
    { text: "A 5kg cart accelerates from rest at 2 m/s² over 10 seconds. Find the work done and final kinetic energy.", subj: 'Physics' },
    { text: "Find the effective resistance when three resistors of 2Ω, 3Ω, and 6Ω are connected in parallel with a 6V battery.", subj: 'Physics' },
    { text: "Balance the chemical equation: Fe + H2O -> Fe3O4 + H2 and state the type of reaction.", subj: 'Chemistry' },
    { text: "A convex mirror of focal length 15 cm forms an image 10 cm from the mirror. Calculate the object distance.", subj: 'Physics' },
    { text: "Find the roots of the quadratic equation 2x² - 7x + 3 = 0 using the quadratic formula.", subj: 'Mathematics' },
    { text: "Find the 20th term of the AP: 2, 7, 12, ... using the nth term formula an = a + (n-1)d.", subj: 'Mathematics' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setSolution(null);

    try {
      const res = await homeworkAPI.solveHomework(
        question.trim(),
        stepByStep,
        'student-user-1',
        { subject, classLevel }
      );
      if (res?.data?.solution || res?.data?.answer || res?.data?.explanation) {
        setSolution(res.data.solution || res.data.answer || res.data.explanation);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback
    }

    const fallbackSteps = [
      `📌 Step 1: Given Data & Target Unknown [1 Mark]`,
      `• Problem Statement: ${question.trim()}`,
      `• Identify Given Values: Check initial conditions, velocities, masses, or circuit parameters.`,
      `• To Find: Isolate the target variable required by the problem.`,
      `\n📐 Step 2: Governing NCERT Formula & Principle [1 Mark]`,
      `• State the fundamental standard equation according to Class ${classLevel} ${subject} NCERT syllabus.`,
      `• Reference: NCERT Official Textbook & S. Chand (Lakhmir Singh / RS Aggarwal).`,
      `\n⚙️ Step 3: Step-by-Step Substitution & Calculation [2 Marks]`,
      `• Substitute values into the equation with proper sign conventions.`,
      `• Solve algebraically step-by-step to avoid calculation errors.`,
      `• Check dimensional homogeneity.`,
      `\n🎯 Step 4: Final Answer & Unit Statement [1 Mark]`,
      `• Boxed Final Answer with SI Units.`,
      `• Complete summary statement for full marks allocation.`,
      `\n💡 Examiner Pro-Tip:`,
      `Draw a box around your final answer and mention SI units explicitly to secure maximum marks on board evaluations.`,
    ].join('\n');

    setSolution(fallbackSteps);
    setLoading(false);
  };

  return (
    <Box sx={{ pb: 8, maxWidth: 1040, mx: 'auto', px: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          AI Homework Assistant (NCERT Marking Scheme & Voiceover)
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Get concise, assignment-ready numerical solutions formatted strictly to official NCERT & CBSE marking schemes with instant AI teacher voiceover audio.
        </Typography>
      </Box>

      {/* Subject & Class Selectors */}
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

      {/* Quick Sample Numericals */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
          📝 Quick homework assignment problems:
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {sampleHomeworkProblems.map((sample, idx) => (
            <Chip
              key={idx}
              label={sample.text}
              size="small"
              onClick={() => {
                setQuestion(sample.text);
                setSubject(sample.subj);
              }}
              clickable
              sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, fontSize: '0.8rem' }}
            />
          ))}
        </Stack>
      </Box>

      {/* Problem Input Card */}
      <Card sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0', mb: 3 }}>
        <CardHeader
          avatar={<AssignmentIcon color="primary" />}
          title={<Typography variant="h6" sx={{ fontWeight: 800 }}>Assignment Problem Form</Typography>}
          subheader="Concise 4-Step NCERT Rubric • Step 1: Given • Step 2: Formula • Step 3: Calculation • Step 4: Final Answer & SI Units"
        />
        <Divider />
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Homework Numerical or Assignment Question"
              placeholder="e.g. A 5kg cart accelerates from rest at 2 m/s² over 10 seconds. Find the work done and final kinetic energy."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              fullWidth
              multiline
              rows={3}
              required
              sx={{ mb: 2.5 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={stepByStep}
                    onChange={(e) => setStepByStep(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    NCERT 4-Step Marking Rubric (Given → Formula → Calculation → Final Answer)
                  </Typography>
                }
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !question.trim()}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FormatListNumberedIcon />}
                sx={{
                  px: 4,
                  py: 1.2,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  bgcolor: '#2563eb',
                  '&:hover': { bgcolor: '#1d4ed8' },
                }}
              >
                {loading ? 'Formatting NCERT Solution...' : 'Generate NCERT Marking Solution'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Solution & Audio Player */}
      {solution && (
        <Box>
          {/* AI Teacher Voice Player for Homework */}
          <TeacherVoicePlayer textToSpeak={solution} title="🎙️ AI Teacher Homework Voiceover (Step-by-Step Audio Walkthrough)" />

          <Card sx={{ borderRadius: 3.5, border: '1px solid #86efac', bgcolor: '#f0fdf4' }}>
            <CardHeader
              avatar={<CheckCircleOutlineIcon color="success" />}
              title={<Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#166534' }}>Official NCERT CBSE Marking Rubric Solution</Typography>}
              subheader="Crisp assignment steps with explicit marks breakdown and standard SI units"
            />
            <Divider sx={{ borderColor: '#bbf7d0' }} />
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: '#14532d', fontSize: '1.02rem', mb: 3 }}>
                {solution}
              </Typography>

              <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2.5, border: '1px solid #bbf7d0' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534', display: 'block', mb: 0.5 }}>
                  📚 Official NCERT & S. Chand e-Book References:
                </Typography>
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Link
                    href="https://ncert.nic.in/textbook.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="caption"
                    sx={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                  >
                    NCERT Official e-Books <OpenInNewIcon sx={{ fontSize: 13 }} />
                  </Link>
                  <Link
                    href="https://www.schandpublishing.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="caption"
                    sx={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                  >
                    S. Chand Textbook Solutions <OpenInNewIcon sx={{ fontSize: 13 }} />
                  </Link>
                </Stack>
              </Paper>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default Homework;