// Centralized Dynamic Student Performance & Rank Manager

let studentDirectory = [
  {
    id: 'std_101',
    studentId: 'ROLL-1001',
    name: 'Alice Johnson',
    email: 'alice.johnson@school.edu',
    temporaryPassword: 'Student#Alice2026',
    classLevel: 10,
    section: 'Section A (Maths & Science)',
    status: 'active',
    teacherRemark: 'Consistently excelling in Calculus and Coordinate Geometry quizzes.',
    removalReason: '',
    rank: 1,
    previousRank: 1,
    rankChange: 0,
    totalSolved: 45,
    accuracy: 94,
    badge: '🏆 Top Scholar',
    submissions: [
      { id: 'sub_a1', subject: 'Mathematics', topic: 'Trigonometry', score: 5, totalQuestions: 5, percentage: 100, date: 'Today' },
      { id: 'sub_a2', subject: 'Physics', topic: 'Electricity', score: 5, totalQuestions: 5, percentage: 100, date: 'Yesterday' },
    ],
  },
  {
    id: 'std_103',
    studentId: 'ROLL-1003',
    name: 'Carol Davis',
    email: 'carol.davis@school.edu',
    temporaryPassword: 'Student#Carol2026',
    classLevel: 10,
    section: 'Section B (Science Honors)',
    status: 'active',
    teacherRemark: 'High conceptual clarity in Chemistry and Life Processes.',
    removalReason: '',
    rank: 2,
    previousRank: 2,
    rankChange: 0,
    totalSolved: 40,
    accuracy: 90,
    badge: '🥈 High Achiever',
    submissions: [
      { id: 'sub_c1', subject: 'Chemistry', topic: 'Acids & Bases', score: 5, totalQuestions: 5, percentage: 100, date: 'Yesterday' },
      { id: 'sub_c2', subject: 'Biology', topic: 'Human Heart', score: 4, totalQuestions: 5, percentage: 80, date: '2 days ago' },
    ],
  },
  {
    id: 'std_105',
    studentId: 'ROLL-1005',
    name: 'Aarav Sharma (You)',
    email: 'student@example.com',
    temporaryPassword: 'password123',
    classLevel: 10,
    section: 'Section A (Maths & Science)',
    status: 'active',
    teacherRemark: 'Welcome to Class 10 Board Preparation! Focus on Parallel Resistor circuit numericals.',
    removalReason: '',
    rank: 3,
    previousRank: 3,
    rankChange: 0,
    totalSolved: 20,
    accuracy: 80,
    badge: '⭐ Rising Star',
    submissions: [
      {
        id: 'sub_101',
        subject: 'Mathematics',
        topic: 'Quadratic Equations & AP',
        score: 4,
        totalQuestions: 5,
        percentage: 80,
        correctness: '4 / 5 Correct (80%)',
        weakTopics: ['Discriminant condition D < 0 (no real roots)'],
        strongTopics: ['nth term of AP formula', 'Midpoint formula'],
        date: 'Today, 11:30 AM',
      },
      {
        id: 'sub_102',
        subject: 'Physics',
        topic: 'Electricity & Light',
        score: 3,
        totalQuestions: 5,
        percentage: 60,
        correctness: '3 / 5 Correct (60%)',
        weakTopics: ['Resistors in parallel formula (1/R_eq)', 'Sign convention for convex mirror'],
        strongTopics: ['Ohm’s law V = IR'],
        date: 'Yesterday, 4:15 PM',
      },
      {
        id: 'sub_103',
        subject: 'Chemistry',
        topic: 'Acids, Bases & Salts',
        score: 5,
        totalQuestions: 5,
        percentage: 100,
        correctness: '5 / 5 Correct (100%)',
        weakTopics: [],
        strongTopics: ['pH scale range', 'Plaster of Paris formula'],
        date: '3 days ago',
      },
      {
        id: 'sub_104',
        subject: 'Biology',
        topic: 'Life Processes & Heart',
        score: 4,
        totalQuestions: 5,
        percentage: 80,
        correctness: '4 / 5 Correct (80%)',
        weakTopics: ['Nephron Bowman capsule filtration'],
        strongTopics: ['Left ventricle function', 'Photosynthesis dark reaction'],
        date: '4 days ago',
      },
    ],
  },
  {
    id: 'std_102',
    studentId: 'ROLL-1002',
    name: 'Bob Smith',
    email: 'bob.smith@school.edu',
    temporaryPassword: 'Student#Bob2026',
    classLevel: 10,
    section: 'Section A (Maths & Science)',
    status: 'active',
    teacherRemark: 'Needs extra practice in Quadratic Equations and Ohm\'s law circuits.',
    removalReason: '',
    rank: 4,
    previousRank: 4,
    rankChange: 0,
    totalSolved: 32,
    accuracy: 74,
    badge: '📈 Steady Improver',
    submissions: [
      { id: 'sub_b1', subject: 'Mathematics', topic: 'Quadratic Equations', score: 3, totalQuestions: 5, percentage: 60, date: '2 days ago' },
      { id: 'sub_b2', subject: 'Physics', topic: 'Ohm’s Law', score: 4, totalQuestions: 5, percentage: 80, date: '4 days ago' },
    ],
  },
  {
    id: 'std_106',
    studentId: 'ROLL-1006',
    name: 'Kabir Singh',
    email: 'kabir.singh@school.edu',
    temporaryPassword: 'Student#Kabir2026',
    classLevel: 10,
    section: 'Section B',
    status: 'active',
    teacherRemark: 'Revision needed in Biology life processes.',
    removalReason: '',
    rank: 5,
    previousRank: 5,
    rankChange: 0,
    totalSolved: 25,
    accuracy: 68,
    badge: '🎯 Board Focused',
    submissions: [
      { id: 'sub_k1', subject: 'Biology', topic: 'Life Processes', score: 3, totalQuestions: 5, percentage: 60, date: '3 days ago' },
    ],
  },
];

