const express = require('express');
const router = express.Router();

// Mock AI response function - in real app, this would call OpenAI API
const generateAIResponse = (question, level) => {
  // Simulate different response levels
  if (level === 'basic') {
    return `Basic Explanation: ${question} can be understood by breaking it down into simple parts. The key concept is that...`;
  } else if (level === 'overview') {
    return `Overview: ${question} relates to broader concepts in the field. At a high level, this topic connects to...`;
  } else {
    // medium/default
    return `Detailed Explanation: To understand ${question}, we need to consider several factors. First, let's look at the fundamentals...`;
  }
};

// Doubt solving route
router.post('/solve-doubt', (req, res) => {
  const { question, level = 'medium' } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    // In real app, we'd call OpenAI GPT-4o here
    const answer = generateAIResponse(question.trim(), level);

    res.json({
      question: question.trim(),
      answer,
      level,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate answer' });
  }
});

// Get explanation level options
router.get('/explanation-levels', (req, res) => {
  res.json([
    { value: 'basic', label: 'Basic (Simple Explanation)' },
    { value: 'medium', label: 'Medium (Detailed Explanation)' },
    { value: 'overview', label: 'Overview (High-level Concept)' }
  ]);
});

module.exports = router;