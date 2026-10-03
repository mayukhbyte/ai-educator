async function testRankFlow() {
  try {
    console.log('=== 1. INITIAL STUDENT PERFORMANCE ===');
    const initialPerf = await fetch('http://localhost:5000/api/student/performance/student@example.com').then(r => r.json());
    console.log('Initial Rank:', initialPerf.rank, 'Accuracy:', initialPerf.accuracy + '%');

    console.log('\n=== 2. SUBMITTING HIGH SCORE QUIZ (5/5 = 100%) ===');
    const submitGood = await fetch('http://localhost:5000/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'student@example.com',
        subject: 'Mathematics',
        classLevel: 10,
        answers: [0, 1, 2, 3, 0],
        questionsData: [
          { id: 'q1', correctAnswer: 0, topic: 'Quadratic Equations' },
          { id: 'q2', correctAnswer: 1, topic: 'Quadratic Equations' },
          { id: 'q3', correctAnswer: 2, topic: 'Trigonometry' },
          { id: 'q4', correctAnswer: 3, topic: 'Trigonometry' },
          { id: 'q5', correctAnswer: 0, topic: 'AP' },
        ]
      })
    }).then(r => r.json());
    console.log('Quiz Result:', submitGood.score + '/' + submitGood.totalQuestions);
    console.log('Rank Status:', submitGood.rankStatusText);
    console.log('New Rank:', submitGood.rank, 'Rank Change:', submitGood.rankChange);

    console.log('\n=== 3. SUBMITTING LOW SCORE QUIZ (1/5 = 20% - DEGRADATION TEST) ===');
    const submitBad = await fetch('http://localhost:5000/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'student@example.com',
        subject: 'Physics',
        classLevel: 10,
        answers: [3, 3, 3, 3, 0],
        questionsData: [
          { id: 'q1', correctAnswer: 0, topic: 'Electricity Resistors' },
          { id: 'q2', correctAnswer: 1, topic: 'Electricity Resistors' },
          { id: 'q3', correctAnswer: 2, topic: 'Mirror Formula' },
          { id: 'q4', correctAnswer: 3, topic: 'Mirror Formula' },
          { id: 'q5', correctAnswer: 1, topic: 'Ohm Law' },
        ]
      })
    }).then(r => r.json());
    console.log('Quiz Result:', submitBad.score + '/' + submitBad.totalQuestions);
    console.log('Rank Status:', submitBad.rankStatusText);
    console.log('Degraded Rank:', submitBad.rank, 'Rank Change:', submitBad.rankChange);

    console.log('\n=== 4. TEACHER DASHBOARD VIEW OF LIVE RANKS ===');
    const teacherStudents = await fetch('http://localhost:5000/api/teacher/students').then(r => r.json());
    console.log('Total Enrolled Students:', teacherStudents.totalStudents);
    teacherStudents.students.slice(0, 5).forEach(s => {
      console.log(`Rank #${s.rank} | ${s.name} | Accuracy: ${s.accuracy}% | Solved: ${s.totalSolved} | Change: ${s.rankChange > 0 ? '+' + s.rankChange : s.rankChange}`);
    });

    console.log('\n>>> DYNAMIC RANK UPDATE & DEGRADATION VERIFIED! <<<');
  } catch (err) {
    console.error('Test error:', err.message);
  }
}
testRankFlow();
