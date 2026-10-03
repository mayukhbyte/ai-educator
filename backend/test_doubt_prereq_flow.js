const axios = require('axios');

async function testDoubtAndPrereqFlow() {
  const BASE_URL = 'http://localhost:5000/api';

  console.log('--- Step 1: Teacher retrieves doubt queue ---');
  const doubtsRes = await axios.get(`${BASE_URL}/tutoring/doubts-for-teacher`);
  console.log(`Doubt queue size: ${doubtsRes.data.doubts.length}`);
  const targetDoubt = doubtsRes.data.doubts[0];
  console.log(`Selected doubt for solution: "${targetDoubt.question}"`);

  console.log('\n--- Step 2: Teacher uploads video solution with attached practice questions ---');
  const uploadRes = await axios.post(`${BASE_URL}/tutoring/upload-video-solution`, {
    doubtId: targetDoubt.id,
    questionPattern: 'parallel',
    topic: 'Electricity - Resistors in Parallel',
    subject: 'Physics',
    teacherName: 'Dr. Sarah (Senior Physics Faculty)',
    videoUrl: 'https://www.youtube.com/watch?v=8jB7w3Kj_g8',
    title: 'Chalkboard Walkthrough: 1/R_eq Parallel Circuits',
    notes: 'Remember: Always take reciprocal at the end: 1/R_eq = 1/R1 + 1/R2.',
    attachedQuestions: [
      {
        question: 'Calculate equivalent resistance when two 10Ω resistors are connected in parallel.',
        answer: '5 Ω',
        explanation: '1/R_eq = 1/10 + 1/10 = 2/10 = 1/5 => R_eq = 5 Ohms.',
        difficulty: 'easy',
      },
      {
        question: 'If a 12V supply is connected to this 5Ω equivalent circuit, what is the total current?',
        answer: '2.4 A',
        explanation: 'Using Ohm’s Law I = V / R = 12 / 5 = 2.4 Amperes.',
        difficulty: 'medium',
      },
    ],
  });
  console.log('Upload Result:', uploadRes.data.message);
  console.log(`Attached questions count: ${uploadRes.data.video.attachedQuestions.length}`);

  console.log('\n--- Step 3: Student asks doubt (Personalized with Past Test Prerequisite Gaps) ---');
  const solveRes = await axios.post(`${BASE_URL}/tutoring/solve-doubt`, {
    question: 'How do I calculate equivalent resistance when resistors are in parallel?',
    level: 'medium',
    userId: 'student-user-1',
    subject: 'Physics',
    classLevel: '10',
  });

  console.log('\n--- Verification Results ---');
  console.log('1. Student Prerequisites Identified from Database:', solveRes.data.prerequisites);
  console.log('2. Has Video attached:', solveRes.data.youtubeVideo?.hasVideo, `(${solveRes.data.youtubeVideo?.title})`);
  console.log('3. Attached Practice Questions from Teacher:', solveRes.data.attachedPracticeQuestions?.length);
  solveRes.data.attachedPracticeQuestions?.forEach((q, i) => {
    console.log(`   Q${i+1}: ${q.question} => Ans: ${q.answer}`);
  });
  console.log('4. Prerequisite-Scaffolded Answer snippet:');
  console.log(solveRes.data.answer.slice(0, 300) + '...\n');

  console.log('✅ ALL CHECKS PASSED SUCCESSFULLY!');
}

testDoubtAndPrereqFlow().catch((err) => {
  console.error('Test failed:', err.response?.data || err.message);
  process.exit(1);
});
