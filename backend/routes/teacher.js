const express = require('express');
const { randomBytes } = require('crypto');

function teacherRoutes(supabase) {
  const router = express.Router();

  function databaseError(error) {
    if (error?.code === 'PGRST205' || error?.code === '42P01') {
      return 'Student roster storage is missing. Apply backend/migrations/20261007_student_roster.sql to Supabase.';
    }
    return 'Could not access the student roster.';
  }

  async function requireTeacher(req, res, next) {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token || !supabase) {
      return res.status(401).json({ error: 'Sign in with a teacher account to manage the student roster.' });
    }
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'A valid signed-in teacher session is required.' });
    }
    let role = data.user.app_metadata?.role;
    if (!role) {
      const profile = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      if (profile.error) return res.status(503).json({ error: 'Could not verify teacher permissions.' });
      role = profile.data?.role;
    }
    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ error: 'Teacher permissions are required to manage the student roster.' });
    }
    req.teacher = data.user;
    return next();
  }

  async function loadRoster() {
    if (!supabase) {
      const error = new Error('Supabase is not configured for student roster storage.');
      error.status = 503;
      throw error;
    }

    const [rosterResult, submissionsResult] = await Promise.all([
      supabase
        .from('student_roster')
        .select('id, student_id, full_name, email, class_level, section, status, teacher_remark, removal_reason, created_at')
        .order('class_level')
        .order('full_name'),
      supabase
        .from('assessment_submissions')
        .select('student_email, student_name, class_level, score, max_marks, time_taken_seconds, result_data')
        .order('submitted_at', { ascending: false }),
    ]);

    if (rosterResult.error) {
      const error = new Error(databaseError(rosterResult.error));
      error.status = 503;
      throw error;
    }
    if (submissionsResult.error) {
      const error = new Error(
        submissionsResult.error.code === 'PGRST205' || submissionsResult.error.code === '42P01'
          ? 'Assessment storage is missing. Apply backend/migrations/20261006_assessment_workflow.sql to Supabase.'
          : databaseError(submissionsResult.error)
      );
      error.status = 503;
      throw error;
    }

    const byEmailAndClass = new Map();
    for (const submission of submissionsResult.data || []) {
      const key = `${submission.student_email.toLowerCase()}:${submission.class_level}`;
      const stats = byEmailAndClass.get(key) || {
        attempts: 0,
        score: 0,
        maxMarks: 0,
        totalSeconds: 0,
        evaluatedQuestions: 0,
        weakPoints: new Set(),
      };
      stats.attempts += 1;
      stats.score += Number(submission.score) || 0;
      stats.maxMarks += Number(submission.max_marks) || 0;
      stats.totalSeconds += Number(submission.time_taken_seconds) || 0;
      stats.evaluatedQuestions += submission.result_data?.stepAudit?.length || 0;
      for (const point of submission.result_data?.weakPoints || []) stats.weakPoints.add(point);
      byEmailAndClass.set(key, stats);
    }

    const students = (rosterResult.data || []).map(student => {
      const stats = byEmailAndClass.get(`${student.email.toLowerCase()}:${student.class_level}`);
      return {
        id: student.id,
        studentId: student.student_id,
        name: student.full_name,
        email: student.email,
        classLevel: student.class_level,
        section: student.section,
        status: student.status,
        teacherRemark: student.teacher_remark,
        removalReason: student.removal_reason,
        dateAdded: student.created_at,
        assessmentCount: stats?.attempts || 0,
        totalSolved: stats?.evaluatedQuestions || 0,
        accuracy: stats?.maxMarks ? Math.round((stats.score / stats.maxMarks) * 100) : null,
        rankAccuracy: stats?.maxMarks ? (stats.score / stats.maxMarks) * 100 : null,
        averageTimeSeconds: stats?.attempts ? Math.round(stats.totalSeconds / stats.attempts) : null,
        weakPoints: stats ? [...stats.weakPoints] : [],
      };
    });

    for (const classLevel of new Set(students.map(student => student.classLevel))) {
      const ranked = students
        .filter(student => student.classLevel === classLevel && student.status === 'active' && student.assessmentCount > 0)
        .sort((a, b) =>
          b.rankAccuracy - a.rankAccuracy ||
          a.averageTimeSeconds - b.averageTimeSeconds ||
          a.name.localeCompare(b.name)
        );
      ranked.forEach((student, index) => { student.rank = index + 1; });
    }

    return students;
  }

  router.get('/students', requireTeacher, async (req, res) => {
    try {
      const students = await loadRoster();
      return res.json({
        totalStudents: students.length,
        activeCount: students.filter(student => student.status === 'active').length,
        removedCount: students.filter(student => student.status === 'removed').length,
        students,
      });
    } catch (error) {
      return res.status(error.status || 503).json({ error: error.message });
    }
  });

  router.post('/students/add', requireTeacher, async (req, res) => {
    const {
      name,
      email,
      studentId,
      password,
      classLevel = 10,
      section = 'Section A',
      initialRemark = '',
    } = req.body;
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');
    const parsedClass = Number.parseInt(classLevel, 10);

    if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'A student name and valid email address are required.' });
    }
    if (cleanPassword.length < 6) {
      return res.status(400).json({ error: 'A password of at least 6 characters is required.' });
    }
    if (!Number.isInteger(parsedClass) || parsedClass < 1 || parsedClass > 12) {
      return res.status(400).json({ error: 'Class must be between 1 and 12.' });
    }
    const rosterCheck = await supabase.from('student_roster').select('id').limit(1);
    if (rosterCheck.error) {
      return res.status(503).json({ error: databaseError(rosterCheck.error) });
    }

    const generatedStudentId = String(studentId || `ROLL-${randomBytes(4).toString('hex').toUpperCase()}`).trim();
    if (!supabase.auth.admin) {
      return res.status(503).json({ error: 'Supabase service-role authentication is required to create student accounts.' });
    }
    const createdAuthUser = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: {
          name: cleanName,
          role: 'student',
          classLevel: parsedClass,
          section: String(section || 'Section A').trim(),
        },
        app_metadata: { role: 'student' },
      });
    if (createdAuthUser.error || !createdAuthUser.data?.user) {
      return res.status(409).json({ error: createdAuthUser.error?.message || 'Could not create the student account.' });
    }

    const inserted = await supabase.from('student_roster').insert({
      auth_user_id: createdAuthUser.data.user.id,
      student_id: generatedStudentId,
      full_name: cleanName,
      email: cleanEmail,
      class_level: parsedClass,
      section: String(section || 'Section A').trim(),
      teacher_remark: String(initialRemark || '').trim(),
    }).select('id').single();

    if (inserted.error) {
      const rollback = await supabase.auth.admin.deleteUser(createdAuthUser.data.user.id);
      if (rollback.error) {
        console.error('Failed to remove orphaned Supabase user after roster insert error:', rollback.error.message);
      }
      return res.status(inserted.error.code === '23505' ? 409 : 503).json({
        error: inserted.error.code === '23505'
          ? 'A student with this email address or student ID is already registered.'
          : databaseError(inserted.error),
      });
    }

    return res.status(201).json({
      message: `Student "${cleanName}" enrolled successfully.`,
      student: {
        id: inserted.data.id,
        studentId: generatedStudentId,
        name: cleanName,
        email: cleanEmail,
        classLevel: parsedClass,
        section: String(section || 'Section A').trim(),
        status: 'active',
        teacherRemark: String(initialRemark || '').trim(),
        assessmentCount: 0,
        totalSolved: 0,
        accuracy: null,
        averageTimeSeconds: null,
        weakPoints: [],
      },
    });
  });

  router.post('/students/remove', requireTeacher, async (req, res) => {
    const { studentId, email, reason = '' } = req.body;
    const cleanReason = String(reason).trim();
    if (!cleanReason) {
      return res.status(400).json({ error: 'A specific removal reason is required.' });
    }
    if (!supabase) return res.status(503).json({ error: 'Supabase is not configured for student roster storage.' });

    let query = supabase.from('student_roster').update({
      status: 'removed',
      removal_reason: cleanReason,
      teacher_remark: `[REMOVED BY TEACHER]: ${cleanReason}`,
      updated_at: new Date().toISOString(),
    });
    query = email
      ? query.eq('email', String(email).trim().toLowerCase())
      : query.eq('id', studentId);
    const { data, error } = await query.select('*').maybeSingle();
    if (error) return res.status(503).json({ error: databaseError(error) });
    if (!data) return res.status(404).json({ error: 'Student record not found.' });
    return res.json({ message: `Student "${data.full_name}" has been removed.`, student: data });
  });

  router.post('/students/reactivate', requireTeacher, async (req, res) => {
    const { studentId, remark = '' } = req.body;
    if (!supabase) return res.status(503).json({ error: 'Supabase is not configured for student roster storage.' });
    const { data, error } = await supabase
      .from('student_roster')
      .update({
        status: 'active',
        removal_reason: '',
        teacher_remark: String(remark || '').trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId)
      .select('*')
      .maybeSingle();
    if (error) return res.status(503).json({ error: databaseError(error) });
    if (!data) return res.status(404).json({ error: 'Student record not found.' });
    return res.json({ message: `Student "${data.full_name}" has been reactivated.`, student: data });
  });

  router.get('/student-notices/:identifier', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase is not configured for student roster storage.' });
    const identifier = String(req.params.identifier || '').trim();
    const byEmail = await supabase.from('student_roster').select('*').ilike('email', identifier).maybeSingle();
    if (byEmail.error) return res.status(503).json({ error: databaseError(byEmail.error) });
    let student = byEmail.data;
    if (!student) {
      const byStudentId = await supabase.from('student_roster').select('*').eq('student_id', identifier).maybeSingle();
      if (byStudentId.error) return res.status(503).json({ error: databaseError(byStudentId.error) });
      student = byStudentId.data;
    }
    if (!student) return res.status(404).json({ error: 'No teacher notice is available for this student.' });
    return res.json({
      studentName: student.full_name,
      studentId: student.student_id,
      classLevel: student.class_level,
      section: student.section,
      status: student.status,
      teacherRemark: student.teacher_remark,
      removalReason: student.removal_reason,
      lastUpdated: student.updated_at,
    });
  });

  return router;
}

module.exports = teacherRoutes;
