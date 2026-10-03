import axios, { type InternalAxiosRequestConfig } from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  signup: (data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    classLevel?: number;
    section?: string;
  }) => api.post('/auth/signup', data),
  me: () => api.get('/auth/me'),
};

// Tutoring API
export const tutoringAPI = {
  solveDoubt: (question: string, level = 'medium', userId = 'demo-user', metadata = {}) =>
    api.post('/tutoring/solve-doubt', { question, level, userId, ...metadata }),
  getExplanationLevels: () => api.get('/tutoring/explanation-levels'),
  getDoubtHistory: (userId: string) => api.get(`/tutoring/history/${userId}`),
  getDoubtsForTeacher: () => api.get('/tutoring/doubts-for-teacher'),
  uploadVideoSolution: (data: {
    doubtId?: string;
    questionPattern?: string;
    topic?: string;
    subject?: string;
    teacherName?: string;
    videoUrl: string;
    title?: string;
    notes?: string;
    attachedQuestions?: Array<{
      question: string;
      answer: string;
      explanation?: string;
      difficulty?: string;
    }>;
  }) => api.post('/tutoring/upload-video-solution', data),
  getDatabaseQuestions: (params: { subject?: string; classLevel?: number | string; search?: string; limit?: number } = {}) =>
    api.get('/tutoring/questions', { params }),
  addDatabaseQuestion: (questionData: any) =>
    api.post('/tutoring/questions/add', questionData),
  editDatabaseQuestion: (data: any) =>
    api.put('/tutoring/questions/edit', data),
  deleteDatabaseQuestion: (question: string) =>
    api.post('/tutoring/questions/delete', { question }),
};

// Quiz API
export const quizAPI = {
  generateQuiz: (options: {
    subject?: string;
    classLevel?: number | string;
    difficulty?: string;
    numQuestions?: number;
    topic?: string;
    userId?: string;
  } | string, difficulty = 'medium', numQuestions = 5, userId = 'demo-user') => {
    if (typeof options === 'string') {
      return api.post('/quiz/generate', { subject: options, difficulty, numQuestions, userId });
    }
    return api.post('/quiz/generate', options);
  },
  submitQuiz: (submissionData: {
    setId?: string;
    classLevel?: number | string;
    subject?: string;
    answers: number[];
    questionsData?: any[];
    userId?: string;
  } | string, answers: number[] = [], userId = 'demo-user') => {
    if (typeof submissionData === 'string') {
      return api.post('/quiz/submit', { subject: submissionData, answers, userId });
    }
    return api.post('/quiz/submit', submissionData);
  },
  getFilters: () => api.get('/quiz/filters'),
  getQuizHistory: (userId: string) => api.get(`/quiz/history/${userId}`),
};

// Homework API (Concise NCERT Marking Scheme Steps + Voiceover - No YouTube)
export const homeworkAPI = {
  solveHomework: (question: string, stepByStep = true, userId = 'demo-user', metadata = {}) =>
    api.post('/tutoring/homework-solve', {
      question,
      stepByStep,
      userId,
      ...metadata,
    }),
};

// Exam Prep & Monthly Assessment API
export const examPrepAPI = {
  generateExamPaper: (data: {
    prompt?: string;
    syllabus?: string;
    subject?: string;
    classLevel?: number | string;
    difficulty?: string;
    numQuestions?: number;
    questionType?: string;
    userId?: string;
  }) => api.post('/exam-prep/generate', data),
  generateQuestionBank: (syllabus: string, subject = 'General', difficulty = 'medium', numQuestions = 10, userId = 'demo-user') =>
    api.post('/exam-prep/generate', {
      prompt: syllabus,
      syllabus,
      subject,
      difficulty,
      numQuestions,
      userId,
    }),
  getTestCatalog: () => api.get('/exam-prep/monthly-test/catalog'),
  getMonthlyTest: (classLevel?: number | string, subject?: string, difficulty?: string, numQuestions?: number) =>
    api.get('/exam-prep/monthly-test', {
      params: {
        ...(classLevel ? { class: classLevel } : {}),
        ...(subject ? { subject } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(numQuestions ? { numQuestions } : {}),
      },
    }),
  publishMonthlyTest: (data: {
    title?: string;
    classLevel?: number | string;
    subject?: string;
    organizer?: string;
    durationMinutes?: number;
    difficulty?: string;
    numQuestions?: number;
    hintsEnabled?: boolean;
    syllabus?: string;
    sections?: any[];
  }) => api.post('/exam-prep/monthly-test/publish', data),
  submitMonthlyTest: (data: {
    testId?: string;
    answers: Record<string, number>;
    userId?: string;
    studentName?: string;
    classLevel?: number | string;
    subject?: string;
  }) => api.post('/exam-prep/monthly-test/submit', data),
  getTeacherFeedback: () => api.get('/exam-prep/teacher-feedback'),
  organizeTargetedTest: (data: {
    classLevel: number | string;
    subject: string;
    studentName?: string;
    targetTopics?: string[];
    difficulty?: string;
    numQuestions?: number;
  }) => api.post('/exam-prep/organize-targeted-test', data),
};

// Teacher & Student Administration API
export const teacherAPI = {
  getStudents: () => api.get('/teacher/students'),
  addStudent: (studentData: {
    name: string;
    email: string;
    studentId?: string;
    password?: string;
    classLevel?: number | string;
    section?: string;
    initialRemark?: string;
  }) => api.post('/teacher/students/add', studentData),
  removeStudent: (data: { studentId?: string; email?: string; reason: string }) =>
    api.post('/teacher/students/remove', data),
  reactivateStudent: (data: { studentId: string; remark?: string }) =>
    api.post('/teacher/students/reactivate', data),
  getStudentNotices: (identifier: string) =>
    api.get(`/teacher/student-notices/${encodeURIComponent(identifier)}`),
};

// Student Analytics & AI Advisor API
export const studentAPI = {
  getPerformance: (userId = 'student-user-1') =>
    api.get(`/student/performance/${encodeURIComponent(userId)}`),
  askAdvisor: (question: string, userId = 'student-user-1', classLevel = 10) =>
    api.post('/student/ask-advisor', { question, userId, classLevel }),
};

export default api;
