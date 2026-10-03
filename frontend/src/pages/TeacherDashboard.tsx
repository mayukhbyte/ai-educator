import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Chip,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyIcon from '@mui/icons-material/Key';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import StorageIcon from '@mui/icons-material/Storage';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { teacherAPI, tutoringAPI, examPrepAPI } from '../services/api';

interface StudentRecord {
  id: string;
  studentId: string;
  name: string;
  email: string;
  temporaryPassword: string;
  classLevel: number;
  section: string;
  status: 'active' | 'removed' | string;
  teacherRemark: string;
  removalReason: string;
  score: number;
  progress: number;
  activeCourses: number;
  dateAdded: string;
  rank?: number;
  previousRank?: number;
  rankChange?: number;
  accuracy?: number;
  totalSolved?: number;
  badge?: string;
}

interface AttachedQuestion {
  question: string;
  answer: string;
  explanation: string;
  difficulty: string;
}

interface DoubtItem {
  id: string;
  studentName: string;
  studentId: string;
  question: string;
  subject: string;
  topic: string;
  classLevel: number;
  hasTeacherVideo: boolean;
  teacherVideoUrl?: string;
  teacherNotes?: string;
  attachedQuestions?: AttachedQuestion[];
  timestamp: string;
}

interface DBQuestion {
  question: string;
  answer: string;
  explanation: string;
  subject: string;
  topic: string;
  chapter_reference: string;
  curriculum: string;
  class_level: number;
  difficulty: string;
  source: string;
}

