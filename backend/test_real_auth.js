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

async function runAuthTests() {
  console.log('=== REAL AUTHENTICATION ENGINE VERIFICATION ===\n');

  // Test 1: Invalid email format rejection
  console.log('Test 1: Rejecting invalid email format...');
  const t1 = await makeRequest('POST', '/api/auth/login', { email: 'fake_email_without_at_or_dot', password: 'password123' });
  console.log(`Status: ${t1.status} | Message: "${t1.data.message}"`);
  if (t1.status !== 400) throw new Error('Expected 400 for invalid email format');

  // Test 2: Seamless auto-provisioning for genuine new email on sign in
  console.log('\nTest 2: Auto-provisioning genuine new email on sign in...');
  const t2 = await makeRequest('POST', '/api/auth/login', { email: 'new.student@domain.edu', password: 'StudentPass#2026' });
  console.log(`Status: ${t2.status} | Message: "${t2.data.message}" | User: ${t2.data.user?.name}`);
  if (t2.status !== 200) throw new Error('Expected 200 for genuine new email auto-provisioning');

  // Test 3: Rejecting wrong password for registered account
  console.log('\nTest 3: Rejecting incorrect password for registered faculty...');
  const t3 = await makeRequest('POST', '/api/auth/login', { email: 'teacher@school.edu', password: 'WrongPassword999' });
  console.log(`Status: ${t3.status} | Message: "${t3.data.message}"`);
  if (t3.status !== 401) throw new Error('Expected 401 for incorrect password');

  // Test 4: Real Faculty Sign In
  console.log('\nTest 4: Real Faculty Sign In with genuine credentials...');
  const t4 = await makeRequest('POST', '/api/auth/login', { email: 'teacher@school.edu', password: 'TeacherPassword#2026' });
  console.log(`Status: ${t4.status} | User: ${t4.data.user?.name} | Role: ${t4.data.user?.role} | Token: ${t4.data.token?.slice(0, 25)}...`);
  if (t4.status !== 200 || t4.data.user?.role !== 'teacher') throw new Error('Faculty login failed');

  // Test 5: Real Student Sign Up
  const testStudentEmail = `student.test.${Date.now()}@realmail.edu`;
  console.log(`\nTest 5: Registering genuine student: ${testStudentEmail}...`);
  const t5 = await makeRequest('POST', '/api/auth/signup', {
    name: 'Rohan Gupta',
    email: testStudentEmail,
    password: 'RohanSecurePassword#2026',
    role: 'student',
    classLevel: 10,
    section: 'Section A',
  });
  console.log(`Status: ${t5.status} | Message: "${t5.data.message}" | User: ${t5.data.user?.name}`);
  if (t5.status !== 201) throw new Error('Student registration failed');

  // Test 6: Sign in with the newly registered student credentials
  console.log('\nTest 6: Logging in with the newly registered student account...');
  const t6 = await makeRequest('POST', '/api/auth/login', {
    email: testStudentEmail,
    password: 'RohanSecurePassword#2026',
  });
  console.log(`Status: ${t6.status} | Logged in as: ${t6.data.user?.name} | Role: ${t6.data.user?.role}`);
  if (t6.status !== 200) throw new Error('New student login failed');

  // Test 7: Teacher creates student credentials in dashboard & student logs in with them
  const enrolledEmail = `enrolled.student.${Date.now()}@delhischool.edu`;
  console.log(`\nTest 7: Teacher enrolls student "${enrolledEmail}" with credentials in Teacher Dashboard...`);
  const t7 = await makeRequest('POST', '/api/teacher/students/add', {
    name: 'Pooja Verma',
    email: enrolledEmail,
    studentId: 'ROLL-8899',
    password: 'PoojaPassword#2026',
    classLevel: 10,
    section: 'Section B (Science Honors)',
    initialRemark: 'Enrolled for Board Exam Preparation 2026',
  });
  console.log(`Enrolled Status: ${t7.status} | Message: "${t7.data.message}"`);

  console.log('Student attempts logging in with credentials created by teacher...');
  const t7Login = await makeRequest('POST', '/api/auth/login', {
    email: enrolledEmail,
    password: 'PoojaPassword#2026',
  });
  console.log(`Status: ${t7Login.status} | Name: ${t7Login.data.user?.name} | Section: ${t7Login.data.user?.section}`);
  if (t7Login.status !== 200) throw new Error('Teacher-enrolled student login failed');

  console.log('\n🎉 ALL REAL AUTHENTICATION TESTS PASSED SUCCESSFULLY! No demo bypass allowed.');
}

runAuthTests().catch((err) => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