// Helper to recalculate ranks across all active students
function recalculateAllRanks() {
  const activeStudents = studentDirectory.filter(s => s.status === 'active');

  // Compute composite score for each student based on accuracy & total solved
  activeStudents.forEach(st => {
    let totalScore = 0;
    let totalQs = 0;
    if (st.submissions && st.submissions.length > 0) {
      totalScore = st.submissions.reduce((acc, sub) => acc + (sub.score || 0), 0);
      totalQs = st.submissions.reduce((acc, sub) => acc + (sub.totalQuestions || 5), 0);
    }
    st.totalSolved = totalQs;
    st.accuracy = totalQs > 0 ? Math.round((totalScore / totalQs) * 100) : st.accuracy || 70;
    st.compositeMetric = (st.accuracy * 0.8) + (Math.min(st.totalSolved, 50) * 0.4);
  });

  // Sort descending by compositeMetric
  activeStudents.sort((a, b) => b.compositeMetric - a.compositeMetric);

  // Assign updated ranks and track momentum (Up/Down/Same)
  activeStudents.forEach((st, idx) => {
    const newRank = idx + 1;
    st.previousRank = st.rank || newRank;
    st.rankChange = st.previousRank - newRank; // positive = promoted, negative = degraded, 0 = unchanged
    st.rank = newRank;

    if (newRank === 1) st.badge = '🏆 Top Scholar';
    else if (newRank === 2) st.badge = '🥈 High Achiever';
    else if (newRank === 3) st.badge = '⭐ Rising Star';
    else if (st.rankChange < 0) st.badge = '⚠️ Rank Degraded (Needs Revision)';
    else if (st.rankChange > 0) st.badge = '🚀 Rank Promoted (Improving)';
    else st.badge = '📈 Steady Learner';
  });
}

