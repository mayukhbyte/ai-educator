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
  Alert,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import { homeworkAPI } from '../services/api';
import { TeacherVoicePlayer } from '../components/TeacherVoicePlayer';

const demoQuestions = [
  {
    classLevel: '9',
    subject: 'Mathematics',
    topic: 'Lines and Angles',
    question: 'Two parallel lines are cut by a transversal. If one interior angle is 68 degrees, find its alternate interior angle.',
  },
  {
    classLevel: '9',
    subject: 'Physics',
    topic: 'Motion',
    question: 'A cyclist changes velocity from 4 m/s to 16 m/s in 6 seconds. Find the average acceleration.',
  },
  {
    classLevel: '9',
    subject: 'Chemistry',
    topic: 'Atoms and Molecules',
    question: 'What is the chemical formula of aluminium oxide?',
  },
  {
    classLevel: '9',
    subject: 'Biology',
    topic: 'The Fundamental Unit of Life',
    question: 'Which cell structure controls the movement of substances into and out of the cell?',
  },
  {
    classLevel: '10',
    subject: 'Mathematics',
    topic: 'Polynomials',
    question: 'For the quadratic polynomial x^2 - 7x + 10, find the sum and product of its zeroes.',
  },
  {
    classLevel: '10',
    subject: 'Physics',
    topic: 'Electricity',
    question: 'Two resistors of 2 ohms and 3 ohms are connected in series. What is their equivalent resistance?',
  },
  {
    classLevel: '10',
    subject: 'Chemistry',
    topic: 'Chemical Reactions',
    question: 'When the equation Fe + O2 -> Fe2O3 is balanced with the smallest whole-number coefficients, what is the coefficient of O2?',
  },
  {
    classLevel: '10',
    subject: 'Biology',
    topic: 'Life Processes',
    question: 'Which part of a nephron filters blood under pressure to form the initial filtrate?',
  },
  {
    classLevel: '11',
    subject: 'Mathematics',
    topic: 'Sequences and Series',
    question: 'Find the 10th term of the arithmetic progression 3, 7, 11, ...',
  },
  {
    classLevel: '11',
    subject: 'Physics',
    topic: 'Laws of Motion',
    question: 'A 2 kg object has a net force of 10 N acting on it. What is its acceleration?',
  },
  {
    classLevel: '11',
    subject: 'Chemistry',
    topic: 'Basic Concepts of Chemistry',
    question: 'How many moles of water are present in 36 g of H2O? Use molar mass 18 g/mol.',
  },
  {
    classLevel: '11',
    subject: 'Biology',
    topic: 'Cell: The Unit of Life',
    question: 'Which organelle is the main site of aerobic cellular respiration in eukaryotic cells?',
  },
  {
    classLevel: '12',
    subject: 'Mathematics',
    topic: 'Continuity and Differentiability',
    question: 'Differentiate y = x^2 sin(x) with respect to x.',
  },
  {
    classLevel: '12',
    subject: 'Physics',
    topic: 'Moving Charges and Magnetism',
    question: 'A charge q moves with speed v perpendicular to a uniform magnetic field B. What is the magnitude of the magnetic force?',
  },
  {
    classLevel: '12',
    subject: 'Chemistry',
    topic: 'Solutions',
    question: 'What is the pH of an ideal 0.01 mol/L solution of a strong monoprotic acid at 25 degrees C?',
  },
  {
    classLevel: '12',
    subject: 'Biology',
    topic: 'Molecular Basis of Inheritance',
    question: 'In the semiconservative model of DNA replication, how many original strands are present in each daughter DNA molecule?',
  },
];

const Homework: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [classLevel, setClassLevel] = useState('10');
  const [stepByStep, setStepByStep] = useState(true);
  const [solution, setSolution] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const applyDemoQuestion = (demo: typeof demoQuestions[number]) => {
    setSubject(demo.subject);
    setQuestion(demo.question);
    setSolution(null);
    setRequestError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setSolution(null);
    setRequestError(null);
    const userEmail = localStorage.getItem('user_email');
    if (!userEmail) {
      setRequestError('Sign in to use the homework assistant.');
      setLoading(false);
      return;
    }

    try {
      const res = await homeworkAPI.solveHomework(
        question.trim(),
        stepByStep,
        userEmail,
        { subject, classLevel }
      );
      if (res?.data?.solution || res?.data?.answer || res?.data?.explanation) {
        setSolution(res.data.solution || res.data.answer || res.data.explanation);
        return;
      }
      setRequestError('The curriculum database returned no stored answer. Please check the question and try again.');
    } catch (err: any) {
      console.error('Homework solution request failed:', err);
      setRequestError(err?.response?.data?.error || 'The curriculum database could not find an answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 8, maxWidth: 1040, mx: 'auto', px: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Curriculum Homework Assistant
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search stored curriculum answers by class and subject. Exact or strong matches include the stored explanation; unsupported questions are not guessed.
        </Typography>
      </Box>
      {requestError && <Alert severity="error" sx={{ mb: 2 }}>{requestError}</Alert>}

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

      {/* Problem Input Card */}
      <Card sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0', mb: 3 }}>
        <CardHeader
          avatar={<AssignmentIcon color="primary" />}
          title={<Typography variant="h6" sx={{ fontWeight: 800 }}>Curriculum Question Lookup</Typography>}
          subheader="Search saved questions and explanations for the selected class and subject."
        />
        <Divider />
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
              Try a Class {classLevel} sample question:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              {demoQuestions
                .filter((demo) => demo.classLevel === classLevel)
                .map((demo) => (
                  <Button
                    key={`${demo.classLevel}-${demo.subject}`}
                    variant="outlined"
                    size="small"
                    onClick={() => applyDemoQuestion(demo)}
                    sx={{ borderRadius: 2, textTransform: 'none', textAlign: 'left' }}
                  >
                    {demo.subject}: {demo.topic}
                  </Button>
                ))}
            </Stack>
            <TextField
              label="Homework question"
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
                    Include stored answer explanation
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
                {loading ? 'Searching curriculum database...' : 'Find Stored Answer'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Solution & Audio Player */}
      {solution && (
        <Box>
          <TeacherVoicePlayer textToSpeak={solution} title="Homework Answer Audio Walkthrough" />

          <Card sx={{ borderRadius: 3.5, border: '1px solid #86efac', bgcolor: '#f0fdf4' }}>
            <CardHeader
              avatar={<CheckCircleOutlineIcon color="success" />}
              title={<Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#166534' }}>Stored Curriculum Answer</Typography>}
              subheader="This answer and explanation were retrieved from the curriculum database."
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