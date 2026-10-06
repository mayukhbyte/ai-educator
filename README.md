# AI-Assisted Tutor Platform

An intelligent tutoring system designed to help students learn through AI-powered doubt solving, personalized explanations, adaptive quizzes, and comprehensive progress tracking.

## Features

### For Students
- **AI Doubt Solving**: Get instant help with any question at different explanation levels (basic, medium, overview)
- **Voice Explanations**: Listen to AI-generated explanations with natural-sounding voices
- **Adaptive Quizzes**: Take personalized quizzes that adjust to your skill level
- **Homework Help**: Get step-by-step guidance for assignments
- **Exam Preparation**: Generate question banks from your syllabus and take practice exams
- **Progress Tracking**: Monitor your learning journey with detailed analytics

### For Teachers
- **Class Dashboard**: View overall class performance and individual student progress
- **Assignment Management**: Create, distribute, and grade assignments
- **Quiz Generation**: Create custom quizzes for your class
- **Student Insights**: Identify areas where students need additional help
- **Resource Sharing**: Distribute study materials to students

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) for clean, professional interface
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Build Tool**: Vite for fast development

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL) - planned integration
- **Authentication**: Supabase Auth
- **API**: RESTful API design

### AI Integration
- **Text Processing**: OpenAI GPT-4o for explanations and tutoring
- **Speech-to-Text**: OpenAI Whisper for voice input
- **Text-to-Speech**: Web Speech API for voice explanations
- **Vision**: OpenAI GPT-4o for image-based problem solving

## Project Structure

```
ai-educator/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service calls
│   │   ├── store/            # Redux store
│   │   └── App.tsx           # Main application component
├── backend/                  # Node.js/Express backend
│   ├── routes/               # API route handlers
│   ├── controllers/          # Business logic
│   ├── middleware/           # Custom middleware
│   └── index.js              # Entry point
└── shared/                   # Shared types and utilities
```

## Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
4. Set up environment variables:
   - Create `.env` file in backend directory with necessary configurations
   - Set up Supabase account and get API keys
   - Get OpenAI API key for AI features

## Development

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open your browser to `http://localhost:5173` (frontend) and `http://localhost:5000` (backend API)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Tutoring
- `POST /api/tutoring/solve-doubt` - Get AI explanation for a question
- `GET /api/tutoring/explanation-levels` - Get available explanation levels

### Quizzes
- `POST /api/quiz/generate` - Generate a quiz for a subject
- `POST /api/quiz/submit` - Submit quiz answers and get score

## Future Enhancements

1. **Supabase Integration**: Connect backend to Supabase for authentication and database
2. **Real-time Features**: Add WebSocket connections for live tutoring sessions
3. **Mobile App**: Develop React Native mobile application
4. **Offline Support**: Add PWA capabilities for offline learning
5. **Gamification**: Add badges, points, and leaderboards
6. **Parent Portal**: Allow parents to monitor their children's progress
7. **Curriculum Alignment**: Align content with educational standards (Common Core, NGSS, etc.)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with create-react-app and Vite
- UI components from Material-UI
- AI capabilities powered by OpenAI
- Backend powered by Node.js and Express