import { Box, Button, Card, CardContent, CardHeader, TextField, Typography, CircularProgress, Stack } from '@mui/material';
import { useState } from 'react';

const DoubtSolving: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanationLevel, setExplanationLevel] = useState('medium'); // basic, medium, overview
  const [history, setHistory] = useState<Array<{question: string; answer: string; level: string; timestamp: string}>>([]);

  const levels = [
    { value: 'basic', label: 'Basic (Simple Explanation)' },
    { value: 'medium', label: 'Medium (Detailed Explanation)' },
    { value: 'overview', label: 'Overview (High-level Concept)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      // In a real app, we'd call our backend API which would then call OpenAI GPT-4o
      // For now, we'll simulate an AI response
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate AI response based on explanation level
      let simulatedAnswer = '';
      if (explanationLevel === 'basic') {
        simulatedAnswer = `Basic Explanation: ${question} can be understood by breaking it down into simple parts. The key concept is that...`;
      } else if (explanationLevel === 'overview') {
        simulatedAnswer = `Overview: ${question} relates to broader concepts in the field. At a high level, this topic connects to...`;
      } else {
        // medium/default
        simulatedAnswer = `Detailed Explanation: To understand ${question}, we need to consider several factors. First, let's look at the fundamentals...`;
      }

      setAnswer(simulatedAnswer);
      setHistory(prev => [
        { question, answer: simulatedAnswer, level: explanationLevel, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4) // Keep only last 5 entries
      ]);
      setQuestion(''); // Clear input after submitting
    } catch (error) {
      console.error('Error getting answer:', error);
      setAnswer('Sorry, I encountered an error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceExplanation = () => {
    // In a real app, we'd use Web Speech API for text-to-speech
    if (answer) {
      alert('Voice explanation feature would play the answer using text-to-speech');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Doubt Solving
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Ask any question and get AI-powered explanations at different levels
      </Typography>

      <form onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 600 }}>
        <Card>
          <CardContent>
            <TextField
              label="What's your doubt?"
              placeholder="Type your question here..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              fullWidth
              multiline
              rows={4}
              margin="normal"
            />

            <FormControlLabel
              control={
                <RadioGroup
                  value={explanationLevel}
                  onChange={(e) => setExplanationLevel(e.target.value as ExplanationLevel)}
                  row
                >
                  {levels.map(level => (
                    <FormControlLabel value={level.value} label={level.label} key={level.value} />
                  ))}
                </RadioGroup>
              }
              label="Explanation Level"
            />

            <Stack direction="row" spacing={2} mt={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !question.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Getting Answer...' : 'Get Answer'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                disabled={!answer}
                onClick={handleVoiceExplanation}
                startIcon={<VolumeUpFont size={20} />}
              >
                Voice Explanation
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </form>

      {answer && (
        <Box mt={4}>
          <Card>
            <CardHeader title="AI Explanation" subheader={`Level: ${explanationLevel.charAt(0).toUpperCase() + explanationLevel.slice(1)}`} />
            <CardContent>
              <Typography variant="body1">{answer}</Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {history.length > 0 && (
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            Recent Questions
          </Typography>
          <Box sx={{ height: 300, overflowY: 'auto' }}>
            {history.map((item, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardHeader
                  title={`Q: ${item.question.substring(0, 50)}${item.question.length > 50 ? '...' : ''}`}
                  subheader={`${item.level} • ${item.timestamp}`}
                />
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setQuestion(item.question);
                      setAnswer(item.answer);
                      setExplanationLevel(item.level as ExplanationLevel);
                    }}
                  >
                    Load
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    A: {item.answer.substring(0, 100)}${item.answer.length > 100 ? '...' : ''}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Type for explanation level
type ExplanationLevel = 'basic' | 'medium' | 'overview';

export default DoubtSolving;