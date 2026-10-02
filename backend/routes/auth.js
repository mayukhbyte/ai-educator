const express = require('express');
const router = express.Router();

// Mock user data - in real app, this would be in Supabase
const users = [
  { id: 1, email: 'student@example.com', password: 'password123', role: 'student' },
  { id: 2, email: 'teacher@example.com', password: 'password123', role: 'teacher' },
];

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // In real app, we'd hash the password and verify properly
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    // In real app, we'd generate a JWT token
    const mockToken = `mock-jwt-token-${user.id}-${user.role}`;
    res.json({
      token: mockToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Logout route (client-side just removes token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;