// Record a new student test submission and dynamically adjust ranks
function recordStudentSubmission(payload) {
  const {
    userId = 'student@example.com',
    studentName = 'Active Student',
    subject = 'General',
    topic = 'Quiz Evaluation',
    score = 5,
    totalQuestions = 5,
    percentage = 100,
    weakTopics = [],
    strongTopics = [],
    classLevel = 10,
  } = payload;

  let student = studentDirectory.find(
    s => s.email.toLowerCase() === userId.toLowerCase() || s.id === userId || s.studentId === userId || userId === 'student-user-1'
  );

  if (!student) {
    student = studentDirectory.find(s => s.email === 'student@example.com');
  }

  if (student) {
    const newSub = {
      id: `sub_${Date.now()}`,
      subject,
      topic,
      score,
      totalQuestions,
      percentage,
      correctness: `${score} / ${totalQuestions} Correct (${percentage}%)`,
      weakTopics: Array.isArray(weakTopics) ? weakTopics : [],
      strongTopics: Array.isArray(strongTopics) ? strongTopics : [],
      classLevel: parseInt(classLevel, 10) || 10,
      date: 'Just now',
      timestamp: new Date().toISOString(),
    };

    if (!student.submissions) student.submissions = [];
    student.submissions.unshift(newSub);

    // Recalculate ranks across the class
    recalculateAllRanks();

    return {
      message: 'Submission recorded and rank updated in real-time!',
      student,
      rank: student.rank,
      previousRank: student.previousRank,
      rankChange: student.rankChange,
      accuracy: student.accuracy,
      newSubmission: newSub,
    };
  }

  return { message: 'Submission logged', rank: 3, rankChange: 0 };
}

