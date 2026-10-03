import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  signup: (data) => api.post('/auth/signup', data),
  me: () => api.get('/auth/me'),
};

// Tutoring API
export const tutoringAPI = {
  solveDoubt: (question, level = 'medium', userId = 'demo-user', metadata = {}) =>
    api.post('/tutoring/solve-doubt', { question, level, userId, ...metadata }),
  getExplanationLevels: () => api.get('/tutoring/explanation-levels'),
  getDoubtHistory: (userId) => api.get(`/tutoring/history/${userId}`),
  getDoubtsForTeacher: () => api.get('/tutoring/doubts-for-teacher'),
  uploadVideoSolution: (data) => api.post('/tutoring/upload-video-solution', data),
  getDatabaseQuestions: (params = {}) => api.get('/tutoring/questions', { params }),
  addDatabaseQuestion: (questionData) => api.post('/tutoring/questions/add', questionData),
  editDatabaseQuestion: (data) => api.put('/tutoring/questions/edit', data),
  deleteDatabaseQuestion: (question) => api.post('/tutoring/questions/delete', { question }),
};

// Quiz API
export const quizAPI = {
  generateQuiz: (options, difficulty = 'medium', numQuestions = 5, userId = 'demo-user') => {
    if (typeof options === 'string') {
      return api.post('/quiz/generate', { subject: options, difficulty, numQuestions, userId });
    }
    return api.post('/quiz/generate', options);
  },
  submitQuiz: (submissionData, answers = [], userId = 'demo-user') => {
    if (typeof submissionData === 'string') {
      return api.post('/quiz/submit', { subject: submissionData, answers, userId });
    }
    return api.post('/quiz/submit', submissionData);
  },
  getFilters: () => api.get('/quiz/filters'),
  getQuizHistory: (userId) => api.get(`/quiz/history/${userId}`),
};

// Homework API (Concise NCERT Marking Scheme Steps + Voiceover - No YouTube)
export const homeworkAPI = {
  solveHomework: (question, stepByStep = true, userId = 'demo-user', metadata = {}) =>
    api.post('/tutoring/homework-solve', {
      question,
      stepByStep,
      userId,
      ...metadata,
    }),
};

// Exam Prep & Monthly Assessment API
export const examPrepAPI = {
  generateExamPaper: (data) => api.post('/exam-prep/generate', data),
  generateQuestionBank: (syllabus, subject = 'General', difficulty = 'medium', numQuestions = 10, userId = 'demo-user') =>
    api.post('/exam-prep/generate', {
      prompt: syllabus,
      syllabus,
      subject,
      difficulty,
      numQuestions,
      userId,
    }),
  getTestCatalog: () => api.get('/exam-prep/monthly-test/catalog'),
  getMonthlyTest: (classLevel, subject, difficulty, numQuestions) =>
    api.get('/exam-prep/monthly-test', {
      params: {
        ...(classLevel ? { class: classLevel } : {}),
        ...(subject ? { subject } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(numQuestions ? { numQuestions } : {}),
      },
    }),
  publishMonthlyTest: (data) => api.post('/exam-prep/monthly-test/publish', data),
  submitMonthlyTest: (data) => api.post('/exam-prep/monthly-test/submit', data),
  getTeacherFeedback: () => api.get('/exam-prep/teacher-feedback'),
  organizeTargetedTest: (data) => api.post('/exam-prep/organize-targeted-test', data),
};

// Teacher & Student Administration API
export const teacherAPI = {
  getStudents: () => api.get('/teacher/students'),
  addStudent: (studentData) => api.post('/teacher/students/add', studentData),
  removeStudent: (data) => api.post('/teacher/students/remove', data),
  reactivateStudent: (data) => api.post('/teacher/students/reactivate', data),
  getStudentNotices: (identifier) =>
    api.get(`/teacher/student-notices/${encodeURIComponent(identifier)}`),
};

// Student Analytics & AI Advisor API
export const studentAPI = {
  getPerformance: (userId = 'student-user-1') =>
    api.get(`/student/performance/${encodeURIComponent(userId)}`),
  askAdvisor: (question, userId = 'student-user-1', classLevel = 10) =>
    api.post('/student/ask-advisor', { question, userId, classLevel }),
};

export default api;
