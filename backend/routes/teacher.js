const express = require('express');
const rankManager = require('../services/rankManager');

function teacherRoutes(supabase) {
  const router = express.Router();

  // GET /api/teacher/students - List all students with live ranks, credentials, accuracy, and status
  router.get('/students', (req, res) => {
    const data = rankManager.getAllStudents();
    return res.json(data);
  });

  // POST /api/teacher/students/add - Teacher adds a new student with credentials
  router.post('/students/add', (req, res) => {
    const { name, email, studentId, password, classLevel = 10, section = 'Section A', initialRemark = '' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required to register a student.' });
    }

    const newStudent = rankManager.addStudent({ name, email, studentId, password, classLevel, section, initialRemark });

    if (supabase) {
      try {
        supabase.from('train').insert([
          {
            title: `Student Enrolled: ${newStudent.name} (${newStudent.studentId})`,
            content: `Class: ${newStudent.classLevel} | Section: ${newStudent.section} | Email: ${newStudent.email}`,
            subject: 'Classroom Administration',
            topic: 'Student Enrollment',
            class_level: newStudent.classLevel,
            content_type: 'student_record',
            difficulty: 'basic',
            quality_score: 1.0,
            source: 'teacher-portal',
          }
        ]).then();
      } catch (_) {}
    }

    return res.json({
      message: `Student "${newStudent.name}" enrolled successfully with initial credentials.`,
      student: newStudent,
    });
  });

  // POST /api/teacher/students/remove - Teacher removes / deactivates student with mandatory reason
  router.post('/students/remove', (req, res) => {
    const { studentId, email, reason = 'Removed by course instructor' } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A specific reason is required so the student can view the notice.' });
    }

    const student = rankManager.removeStudent(studentId, email, reason);
    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    if (supabase) {
      try {
        supabase.from('train').insert([
          {
            title: `Student Deactivated: ${student.name} (${student.studentId})`,
            content: `Reason: "${student.removalReason}" | Class: ${student.classLevel}`,
            subject: 'Classroom Administration',
            topic: 'Student Deactivation Notice',
            class_level: student.classLevel,
            content_type: 'disciplinary_notice',
            difficulty: 'medium',
            quality_score: 1.0,
            source: 'teacher-portal',
          }
        ]).then();
      } catch (_) {}
    }

    return res.json({
      message: `Student "${student.name}" has been removed with notice: "${student.removalReason}".`,
      student,
    });
  });

  // POST /api/teacher/students/reactivate - Reactivate student
  router.post('/students/reactivate', (req, res) => {
    const { studentId, remark = 'Re-admitted to active batch' } = req.body;
    const student = rankManager.reactivateStudent(studentId, remark);

    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    return res.json({
      message: `Student "${student.name}" has been re-activated.`,
      student,
    });
  });

  // GET /api/teacher/student-notices/:identifier - Student views teacher notices and reasons
  router.get('/student-notices/:identifier', (req, res) => {
    const id = req.params.identifier.toLowerCase();
    const studentsData = rankManager.getAllStudents().students;
    const student = studentsData.find(
      s => s.email.toLowerCase() === id || s.id.toLowerCase() === id || s.studentId.toLowerCase() === id
    );

    if (student) {
      return res.json({
        studentName: student.name,
        studentId: student.studentId,
        classLevel: student.classLevel,
        section: student.section,
        status: student.status,
        teacherRemark: student.teacherRemark,
        removalReason: student.removalReason,
        rank: student.rank,
        rankChange: student.rankChange,
        accuracy: student.accuracy,
        lastUpdated: student.lastUpdated || student.dateAdded,
      });
    }

    // Default student notice for demo guest
    return res.json({
      studentName: 'Demo Student',
      studentId: 'ROLL-1005',
      classLevel: 10,
      section: 'Section A (Maths & Science)',
      status: 'active',
      teacherRemark: 'Welcome to Class 10 Board Preparation! Please complete the Electricity diagnostic quiz by Friday.',
      removalReason: '',
      rank: 3,
      rankChange: 0,
      accuracy: 80,
      lastUpdated: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = teacherRoutes;