const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Tab 1: Students
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newClassLevel, setNewClassLevel] = useState<number>(10);
  const [newSection, setNewSection] = useState('Section A (Maths & Science)');
  const [newRemark, setNewRemark] = useState('');

  // Remove Student Dialog
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [removalReason, setRemovalReason] = useState('');

  // Tab 2: Doubts & Video Solutions
  const [doubts, setDoubts] = useState<DoubtItem[]>([]);
  const [openVideoDialog, setOpenVideoDialog] = useState(false);
  const [targetDoubt, setTargetDoubt] = useState<DoubtItem | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoNotes, setVideoNotes] = useState('');
  const [attachedQuestions, setAttachedQuestions] = useState<AttachedQuestion[]>([
    {
      question: '',
      answer: '',
      explanation: '',
      difficulty: 'medium',
    },
  ]);

  // Tab 3: Database Question Manager & NCERT Marking Scheme Solution Enhancer
  const [dbQuestions, setDbQuestions] = useState<DBQuestion[]>([]);
  const [dbFilterSubject, setDbFilterSubject] = useState('all');
  const [dbFilterClass, setDbFilterClass] = useState('all');
  const [dbSearch, setDbSearch] = useState('');
  const [openAddQDialog, setOpenAddQDialog] = useState(false);
  const [openEditQDialog, setOpenEditQDialog] = useState(false);

  // Improve Solution Dialog State (NCERT Marking Scheme)
  const [openImproveDialog, setOpenImproveDialog] = useState(false);
  const [selectedQToImprove, setSelectedQToImprove] = useState<DBQuestion | null>(null);
  const [markingStep1, setMarkingStep1] = useState('');
  const [markingStep1Marks, setMarkingStep1Marks] = useState('1 Mark');
  const [markingStep2, setMarkingStep2] = useState('');
  const [markingStep2Marks, setMarkingStep2Marks] = useState('1 Mark');
  const [markingStep3, setMarkingStep3] = useState('');
  const [markingStep3Marks, setMarkingStep3Marks] = useState('1 Mark');
  const [markingPenaltyNotes, setMarkingPenaltyNotes] = useState('Deduct ½ mark if SI units are missing or fundamental formula is unstated.');

  // Add/Edit Question Form State
  const [qQuestion, setQQuestion] = useState('');
  const [qAnswer, setQAnswer] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qSubject, setQSubject] = useState('Mathematics');
  const [qTopic, setQTopic] = useState('Quadratic Equations');
  const [qChapterRef, setQChapterRef] = useState('NCERT Class 10 Chapter 4');
  const [qClassLevel, setQClassLevel] = useState(10);
  const [qDifficulty, setQDifficulty] = useState('medium');
  const [qSource, setQSource] = useState('https://ncert.nic.in/textbook.php (NCERT / S. Chand)');
  const [editingOriginalQ, setEditingOriginalQ] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  // Tab 3: Monthly NCERT Assessments & Step Marking System
  const [monthlyTest, setMonthlyTest] = useState<any>(null);
  const [monthlyTestLoading, setMonthlyTestLoading] = useState(false);
  const [openPublishTestDialog, setOpenPublishTestDialog] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('Official Monthly Board Test (Arihant + NCERT)');
  const [newTestSubject, setNewTestSubject] = useState('science');
  const [newTestClass, setNewTestClass] = useState(10);
  const [newTestDuration, setNewTestDuration] = useState(45);
  const [newTestMarks, setNewTestMarks] = useState(10);
  const [newTestDifficulty, setNewTestDifficulty] = useState('all');
  const [newTestNumQuestions, setNewTestNumQuestions] = useState(4);
  const [newTestHintsEnabled, setNewTestHintsEnabled] = useState(true);
  const [newTestSyllabus, setNewTestSyllabus] = useState('Comprehensive Core Curriculum & Arihant Concept Mastery');
  const [newTestGuidelines, setNewTestGuidelines] = useState('Strict NCERT step-marking: 1 mark for stated formula, 1 mark for step calculations, ½ mark deduction for missing SI units.');

  // Teacher feedback store state & remedial test dialog
  const [teacherFeedbacks, setTeacherFeedbacks] = useState<any[]>([]);
  const [selectedFeedbackForRemedial, setSelectedFeedbackForRemedial] = useState<any | null>(null);
  const [openRemedialDialog, setOpenRemedialDialog] = useState(false);
  const [remedialDifficulty, setRemedialDifficulty] = useState('medium');
  const [remedialNumQuestions, setRemedialNumQuestions] = useState(4);

  const fetchStudents = async () => {
    try {
      const res = await teacherAPI.getStudents();
      if (res?.data?.students) setStudents(res.data.students);
    } catch {
      // ignore
    }
  };

  const fetchDoubts = async () => {
    try {
      const res = await tutoringAPI.getDoubtsForTeacher();
      if (res?.data?.doubts) setDoubts(res.data.doubts);
    } catch {
      // ignore
    }
  };

  const fetchDBQuestions = useCallback(async () => {
    try {
      const res = await tutoringAPI.getDatabaseQuestions({
        subject: dbFilterSubject,
        classLevel: dbFilterClass,
        search: dbSearch,
      });
      if (res?.data?.questions) setDbQuestions(res.data.questions);
    } catch {
      // ignore
    }
  }, [dbFilterSubject, dbFilterClass, dbSearch]);

  const fetchMonthlyTest = useCallback(async () => {
    try {
      setMonthlyTestLoading(true);
      const res = await examPrepAPI.getMonthlyTest(newTestClass, newTestSubject);
      if (res?.data?.test) {
        setMonthlyTest(res.data.test);
      }
    } catch {
      // ignore
    } finally {
      setMonthlyTestLoading(false);
    }
  }, [newTestClass, newTestSubject]);

  const fetchTeacherFeedbacks = useCallback(async () => {
    try {
      const res = await examPrepAPI.getTeacherFeedback();
      if (res?.data?.feedbacks) {
        setTeacherFeedbacks(res.data.feedbacks);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAIGenerateMonthlyTest = async () => {
    try {
      setMonthlyTestLoading(true);
      const targetSubj = newTestSubject || 'science';
      const subjCapitalized = targetSubj.charAt(0).toUpperCase() + targetSubj.slice(1);
      const res = await examPrepAPI.publishMonthlyTest({
        title: `AI-Organized Arihant & NCERT Assessment (Class ${newTestClass || 10} ${subjCapitalized})`,
        classLevel: newTestClass || 10,
        subject: targetSubj,
        durationMinutes: newTestDuration || 45,
        difficulty: newTestDifficulty || 'all',
        numQuestions: newTestNumQuestions || 4,
        hintsEnabled: newTestHintsEnabled !== undefined ? newTestHintsEnabled : true,
        organizer: 'AI Curriculum Engine (Arihant & CBSE Guidelines)',
        syllabus: newTestSyllabus || 'Core Board Curriculum & Arihant Concept Mastery',
      });
      const testObj = res?.data?.test || res?.data;
      if (testObj) {
        setMonthlyTest(testObj);
        setToastMessage(`New AI Assessment for Class ${newTestClass || 10} ${subjCapitalized} published!`);
        setToastOpen(true);
        fetchTeacherFeedbacks();
      }
    } catch (err: any) {
      console.error('Error in handleAIGenerateMonthlyTest:', err);
      setToastMessage(err?.response?.data?.error || err?.message || 'Failed to generate monthly test');
      setToastOpen(true);
    } finally {
      setMonthlyTestLoading(false);
    }
  };

  const handleSavePublishMonthlyTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetSubj = newTestSubject || 'science';
      const subjCapitalized = targetSubj.charAt(0).toUpperCase() + targetSubj.slice(1);
      const titleToSave = (newTestTitle && newTestTitle.trim()) || `Class ${newTestClass || 10} ${subjCapitalized} Monthly Assessment`;

      const res = await examPrepAPI.publishMonthlyTest({
        title: titleToSave,
        classLevel: newTestClass || 10,
        subject: targetSubj,
        durationMinutes: newTestDuration || 45,
        difficulty: newTestDifficulty || 'all',
        numQuestions: newTestNumQuestions || 4,
        hintsEnabled: newTestHintsEnabled !== undefined ? newTestHintsEnabled : true,
        organizer: 'Faculty Examination Board (Arihant Guidelines)',
        syllabus: (newTestSyllabus && newTestSyllabus.trim()) || 'Core Board Curriculum',
      });
      const testObj = res?.data?.test || res?.data;
      if (testObj) {
        setMonthlyTest(testObj);
        setToastMessage(`Custom Arihant & NCERT Test for Class ${newTestClass || 10} ${subjCapitalized} published!`);
        setToastOpen(true);
        setOpenPublishTestDialog(false);
        fetchTeacherFeedbacks();
      }
    } catch (err: any) {
      console.error('Error in handleSavePublishMonthlyTest:', err);
      setToastMessage(err?.response?.data?.error || err?.message || 'Failed to publish monthly test');
      setToastOpen(true);
    }
  };

  const handleOpenRemedial = (feedback: any) => {
    setSelectedFeedbackForRemedial(feedback);
    setRemedialDifficulty('medium');
    setRemedialNumQuestions(4);
    setOpenRemedialDialog(true);
  };

  const handleConfirmRemedialTest = async () => {
    if (!selectedFeedbackForRemedial) return;
    try {
      const res = await examPrepAPI.organizeTargetedTest({
        classLevel: selectedFeedbackForRemedial.classLevel || 10,
        subject: selectedFeedbackForRemedial.subject || 'science',
        studentName: selectedFeedbackForRemedial.studentName || 'Active Student',
        targetTopics: selectedFeedbackForRemedial.weakPoints || [],
        difficulty: remedialDifficulty,
        numQuestions: remedialNumQuestions,
      });
      if (res?.data?.test) {
        setMonthlyTest(res.data.test);
        setToastMessage(`Targeted Remedial Test organized for ${selectedFeedbackForRemedial.studentName} and published!`);
        setToastOpen(true);
        setOpenRemedialDialog(false);
      }
    } catch (err: any) {
      setToastMessage(err?.response?.data?.error || 'Failed to organize remedial test');
      setToastOpen(true);
    }
  };

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchStudents();
    fetchDoubts();
    fetchDBQuestions();
    fetchMonthlyTest();
    fetchTeacherFeedbacks();
  }, [fetchDBQuestions, fetchMonthlyTest, fetchTeacherFeedbacks]);

  // Handle Add Student
  const handleOpenAddStudent = () => {
    setNewName('');
    setNewEmail('');
    setNewStudentId(`ROLL-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewPassword(`Student#${Math.floor(1000 + Math.random() * 9000)}`);
    setNewRemark('Enrolled in Class 10 NCERT Board Preparation');
    setOpenAddDialog(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await teacherAPI.addStudent({
        name: newName.trim(),
        email: newEmail.trim(),
        studentId: newStudentId.trim(),
        password: newPassword.trim(),
        classLevel: newClassLevel,
        section: newSection,
        initialRemark: newRemark.trim(),
      });
      if (res?.data?.student) {
        setToastMessage(res.data.message || 'Student enrolled successfully!');
        setToastOpen(true);
        setOpenAddDialog(false);
        fetchStudents();
      }
    } catch (err: any) {
      setToastMessage(err?.response?.data?.error || 'Failed to add student');
      setToastOpen(true);
    }
  };

  // Handle Remove Student
  const handleOpenRemove = (student: StudentRecord) => {
    setSelectedStudent(student);
    setRemovalReason('Missing weekly assignment submissions and attendance below 70%.');
    setOpenRemoveDialog(true);
  };

  const handleConfirmRemove = async () => {
    if (!selectedStudent || !removalReason.trim()) return;
    try {
      const res = await teacherAPI.removeStudent({
        studentId: selectedStudent.id,
        email: selectedStudent.email,
        reason: removalReason.trim(),
      });
      if (res?.data?.student) {
        setToastMessage(`Student removed. Reason visible to ${selectedStudent.name}.`);
        setToastOpen(true);
        setOpenRemoveDialog(false);
        fetchStudents();
      }
    } catch (err: any) {
      setToastMessage(err?.response?.data?.error || 'Failed to remove student');
      setToastOpen(true);
    }
  };

  const handleReactivate = async (student: StudentRecord) => {
    try {
      const res = await teacherAPI.reactivateStudent({
        studentId: student.id,
        remark: 'Re-admitted to active cohort upon teacher review.',
      });
      if (res?.data?.student) {
        setToastMessage(`Student "${student.name}" re-activated!`);
        setToastOpen(true);
        fetchStudents();
      }
    } catch {
      // ignore
    }
  };

  // Handle Upload Video Solution for Doubt
  const handleOpenVideoUpload = (doubt: DoubtItem) => {
    setTargetDoubt(doubt);
    setVideoTitle(`Chalkboard Solution: ${doubt.question.slice(0, 50)}...`);
    setVideoUrl(doubt.teacherVideoUrl || 'https://www.youtube.com/watch?v=8jB7w3Kj_g8');
    setVideoNotes(doubt.teacherNotes || 'Focus on step-by-step substitution into standard NCERT formulas.');
    if (doubt.attachedQuestions && doubt.attachedQuestions.length > 0) {
      setAttachedQuestions(doubt.attachedQuestions);
    } else {
      setAttachedQuestions([
        {
          question: `Practice Exercise on ${doubt.topic || doubt.subject}: Solve with alternate parameters`,
          answer: 'Step-by-step verified numerical result',
          explanation: 'Apply the standard governing formula, substitute values, and state final SI units.',
          difficulty: 'medium',
        },
      ]);
    }
    setOpenVideoDialog(true);
  };

  const handleAddQuestionField = () => {
    setAttachedQuestions((prev) => [
      ...prev,
      {
        question: '',
        answer: '',
        explanation: '',
        difficulty: 'medium',
      },
    ]);
  };

  const handleRemoveQuestionField = (index: number) => {
    setAttachedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionFieldChange = (index: number, field: keyof AttachedQuestion, value: string) => {
    setAttachedQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim() || !targetDoubt) return;

    try {
      const validQuestions = attachedQuestions.filter((q) => q.question.trim() && q.answer.trim());
      const res = await tutoringAPI.uploadVideoSolution({
        doubtId: targetDoubt.id,
        questionPattern: targetDoubt.question.slice(0, 30),
        topic: targetDoubt.topic,
        subject: targetDoubt.subject,
        teacherName: 'Senior Faculty',
        videoUrl: videoUrl.trim(),
        title: videoTitle.trim(),
        notes: videoNotes.trim(),
        attachedQuestions: validQuestions,
      });
      if (res?.data) {
        setToastMessage(res.data.message || 'Video solution and practice questions attached!');
        setToastOpen(true);
        setOpenVideoDialog(false);
        fetchDoubts();
      }
    } catch (err: any) {
      setToastMessage(err?.response?.data?.error || 'Error uploading video solution');
      setToastOpen(true);
    }
  };

  // Handle Add Question to DB
  const handleOpenAddQuestion = () => {
    setQQuestion('');
    setQAnswer('');
    setQExplanation(`📋 Official NCERT Marking Scheme Breakdown:
• [1 Mark] Step 1 (Formula & Stated Axioms): State governing formula and declare given values.
• [1 Mark] Step 2 (Substitution & Calculation): Substitute numerical values and reduce algebraically.
• [1 Mark] Step 3 (Final Result with SI Units): State final answer with proper standard units.

⚠️ Examiner Penalty Guidelines:
• Deduct ½ mark if SI units are missing or formula step is skipped.`);
    setQSubject('Mathematics');
    setQTopic('Quadratic Equations');
    setQChapterRef('NCERT Class 10 Chapter 4');
    setQClassLevel(10);
    setQDifficulty('medium');
    setQSource('https://ncert.nic.in/textbook.php (NCERT / S. Chand)');
    setOpenAddQDialog(true);
  };

  const handleSaveNewQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await tutoringAPI.addDatabaseQuestion({
        question: qQuestion,
        answer: qAnswer,
        explanation: qExplanation,
        subject: qSubject,
        topic: qTopic,
        chapter_reference: qChapterRef,
        class_level: qClassLevel,
        difficulty: qDifficulty,
        source: qSource,
      });
      if (res?.data) {
        setToastMessage(res.data.message || 'Question added to live database!');
        setToastOpen(true);
        setOpenAddQDialog(false);
        fetchDBQuestions();
      }
    } catch (err: any) {
      setToastMessage(err?.response?.data?.error || 'Failed to add question');
      setToastOpen(true);
    }
  };

  // Handle Open Improve Solution according to NCERT Marking Scheme
  const handleOpenImproveSolution = (row: DBQuestion) => {
    setSelectedQToImprove(row);
    setEditingOriginalQ(row.question);
    setQAnswer(row.answer);
    setMarkingStep1(`State given variables and write the fundamental ${row.subject} governing equation.`);
    setMarkingStep1Marks('1 Mark');
    setMarkingStep2(`Substitute the values step-by-step and perform algebraic simplification.`);
    setMarkingStep2Marks('1 Mark');
    setMarkingStep3(`State final answer "${row.answer}" with correct standard SI units.`);
    setMarkingStep3Marks('1 Mark');
    setMarkingPenaltyNotes('NCERT Marking Scheme (3 Marks Total): Deduct ½ mark if SI units are missing or formula step is skipped.');
    setOpenImproveDialog(true);
  };

  const handleSaveImprovedSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQToImprove) return;

    const formattedMarkingScheme = `📋 Official NCERT Marking Scheme Breakdown (Verified by Senior Faculty):
• [${markingStep1Marks}] Step 1 (Formula & Stated Axioms): ${markingStep1}
• [${markingStep2Marks}] Step 2 (Substitution & Calculation): ${markingStep2}
• [${markingStep3Marks}] Step 3 (Final Result & Units): ${markingStep3}

⚠️ Examiner Guidelines & Pitfalls:
• ${markingPenaltyNotes}`;

    const enhancedExplanation = `${formattedMarkingScheme}\n\n🔍 Step-by-Step Analytical Derivation:\n${selectedQToImprove.explanation}`;

    try {
      const res = await tutoringAPI.editDatabaseQuestion({
        originalQuestion: editingOriginalQ,
        updatedQuestion: selectedQToImprove.question,
        updatedAnswer: qAnswer || selectedQToImprove.answer,
        updatedExplanation: enhancedExplanation,
        topic: selectedQToImprove.topic,
        chapter_reference: selectedQToImprove.chapter_reference,
        difficulty: selectedQToImprove.difficulty,
        marking_scheme: formattedMarkingScheme,
      });
      if (res?.data) {
        setToastMessage('Solution improved according to NCERT Marking Scheme & saved into live database!');
        setToastOpen(true);
        setOpenImproveDialog(false);
        fetchDBQuestions();
      }
    } catch (err: any) {
      setToastMessage(err?.response?.data?.error || 'Failed to improve solution');
      setToastOpen(true);
    }
  };

  // Handle Edit Question
  const handleOpenEditQuestion = (row: DBQuestion) => {
    setEditingOriginalQ(row.question);
    setQQuestion(row.question);
    setQAnswer(row.answer);
    setQExplanation(row.explanation);
    setQTopic(row.topic);
    setQChapterRef(row.chapter_reference);
    setQDifficulty(row.difficulty);
    setOpenEditQDialog(true);
  };

  const handleSaveEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await tutoringAPI.editDatabaseQuestion({
        originalQuestion: editingOriginalQ,
        updatedQuestion: qQuestion,
        updatedAnswer: qAnswer,
        updatedExplanation: qExplanation,
        topic: qTopic,
        chapter_reference: qChapterRef,
        difficulty: qDifficulty,
      });
      if (res?.data) {
        setToastMessage(res.data.message || 'Question updated in live database!');
        setToastOpen(true);
        setOpenEditQDialog(false);
        fetchDBQuestions();
      }
    } catch (err: any) {
      setToastMessage(err?.response?.data?.error || 'Failed to edit question');
      setToastOpen(true);
    }
  };

  // Handle Delete Question
  const handleDeleteQuestion = async (questionText: string) => {
    if (!window.confirm(`Are you sure you want to delete this question from the live database?\n"${questionText.slice(0, 60)}..."`)) return;
    try {
      const res = await tutoringAPI.deleteDatabaseQuestion(questionText);
      if (res?.data) {
        setToastMessage(res.data.message || 'Question deleted.');
        setToastOpen(true);
        fetchDBQuestions();
      }
    } catch (err: any) {
      setToastMessage(err?.response?.data?.error || 'Failed to delete');
      setToastOpen(true);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`${label} copied to clipboard!`);
    setToastOpen(true);
  };

  return (
    <Box sx={{ pb: 8, maxWidth: 1200, mx: 'auto', px: { xs: 1, sm: 2 } }}>
      {/* Top Banner */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Teacher Command Center & Curriculum Manager
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage student accounts, record video explanations for doubts, and directly edit/add NCERT & S. Chand questions in the live database.
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0' }} elevation={0}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', py: 2, fontSize: '0.95rem' } }}
        >
          <Tab icon={<PeopleIcon />} iconPosition="start" label={`Students & Credentials (${students.length})`} />
          <Tab icon={<VideoLibraryIcon />} iconPosition="start" label={`Doubt Queue & Video Uploads (${doubts.length})`} />
          <Tab icon={<StorageIcon />} iconPosition="start" label={`Curriculum Database Manager (${dbQuestions.length})`} />
          <Tab icon={<FactCheckIcon />} iconPosition="start" label="Monthly NCERT Assessments & Step Marking" />
        </Tabs>
      </Paper>

      {/* ========================================================= */}
      {/* TAB 0: STUDENTS & CREDENTIALS DIRECTORY                   */}
      {/* ========================================================= */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Enrolled Student Directory
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenAddStudent}
              sx={{ fontWeight: 700, borderRadius: 2.5, px: 3, py: 1, bgcolor: '#2563eb' }}
            >
              Add Student with Credentials
            </Button>
          </Box>

          {/* Student Table with Dynamic Live Ranks */}
          <Card sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0', mb: 4 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Class Rank & Momentum</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Student & Credentials</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Class / Section</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Answer Correctness</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 260 }}>Teacher Reason / Remark</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const isRemoved = student.status === 'removed';
                    const rankNum = student.rank || 3;
                    const change = student.rankChange || 0;
                    return (
                      <TableRow key={student.id} hover sx={{ bgcolor: isRemoved ? 'rgba(254, 242, 242, 0.4)' : undefined }}>
                        <TableCell>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Chip
                              label={rankNum === 1 ? '🥇 Rank #1' : rankNum === 2 ? '🥈 Rank #2' : rankNum === 3 ? '🥉 Rank #3' : `Rank #${rankNum}`}
                              size="small"
                              color={rankNum === 1 ? 'warning' : rankNum <= 3 ? 'primary' : 'default'}
                              sx={{ fontWeight: 900, fontSize: '0.8rem' }}
                            />
                            {change > 0 && (
                              <Chip label={`▲ +${change}`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }} />
                            )}
                            {change < 0 && (
                              <Chip label={`▼ ${change}`} size="small" color="error" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }} />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: isRemoved ? '#fee2e2' : '#dbeafe', color: isRemoved ? '#dc2626' : '#2563eb', fontWeight: 700 }}>
                              {student.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{student.name}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {student.email} • <strong>{student.studentId}</strong>
                              </Typography>
                              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.5 }}>
                                <KeyIcon sx={{ fontSize: 13, color: '#64748b' }} />
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', px: 0.8, py: 0.2, borderRadius: 1 }}>
                                  {student.temporaryPassword}
                                </Typography>
                                <Tooltip title="Copy Password">
                                  <IconButton size="small" onClick={() => copyToClipboard(student.temporaryPassword, 'Password')} sx={{ p: 0.2 }}>
                                    <ContentCopyIcon sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={`Class ${student.classLevel}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, mb: 0.5 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{student.section}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: (student.accuracy || student.score || 80) >= 80 ? '#16a34a' : '#ea580c' }}>
                            {student.accuracy || student.score || 80}% Accuracy
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {student.totalSolved || 20} Solved • {student.badge || 'Active'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={isRemoved ? 'Removed / Notice' : 'Active'} size="small" color={isRemoved ? 'error' : 'success'} sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell>
                          {isRemoved ? (
                            <Alert severity="error" icon={<InfoOutlinedIcon />} sx={{ p: 1, py: 0.5, borderRadius: 2 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Removal Reason (Visible to Student):</Typography>
                              <Typography variant="caption">{student.removalReason || student.teacherRemark}</Typography>
                            </Alert>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#334155' }}>{student.teacherRemark || 'No remarks recorded.'}</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          {isRemoved ? (
                            <Button variant="outlined" size="small" color="success" startIcon={<SettingsBackupRestoreIcon />} onClick={() => handleReactivate(student)} sx={{ fontWeight: 700, textTransform: 'none' }}>
                              Reactivate
                            </Button>
                          ) : (
                            <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleOpenRemove(student)} sx={{ fontWeight: 700, textTransform: 'none' }}>
                              Remove Student
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ========================================================= */}
      {/* TAB 1: DOUBTS QUEUE & VIDEO SOLUTION UPLOAD               */}
      {/* ========================================================= */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
              Student Doubt Queue & Video Solutions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload video walkthroughs (YouTube, Loom, MP4 links) for questions asked by students. When a student asks this doubt, your video will be displayed in their solver.
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            {doubts.map((dbt) => (
              <Grid key={dbt.id} size={{ xs: 12, md: 6 }}>
                <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 2.5, flex: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                      <QuestionAnswerIcon color="primary" sx={{ fontSize: 20 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        {dbt.studentName} ({dbt.studentId}) • Class {dbt.classLevel} {dbt.subject}
                      </Typography>
                      {dbt.hasTeacherVideo ? (
                        <Chip icon={<CheckCircleIcon />} label="Video Uploaded" color="success" size="small" sx={{ ml: 'auto !important', fontWeight: 700 }} />
                      ) : (
                        <Chip label="Video Pending" color="warning" size="small" sx={{ ml: 'auto !important', fontWeight: 700 }} />
                      )}
                    </Stack>

                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
                      "{dbt.question}"
                    </Typography>

                    {dbt.hasTeacherVideo && dbt.teacherVideoUrl && (
                      <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #86efac' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PlayCircleFilledIcon sx={{ fontSize: 16 }} /> Active Video: {dbt.teacherVideoUrl}
                        </Typography>
                      </Box>
                    )}

                    {dbt.attachedQuestions && dbt.attachedQuestions.length > 0 ? (
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={`📝 ${dbt.attachedQuestions.length} Practice Question(s) Attached`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label="No practice questions attached yet"
                          size="small"
                          variant="outlined"
                          sx={{ color: 'text.secondary' }}
                        />
                      </Box>
                    )}

                    <Button
                      variant={dbt.hasTeacherVideo ? 'outlined' : 'contained'}
                      color={dbt.hasTeacherVideo ? 'primary' : 'secondary'}
                      startIcon={<VideoLibraryIcon />}
                      onClick={() => handleOpenVideoUpload(dbt)}
                      fullWidth
                      sx={{ mt: 'auto', fontWeight: 700, borderRadius: 2 }}
                    >
                      {dbt.hasTeacherVideo ? 'Edit Video & Practice Questions' : 'Upload Video & Add Practice Questions'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CURRICULUM DATABASE MANAGER (LIVE SUPABASE)        */}
      {/* ========================================================= */}
      {activeTab === 2 && (
        <Box>
          {/* Action Header & Filters */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Live Curriculum Database Manager (Supabase)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add, edit, or delete NCERT and S. Chand reference questions directly in the live database.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={handleOpenAddQuestion}
              sx={{ fontWeight: 700, borderRadius: 2.5, px: 3, py: 1, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
            >
              Add New Question to Database
            </Button>
          </Box>

          {/* Search & Subject Filter Toolbar */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid #e2e8f0' }} elevation={0}>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                <TextField
                  placeholder="Search questions or topics..."
                  value={dbSearch}
                  onChange={(e) => setDbSearch(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 6, sm: 3, md: 3 }}>
                <Select
                  size="small"
                  fullWidth
                  value={dbFilterSubject}
                  onChange={(e) => setDbFilterSubject(e.target.value)}
                >
                  <MenuItem value="all">All Subjects</MenuItem>
                  <MenuItem value="Mathematics">Mathematics</MenuItem>
                  <MenuItem value="Physics">Physics</MenuItem>
                  <MenuItem value="Chemistry">Chemistry</MenuItem>
                  <MenuItem value="Biology">Biology</MenuItem>
                </Select>
              </Grid>

              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <Select
                  size="small"
                  fullWidth
                  value={dbFilterClass}
                  onChange={(e) => setDbFilterClass(e.target.value)}
                >
                  <MenuItem value="all">All Classes</MenuItem>
                  <MenuItem value="10">Class 10</MenuItem>
                  <MenuItem value="9">Class 9</MenuItem>
                  <MenuItem value="11">Class 11</MenuItem>
                  <MenuItem value="12">Class 12</MenuItem>
                </Select>
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
                <Button variant="outlined" fullWidth onClick={fetchDBQuestions} sx={{ fontWeight: 700, height: 40 }}>
                  Apply Filter
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Database Questions Table */}
          <Card sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Question Statement</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Subject & Class</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Topic & Reference</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Difficulty</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dbQuestions.map((row, idx) => {
                    const hasMarkingScheme = row.explanation && (row.explanation.includes('NCERT Marking Scheme') || row.explanation.includes('📋'));
                    return (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ maxWidth: 360 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                            {row.question}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            <strong>Ans:</strong> {row.answer}
                          </Typography>
                          {hasMarkingScheme ? (
                            <Chip
                              icon={<FactCheckIcon sx={{ fontSize: '14px !important', color: '#166534 !important' }} />}
                              label="NCERT Marking Scheme Active"
                              size="small"
                              color="success"
                              sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                            />
                          ) : (
                            <Chip
                              label="Standard AI Explanation"
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.68rem', height: 22, color: 'text.secondary' }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={row.subject} size="small" color="primary" sx={{ fontWeight: 700, mb: 0.5, display: 'block', width: 'fit-content' }} />
                          <Typography variant="caption" color="text.secondary">Class {row.class_level}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.topic}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.chapter_reference}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={row.difficulty} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                              onClick={() => handleOpenImproveSolution(row)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 2,
                                fontSize: '0.72rem',
                                px: 1.5,
                                py: 0.6,
                                bgcolor: hasMarkingScheme ? '#0284c7' : '#059669',
                                '&:hover': { bgcolor: hasMarkingScheme ? '#0369a1' : '#047857' },
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {hasMarkingScheme ? 'Edit NCERT Scheme' : 'Improve Solution (NCERT Scheme)'}
                            </Button>
                            <IconButton size="small" color="primary" onClick={() => handleOpenEditQuestion(row)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteQuestion(row.question)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MONTHLY NCERT & ARIHANT ASSESSMENTS & STEP MARKING */}
      {/* ========================================================= */}
      {activeTab === 3 && (
        <Box>
          {/* Header & Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Monthly Board Assessments (Arihant &amp; NCERT Guidelines)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure &amp; publish custom tests for Classes 9–12 across all subjects. Real-time feedback and step-deductions are received automatically from students.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Quick Class & Subject Selector */}
              <Select
                size="small"
                value={newTestClass}
                onChange={(e) => {
                  const cl = Number(e.target.value);
                  setNewTestClass(cl);
                  let targetSubj = newTestSubject;
                  if (cl >= 11 && targetSubj === 'science') {
                    targetSubj = 'physics';
                    setNewTestSubject('physics');
                  }
                  examPrepAPI.getMonthlyTest(cl, targetSubj).then((res: any) => {
                    if (res?.data?.test) setMonthlyTest(res.data.test);
                  });
                }}
                sx={{ fontWeight: 800, minWidth: 110, bgcolor: '#f8fafc', borderRadius: 2 }}
              >
                <MenuItem value={9}>Class 9</MenuItem>
                <MenuItem value={10}>Class 10</MenuItem>
                <MenuItem value={11}>Class 11</MenuItem>
                <MenuItem value={12}>Class 12</MenuItem>
              </Select>

              <Select
                size="small"
                value={newTestSubject}
                onChange={(e) => {
                  const sub = e.target.value;
                  setNewTestSubject(sub);
                  examPrepAPI.getMonthlyTest(newTestClass, sub).then((res: any) => {
                    if (res?.data?.test) setMonthlyTest(res.data.test);
                  });
                }}
                sx={{ fontWeight: 800, minWidth: 130, bgcolor: '#f8fafc', borderRadius: 2, textTransform: 'capitalize' }}
              >
                {newTestClass <= 10 && <MenuItem value="science">Science</MenuItem>}
                <MenuItem value="maths">Mathematics</MenuItem>
                <MenuItem value="physics">Physics</MenuItem>
                <MenuItem value="chemistry">Chemistry</MenuItem>
                <MenuItem value="biology">Biology</MenuItem>
              </Select>

              <Button
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                onClick={handleAIGenerateMonthlyTest}
                disabled={monthlyTestLoading}
                sx={{ fontWeight: 700, borderRadius: 2.5, px: 2.5, py: 1 }}
              >
                ⚡ AI-Organize Test
              </Button>
              <Button
                variant="contained"
                startIcon={<AddCircleIcon />}
                onClick={() => setOpenPublishTestDialog(true)}
                sx={{ fontWeight: 700, borderRadius: 2.5, px: 2.5, py: 1, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
              >
                Publish Custom Test
              </Button>
            </Stack>
          </Box>

          {/* Active Monthly Assessment Summary Card */}
          {monthlyTest && (
            <Card sx={{ borderRadius: 3.5, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4', mb: 3.5, p: 2.5 }}>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                    <Chip label="📅 Active Monthly Assessment" color="success" size="small" sx={{ fontWeight: 800 }} />
                    <Chip label={`Class ${monthlyTest.classLevel || 10}`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                    <Chip label={monthlyTest.subject || 'Mathematics & Science'} size="small" color="primary" sx={{ fontWeight: 700 }} />
                    <Chip label={`⏱️ ${monthlyTest.durationMinutes || 45} Minutes`} size="small" sx={{ fontWeight: 700 }} />
                    <Chip label={`🎯 ${monthlyTest.totalMarks || 25} Total Marks`} size="small" color="secondary" sx={{ fontWeight: 700 }} />
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#065f46', mb: 0.5 }}>
                    {monthlyTest.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#166534', display: 'block', mb: 1 }}>
                    <strong>Organized By:</strong> {monthlyTest.organizedBy || 'Senior Faculty & AI Curriculum Engine'} • <strong>Standard:</strong> {monthlyTest.markingSchemeStandard || 'Strict NCERT / CBSE Step Marking'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#334155' }}>
                    <strong>Syllabus Scope:</strong> {monthlyTest.syllabus || 'Quadratic Equations, Light Optics, Electricity & Circuits'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2.5, border: '1px solid #cbd5e1' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e3a8a', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FactCheckIcon sx={{ fontSize: 18, color: '#2563eb' }} /> NCERT Marking Rules Active
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#475569', mb: 0.5 }}>
                      • Formula / Axiom Statement: <strong>Full Step Credit</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#475569', mb: 0.5 }}>
                      • Intermediate Substitutions: <strong>Fractional Step Credit</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#dc2626' }}>
                      • Missing SI units / Notation: <strong>-½ Mark Penalty</strong>
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Card>
          )}

          {/* Test Sections & Step Marking Rubric Breakdown */}
          {monthlyTest?.sections && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: '#0f172a' }}>
                📋 Test Structure & Section Step Rubrics (Hints Provided for Hard Questions)
              </Typography>
              <Stack spacing={2}>
                {monthlyTest.sections.map((sec: any, sIdx: number) => (
                  <Accordion key={sIdx} defaultExpanded={sIdx === 0} sx={{ borderRadius: '12px !important', border: '1px solid #e2e8f0', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f8fafc', borderRadius: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', pr: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                          {sec.sectionTitle}
                        </Typography>
                        <Chip label={`${sec.questions?.length || 0} Questions • ${sec.marksPerQuestion}M Each`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2.5 }}>
                      <Stack spacing={2}>
                        {sec.questions?.map((q: any, qIdx: number) => (
                          <Paper key={q.id || qIdx} elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: '#fdfdfd', border: '1px solid #e2e8f0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', flex: 1 }}>
                                Q{qIdx + 1}. {q.question}
                              </Typography>
                              <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                                <Chip label={`${q.marks || sec.marksPerQuestion} Mark${q.marks > 1 ? 's' : ''}`} size="small" sx={{ fontWeight: 800, bgcolor: '#e0e7ff', color: '#3730a3' }} />
                                <Chip
                                  label={q.difficulty || 'medium'}
                                  size="small"
                                  color={q.difficulty === 'hard' ? 'error' : q.difficulty === 'easy' ? 'success' : 'warning'}
                                  sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                                />
                              </Stack>
                            </Box>

                            {/* Hint for Hard Questions */}
                            {q.hint && (
                              <Box sx={{ mt: 1, mb: 1.5, p: 1.2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px dashed #60a5fa' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LightbulbOutlinedIcon sx={{ fontSize: 16 }} /> Pedagogical Hint (Shown to students on hard questions):
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#1e3a8a', display: 'block', mt: 0.3 }}>
                                  {q.hint}
                                </Typography>
                              </Box>
                            )}

                            {/* Step Rubric if Available */}
                            {q.stepRubric && q.stepRubric.length > 0 && (
                              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 0.5 }}>
                                  🎯 NCERT Official Step-Marking Rubric:
                                </Typography>
                                {q.stepRubric.map((rub: any, rIdx: number) => (
                                  <Typography key={rIdx} variant="caption" sx={{ display: 'block', color: '#475569', mb: 0.3 }}>
                                    • <strong>{rub.step} ({rub.marks} Mark{rub.marks !== 1 ? 's' : ''}):</strong> {rub.criterion}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Paper>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </Box>
          )}

          {/* Real-time Dynamic AI Improvements Roster for Every Student */}
          <Card sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
            <CardHeader
              avatar={<PsychologyIcon sx={{ color: '#7c3aed' }} />}
              title={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Student Live Assessment Standing & Real-Time Dynamic AI Improvements</Typography>}
              subheader="Every student receives an individualized remedial roadmap calculated in real time based on their specific test mistakes."
            />
            <Divider />
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Live Rank & Tier</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Student Name & ID</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Test Score / Accuracy</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 320 }}>Real-Time Dynamic AI Improvement Roadmap</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const rankNum = student.rank || 3;
                    const change = student.rankChange || 0;
                    return (
                      <TableRow key={student.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Chip
                              icon={rankNum === 1 ? <EmojiEventsIcon sx={{ fontSize: '16px !important' }} /> : undefined}
                              label={rankNum === 1 ? '🥇 Rank #1' : rankNum === 2 ? '🥈 Rank #2' : rankNum === 3 ? '🥉 Rank #3' : `Rank #${rankNum}`}
                              size="small"
                              color={rankNum === 1 ? 'warning' : rankNum <= 3 ? 'primary' : 'default'}
                              sx={{ fontWeight: 900 }}
                            />
                            {change > 0 && <Chip label={`▲ +${change}`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }} />}
                            {change < 0 && <Chip label={`▼ ${change}`} size="small" color="error" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }} />}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{student.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{student.studentId} • Class {student.classLevel}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: (student.accuracy || 80) >= 80 ? '#16a34a' : '#ea580c' }}>
                            {student.accuracy || 80}% Accuracy
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{student.totalSolved || 20} Questions Evaluated</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ p: 1.2, bgcolor: '#f5f3ff', borderRadius: 2, border: '1px solid #ddd6fe' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <AutoAwesomeIcon sx={{ fontSize: 14 }} /> Unique Remedial Target for {student.name}:
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#4c1d95', display: 'block' }}>
                              {(student.accuracy || 80) < 75
                                ? '• Priority: NCERT Chapter 4 (Quadratic Discriminant Step Rigor) & SI Unit notations on Electricity numericals.'
                                : (student.accuracy || 80) < 90
                                ? '• Priority: NCERT Exemplar optics ray diagrams and sign convention step-marking compliance.'
                                : '• Advanced Mastery: Solving Board Exemplar high-order thinking problems with 100% step score.'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* ── Real-time Student Test Submissions & Feedback Reports ── */}
          <Card sx={{ borderRadius: 3.5, border: '1px solid #bfdbfe', mt: 3.5 }}>
            <CardHeader
              avatar={<FactCheckIcon sx={{ color: '#2563eb' }} />}
              title={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e3a8a' }}>
                    📡 Live Student Test Submissions, Points for Improvement &amp; Remedial Engine
                  </Typography>
                  <Chip
                    label={`${teacherFeedbacks.length} Live Submission${teacherFeedbacks.length !== 1 ? 's' : ''}`}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 800 }}
                  />
                </Box>
              }
              subheader="Automated reports received directly from student monthly assessments. Click 'AI Organise Remedial Test' to generate a targeted test for weak concepts."
            />
            <Divider />
            {teacherFeedbacks.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  No recent student test submissions in the queue. When students complete assessments, their step deductions and points for improvement will appear here instantly.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: '#eff6ff' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Student &amp; Class</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Assessment Title</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Marks &amp; Grade</TableCell>
                      <TableCell sx={{ fontWeight: 800, minWidth: 280 }}>Identified Weak Points &amp; Concept Areas</TableCell>
                      <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Pedagogical Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teacherFeedbacks.map((fb) => (
                      <TableRow key={fb.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            {fb.studentName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Class {fb.classLevel} • {fb.userId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                            {fb.testTitle?.split('—')[0]?.trim() || fb.testTitle}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fb.stepAuditSummary || `${fb.percentage}% Accuracy`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Chip
                              label={`${fb.totalMarksEarned} / ${fb.maxMarks}m`}
                              size="small"
                              color={fb.percentage >= 80 ? 'success' : fb.percentage >= 50 ? 'warning' : 'error'}
                              sx={{ fontWeight: 800 }}
                            />
                            <Chip label={fb.grade} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {fb.weakPoints && fb.weakPoints.length > 0 ? (
                            <Box>
                              {fb.weakPoints.slice(0, 2).map((wp: string, wIdx: number) => (
                                <Typography key={wIdx} variant="caption" sx={{ color: '#dc2626', fontWeight: 600, display: 'block' }}>
                                  • {wp}
                                </Typography>
                              ))}
                              {fb.improvementRecommendations && fb.improvementRecommendations.length > 0 && (
                                <Typography variant="caption" sx={{ color: '#b45309', display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                  💡 Tip: {fb.improvementRecommendations[0].advice?.slice(0, 90)}...
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800 }}>
                              ✨ 100% NCERT Rubric Mastery
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleOpenRemedial(fb)}
                            sx={{
                              bgcolor: '#7c3aed',
                              color: '#fff',
                              fontWeight: 800,
                              textTransform: 'none',
                              borderRadius: 2,
                              fontSize: '0.75rem',
                              '&:hover': { bgcolor: '#6d28d9' },
                            }}
                          >
                            AI Remedial Test
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Box>
      )}

      {/* ========================================================= */}
      {/* DIALOG: ADD STUDENT WITH CREDENTIALS                      */}
      {/* ========================================================= */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Enroll New Student with Credentials</DialogTitle>
        <Divider />
        <Box component="form" onSubmit={handleCreateStudent}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Student Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Email Address" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Student ID / Roll" value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Login Password / Credential" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>Assigned Class:</Typography>
                <Select size="small" fullWidth value={newClassLevel} onChange={(e) => setNewClassLevel(Number(e.target.value))}>
                  <MenuItem value={10}>Class 10 (Board Focus)</MenuItem>
                  <MenuItem value={9}>Class 9</MenuItem>
                  <MenuItem value={11}>Class 11</MenuItem>
                  <MenuItem value={12}>Class 12</MenuItem>
                </Select>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>Section / Batch:</Typography>
                <Select size="small" fullWidth value={newSection} onChange={(e) => setNewSection(e.target.value)}>
                  <MenuItem value="Section A (Maths & Science)">Section A (Maths & Science)</MenuItem>
                  <MenuItem value="Section B (Science Honors)">Section B (Science Honors)</MenuItem>
                </Select>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Initial Teacher Remark" value={newRemark} onChange={(e) => setNewRemark(e.target.value)} fullWidth multiline rows={2} />
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700, px: 3 }}>Enroll Student</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG: REMOVE STUDENT WITH REASON                        */}
      {/* ========================================================= */}
      <Dialog open={openRemoveDialog} onClose={() => setOpenRemoveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#dc2626' }}>Remove Student from Classroom</DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          {selectedStudent && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2.5 }}>
                You are removing <strong>{selectedStudent.name}</strong>. This reason will be visible to the student in their dashboard notice board.
              </Alert>
              <TextField
                label="Reason for Removal / Notice"
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                fullWidth
                multiline
                rows={4}
                required
              />
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setOpenRemoveDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmRemove} disabled={!removalReason.trim()} sx={{ fontWeight: 700 }}>
            Confirm Removal & Post Notice
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG: UPLOAD VIDEO SOLUTION FOR DOUBT                   */}
      {/* ========================================================= */}
      <Dialog open={openVideoDialog} onClose={() => setOpenVideoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideoLibraryIcon color="primary" /> Upload Teacher Video Solution & Practice Questions
        </DialogTitle>
        <Divider />
        <Box component="form" onSubmit={handleSubmitVideo}>
          <DialogContent sx={{ p: 3 }}>
            {targetDoubt && (
              <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Student Doubt in Queue:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: '#0f172a' }}>"{targetDoubt.question}"</Typography>
                <Typography variant="caption" color="text.secondary">
                  Student: {targetDoubt.studentName} ({targetDoubt.studentId}) • {targetDoubt.subject} (Class {targetDoubt.classLevel})
                </Typography>
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e3a8a', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              🎬 Video Details & Chalkboard Guidance
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Video Title / Topic"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  fullWidth
                  size="small"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Video URL (YouTube embed, watch, or MP4 link)"
                  placeholder="e.g. https://www.youtube.com/watch?v=8jB7w3Kj_g8"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  fullWidth
                  size="small"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Chalkboard Notes / Student Guidance"
                  placeholder="e.g. Pay special attention to sign conventions in step 2 and simplify fractions..."
                  value={videoNotes}
                  onChange={(e) => setVideoNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
            </Grid>

            {/* Practice Questions Attached to This Video */}
            <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2.5, border: '1px solid #bbf7d0', mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534' }}>
                    📝 Add Practice Questions According to this Video
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#15803d' }}>
                    Students watching your video will get these questions to test their mastery. Questions are automatically added to the live curriculum database.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  color="success"
                  startIcon={<AddCircleIcon />}
                  onClick={handleAddQuestionField}
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  Add Another Question
                </Button>
              </Box>

              <Stack spacing={2}>
                {attachedQuestions.map((qItem, idx) => (
                  <Paper key={idx} elevation={0} sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #cbd5e1' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155' }}>
                        Follow-Up Question #{idx + 1}
                      </Typography>
                      {attachedQuestions.length > 1 && (
                        <IconButton size="small" color="error" onClick={() => handleRemoveQuestionField(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          label="Question Statement"
                          placeholder="e.g. Calculate the equivalent resistance of three 6Ω resistors in parallel."
                          value={qItem.question}
                          onChange={(e) => handleQuestionFieldChange(idx, 'question', e.target.value)}
                          fullWidth
                          size="small"
                          required
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          label="Correct Answer / Simplified Result"
                          placeholder="e.g. 2 Ω (with units)"
                          value={qItem.answer}
                          onChange={(e) => handleQuestionFieldChange(idx, 'answer', e.target.value)}
                          fullWidth
                          size="small"
                          required
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Select
                          size="small"
                          fullWidth
                          value={qItem.difficulty || 'medium'}
                          onChange={(e) => handleQuestionFieldChange(idx, 'difficulty', e.target.value)}
                        >
                          <MenuItem value="easy">Easy</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="hard">Hard</MenuItem>
                        </Select>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          label="Step-by-Step Explanation"
                          placeholder="e.g. 1/Req = 1/6 + 1/6 + 1/6 = 3/6 = 1/2 => Req = 2 Ohms."
                          value={qItem.explanation}
                          onChange={(e) => handleQuestionFieldChange(idx, 'explanation', e.target.value)}
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button onClick={() => setOpenVideoDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700, px: 3, bgcolor: '#2563eb' }}>
              Publish Video & Save Practice Questions
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG: ADD QUESTION TO LIVE DATABASE                     */}
      {/* ========================================================= */}
      <Dialog open={openAddQDialog} onClose={() => setOpenAddQDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add New Question to Live NCERT/S. Chand Database</DialogTitle>
        <Divider />
        <Box component="form" onSubmit={handleSaveNewQuestion}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField label="Question Statement" value={qQuestion} onChange={(e) => setQQuestion(e.target.value)} fullWidth multiline rows={2} required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Simplified Correct Answer" value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} fullWidth multiline rows={2} required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Step-by-Step Explanation & Rationale" value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} fullWidth multiline rows={3} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>Subject:</Typography>
                <Select size="small" fullWidth value={qSubject} onChange={(e) => setQSubject(e.target.value)}>
                  <MenuItem value="Mathematics">Mathematics</MenuItem>
                  <MenuItem value="Physics">Physics</MenuItem>
                  <MenuItem value="Chemistry">Chemistry</MenuItem>
                  <MenuItem value="Biology">Biology</MenuItem>
                </Select>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Topic / Concept" value={qTopic} onChange={(e) => setQTopic(e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>Class Level:</Typography>
                <Select size="small" fullWidth value={qClassLevel} onChange={(e) => setQClassLevel(Number(e.target.value))}>
                  <MenuItem value={10}>Class 10</MenuItem>
                  <MenuItem value={9}>Class 9</MenuItem>
                  <MenuItem value={11}>Class 11</MenuItem>
                  <MenuItem value={12}>Class 12</MenuItem>
                </Select>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Chapter Reference" value={qChapterRef} onChange={(e) => setQChapterRef(e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Book Source / S. Chand Citation" value={qSource} onChange={(e) => setQSource(e.target.value)} fullWidth size="small" />
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button onClick={() => setOpenAddQDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700, px: 3, bgcolor: '#059669' }}>
              Save Question into Database
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG: EDIT QUESTION IN DATABASE                         */}
      {/* ========================================================= */}
      <Dialog open={openEditQDialog} onClose={() => setOpenEditQDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Question in Database</DialogTitle>
        <Divider />
        <Box component="form" onSubmit={handleSaveEditQuestion}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField label="Question Statement" value={qQuestion} onChange={(e) => setQQuestion(e.target.value)} fullWidth multiline rows={2} required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Simplified Answer" value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} fullWidth multiline rows={2} required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Step-by-Step Explanation" value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} fullWidth multiline rows={3} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Topic" value={qTopic} onChange={(e) => setQTopic(e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Chapter Reference" value={qChapterRef} onChange={(e) => setQChapterRef(e.target.value)} fullWidth size="small" />
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button onClick={() => setOpenEditQDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700, px: 3 }}>
              Update Question
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG: IMPROVE SOLUTION (NCERT MARKING SCHEME)           */}
      {/* ========================================================= */}
      <Dialog open={openImproveDialog} onClose={() => setOpenImproveDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: '#065f46' }}>
          <FactCheckIcon sx={{ color: '#059669' }} /> Improve Solution According to NCERT Marking Scheme
        </DialogTitle>
        <Divider />
        <Box component="form" onSubmit={handleSaveImprovedSolution}>
          <DialogContent sx={{ p: 3 }}>
            {selectedQToImprove && (
              <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f0fdf4', borderRadius: 2.5, border: '1px solid #bbf7d0' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#166534', display: 'block' }}>
                  Target Question:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, mt: 0.5, color: '#0f172a' }}>
                  "{selectedQToImprove.question}"
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Subject: {selectedQToImprove.subject} (Class {selectedQToImprove.class_level}) • Topic: {selectedQToImprove.topic}
                </Typography>
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e3a8a', mb: 1.5 }}>
              🎯 Step-by-Step NCERT Marking Distribution (Board Exam Scheme)
            </Typography>

            {/* Step 1 */}
            <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid #cbd5e1', bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Step 1: Formula / Governing Equation / Axiom Statement
                </Typography>
                <Select
                  size="small"
                  value={markingStep1Marks}
                  onChange={(e) => setMarkingStep1Marks(e.target.value)}
                  sx={{ width: 120, height: 32, fontWeight: 700 }}
                >
                  <MenuItem value="½ Mark">½ Mark</MenuItem>
                  <MenuItem value="1 Mark">1 Mark</MenuItem>
                  <MenuItem value="1½ Marks">1½ Marks</MenuItem>
                  <MenuItem value="2 Marks">2 Marks</MenuItem>
                </Select>
              </Box>
              <TextField
                placeholder="e.g. State formula V = IR or 1/Req = 1/R1 + 1/R2 and list given values."
                value={markingStep1}
                onChange={(e) => setMarkingStep1(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
                required
              />
            </Paper>

            {/* Step 2 */}
            <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid #cbd5e1', bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Step 2: Substitution & Step-by-Step Algebraic Reduction
                </Typography>
                <Select
                  size="small"
                  value={markingStep2Marks}
                  onChange={(e) => setMarkingStep2Marks(e.target.value)}
                  sx={{ width: 120, height: 32, fontWeight: 700 }}
                >
                  <MenuItem value="½ Mark">½ Mark</MenuItem>
                  <MenuItem value="1 Mark">1 Mark</MenuItem>
                  <MenuItem value="1½ Marks">1½ Marks</MenuItem>
                  <MenuItem value="2 Marks">2 Marks</MenuItem>
                </Select>
              </Box>
              <TextField
                placeholder="e.g. Substitute numerical values and show reduction to intermediate fractions."
                value={markingStep2}
                onChange={(e) => setMarkingStep2(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
                required
              />
            </Paper>

            {/* Step 3 */}
            <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid #cbd5e1', bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Step 3: Final Answer Statement & Standard SI Units
                </Typography>
                <Select
                  size="small"
                  value={markingStep3Marks}
                  onChange={(e) => setMarkingStep3Marks(e.target.value)}
                  sx={{ width: 120, height: 32, fontWeight: 700 }}
                >
                  <MenuItem value="½ Mark">½ Mark</MenuItem>
                  <MenuItem value="1 Mark">1 Mark</MenuItem>
                  <MenuItem value="1½ Marks">1½ Marks</MenuItem>
                </Select>
              </Box>
              <TextField
                placeholder="e.g. State final simplified answer with SI units."
                value={markingStep3}
                onChange={(e) => setMarkingStep3(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
                required
              />
            </Paper>

            {/* Examiner Penalties and Notes */}
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Official Examiner Guidelines & Common Penalty Deductions"
                placeholder="e.g. Deduct ½ mark if SI units are omitted. Award full 1 mark for correct circuit formula even if calculation error occurs later."
                value={markingPenaltyNotes}
                onChange={(e) => setMarkingPenaltyNotes(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
            </Box>

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              💡 Once saved, this solution will become the authoritative NCERT marking guide shown to all students when asking this doubt or solving homework.
            </Alert>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button onClick={() => setOpenImproveDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700, px: 3, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>
              Save NCERT Marking Solution
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG: PUBLISH / CUSTOMIZE MONTHLY BOARD ASSESSMENT      */}
      {/* ========================================================= */}
      <Dialog open={openPublishTestDialog} onClose={() => setOpenPublishTestDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: '#065f46' }}>
          <FactCheckIcon sx={{ color: '#059669' }} /> Publish Custom Assessment (Arihant &amp; NCERT Standards)
        </DialogTitle>
        <Divider />
        <Box component="form" onSubmit={handleSavePublishMonthlyTest}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Assessment Title"
                  value={newTestTitle}
                  onChange={(e) => setNewTestTitle(e.target.value)}
                  fullWidth
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: '#334155' }}>
                  Target Class:
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={newTestClass}
                  onChange={(e) => setNewTestClass(Number(e.target.value))}
                >
                  <MenuItem value={9}>Class 9 (Foundational Curriculum)</MenuItem>
                  <MenuItem value={10}>Class 10 (Board Standard)</MenuItem>
                  <MenuItem value={11}>Class 11 (Senior Secondary)</MenuItem>
                  <MenuItem value={12}>Class 12 (Board &amp; Competitive)</MenuItem>
                </Select>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: '#334155' }}>
                  Subject:
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={newTestSubject}
                  onChange={(e) => setNewTestSubject(e.target.value)}
                  sx={{ textTransform: 'capitalize' }}
                >
                  <MenuItem value="maths">Mathematics</MenuItem>
                  <MenuItem value="science">Science</MenuItem>
                  <MenuItem value="physics">Physics</MenuItem>
                  <MenuItem value="chemistry">Chemistry</MenuItem>
                  <MenuItem value="biology">Biology</MenuItem>
                </Select>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: '#334155' }}>
                  Difficulty Level:
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={newTestDifficulty}
                  onChange={(e) => setNewTestDifficulty(e.target.value)}
                >
                  <MenuItem value="all">Mixed / All Difficulties</MenuItem>
                  <MenuItem value="basic">Basic / Conceptual</MenuItem>
                  <MenuItem value="medium">Medium / Standard Board</MenuItem>
                  <MenuItem value="hard">Hard / High Order Thinking</MenuItem>
                </Select>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: '#334155' }}>
                  Number of Questions:
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={newTestNumQuestions}
                  onChange={(e) => setNewTestNumQuestions(Number(e.target.value))}
                >
                  <MenuItem value={4}>4 Questions (Standard Blueprint)</MenuItem>
                  <MenuItem value={6}>6 Questions (Extended Test)</MenuItem>
                  <MenuItem value={8}>8 Questions (Mock Board Exam)</MenuItem>
                  <MenuItem value={10}>10 Questions (Full Unit Paper)</MenuItem>
                </Select>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: '#334155' }}>
                  Pedagogical Hints:
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={newTestHintsEnabled ? 'yes' : 'no'}
                  onChange={(e) => setNewTestHintsEnabled(e.target.value === 'yes')}
                >
                  <MenuItem value="yes">💡 Hints Active on Hard Qs</MenuItem>
                  <MenuItem value="no">Strict No-Hint Exam Mode</MenuItem>
                </Select>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Duration (Minutes)"
                  type="number"
                  value={newTestDuration}
                  onChange={(e) => setNewTestDuration(Number(e.target.value))}
                  fullWidth
                  size="small"
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Arihant / NCERT Reference Link"
                  value={`https://www.arihantbooks.com/${newTestSubject}-class-${newTestClass}`}
                  disabled
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Syllabus Topics Covered"
                  value={newTestSyllabus}
                  onChange={(e) => setNewTestSyllabus(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  required
                />
              </Grid>
            </Grid>

            <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
              💡 All enrolled students in Class {newTestClass} will immediately see this updated assessment on their dashboard with automated step-marking and Arihant book guidance.
            </Alert>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button onClick={() => setOpenPublishTestDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700, px: 3, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>
              Publish Custom Test
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG: ORGANIZE REMEDIAL TEST FOR STUDENT DEVELOPMENT    */}
      {/* ========================================================= */}
      <Dialog open={openRemedialDialog} onClose={() => setOpenRemedialDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: '#6d28d9' }}>
          <AutoAwesomeIcon sx={{ color: '#7c3aed' }} /> AI Organise Targeted Remedial Assessment
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          {selectedFeedbackForRemedial && (
            <Box>
              <Box sx={{ p: 2, bgcolor: '#f5f3ff', borderRadius: 2.5, border: '1px solid #ddd6fe', mb: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#6d28d9', display: 'block' }}>
                  Target Student &amp; Performance Context:
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                  {selectedFeedbackForRemedial.studentName} (Class {selectedFeedbackForRemedial.classLevel} {selectedFeedbackForRemedial.subject})
                </Typography>
                <Typography variant="caption" sx={{ color: '#4c1d95', display: 'block' }}>
                  Previous Score: {selectedFeedbackForRemedial.totalMarksEarned} / {selectedFeedbackForRemedial.maxMarks} ({selectedFeedbackForRemedial.percentage}%) • Grade {selectedFeedbackForRemedial.grade}
                </Typography>
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
                🎯 Focus Weak Concepts to Target:
              </Typography>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#fff5f5', border: '1px solid #fecaca', borderRadius: 2, mb: 2.5 }}>
                {(selectedFeedbackForRemedial.weakPoints && selectedFeedbackForRemedial.weakPoints.length > 0) ? (
                  selectedFeedbackForRemedial.weakPoints.map((wp: string, i: number) => (
                    <Typography key={i} variant="caption" sx={{ display: 'block', color: '#dc2626', fontWeight: 700 }}>
                      • {wp}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="caption" sx={{ color: '#475569' }}>
                    • General Board Exemplar High-Order Thinking Problems
                  </Typography>
                )}
              </Paper>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                    Targeted Difficulty:
                  </Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={remedialDifficulty}
                    onChange={(e) => setRemedialDifficulty(e.target.value)}
                  >
                    <MenuItem value="medium">Medium (Step Reinforcement)</MenuItem>
                    <MenuItem value="basic">Basic (Foundational Rebuild)</MenuItem>
                    <MenuItem value="hard">Hard (Advanced Challenge)</MenuItem>
                  </Select>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                    Questions in Test:
                  </Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={remedialNumQuestions}
                    onChange={(e) => setRemedialNumQuestions(Number(e.target.value))}
                  >
                    <MenuItem value={4}>4 Focused Questions</MenuItem>
                    <MenuItem value={6}>6 Questions</MenuItem>
                  </Select>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2.5, borderRadius: 2 }}>
                ⚡ This remedial test will be published live to the student dashboard with Arihant chapter references to accelerate their score improvement.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setOpenRemedialDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmRemedialTest}
            sx={{ fontWeight: 700, px: 3, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
          >
            Publish Remedial Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar open={toastOpen} autoHideDuration={4000} onClose={() => setToastOpen(false)} message={toastMessage} />
    </Box>
  );
};

export default TeacherDashboard;