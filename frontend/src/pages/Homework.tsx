import { Box, Button, Card, CardContent, CardHeader, TextField, Typography, CircularProgress, Stack, Divider } from '@mui/material';
import { useState } from 'react';

const Homework: React.FC = () => {
  const [homeworkQuestion, setHomeworkQuestion] = useState('');
  const [solution, setSolution] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepByStep, setStepByStep] = useState(false);
  const [history, setHistory] = useState<Array<{question: string; solution: string; timestamp: string}>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkQuestion.trim()) return;

    setLoading(true);
    try {
      // In a real app, we'd call our backend API which would then call OpenAI GPT-4o
      // For now, we'll simulate an AI response
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate step-by-step solution
      let simulatedSolution = '';
      if (homeworkQuestion.toLowerCase().includes('solve') || homeworkQuestion.toLowerCase().includes('calculate')) {
        simulatedSolution = `Step-by-step solution for: "${homeworkQuestion}"\n\nStep 1: Identify the given information and what we need to find.\nStep 2: Choose the appropriate formula or method.\nStep 3: Substitute the values into the formula.\nStep 4: Perform the calculations.\nStep 5: Check the answer for reasonableness.\nStep 6: State the final answer with units.\n\nFinal Answer: [Solution would be calculated based on the specific problem]`;
      } else if (homeworkQuestion.toLowerCase().includes('explain') || homeworkQuestion.toLowerCase().includes('describe')) {
        simulatedSolution = `Explanation for: "${homeworkQuestion}"\n\n1. Definition: [Clear definition of the concept]\n2. Key Points:\n   - Point 1: [Explanation]\n   - Point 2: [Explanation]\n   - Point 3: [Explanation]\n3. Examples: [Relevant examples]\n4. Applications: [Real-world applications]\n5. Summary: [Brief summary of key takeaways]`;
      } else {
        simulatedSolution = `Approach for: "${homeworkQuestion}"\n\nStep 1: Understand the problem\n- Read the question carefully\n- Identify what is being asked\n\nStep 2: Gather information\n- Note down all given data\n- Recall relevant concepts/formulas\n\nStep 3: Plan your solution\n- Determine the best approach\n- Consider alternative methods\n\nStep 4: Execute the plan\n- Work through each step systematically\n- Show all work clearly\n\nStep 5: Review and verify\n- Check your calculations\n- Ensure the answer makes sense\n- Verify against known principles\n\nFinal guidance: [Specific advice based on the question type]`;
      }

      setSolution(simulatedSolution);
      setHistory(prev => [
        { question: homeworkQuestion, solution: simulatedSolution, timestamp: new Date().toLocaleString() },
        ...prev.slice(0, 4) // Keep only last 5 entries
      ]);
      setHomeworkQuestion(''); // Clear input after submitting
    } catch (error) {
      console.error('Error getting solution:', error);
      setSolution('Sorry, I encountered an error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Homework Help
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Get step-by-step guidance for your homework questions
      </Typography>

      <form onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 600 }}>
        <Card>
          <CardContent>
            <TextField
              label="What homework question do you need help with?"
              placeholder="Type your homework question here..."
              value={homeworkQuestion}
              onChange={(e) => setHomeworkQuestion(e.target.value)}
              fullWidth
              multiline
              rows={4}
              margin="normal"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={stepByStep}
                  onChange={(e) => setStepByStep(e.target.checked)}
                  color="primary"
                />
              }
              label="Show step-by-step solution"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !homeworkQuestion.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{ mt: 2 }}
            >
              {loading ? 'Getting Help...' : 'Get Homework Help'}
            </Button>
          </CardContent>
        </Card>
      </form>

      {solution && (
        <Box mt={4}>
          <Card>
            <CardHeader title="Homework Solution" subheader="Step-by-step guidance" />
            <CardContent>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {solution}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {history.length > 0 && (
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            Recent Homework Questions
          </Typography>
          <Box sx={{ height: 300, overflowY: 'auto' }}>
            {history.map((item, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardHeader
                  title={`Q: ${item.question.substring(0, 50)}${item.question.length > 50 ? '...' : ''}`}
                  subheader={item.timestamp}
                />
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setHomeworkQuestion(item.question);
                      setSolution(item.solution);
                    }}
                  >
                    Load
                  </Button>
                  <Typography variant="body2" color="text.secondal" sx={{ maxWidth: 200 }}>
                    A: {item.solution.substring(0, 100)}${item.solution.length > 100 ? '...' : ''}
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

export default Homework;