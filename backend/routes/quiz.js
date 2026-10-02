const express = require('express');
const router = express.Router();

// Mock question bank - in real app, this would be in Supabase
const questionBank = {
  mathematics: [
    {
      id: 1,
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
      explanation: '2 + 2 equals 4.'
    },
    {
      id: 2,
      question: 'What is the square root of 16?',
      options: ['2', '4', '8', '16'],
      correctAnswer: 1,
      explanation: 'The square root of 16 is 4 because 4 × 4 = 16.'
    }
  ],
  physics: [
    {
      id: 1,
      question: 'What is the formula for force?',
      options: ['F = ma', 'F = mv', 'F = m/a', 'F = a/m'],
      correctAnswer: 0,
      explanation: 'Newton\'s second law states that force equals mass times acceleration (F = ma).'
    }
  ]
};

// Generate quiz route
router.post('/generate', (req, res) => {
  const { subject, difficulty, numQuestions } = req.body;

  if (!subject || !questionBank[subject]) {
    return res.status(400).json({ error: 'Valid subject is required' });
  }

  const questions = questionBank[subject] || [];
  // In real app, we'd filter by difficulty and randomly select questions
  const selectedQuestions = questions.slice(0, Math.min(numQuestions || 5, questions.length));

  res.json({
    questions: selectedQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
      // Note: We don't send correctAnswer or explanation to the client
    })),
    subject
  });
});

// Submit quiz answers route
router.post('/submit', (req, res) => {
  const { subject, answers } = req.body; // answers should be array of selected option indices

  if (!subject || !questionBank[subject] || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Valid subject and answers array are required' });
  }

  const questions = questionBank[subject];
  let score = 0;
  const results = [];

  answers.forEach((selectedIndex, questionIndex) => {
    if (questionIndex < questions.length) {
      const correctIndex = questions[questionIndex].correctAnswer;
      const isCorrect = selectedIndex === correctIndex;
      if (isCorrect) score++;

      results.push({
        questionId: questions[questionIndex].id,
        correct: isCorrect,
        correctAnswer: correctIndex,
        explanation: questions[questionIndex].explanation
      });
    }
  });

  res.json({
    score,
    totalQuestions: questions.length,
    percentage: (score / questions.length) * 100,
    results
  });
});

module.exports = router;