// Knowledge Base of NCERT Remedial Modules for Dynamic Real-Time Synthesis
const NCERT_REMEDIAL_CATALOG = {
  'discriminant': {
    subject: 'Mathematics',
    title: 'Solidify Quadratic Discriminant Nature of Roots (D = b² - 4ac)',
    detail: 'Your recent test errors indicate confusion between D < 0 (no real roots) and D = 0 (equal roots). Review the 3 conditions in NCERT Section 4.4.',
    ncertChapter: 'NCERT Class 10 Maths: Chapter 4 Quadratic Equations',
    action: 'Solve Solved Example 16 & Exercise 4.4 Q1-5',
    link: 'https://ncert.nic.in/textbook.php?jemh1=4-15',
  },
  'quadratic': {
    subject: 'Mathematics',
    title: 'Master Quadratic Equations & Factorization Methods',
    detail: 'Targeted practice on splitting middle term and quadratic formula derivation x = (-b ± √D)/(2a).',
    ncertChapter: 'NCERT Class 10 Maths: Chapter 4 Quadratic Equations',
    action: 'Practice Page 84 Factorization Exercises',
    link: 'https://ncert.nic.in/textbook.php?jemh1=4-15',
  },
  'ap': {
    subject: 'Mathematics',
    title: 'Master Arithmetic Progression (AP) nth Term & Sum Formulas',
    detail: 'Your test results showed marks deducted on simultaneous AP linear equations (a_n = a + (n-1)d). Practice Exercise 5.2.',
    ncertChapter: 'NCERT Class 10 Maths: Chapter 5 Arithmetic Progressions',
    action: 'Solve Exercise 5.2 Questions 7 to 15',
    link: 'https://ncert.nic.in/textbook.php?jemh1=5-15',
  },
  'arithmetic': {
    subject: 'Mathematics',
    title: 'Arithmetic Progression Problem Solving',
    detail: 'Review formula for sum of n terms S_n = n/2 [2a + (n-1)d].',
    ncertChapter: 'NCERT Class 10 Maths: Chapter 5 Arithmetic Progressions',
    action: 'Review Solved Examples 11 to 14',
    link: 'https://ncert.nic.in/textbook.php?jemh1=5-15',
  },
  'trigonometry': {
    subject: 'Mathematics',
    title: 'Memorize Standard Trigonometric Table & Identities',
    detail: 'Recent submission data showed value substitution errors (sin 30°, cos 60°, cosec 60°). Memorize NCERT Table 8.1.',
    ncertChapter: 'NCERT Class 10 Maths: Chapter 8 Introduction to Trigonometry',
    action: 'Revise NCERT Table 8.1 on Page 185',
    link: 'https://ncert.nic.in/textbook.php?jemh1=8-15',
  },
  'coordinate': {
    subject: 'Mathematics',
    title: 'Review Midpoint & Section Formulas in Coordinate Geometry',
    detail: 'Ensure precision when substituting coordinates: ((x₁ + x₂)/2, (y₁ + y₂)/2) and section formula (m₁x₂ + m₂x₁)/(m₁ + m₂).',
    ncertChapter: 'NCERT Class 10 Maths: Chapter 7 Coordinate Geometry',
    action: 'Practice Exercise 7.2 Questions 1 to 6',
    link: 'https://ncert.nic.in/textbook.php?jemh1=7-15',
  },
  'parallel': {
    subject: 'Physics',
    title: 'Master Resistors in Parallel (1/R_eq = 1/R₁ + 1/R₂ + ...)',
    detail: 'In your Electricity assessments, multi-resistor parallel combinations had reciprocal errors. Remember to take reciprocal of the sum to find R_eq.',
    ncertChapter: 'NCERT Class 10 Science: Chapter 12 Electricity',
    action: 'Solve Solved Examples 12.8 & 12.9 on Page 214',
    link: 'https://ncert.nic.in/textbook.php?jesc1=12-16',
  },
  'resistor': {
    subject: 'Physics',
    title: 'Series vs Parallel Circuit Analysis',
    detail: 'Review voltage distribution in series and current division in parallel circuits.',
    ncertChapter: 'NCERT Class 10 Science: Chapter 12 Electricity',
    action: 'Practice Exercise 12 Questions 8, 9, 10',
    link: 'https://ncert.nic.in/textbook.php?jesc1=12-16',
  },
  'electricity': {
    subject: 'Physics',
    title: 'Ohm’s Law & Joule’s Heating Law Numericals',
    detail: 'Solidify relationship V = IR and heating formula H = I²Rt with proper S.I. units [Joules / Watts].',
    ncertChapter: 'NCERT Class 10 Science: Chapter 12 Electricity',
    action: 'Solve Heating Effect Numericals on Page 218',
    link: 'https://ncert.nic.in/textbook.php?jesc1=12-16',
  },
  'mirror': {
    subject: 'Physics',
    title: 'Review Cartesian Sign Conventions for Spherical Mirrors',
    detail: 'Convex mirror focal length is positive (+f); concave mirror focal length is negative (-f). Object distance is always negative (-u).',
    ncertChapter: 'NCERT Class 10 Science: Chapter 10 Light Reflection',
    action: 'Review Figure 10.9 Ray Diagrams on Page 168',
    link: 'https://ncert.nic.in/textbook.php?jesc1=10-16',
  },
  'lens': {
    subject: 'Physics',
    title: 'Master Convex & Concave Lens Formula and Magnification',
    detail: 'Lens formula: 1/f = 1/v - 1/u (notice negative sign compared to mirror formula). Magnification m = v/u.',
    ncertChapter: 'NCERT Class 10 Science: Chapter 10 Light Refraction',
    action: 'Practice Solved Examples 10.3 & 10.4',
    link: 'https://ncert.nic.in/textbook.php?jesc1=10-16',
  },
  'light': {
    subject: 'Physics',
    title: 'Refraction & Snell’s Law of Refraction',
    detail: 'Review refractive index n = sin i / sin r and speed of light ratios.',
    ncertChapter: 'NCERT Class 10 Science: Chapter 10 Light',
    action: 'Review Refraction through Glass Slab',
    link: 'https://ncert.nic.in/textbook.php?jesc1=10-16',
  },
  'acid': {
    subject: 'Chemistry',
    title: 'pH Scale & Chemical Properties of Acids and Bases',
    detail: 'Review neutralization reactions: Acid + Base → Salt + Water. Living organisms survive in narrow pH range 7.0 to 7.8.',
    ncertChapter: 'NCERT Class 10 Science: Chapter 2 Acids, Bases and Salts',
    action: 'Review NCERT Section 2.3 Importance of pH',
    link: 'https://ncert.nic.in/textbook.php?jesc1=2-16',
  },
  'carbon': {
    subject: 'Chemistry',
    title: 'Functional Groups & Nomenclature of Carbon Compounds',
    detail: 'Distinguish aldehydes (-CHO), ketones (>C=O), carboxylic acids (-COOH), and alcohols (-OH).',
    ncertChapter: 'NCERT Class 10 Science: Chapter 4 Carbon and its Compounds',
    action: 'Study NCERT Table 4.4 on Page 67',
    link: 'https://ncert.nic.in/textbook.php?jesc1=4-16',
  },
  'heart': {
    subject: 'Biology',
    title: 'Double Circulation & Structure of Human Heart',
    detail: 'Understand oxygenated blood pumping from left ventricle via aorta vs deoxygenated blood from right ventricle via pulmonary artery.',
    ncertChapter: 'NCERT Class 10 Science: Chapter 6 Life Processes (Transportation)',
    action: 'Examine Figure 6.10 Schematic Sectional View of Heart',
    link: 'https://ncert.nic.in/textbook.php?jesc1=6-16',
  },
  'nephron': {
    subject: 'Biology',
    title: 'Excretion in Humans & Ultrafiltration in Nephrons',
    detail: 'Study the filtration of nitrogenous waste in Bowman’s capsule and selective reabsorption in renal tubules.',
    ncertChapter: 'NCERT Class 10 Science: Chapter 6 Life Processes (Excretion)',
    action: 'Review Figure 6.14 Structure of a Nephron',
    link: 'https://ncert.nic.in/textbook.php?jesc1=6-16',
  },
  'synapse': {
    subject: 'Biology',
    title: 'Nervous System & Transmission of Nerve Impulses across Synapses',
    detail: 'Review chemical transmission of nerve impulses from axon terminal across the synaptic gap to dendrites of next neuron.',
    ncertChapter: 'NCERT Class 10 Science: Chapter 7 Control and Coordination',
    action: 'Review Figure 7.1 Structure of Neuron on Page 115',
    link: 'https://ncert.nic.in/textbook.php?jesc1=7-16',
  },
};

