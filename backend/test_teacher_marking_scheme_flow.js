const http = require('http');

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', (chunk) => { resData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resData) });
        } catch {
          resolve({ status: res.statusCode, data: resData });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runMarkingSchemeTests() {
  console.log('=== TEACHER NCERT MARKING SCHEME & SOLUTION IMPROVER TEST ===\n');

  // Step 1: Teacher Adds New Question with NCERT Marking Scheme
  console.log('Step 1: Teacher adding new question with structured NCERT marking breakdown...');
  const addRes = await makeRequest('POST', '/api/tutoring/questions/add', {
    question: 'Calculate the focal length of a concave mirror whose radius of curvature is 30 cm.',
    answer: 'f = -15 cm',
    marking_scheme: `📋 Official NCERT Marking Scheme Breakdown (Senior Faculty):
• [1 Mark] Step 1: State relationship R = 2f => f = R/2.
• [1 Mark] Step 2: Apply sign convention for concave mirror (R = -30 cm).
• [1 Mark] Step 3: f = -30 / 2 = -15 cm (Final answer with negative sign and cm unit).

⚠️ Examiner Penalty Guidelines:
• Deduct 1 mark if negative sign is omitted (focal length of concave mirror is always negative).`,
    explanation: 'f = R/2 = -30/2 = -15 cm.',
    subject: 'Physics',
    topic: 'Light - Reflection and Refraction',
    chapter_reference: 'NCERT Class 10 Chapter 10',
    class_level: 10,
    difficulty: 'easy',
  });
  console.log(`Status: ${addRes.status} | Message: "${addRes.data.message}"`);

  // Step 2: Teacher Improves an Existing AI Solution
  console.log('\nStep 2: Teacher improves existing AI solution according to NCERT Marking Scheme...');
  const editRes = await makeRequest('PUT', '/api/tutoring/questions/edit', {
    originalQuestion: 'Calculate the focal length of a concave mirror whose radius of curvature is 30 cm.',
    updatedQuestion: 'Calculate the focal length of a concave mirror whose radius of curvature is 30 cm.',
    updatedAnswer: 'f = -15 cm (or -0.15 m)',
    updatedExplanation: `📋 Official NCERT Marking Scheme Breakdown (Faculty Improved):
• [1 Mark] Step 1 (Formula & Sign Convention): State f = R/2 and concave mirror sign R = -30 cm.
• [1 Mark] Step 2 (Substitution): f = -30 cm / 2 = -15 cm.
• [1 Mark] Step 3 (SI Units & Direction): f = -15 cm. Negative sign confirms principal focus lies in front of mirror.

⚠️ Examiner Penalty Guidelines:
• Deduct ½ mark if cm/m units omitted. Deduct 1 mark if negative sign is missing.`,
    topic: 'Light - Reflection and Refraction',
    chapter_reference: 'NCERT Class 10 Chapter 10',
    difficulty: 'medium',
  });
  console.log(`Status: ${editRes.status} | Message: "${editRes.data.message}"`);

  // Step 3: Student asks doubt and receives the Teacher-Improved NCERT Marking Scheme Solution
  console.log('\nStep 3: Student asks doubt on this question in Doubt Solver...');
  const solveRes = await makeRequest('POST', '/api/tutoring/solve-doubt', {
    question: 'Calculate the focal length of a concave mirror whose radius of curvature is 30 cm.',
    subject: 'Physics',
    classLevel: '10',
    userId: 'student-user-1',
  });

  console.log(`Status: ${solveRes.status}`);
  console.log(`Provider: ${solveRes.data.provider}`);
  console.log('\n--- Returned Solution Snippet ---');
  console.log(solveRes.data.answer.slice(0, 400) + '...\n');

  if (!solveRes.data.answer.includes('NCERT') && !solveRes.data.answer.includes('Marking Scheme')) {
    throw new Error('NCERT Marking Scheme was not included in the doubt solver solution');
  }

  console.log('🎉 NCERT MARKING SCHEME INTEGRATION VERIFIED SUCCESSFULLY!');
}

runMarkingSchemeTests().catch((err) => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
