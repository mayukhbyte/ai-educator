const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env.local'), override: true });

const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;
// Initialize Supabase client (use service role key for server-side to bypass RLS)
let supabase = null;
if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
  try {
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    supabase = createClient(process.env.SUPABASE_URL, supabaseKey);
    console.log('Supabase initialized with', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role key' : 'anon key');
  } catch (err) {
    console.warn('Warning: Could not initialize Supabase client:', err.message);
  }
}

// Initialize Gemini AI client (primary)
let gemini = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    gemini = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('Gemini AI initialized (gemini-2.5-flash)');
  } catch (err) {
    console.warn('Warning: Could not initialize Gemini client:', err.message);
  }
}

// Initialize OpenAI client (fallback)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI initialized (fallback)');
  } catch (err) {
    console.warn('Warning: Could not initialize OpenAI client:', err.message);
  }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const tutoringRoutes = require('./routes/tutoring');
const quizRoutes = require('./routes/quiz');
const examPrepRoutes = require('./routes/examPrep');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

// Pass clients to route handlers (gemini as primary AI, openai as secondary)
app.use('/api/auth', typeof authRoutes === 'function' ? authRoutes(supabase) : authRoutes);
app.use('/api/tutoring', typeof tutoringRoutes === 'function' ? tutoringRoutes(supabase, openai, gemini) : tutoringRoutes);
app.use('/api/quiz', typeof quizRoutes === 'function' ? quizRoutes(supabase, openai, gemini) : quizRoutes);
app.use('/api/exam-prep', typeof examPrepRoutes === 'function' ? examPrepRoutes(supabase) : examPrepRoutes);
app.use('/api/teacher', typeof teacherRoutes === 'function' ? teacherRoutes(supabase) : teacherRoutes);
app.use('/api/student', typeof studentRoutes === 'function' ? studentRoutes(supabase, openai) : studentRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    supabaseConfigured: Boolean(supabase),
    geminiConfigured: Boolean(gemini),
    openaiConfigured: Boolean(openai),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'AI Tutor API is running!' });
});

// Start server only when running locally (not on Vercel serverless)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} | Gemini: ${Boolean(gemini)} | OpenAI: ${Boolean(openai)}`);
  });
}

module.exports = app;