// Dynamic Generator: builds personalized, real-time AI improvement points for any student
function generateDynamicImprovementPoints(student, weakTopics, subjectMastery, accuracy, rank) {
  const points = [];
  let idCounter = 1;
  const seenTitles = new Set();

  // 1. Process specific weak topics identified from the student's actual submissions
  (weakTopics || []).forEach(wt => {
    const lower = wt.toLowerCase();
    for (const [key, item] of Object.entries(NCERT_REMEDIAL_CATALOG)) {
      if (lower.includes(key) && !seenTitles.has(item.title)) {
        seenTitles.add(item.title);
        points.push({
          id: idCounter++,
          priority: points.length === 0 ? 'High' : points.length < 3 ? 'Medium' : 'Low',
          subject: item.subject,
          title: item.title,
          detail: `[Student Specific Diagnosis for ${student.name.replace(' (You)', '')}]: In your recent assessment, mistakes were detected in ${wt}. ${item.detail}`,
          ncertChapter: item.ncertChapter,
          action: item.action,
          link: item.link,
        });
        break;
      }
    }
  });

  // 2. Identify the student's lowest scoring subject from subjectMastery
  let lowestSubject = 'Physics';
  let lowestScore = 100;
  if (subjectMastery) {
    Object.entries(subjectMastery).forEach(([subj, score]) => {
      if (score < lowestScore) {
        lowestScore = score;
        lowestSubject = subj;
      }
    });
  }

  // If lowest subject is below 85% and not yet addressed, add a subject-specific high priority module
  if (lowestScore < 85) {
    const fallbackForSubj = Object.values(NCERT_REMEDIAL_CATALOG).find(
      it => it.subject === lowestSubject && !seenTitles.has(it.title)
    );
    if (fallbackForSubj) {
      seenTitles.add(fallbackForSubj.title);
      points.unshift({
        id: idCounter++,
        priority: 'High',
        subject: fallbackForSubj.subject,
        title: `Priority Focus on ${lowestSubject} (${lowestScore}% Mastery)`,
        detail: `Your current ${lowestSubject} accuracy of ${lowestScore}% is your largest opportunity to boost class ranking. ${fallbackForSubj.detail}`,
        ncertChapter: fallbackForSubj.ncertChapter,
        action: fallbackForSubj.action,
        link: fallbackForSubj.link,
      });
    }
  }

  // 3. Ensure at least 3-4 personalized recommendations
  const allRemedials = Object.values(NCERT_REMEDIAL_CATALOG);
  for (const item of allRemedials) {
    if (points.length >= 4) break;
    if (!seenTitles.has(item.title)) {
      seenTitles.add(item.title);
      points.push({
        id: idCounter++,
        priority: points.length < 2 ? 'Medium' : 'Low',
        subject: item.subject,
        title: item.title,
        detail: `[Curriculum Alignment]: Recommended NCERT booster to reinforce mastery and maintain Rank #${rank}.`,
        ncertChapter: item.ncertChapter,
        action: item.action,
        link: item.link,
      });
    }
  }

  // 4. Always append a dynamic live assessment challenge action based on current rank
  points.push({
    id: idCounter++,
    priority: rank > 1 ? 'High' : 'Medium',
    subject: 'Board Competition',
    title: rank === 1 ? 'Maintain #1 Class Rank: Take Monthly Board Test' : `Climb to Rank #1: Target Weak Points in Daily Speed Test`,
    detail: `You are currently Rank #${rank} among ${studentDirectory.length} active classmates. Completing timed tests with strict NCERT step-marking will directly increase your ranking!`,
    ncertChapter: 'AI Educator Real-Time NCERT Assessment',
    action: rank === 1 ? 'Attempt Monthly Board Test' : 'Launch 5-Question Adaptive Quiz',
    link: '/quiz',
  });

  return points;
}

