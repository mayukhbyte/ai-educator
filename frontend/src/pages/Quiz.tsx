import { Box, Button, Card, CardContent, CardHeader, Typography, CircularProgress, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Stack } from '@mui/material';
import { useState, useEffect } from 'react';

const Quiz: React.FC = () => {
  const [quizData, setQuizData] = useState<{
    questions: Array<{
      id: number;
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
    currentQuestion: number;
    score: number;
    answers: number[];
    submitted: boolean;
    showExplanation: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('mathematics');

  const subjects = ['mathematics', 'physics', 'chemistry', 'biology', 'history', 'english'];

  useEffect(() => {
    // In a real app, we'd fetch quiz data from backend API
    // For now, we'll generate mock quiz data
    const generateQuiz = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate mock questions based on subject
        const questions = Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          question: `Sample ${subject} question ${i + 1}: What is the capital of France?`,
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 2,
          explanation: 'Paris is the capital of France.',
        }));

        setQuizData({
          questions,
          currentQuestion: 0,
          score: 0,
          answers: Array(questions.length).fill(-1),
          submitted: false,
          showExplanation: false,
        });
      } catch (error) {
        console.error('Failed to load quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    generateQuiz();
  }, [subject]);

  if (loading || !quizData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">Loading quiz...</Typography>
        <CircularProgress size={40} />
      </Box>
    );
  }

  const { questions, currentQuestion, score, answers, submitted, showExplanation } = quizData;
  const currentQ = questions[currentQuestion];

  const handleAnswerSelect = (index: number) => {
    if (!submitted) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = index;
      setQuizData(prev => ({ ...prev, answers: newAnswers }));
    }
  };

  const handleSubmitAnswer = () => {
    if (answers[currentQuestion] === -1) return;

    setQuizData(prev => {
      const isCorrect = answers[currentQuestion] === questions[currentQuestion].correctAnswer;
      const newScore = isCorrect ? prev.score + 1 : prev.score;
      return {
        ...prev,
        score: newScore,
        submitted: true,
        showExplanation: true,
      };
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setQuizData(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        submitted: false,
        showExplanation: false,
      }));
    } else {
      // Quiz completed
      setQuizData(prev => ({ ...prev, submitted: true }));
    }
  };

  const handleRestartQuiz = () => {
    setQuizData(prev => ({
      ...prev,
      currentQuestion: 0,
      score: 0,
      answers: Array(prev.questions.length).fill(-1),
      submitted: false,
      showExplanation: false,
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Adaptive Quiz
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2">
          Subject:
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            sx={{ ml: 1 }}
          >
            {subjects.map(sub => (
              <option key={sub} value={sub}>
                {sub.charAt(0).toUpperCase() + sub.slice(1)}
              </option>
            ))}
          </select>
        </Typography>
        <Typography variant="body2">
          Question {currentQuestion + 1} of {questions.length}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          {!submitted && currentQuestion < questions.length ? (
            <>
              <Typography variant="h5" gutterBottom>
                {currentQ.question}
              </Typography>
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend">Select your answer:</FormLabel>
                <RadioGroup
                  value={answers[currentQuestion]}
                  onChange={(e) => handleAnswerSelect(Number(e.target.value))}
                  row
                >
                  {currentQ.options.map((option, index) => (
                    <FormControlLabel
                      value={index}
                      label={option}
                      key={option}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={handleSubmitAnswer}
                  disabled={answers[currentQuestion] === -1}
                >
                  Submit Answer
                </Button>
              </Stack>
            </>
          ) : submitted && currentQuestion < questions.length ? (
            <>
              <Typography variant="h5" gutterBottom>
                {showExplanation ? 'Explanation' : 'Result'}
              </Typography>
              {showExplanation ? (
                <>
                  <Typography variant="body1">
                    {currentQ.explanation}
                  </Typography>
                  <Box mt={2}>
                    <Button
                      variant="outlined"
                      onClick={() => setQuizData(prev => ({ ...prev, showExplanation: false }))}
                    >
                      Hide Explanation
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="body1" color={answers[currentQuestion] === questions[currentQuestion].correctAnswer ? 'success.main' : 'error.main'}>
                    {answers[currentQuestion] === questions[currentQuestion].correctAnswer ? 'Correct!' : 'Incorrect.'}
                  </Typography>
                  <Typography variant="body2">
                    The correct answer is: {currentQ.options[questions[currentQuestion].correctAnswer]}
                  </Typography>
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      color={answers[currentQuestion] === questions[currentQuestion].correctAnswer ? 'success' : 'error'}
                      onClick={handleNextQuestion}
                    >
                      {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    </Button>
                  </Box>
                </>
              )}
            </>
          ) : (
            <>
              <Typography variant="h4" gutterBottom align="center">
                Quiz Complete!
              </Typography>
              <Typography variant="h2" align="center" mb={3}>
                {score}/{questions.length}
              </Typography>
              <Typography variant="body1" align="center" mb={3}>
                {score >= questions.length * 0.8 ? 'Excellent!' : score >= questions.length * 0.6 ? 'Good job!' : 'Keep practicing!'}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleRestartQuiz}
                >
                  Retake Quiz
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRestartQuiz}
                >
                  New Quiz
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Quiz;