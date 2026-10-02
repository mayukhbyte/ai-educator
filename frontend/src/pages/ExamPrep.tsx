import { Box, Button, Card, CardContent, CardHeader, TextField, Typography, CircularProgress, Stack, Typography as MuiTypography } from '@mui/material';
import { useState } from 'react';

const ExamPrep: React.FC = () => {
  const [syllabusContent, setSyllabusContent] = useState('');
  const [questionBank, setQuestionBank] = useState<Array<{id: number; question: string; options: string[]; correctAnswer: number; explanation: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerateQuestionBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusContent.trim()) return;

    setLoading(true);
    try {
      // In a real app, we'd call our backend API which would process the syllabus
      // and generate questions using OpenAI GPT-4o
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate generated question bank based on syllabus
      const simulatedQuestions = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        question: `Generated question ${i + 1} based on your syllabus: What is the main concept discussed in section ${Math.floor(i / 2) + 1}?`,
        options: [
          `Option A for question ${i + 1}`,
          `Option B for question ${i + 1}`,
          `Option C for question ${i + 1}`,
          `Option D for question ${i + 1}`
        ],
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: `This is the explanation for question ${i + 1}. The correct answer is because...`
      }));

      setQuestionBank(simulatedQuestions);
      setGenerated(true);
    } catch (error) {
      console.error('Error generating question bank:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPracticeExam = () => {
    // In a real app, we'd navigate to an exam interface with these questions
    alert('Starting practice exam with generated questions...');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Exam Preparation
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Upload your syllabus and get a personalized question bank for exam practice
      </Typography>

      <form onSubmit={handleGenerateQuestionBank} sx={{ width: '100%', maxWidth: 600 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Upload Syllabus
            </Typography>
            <TextField
              label="Paste your syllabus content here"
              placeholder="Copy and paste your syllabus or course outline..."
              value={syllabusContent}
              onChange={(e) => setSyllabusContent(e.target.value)}
              fullWidth
              multiline
              rows={8}
              margin="normal"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !syllabusContent.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{ mt: 2 }}
            >
              {loading ? 'Generating Question Bank...' : 'Generate Question Bank'}
            </Button>
          </CardContent>
        </Card>
      </form>

      {generated && questionBank.length > 0 && (
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            Generated Question Bank ({questionBank.length} questions)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                // In a real app, we'd allow downloading the question bank
                alert('Question bank downloaded!');
              }}
            >
              Download Question Bank
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartPracticeExam}
            >
              Start Practice Exam
            </Button>
          </Box>

          <Box sx={{ height: 400, overflowY: 'auto', border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 2 }}>
            {questionBank.map((q, index) => (
              <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6">
                  Question {q.id}: {q.question}
                </Typography>
                <Box mt={2}>
                  {q.options.map((option, optIndex) => (
                    <Box key={optIndex} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ width: 20, mr: 2 }}>
                        {String.fromCharCode(65 + optIndex)}.
                      </Typography>
                      <Typography>{option}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box mt={2}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => alert(`Explanation: ${q.explanation}`)}
                  >
                    Show Explanation
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ExamPrep;