// Get student performance profile
function getStudentPerformance(userId = 'student@example.com') {
  let student = studentDirectory.find(
    s => s.email.toLowerCase() === userId.toLowerCase() || s.id === userId || s.studentId === userId || userId === 'student-user-1'
  );

  if (!student) {
    student = studentDirectory.find(s => s.email === 'student@example.com');
  }

  recalculateAllRanks();

  const totalClassStudents = 45;
  const rank = student ? student.rank : 3;
  const percentile = Math.min(99, Math.max(50, Math.round(((totalClassStudents - rank + 1) / totalClassStudents) * 100)));

  const submissions = student?.submissions || [];
  const totalScore = submissions.reduce((acc, s) => acc + (s.score || 0), 0);
  const totalQuestions = submissions.reduce((acc, s) => acc + (s.totalQuestions || 5), 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : (student?.accuracy || 80);

  // Compute individualized subject mastery for this specific student
  const subjectStats = {
    Mathematics: { total: 0, score: 0 },
    Physics: { total: 0, score: 0 },
    Chemistry: { total: 0, score: 0 },
    Biology: { total: 0, score: 0 },
  };

  const weakTopics = [];
  const strongTopics = [];
  submissions.forEach(s => {
    if (s.weakTopics && Array.isArray(s.weakTopics)) {
      s.weakTopics.forEach(w => { if (!weakTopics.includes(w)) weakTopics.push(w); });
    }
    if (s.strongTopics && Array.isArray(s.strongTopics)) {
      s.strongTopics.forEach(st => { if (!strongTopics.includes(st)) strongTopics.push(st); });
    }
    const subj = s.subject || 'General';
    if (subjectStats[subj]) {
      subjectStats[subj].total += s.totalQuestions || 5;
      subjectStats[subj].score += s.score || 0;
    }
  });

  const subjectMastery = {
    Mathematics: subjectStats.Mathematics.total > 0 ? Math.round((subjectStats.Mathematics.score / subjectStats.Mathematics.total) * 100) : (student?.id === 'std_101' ? 95 : 82),
    Physics: subjectStats.Physics.total > 0 ? Math.round((subjectStats.Physics.score / subjectStats.Physics.total) * 100) : (student?.id === 'std_103' ? 90 : 70),
    Chemistry: subjectStats.Chemistry.total > 0 ? Math.round((subjectStats.Chemistry.score / subjectStats.Chemistry.total) * 100) : (student?.id === 'std_103' ? 98 : 92),
    Biology: subjectStats.Biology.total > 0 ? Math.round((subjectStats.Biology.score / subjectStats.Biology.total) * 100) : (student?.id === 'std_106' ? 68 : 84),
  };

  // Dynamically generate real-time AI improvement points tailored specifically to this student!
  const improvementPoints = generateDynamicImprovementPoints(
    student || { name: 'Active Student' },
    weakTopics,
    subjectMastery,
    accuracy,
    rank
  );

  const leaderboard = studentDirectory
    .filter(s => s.status === 'active')
    .map(s => ({
      rank: s.rank,
      previousRank: s.previousRank,
      rankChange: s.rankChange,
      name: s.id === student?.id ? `${s.name.replace(' (You)', '')} (You)` : s.name,
      scoreAvg: s.accuracy,
      totalSolved: s.totalSolved,
      accuracy: s.accuracy,
      badge: s.badge,
    }))
    .sort((a, b) => a.rank - b.rank);

  return {
    rank,
    previousRank: student?.previousRank || rank,
    rankChange: student?.rankChange || 0,
    totalClassStudents,
    percentile,
    accuracy,
    totalQuestionsAttempted: totalQuestions,
    totalCorrectAnswers: totalScore,
    totalSubmissions: submissions.length,
    leaderboard,
    weakTopics: weakTopics.length > 0 ? weakTopics : ['Parallel Resistors 1/R_eq', 'Discriminant Condition D < 0'],
    strongTopics: strongTopics.length > 0 ? strongTopics : ['Acids & Bases pH', 'Ohm’s Law', 'AP formula'],
    improvementPoints,
    submissionsHistory: submissions,
    subjectMastery,
  };
}

// Teacher management functions
function getAllStudents() {
  recalculateAllRanks();
  return {
    totalStudents: studentDirectory.length,
    activeCount: studentDirectory.filter(s => s.status === 'active').length,
    removedCount: studentDirectory.filter(s => s.status === 'removed').length,
    students: studentDirectory,
  };
}

function addStudent(data) {
  const newStudent = {
    id: `std_${Date.now()}`,
    studentId: data.studentId || `ROLL-${Math.floor(1000 + Math.random() * 9000)}`,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    temporaryPassword: data.password || `Welcome#${Math.floor(1000 + Math.random() * 9000)}`,
    classLevel: parseInt(data.classLevel, 10) || 10,
    section: data.section || 'Section A',
    status: 'active',
    teacherRemark: data.initialRemark || 'Registered and assigned to active cohort by Teacher.',
    removalReason: '',
    rank: studentDirectory.length + 1,
    previousRank: studentDirectory.length + 1,
    rankChange: 0,
    score: 85,
    accuracy: 85,
    totalSolved: 10,
    badge: '⭐ New Enrollee',
    submissions: [],
    dateAdded: new Date().toISOString().split('T')[0],
  };

  studentDirectory.push(newStudent);
  recalculateAllRanks();
  return newStudent;
}

function removeStudent(studentId, email, reason) {
  const student = studentDirectory.find(
    s => s.id === studentId || s.studentId === studentId || s.email.toLowerCase() === (email || '').toLowerCase()
  );
  if (!student) return null;

  student.status = 'removed';
  student.removalReason = (reason || 'Removed by instructor').trim();
  student.teacherRemark = `[REMOVED BY TEACHER]: ${student.removalReason}`;
  student.lastUpdated = new Date().toISOString();
  recalculateAllRanks();
  return student;
}

function reactivateStudent(studentId, remark) {
  const student = studentDirectory.find(s => s.id === studentId || s.studentId === studentId);
  if (!student) return null;

  student.status = 'active';
  student.removalReason = '';
  student.teacherRemark = (remark || 'Re-admitted to active batch').trim();
  student.lastUpdated = new Date().toISOString();
  recalculateAllRanks();
  return student;
}

module.exports = {
  studentDirectory,
  recalculateAllRanks,
  recordStudentSubmission,
  getStudentPerformance,
  getAllStudents,
  addStudent,
  removeStudent,
  reactivateStudent,
};
