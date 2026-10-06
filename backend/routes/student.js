const express = require('express');

function studentRoutes(supabase, openai) {
  const router = express.Router();

  async function getSignedInStudentEmail(req, expectedEmail) {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token || !supabase) return { error: 'A signed-in student account is required.', status: 401 };
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.email) {
      return { error: 'A valid signed-in student account is required.', status: 401 };
    }
    const email = data.user.email.trim().toLowerCase();
    if (expectedEmail && expectedEmail !== email) {
      return { error: 'You can only access your own student performance data.', status: 403 };
    }
    return { email };
  }

  async function getStudentMetrics(userEmail) {
    if (!supabase) {
      const error = new Error('Student assessment data is not configured.');
      error.statusCode = 503;
      throw error;
    }

    const { data: ownRows, error: ownError } = await supabase
      .from('assessment_submissions')
      .select('id, test_id, student_email, student_name, class_level, subject, score, max_marks, percentage, time_taken_seconds, teacher_feedback, submitted_at, result_data')
      .eq('student_email', userEmail)
      .order('submitted_at', { ascending: false });
    if (ownError) throw ownError;

    const roster = await supabase
      .from('student_roster')
      .select('class_level, status')
      .eq('email', userEmail)
      .maybeSingle();
    if (roster.error) throw roster.error;
    if (!roster.data) {
      const error = new Error('Student roster record not found.');
      error.statusCode = 404;
      throw error;
    }
    if (roster.data.status !== 'active') {
      const error = new Error('Student account is inactive.');
      error.statusCode = 403;
      throw error;
    }

    const classLevel = roster.data.class_level;
    const rows = (ownRows || []).filter(row => row.class_level === classLevel);
    let classRows = rows;
    if (classLevel) {
      const [submissions, activeRoster] = await Promise.all([
        supabase
        .from('assessment_submissions')
        .select('student_email, student_name, score, max_marks, percentage, time_taken_seconds, submitted_at, class_level')
        .eq('class_level', classLevel),
        supabase
          .from('student_roster')
          .select('email')
          .eq('class_level', classLevel)
          .eq('status', 'active'),
      ]);
      if (submissions.error) throw submissions.error;
      if (activeRoster.error) throw activeRoster.error;
      const activeEmails = new Set((activeRoster.data || []).map(student => student.email.toLowerCase()));
      classRows = (submissions.data || []).filter(row => activeEmails.has(row.student_email.toLowerCase()));
    }

    const studentScores = new Map();
    for (const row of classRows) {
      const key = row.student_email;
      const score = studentScores.get(key) || {
        name: row.student_name,
        score: 0,
        maxMarks: 0,
        attempts: 0,
        totalSeconds: 0,
      };
      score.score += Number(row.score) || 0;
      score.maxMarks += Number(row.max_marks) || 0;
      score.attempts += 1;
      score.totalSeconds += Number(row.time_taken_seconds) || 0;
      studentScores.set(key, score);
    }

    const leaderboard = [...studentScores.entries()]
      .map(([email, student]) => ({
        email,
        name: student.name,
        scoreAvg: student.maxMarks ? Math.round((student.score / student.maxMarks) * 100) : 0,
        totalSolved: student.attempts,
        averageTimeSeconds: student.attempts ? Math.round(student.totalSeconds / student.attempts) : null,
        accuracy: student.maxMarks ? Math.round((student.score / student.maxMarks) * 100) : 0,
        badge: '',
      }))
      .sort((a, b) => {
        const scoresA = studentScores.get(a.email);
        const scoresB = studentScores.get(b.email);
        const rawAverageA = scoresA.maxMarks ? scoresA.score / scoresA.maxMarks : 0;
        const rawAverageB = scoresB.maxMarks ? scoresB.score / scoresB.maxMarks : 0;
        return rawAverageB - rawAverageA ||
          (a.averageTimeSeconds ?? Number.POSITIVE_INFINITY) - (b.averageTimeSeconds ?? Number.POSITIVE_INFINITY) ||
          a.name.localeCompare(b.name);
      })
      .map((student, index) => ({ ...student, rank: index + 1 }));

    const currentUser = leaderboard.find(student => student.email === userEmail);
    const totalQuestionsAttempted = rows.reduce((total, row) => total + Number(row.max_marks || 0), 0);
    const totalCorrectAnswers = rows.reduce((total, row) => total + Number(row.score || 0), 0);
    const subjectTotals = new Map();
    for (const row of rows) {
      const subject = row.subject || 'Other';
      const totals = subjectTotals.get(subject) || { score: 0, maxMarks: 0 };
      totals.score += Number(row.score) || 0;
      totals.maxMarks += Number(row.max_marks) || 0;
      subjectTotals.set(subject, totals);
    }

    const weakTopics = [...new Set(rows.flatMap(row => row.result_data?.weakPoints || []))];
    const strongTopics = [...new Set(rows.flatMap(row =>
      (row.result_data?.stepAudit || [])
        .filter(step => step.isCorrect)
        .map(step => step.chapterReference)
        .filter(Boolean)
    ))];
    const improvementPoints = rows.flatMap(row =>
      (row.result_data?.improvementRecommendations || []).map((recommendation, index) => ({
        id: `${row.id}-${index}`,
        priority: 'Review',
        subject: row.subject,
        title: recommendation.topic,
        detail: recommendation.advice,
        ncertChapter: recommendation.topic,
        action: 'Review the submitted assessment feedback.',
        link: recommendation.sourceLink,
      }))
    );

    return {
      rank: currentUser?.rank ?? null,
      totalClassStudents: studentScores.size,
      percentile: currentUser && studentScores.size
        ? Math.round(((studentScores.size - currentUser.rank + 1) / studentScores.size) * 100)
        : null,
      accuracy: totalQuestionsAttempted
        ? Math.round((totalCorrectAnswers / totalQuestionsAttempted) * 100)
        : null,
      totalQuestionsAttempted,
      totalCorrectAnswers,
      totalSubmissions: rows.length,
      leaderboard: leaderboard.map(({ email, ...student }) => student),
      weakTopics,
      strongTopics,
      improvementPoints,
      submissionsHistory: rows.map(row => ({
        id: row.id,
        subject: row.subject,
        topic: row.result_data?.testTitle || row.test_id,
        score: Number(row.score),
        totalQuestions: Number(row.max_marks),
        percentage: Number(row.percentage),
        correctness: `${row.score} / ${row.max_marks} marks`,
        weakTopics: row.result_data?.weakPoints || [],
        strongTopics: (row.result_data?.stepAudit || [])
          .filter(step => step.isCorrect)
          .map(step => step.chapterReference)
          .filter(Boolean),
        date: row.submitted_at,
        timestamp: row.submitted_at,
      })),
      subjectMastery: Object.fromEntries([...subjectTotals.entries()].map(([subject, totals]) => [
        subject,
        totals.maxMarks ? Math.round((totals.score / totals.maxMarks) * 100) : 0,
      ])),
    };
  }

  router.get('/performance/:userId', async (req, res) => {
    const expectedEmail = String(req.params.userId || '').trim().toLowerCase();
    if (!expectedEmail) return res.status(400).json({ error: 'Student email is required.' });
    const identity = await getSignedInStudentEmail(req, expectedEmail);
    if (identity.error) return res.status(identity.status).json({ error: identity.error });
    const userEmail = identity.email;
    try {
      return res.json(await getStudentMetrics(userEmail));
    } catch (error) {
      console.error('Error fetching student performance:', error.message);
      return res.status(error.statusCode || 503).json({
        error: error.code === 'PGRST205' && error.message.includes('student_roster')
          ? 'Student roster storage is not configured. Apply backend/migrations/20261007_student_roster.sql.'
          : error.code === 'PGRST205'
            ? 'Assessment storage is not configured. Apply backend/migrations/20261006_assessment_workflow.sql.'
          : 'Could not load student performance data.',
      });
    }
  });

  router.post('/ask-advisor', async (req, res) => {
    const { question, userId, classLevel } = req.body;
    const expectedEmail = String(userId || '').trim().toLowerCase();
    if (!question?.trim() || !expectedEmail) {
      return res.status(400).json({ error: 'Question and signed-in student email are required.' });
    }
    const identity = await getSignedInStudentEmail(req, expectedEmail);
    if (identity.error) return res.status(identity.status).json({ error: identity.error });
    const userEmail = identity.email;

    let metrics;
    try {
      metrics = await getStudentMetrics(userEmail);
    } catch (error) {
      console.error('Could not load advisor context:', error.message);
      return res.status(error.statusCode || 503).json({ error: 'Could not load live student assessment data.' });
    }
    if (metrics.totalSubmissions === 0) {
      return res.status(404).json({ error: 'Complete an assessment before requesting personalized performance advice.' });
    }

    const subjectScores = Object.entries(metrics.subjectMastery);
    const strongestSubject = [...subjectScores].sort((a, b) => b[1] - a[1])[0];
    const areasToReview = metrics.weakTopics.length ? metrics.weakTopics.join(', ') : 'No weak topics identified in submitted assessments';
    let advice;
    let provider = 'live-assessment-analytics';

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an academic advisor. Base recommendations only on this student's real submitted-assessment data: class ${classLevel || 'not recorded'}, rank ${metrics.rank ?? 'not available'}, accuracy ${metrics.accuracy}%, strongest subject ${strongestSubject?.[0] || 'not available'} (${strongestSubject?.[1] ?? 'not available'}%), topics to review: ${areasToReview}. Never invent class peers, scores, submissions, or topic weaknesses.`,
            },
            { role: 'user', content: question.trim() },
          ],
          temperature: 0.6,
          max_tokens: 500,
        });
        advice = completion?.choices?.[0]?.message?.content;
        if (advice) provider = 'openai-assessment-advisor';
      } catch (error) {
        console.error('AI advisor generation failed:', error.message);
      }
    }

    if (!advice) {
      advice = [
        `You have completed ${metrics.totalSubmissions} assessment(s) with ${metrics.accuracy}% overall accuracy.`,
        `Your current rank is ${metrics.rank ?? 'not available'} of ${metrics.totalClassStudents} students with submitted assessments.`,
        `Your strongest recorded subject is ${strongestSubject?.[0] || 'not available'}${strongestSubject ? ` (${strongestSubject[1]}%)` : ''}.`,
        `Topics to review: ${areasToReview}.`,
        `For your question, "${question.trim()}", use these recorded results to choose the next topic to practise.`,
      ].join('\n\n');
    }

    return res.json({
      question: question.trim(),
      advice,
      rank: metrics.rank,
      percentile: metrics.percentile,
      accuracy: metrics.accuracy,
      weakTopics: metrics.weakTopics,
      provider,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = studentRoutes;
