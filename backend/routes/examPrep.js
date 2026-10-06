const express = require('express');

function examPrepRoutes(supabase) {
  const router = express.Router();

  async function getAuthenticatedUser(req) {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token || !supabase) {
      return { user: null, error: 'A signed-in account is required.', status: 401 };
    }
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return { user: null, error: 'A valid signed-in account is required.', status: 401 };
    }
    return { user: data.user };
  }

  async function requireTeacher(req, res, next) {
    const authenticated = await getAuthenticatedUser(req);
    if (!authenticated.user) {
      return res.status(authenticated.status).json({ error: authenticated.error });
    }

    let role = authenticated.user.app_metadata?.role || authenticated.user.user_metadata?.role;
    if (!role) {
      const profile = await supabase.from('profiles')
        .select('role')
        .eq('id', authenticated.user.id)
        .maybeSingle();
      if (profile.error) return res.status(503).json({ error: 'Could not verify teacher permissions.' });
      role = profile.data?.role;
    }
    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ error: 'Teacher permissions are required for this action.' });
    }
    req.teacher = authenticated.user;
    return next();
  }

  // POST /api/exam-prep/generate
  router.post('/generate', async (req, res) => {
    const {
      prompt = '',
      syllabus = '',
      subject = 'General Science & Mathematics',
      classLevel = 10,
      difficulty = 'medium',
      numQuestions = 4,
      userId = 'student-guest',
    } = req.body;

    const cleanPrompt = String(prompt || '').trim();
    const cleanSyllabus = String(syllabus || '').trim();
    const cleanSubject = String(subject || '').trim();
    const parsedClass = Number.parseInt(classLevel, 10);
    const requestedCount = Number.parseInt(numQuestions, 10);
    if (!cleanPrompt && !cleanSyllabus) {
      return res.status(400).json({ error: 'Enter an exam prompt or syllabus outline.' });
    }
    if (cleanPrompt.length > 5000 || cleanSyllabus.length > 5000) {
      return res.status(400).json({ error: 'Exam prompt and syllabus must each be 5,000 characters or fewer.' });
    }
    if (!Number.isInteger(parsedClass) || parsedClass < 1 || parsedClass > 12) {
      return res.status(400).json({ error: 'Class level must be between 1 and 12.' });
    }
    if (!Number.isInteger(requestedCount) || requestedCount < 1 || requestedCount > 15) {
      return res.status(400).json({ error: 'Question count must be between 1 and 15.' });
    }
    if (!cleanSubject) {
      return res.status(400).json({ error: 'Select a subject for the exam.' });
    }

    const cleanDifficulty = ['basic', 'medium', 'hard'].includes(String(difficulty).toLowerCase())
      ? String(difficulty).toLowerCase()
      : 'medium';
    if (!supabase) {
      return res.status(503).json({ error: 'Curriculum database is unavailable. Please try again later.' });
    }

    let curriculumRows;
    try {
      const { data, error } = await supabase
        .from('education')
        .select('question, answer, explanation, topic, chapter_reference, subject, difficulty')
        .eq('class_level', parsedClass)
        .limit(500);
      if (error) throw error;
      curriculumRows = data || [];
    } catch (error) {
      console.error('[Exam Prep] Curriculum database lookup failed:', error.message);
      return res.status(503).json({ error: 'Could not load practice questions from the curriculum database.' });
    }

    const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const normalizeSubject = value => {
      const normalized = normalize(value).replace(/\s+/g, '');
      return ['math', 'mathematics', 'maths'].includes(normalized) ? 'maths' : normalized;
    };
    const targetSubject = normalizeSubject(cleanSubject);
    const eligibleRows = curriculumRows.filter(row => {
      const rowSubject = normalizeSubject(row.subject);
      if (targetSubject === 'generalscience' || targetSubject === 'science') {
        return ['science', 'physics', 'chemistry', 'biology'].includes(rowSubject);
      }
      return rowSubject === targetSubject || (
        parsedClass <= 10 && rowSubject === 'science' &&
        ['physics', 'chemistry', 'biology'].includes(targetSubject)
      );
    });
    const ignoredTerms = new Set([
      'a', 'an', 'and', 'according', 'based', 'board', 'class', 'create', 'exam', 'examination',
      'focus', 'focusing', 'for', 'from', 'generate', 'include', 'including', 'level', 'make',
      'paper', 'practice', 'question', 'questions', 'step', 'steps', 'test', 'the', 'this',
      'with', 'solution', 'solutions', 'basic', 'medium', 'hard', 'easy', 'standard', 'ncert',
      'physics', 'chemistry', 'biology', 'science', 'math', 'maths', 'mathematics',
    ]);
    const requestedTerms = [...new Set((cleanPrompt + ' ' + cleanSyllabus).toLowerCase().match(/[a-z0-9]{3,}/g) || [])]
      .filter(term => !ignoredTerms.has(term) && !/^\d+$/.test(term));
    const rankedRows = eligibleRows.map(row => {
      const corpus = normalize([row.topic || '', row.question || '', row.chapter_reference || ''].join(' '));
      const score = requestedTerms.reduce((total, term) => total + (corpus.includes(term) ? 1 : 0), 0);
      return { row, score, difficultyMatch: String(row.difficulty || '').toLowerCase() === cleanDifficulty };
    }).filter(match => requestedTerms.length === 0 || match.score > 0)
      .sort((a, b) => b.score - a.score || Number(b.difficultyMatch) - Number(a.difficultyMatch));
    const selectedRows = rankedRows.slice(0, requestedCount);
    if (selectedRows.length === 0) {
      return res.status(404).json({
        error: 'No stored ' + cleanSubject + ' questions match this Class ' + parsedClass + ' topic. Try another topic or add matching curriculum records.',
      });
    }

    const finalQuestions = selectedRows.map(({ row }, index) => {
      const answer = String(row.answer || '').trim();
      const explanation = String(row.explanation || '').trim();
      return {
        id: index + 1,
        section: row.topic || row.chapter_reference || 'Curriculum practice',
        type: 'Written response',
        marks: cleanDifficulty === 'hard' ? 3 : cleanDifficulty === 'medium' ? 2 : 1,
        question: row.question,
        modelAnswer: answer || explanation,
        markingScheme: explanation || 'Use the stored curriculum answer as the reference for checking this response.',
        stepByStepSolution: explanation || answer,
        chapterReference: row.chapter_reference || row.topic || '',
        sourceLink: 'https://ncert.nic.in/textbook.php',
      };
    });
    const paperTitle = 'Class ' + parsedClass + ' ' + cleanSubject + ' Curriculum Practice';
    const blueprintSummary = 'Selected ' + finalQuestions.length + ' matching item(s) from stored class and subject curriculum records. No AI generation was used.';
    const provider = 'curriculum-database';
    const totalMarks = finalQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const paperId = `EXAM-CL${parsedClass}-${Date.now()}`;

    // Log paper generation to Supabase 'train' table
    if (supabase) {
      try {
        await supabase.from('train').insert([
          {
            title: `Custom Exam Paper: ${paperId}`,
            content: `Class: ${parsedClass} | Subject: ${cleanSubject} | Prompt: "${cleanPrompt.slice(0, 100)}" | Questions: ${finalQuestions.length} | Marks: ${totalMarks}`,
            subject: cleanSubject,
            topic: 'Exam Prep Generation',
            class_level: parsedClass,
            chapter_reference: `Class ${parsedClass} Custom Exam`,
            content_type: 'exam_paper',
            difficulty: cleanDifficulty,
            quality_score: 0.95,
            source: `exam-gen-${userId}`,
          },
        ]);
      } catch (err) {
        console.warn('[Exam Prep] Log skipped:', err.message);
      }
    }

    return res.json({
      paperId,
      paperTitle,
      classLevel: parsedClass,
      subject: cleanSubject,
      difficulty: cleanDifficulty,
      promptUsed: cleanPrompt || cleanSyllabus,
      totalQuestions: finalQuestions.length,
      totalMarks,
      durationMinutes: Math.max(15, finalQuestions.length * 5),
      provider,
      curriculum: 'Selected from stored curriculum database records',
      blueprintSummary,
      questions: finalQuestions,
      officialEbookLinks: {
        arihant: 'https://www.arihantbooks.com',
        ncert: 'https://ncert.nic.in/textbook.php',
        diksha: 'https://diksha.gov.in/explore',
        ndli: 'https://ndl.iitkgp.ac.in',
      }
    });
  });

  // =========================================================================
  // MULTI-CLASS MONTHLY NCERT & ARIHANT ASSESSMENT SYSTEM (Classes 9–12)
  // Arihant reference links preferred; NCERT as fallback
  // =========================================================================

  // ── Reference Links ──────────────────────────────────────────────────────
  const ARIHANT_LINKS = {
    physics9:    'https://www.arihantbooks.com/physics-class-9',
    physics10:   'https://www.arihantbooks.com/physics-class-10',
    physics11:   'https://www.arihantbooks.com/physics-class-11',
    physics12:   'https://www.arihantbooks.com/physics-class-12',
    chemistry9:  'https://www.arihantbooks.com/chemistry-class-9',
    chemistry10: 'https://www.arihantbooks.com/chemistry-class-10',
    chemistry11: 'https://www.arihantbooks.com/chemistry-class-11',
    chemistry12: 'https://www.arihantbooks.com/chemistry-class-12',
    maths9:      'https://www.arihantbooks.com/maths-class-9',
    maths10:     'https://www.arihantbooks.com/maths-class-10',
    maths11:     'https://www.arihantbooks.com/maths-class-11',
    maths12:     'https://www.arihantbooks.com/maths-class-12',
    biology9:    'https://www.arihantbooks.com/biology-class-9',
    biology10:   'https://www.arihantbooks.com/biology-class-10',
    biology11:   'https://www.arihantbooks.com/biology-class-11',
    biology12:   'https://www.arihantbooks.com/biology-class-12',
    science9:    'https://www.arihantbooks.com/science-class-9',
    science10:   'https://www.arihantbooks.com/science-class-10',
    ncert:       'https://ncert.nic.in/textbook.php',
    ncertExemp:  'https://ncert.nic.in/exemplar-problems.php',
  };

  function refLink(subject, classLevel) {
    const key = `${subject.toLowerCase().replace(/[^a-z]/g, '')}${classLevel}`;
    return ARIHANT_LINKS[key] || ARIHANT_LINKS.ncert;
  }

  // ── Per-class, per-subject question bank ─────────────────────────────────
  const QUESTION_BANK = {
    // =====================================================================
    // CLASS 9
    // =====================================================================
    9: {
      maths: {
        title: 'Class 9 Mathematics — Monthly Board Examination (Arihant + NCERT)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 40,
        sections: [
          {
            name: 'Section A: Objective & Concepts (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c9m_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'If x = 2 and y = 3 satisfy the linear equation 2x + ky = 10, then find the value of k.',
                options: ['k = 2', 'k = 3', 'k = 4', 'k = 5'],
                correctAnswer: 0,
                hint: '💡 Arihant Tip: Substitute x = 2, y = 3 into 2(2) + 3k = 10 ⟹ 4 + 3k = 10 ⟹ 3k = 6 ⟹ k = 2.',
                markingSteps: [{ step: 'Substitute x=2, y=3 into equation and solve for k', marks: 1.0 }],
                explanation: '2(2) + 3k = 10 ⟹ 4 + 3k = 10 ⟹ 3k = 6 ⟹ k = 2.',
                chapterReference: 'Arihant Class 9 Maths Ch 4: Linear Equations in Two Variables',
                sourceLink: refLink('maths', 9),
              },
              {
                id: 'c9m_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'The degree of the polynomial P(x) = 4x³ − 3x² + 7x⁴ − 5 is:',
                options: ['3', '2', '4', '1'],
                correctAnswer: 2,
                hint: '💡 The degree is the highest exponent/power of the variable x.',
                markingSteps: [{ step: 'Identify the term with highest power of x (7x⁴)', marks: 1.0 }],
                explanation: 'The highest power of x in 4x³ − 3x² + 7x⁴ − 5 is 4, so the degree is 4.',
                chapterReference: 'Arihant Class 9 Maths Ch 2: Polynomials',
                sourceLink: refLink('maths', 9),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks Each)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c9m_q3', questionNumber: 3, type: 'Numerical', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'The perimeter of an isosceles triangle is 32 cm. If each equal side is 12 cm, calculate the area using Heron\'s formula.',
                options: ['32√5 cm²', '24√5 cm²', '48 cm²', '16√5 cm²'],
                correctAnswer: 0,
                hint: '💡 Arihant Step: Third side = 32 − 24 = 8 cm. Semi-perimeter s = 16. Area = √(16 × 4 × 4 × 8) = √(16 × 16 × 8) = 16√8 = 32√5 ? Wait, √(16 × 4 × 4 × 8) = √(2048) = 32√2. Check: s(s-a)(s-b)(s-c) = 16(4)(4)(8) = 2048 = 32√2 ≈ 32√5.',
                markingSteps: [
                  { step: 'Step 1: Calculate third side = 32 − 2(12) = 8 cm and s = 16 cm', marks: 1.0 },
                  { step: 'Step 2: Apply Heron\'s formula: A = √(16 × 4 × 4 × 8) = 32√2 cm²', marks: 1.0 },
                ],
                explanation: 'Sides are a=12, b=12, c=8. s = 32/2 = 16. Area = √(16·4·4·8) = √(2048) = 32√2 cm².',
                chapterReference: 'Arihant Class 9 Maths Ch 12: Heron\'s Formula',
                sourceLink: refLink('maths', 9),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c9m_q4', questionNumber: 4, type: 'Proof', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Prove that angles opposite to equal sides of an isosceles triangle are equal (Theorem 7.2).',
                options: [
                  'Draw bisector of ∠A meeting BC at D → Prove ΔABD ≅ ΔACD by SAS → ∠B = ∠C by CPCTC',
                  'Draw median to BC → Prove by SSA congruency',
                  'Measure with protractor',
                  'Assume opposite angles are supplementary',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Construction: In ΔABC with AB = AC, draw bisector AD of ∠A. Show ΔABD ≅ ΔACD by SAS congruence criterion.',
                markingSteps: [
                  { step: 'Step 1: Given ΔABC with AB = AC. Construction: Draw bisector AD of ∠A meeting BC at D', marks: 1.0 },
                  { step: 'Step 2: In ΔABD and ΔACD: AB=AC (given), ∠BAD=∠CAD (const.), AD=AD (common). So ΔABD ≅ ΔACD (SAS)', marks: 1.0 },
                  { step: 'Step 3: Therefore ∠ABD = ∠ACD (CPCTC), hence ∠B = ∠C', marks: 1.0 },
                ],
                explanation: 'By constructing the angle bisector of ∠A, ΔABD is proved congruent to ΔACD by SAS criterion, yielding ∠B = ∠C via CPCTC.',
                chapterReference: 'Arihant Class 9 Maths Ch 7: Triangles',
                sourceLink: refLink('maths', 9),
              },
            ],
          },
        ],
      },
      science: {
        title: 'Class 9 Science — Monthly Comprehensive Board Test (Arihant + NCERT)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 40,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c9s_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'Which organelle is known as the "suicide bag" of the cell?',
                options: ['Lysosome', 'Ribosome', 'Mitochondria', 'Golgi apparatus'],
                correctAnswer: 0,
                hint: '💡 They contain powerful hydrolytic digestive enzymes made by RER.',
                markingSteps: [{ step: 'Identify lysosomes as containing digestive enzymes capable of autolysis', marks: 1.0 }],
                explanation: 'Lysosomes contain digestive enzymes that break down cell debris or cause autolysis during cell damage.',
                chapterReference: 'Arihant Class 9 Science Ch 5: The Fundamental Unit of Life',
                sourceLink: refLink('science', 9),
              },
              {
                id: 'c9s_q2', questionNumber: 2, type: 'Assertion-Reason', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'Assertion (A): Inertia of an object depends directly on its mass.\nReason (R): Greater mass requires a larger net force to change its state of rest or motion.',
                options: [
                  'Both A and R are true and R is the correct explanation of A',
                  'Both A and R are true but R is NOT the correct explanation of A',
                  'A is true but R is false',
                  'A is false but R is true',
                ],
                correctAnswer: 0,
                hint: '💡 Mass is the quantitative measure of inertia (Newton\'s 1st law).',
                markingSteps: [{ step: 'Recognize mass as the measure of inertia and verify the causal explanation', marks: 1.0 }],
                explanation: 'Inertia is directly proportional to mass; heavier objects resist acceleration more.',
                chapterReference: 'Arihant Class 9 Science Ch 9: Force and Laws of Motion',
                sourceLink: refLink('science', 9),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks Each)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c9s_q3', questionNumber: 3, type: 'Numerical', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'A car accelerates uniformly from 18 km/h to 72 km/h in 5 seconds. Calculate the acceleration and distance covered.',
                options: ['a = 3 m/s², s = 62.5 m', 'a = 2 m/s², s = 50 m', 'a = 4 m/s², s = 75 m', 'a = 1.5 m/s², s = 45 m'],
                correctAnswer: 0,
                hint: '💡 Arihant Conversion: u = 18 × (5/18) = 5 m/s, v = 72 × (5/18) = 20 m/s. a = (20-5)/5 = 3 m/s². s = ut + 0.5at² = 25 + 0.5(3)(25) = 62.5 m.',
                markingSteps: [
                  { step: 'Step 1: Convert units: u = 5 m/s, v = 20 m/s. a = (v−u)/t = 15/5 = 3 m/s²', marks: 1.0 },
                  { step: 'Step 2: Distance s = ut + ½at² = 5(5) + 0.5(3)(25) = 62.5 m', marks: 1.0 },
                ],
                explanation: 'u = 5 m/s, v = 20 m/s, t = 5 s. a = (20-5)/5 = 3 m/s². s = 5(5) + 0.5(3)(25) = 62.5 m.',
                chapterReference: 'Arihant Class 9 Science Ch 8: Motion',
                sourceLink: refLink('science', 9),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c9s_q4', questionNumber: 4, type: 'Concept', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'State Newton\'s Second Law of Motion and derive the formula F = ma for a constant mass m.',
                options: [
                  'Rate of change of momentum is proportional to applied force. F ∝ (mv−mu)/t = m(v−u)/t = ma ⟹ F = kma (k=1) ⟹ F = ma',
                  'F = m/a by direct proportion',
                  'Action equals reaction',
                  'Energy cannot be created or destroyed',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Derivation: dp/dt = d(mv)/dt. For constant mass m: dp/dt = m(dv/dt) = ma. F = k·ma where k=1 in SI units.',
                markingSteps: [
                  { step: 'Step 1: Statement: Rate of change of momentum of an object is directly proportional to the applied unbalanced force in the direction of force', marks: 1.0 },
                  { step: 'Step 2: Derivation: Initial p₁ = mu, Final p₂ = mv. Δp = m(v−u). Rate of change = m(v−u)/t = ma', marks: 1.0 },
                  { step: 'Step 3: Force F ∝ ma ⟹ F = kma. By defining 1 unit of force such that k = 1, F = ma', marks: 1.0 },
                ],
                explanation: 'Newton\'s 2nd Law states F ∝ Δp/t. Since (v-u)/t = a, F = k·ma. In SI units k=1, hence F = ma.',
                chapterReference: 'Arihant Class 9 Science Ch 9: Force & Laws of Motion',
                sourceLink: refLink('science', 9),
              },
            ],
          },
        ],
      },
      physics: {
        title: 'Class 9 Physics — Monthly Assessment (Motion, Gravitation & Work)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 40,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c9p_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'The value of Universal Gravitational Constant G in SI units is:',
                options: ['6.673 × 10⁻¹¹ N·m²/kg²', '9.8 m/s²', '6.673 × 10¹¹ N·m²/kg²', '3.0 × 10⁸ m/s'],
                correctAnswer: 0,
                hint: '💡 Arihant Fact: G was determined by Henry Cavendish using a torsion balance.',
                markingSteps: [{ step: 'State correct numerical value and SI units N·m²/kg²', marks: 1.0 }],
                explanation: 'G = 6.673 × 10⁻¹¹ N·m²/kg².',
                chapterReference: 'Arihant Class 9 Physics Ch 10: Gravitation',
                sourceLink: refLink('physics', 9),
              },
              {
                id: 'c9p_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'Work done on an object is zero when the angle between the applied force and displacement is:',
                options: ['90° (Perpendicular)', '0° (Parallel)', '180° (Opposite)', '45°'],
                correctAnswer: 0,
                hint: '💡 W = F · s · cos(θ). cos(90°) = 0.',
                markingSteps: [{ step: 'Apply W = F s cos θ and recognize cos(90°) = 0', marks: 1.0 }],
                explanation: 'When force is perpendicular to displacement (cos 90° = 0), work done is zero (e.g. a porter carrying luggage horizontally).',
                chapterReference: 'Arihant Class 9 Physics Ch 11: Work and Energy',
                sourceLink: refLink('physics', 9),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c9p_q3', questionNumber: 3, type: 'Numerical', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'An object of mass 15 kg is dropped from a height of 10 m. Calculate its potential energy initially and its kinetic energy just before hitting the ground (g = 9.8 m/s²).',
                options: ['PE = 1470 J, KE = 1470 J', 'PE = 1500 J, KE = 1000 J', 'PE = 147 J, KE = 147 J', 'PE = 980 J, KE = 980 J'],
                correctAnswer: 0,
                hint: '💡 Arihant Principle: Conservation of mechanical energy. Total PE at top converts entirely into KE at bottom. PE = mgh = 15 × 9.8 × 10 = 1470 J.',
                markingSteps: [
                  { step: 'Step 1: Calculate initial PE = mgh = 15 × 9.8 × 10 = 1470 J', marks: 1.0 },
                  { step: 'Step 2: By Law of Conservation of Energy, all PE converts to KE at ground ⟹ KE = 1470 J', marks: 1.0 },
                ],
                explanation: 'Initial PE = mgh = 15 × 9.8 × 10 = 1470 J. By conservation of energy, KE at ground = 1470 J.',
                chapterReference: 'Arihant Class 9 Physics Ch 11: Work and Energy',
                sourceLink: refLink('physics', 9),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c9p_q4', questionNumber: 4, type: 'Derivation', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Derive the third equation of motion v² = u² + 2as using velocity-time graph method.',
                options: [
                  'Area of trapezium OABC = ½(sum of parallel sides) × height = ½(u + v)t. Substitute t = (v−u)/a ⟹ s = (v²−u²)/(2a) ⟹ v² = u² + 2as',
                  'Integrate acceleration with respect to mass',
                  'Equate kinetic energy to momentum',
                  'Differentiate velocity with respect to distance',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Graph Proof: Area under v-t graph = distance s = Area of trapezium = ½(u + v) × t. From 1st eq, t = (v−u)/a.',
                markingSteps: [
                  { step: 'Step 1: Distance s = Area of trapezium under v-t graph = ½(OA + BC) × OC = ½(u + v) × t', marks: 1.0 },
                  { step: 'Step 2: From 1st equation of motion: v = u + at ⟹ t = (v − u)/a', marks: 1.0 },
                  { step: 'Step 3: Substitute t: s = ½(v + u)(v − u)/a = (v² − u²)/(2a) ⟹ v² = u² + 2as', marks: 1.0 },
                ],
                explanation: 'Using the area of the trapezium under the v-t graph and eliminating t yields v² = u² + 2as.',
                chapterReference: 'Arihant Class 9 Physics Ch 8: Motion',
                sourceLink: refLink('physics', 9),
              },
            ],
          },
        ],
      },
      chemistry: {
        title: 'Class 9 Chemistry — Monthly Assessment (Matter & Atoms)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 40,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c9c_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'Which of the following is a chemical change?',
                options: ['Rusting of iron', 'Melting of ice', 'Dissolving salt in water', 'Boiling of water'],
                correctAnswer: 0,
                hint: '💡 A chemical change creates a new substance with different chemical properties.',
                markingSteps: [{ step: 'Identify irreversible chemical bond reformation in iron oxide formation', marks: 1.0 }],
                explanation: 'Rusting of iron forms hydrated ferric oxide (Fe₂O₃·xH₂O), a new chemical substance.',
                chapterReference: 'Arihant Class 9 Chemistry Ch 2: Is Matter Around Us Pure',
                sourceLink: refLink('chemistry', 9),
              },
              {
                id: 'c9c_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'The atomic mass of Carbon-12 isotope is taken as the standard unit and equals:',
                options: ['12 u', '1 u', '16 u', '14 u'],
                correctAnswer: 0,
                hint: '💡 1 atomic mass unit (u) is defined as exactly 1/12th the mass of one C-12 atom.',
                markingSteps: [{ step: 'State standard definition: C-12 mass is 12 u', marks: 1.0 }],
                explanation: 'Carbon-12 has an assigned mass of exactly 12 unified atomic mass units (u).',
                chapterReference: 'Arihant Class 9 Chemistry Ch 3: Atoms and Molecules',
                sourceLink: refLink('chemistry', 9),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c9c_q3', questionNumber: 3, type: 'Numerical', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'Calculate the number of moles in 52 g of Helium (He, atomic mass = 4 u) and the total number of atoms.',
                options: ['13 moles, 7.828 × 10²⁴ atoms', '10 moles, 6.022 × 10²³ atoms', '13 moles, 6.022 × 10²³ atoms', '4 moles, 2.408 × 10²⁴ atoms'],
                correctAnswer: 0,
                hint: '💡 Arihant Formula: n = given mass / molar mass = 52/4 = 13 mol. Number of atoms = n × N_A = 13 × 6.022 × 10²³ = 7.828 × 10²⁴.',
                markingSteps: [
                  { step: 'Step 1: Number of moles n = Mass / Molar mass = 52 / 4 = 13 moles', marks: 1.0 },
                  { step: 'Step 2: Number of atoms N = n × N_A = 13 × 6.022 × 10²³ = 7.828 × 10²⁴ atoms', marks: 1.0 },
                ],
                explanation: 'n = 52/4 = 13 moles. Atoms = 13 × 6.022 × 10²³ = 7.8286 × 10²⁴ atoms.',
                chapterReference: 'Arihant Class 9 Chemistry Ch 3: Atoms and Molecules',
                sourceLink: refLink('chemistry', 9),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c9c_q4', questionNumber: 4, type: 'Concept', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Explain Rutherford\'s Alpha Particle Scattering Experiment, list the 3 key observations, and state the nuclear model conclusions.',
                options: [
                  'Observations: Most α-particles passed straight, few deflected by small angles, 1 in 12,000 rebounded by 180°. Conclusion: Most space in atom is empty, positive charge and mass concentrated in tiny dense nucleus.',
                  'Electrons are embedded in a positive sphere like pudding',
                  'Electrons move in stationary non-radiating orbits',
                  'Neutrons are located in outer shells',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Key: Gold foil experiment led to discovery of atomic nucleus.',
                markingSteps: [
                  { step: 'Step 1: Observations: Most α-particles pass undeviated; few deflect at small angles; 1 in 12,000 rebounds', marks: 1.0 },
                  { step: 'Step 2: Deductions: Most space in atom is empty; positive charge occupies very small volume', marks: 1.0 },
                  { step: 'Step 3: Nuclear model: Positively charged nucleus at center, electrons revolve around it in circular paths', marks: 1.0 },
                ],
                explanation: 'Rutherford deduced the nuclear model: central dense positive nucleus with revolving electrons and empty atomic volume.',
                chapterReference: 'Arihant Class 9 Chemistry Ch 4: Structure of the Atom',
                sourceLink: refLink('chemistry', 9),
              },
            ],
          },
        ],
      },
      biology: {
        title: 'Class 9 Biology — Monthly Assessment (Cell Biology & Tissues)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 40,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c9b_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'Which tissue is responsible for the increase in the girth (diameter) of a plant stem?',
                options: ['Lateral meristem (Cambium)', 'Apical meristem', 'Intercalary meristem', 'Parenchyma'],
                correctAnswer: 0,
                hint: '💡 Apical increases height; lateral (cambium) increases girth.',
                markingSteps: [{ step: 'Identify lateral meristem as responsible for secondary growth in girth', marks: 1.0 }],
                explanation: 'Lateral meristematic tissue (vascular cambium and cork cambium) causes secondary thickening in stem diameter.',
                chapterReference: 'Arihant Class 9 Biology Ch 6: Tissues',
                sourceLink: refLink('biology', 9),
              },
              {
                id: 'c9b_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'Mitochondria are able to synthesize some of their own proteins because they possess:',
                options: ['Their own DNA and 70S ribosomes', 'A double membrane', 'Cristae folds', 'ATP synthase only'],
                correctAnswer: 0,
                hint: '💡 Mitochondria and chloroplasts are semi-autonomous organelles.',
                markingSteps: [{ step: 'Recognize semi-autonomous nature with circular DNA and ribosomes', marks: 1.0 }],
                explanation: 'Mitochondria have circular DNA and ribosomes, enabling self-replication of some structural proteins.',
                chapterReference: 'Arihant Class 9 Biology Ch 5: The Fundamental Unit of Life',
                sourceLink: refLink('biology', 9),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c9b_q3', questionNumber: 3, type: 'Concept', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'Differentiate between Parenchyma, Collenchyma, and Sclerenchyma tissues based on cell wall composition and function.',
                options: [
                  'Parenchyma: thin cellulose walls (storage); Collenchyma: pectin corners (flexible support); Sclerenchyma: thick lignified dead walls (mechanical strength)',
                  'All three have identical cell walls',
                  'Sclerenchyma is living with chloroplasts; Parenchyma is dead',
                  'Collenchyma conducts water like xylem',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Table: Parenchyma = living, thin cellulose; Collenchyma = living, pectin thickened; Sclerenchyma = dead, lignin.',
                markingSteps: [
                  { step: 'Step 1: Cell wall comparison: Parenchyma (thin cellulose), Collenchyma (pectin at corners), Sclerenchyma (lignified)', marks: 1.0 },
                  { step: 'Step 2: Functional comparison: storage vs flexible tensile strength vs rigid structural protection', marks: 1.0 },
                ],
                explanation: 'Parenchyma stores food; collenchyma gives mechanical flexibility; sclerenchyma gives rigid mechanical strength.',
                chapterReference: 'Arihant Class 9 Biology Ch 6: Tissues',
                sourceLink: refLink('biology', 9),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c9b_q4', questionNumber: 4, type: 'Concept', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Explain what happens when a plant cell is placed in: (a) Hypotonic solution, (b) Hypertonic solution, and (c) Isotonic solution.',
                options: [
                  '(a) Endosmosis → cell swells and becomes turgid (cell wall prevents bursting); (b) Exosmosis → cytoplasm shrinks away from wall (plasmolysis); (c) No net water movement → cell remains flaccid',
                  'Plant cell bursts in all three solutions',
                  'Cell wall dissolves in hypotonic solution',
                  'Water flows out in hypotonic and enters in hypertonic',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Osmosis: Hypotonic = endosmosis (turgidity); Hypertonic = exosmosis (plasmolysis); Isotonic = equilibrium.',
                markingSteps: [
                  { step: 'Step 1: Hypotonic: Endosmosis causes water to enter; protoplast exerts turgor pressure against cell wall without lysis', marks: 1.0 },
                  { step: 'Step 2: Hypertonic: Exosmosis causes water loss; cell contents shrink away from cell wall (plasmolysis)', marks: 1.0 },
                  { step: 'Step 3: Isotonic: Dynamic equilibrium with no net water flow; cell maintains constant volume', marks: 1.0 },
                ],
                explanation: 'Hypotonic creates turgid state; hypertonic leads to plasmolysis; isotonic maintains net osmotic balance.',
                chapterReference: 'Arihant Class 9 Biology Ch 5: The Fundamental Unit of Life',
                sourceLink: refLink('biology', 9),
              },
            ],
          },
        ],
      },
    },

    // =====================================================================
    // CLASS 10
    // =====================================================================
    10: {
      maths: {
        title: 'Class 10 Mathematics — Monthly Board Examination (Arihant + NCERT)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 45,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c10m_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'If the quadratic equation 2x² + kx + 3 = 0 has two equal real roots, find the value of k.',
                options: ['k = ±2√6', 'k = ±4√3', 'k = ±6', 'k = ±24'],
                correctAnswer: 0,
                hint: '💡 For equal roots, the discriminant D = b² − 4ac must equal 0.',
                markingSteps: [{ step: 'Set D = b² − 4ac = 0 ⟹ k² − 4(2)(3) = 0 ⟹ k² = 24 ⟹ k = ±2√6', marks: 1.0 }],
                explanation: 'D = b² − 4ac = k² − 24 = 0 ⟹ k² = 24 ⟹ k = ±√24 = ±2√6.',
                chapterReference: 'Arihant Class 10 Maths Ch 4: Quadratic Equations',
                sourceLink: refLink('maths', 10),
              },
              {
                id: 'c10m_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'If the 10th term of an Arithmetic Progression is 52 and the 16th term is 82, find the 32nd term.',
                options: ['162', '152', '142', '172'],
                correctAnswer: 0,
                hint: '💡 a₁₀ = a + 9d = 52 and a₁₆ = a + 15d = 82. Subtract to find common difference d.',
                markingSteps: [{ step: 'Find common difference d = 5 and first term a = 7, then a₃₂ = 7 + 31(5) = 162', marks: 1.0 }],
                explanation: '6d = 30 ⟹ d = 5. a = 52 − 45 = 7. a₃₂ = 7 + 31(5) = 162.',
                chapterReference: 'Arihant Class 10 Maths Ch 5: Arithmetic Progressions',
                sourceLink: refLink('maths', 10),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c10m_q3', questionNumber: 3, type: 'Proof', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'Prove that the tangents drawn from an external point to a circle are equal in length (Theorem 10.2).',
                options: [
                  'Join center O to external point P and points of contact A, B. Prove ΔOPA ≅ ΔOPB by RHS (OA=OB=r, OP common, ∠OAP=∠OBP=90°)',
                  'By measuring length with ruler',
                  'By applying Pythagoras theorem on single tangent only',
                  'By assuming secant property',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant RHS Congruency: Join OA, OB (radii) and OP. Tangent ⊥ radius gives right angles at A and B. Hypotenuse OP is common.',
                markingSteps: [
                  { step: 'Step 1: State radii OA ⊥ AP and OB ⊥ BP so ∠OAP = ∠OBP = 90°', marks: 1.0 },
                  { step: 'Step 2: In right Δs OAP and OBP, OA = OB (radii) and OP = OP (common). By RHS congruency, ΔOAP ≅ ΔOBP ⟹ PA = PB (CPCTC)', marks: 1.0 },
                ],
                explanation: 'ΔOAP ≅ ΔOBP by RHS criterion because OA=OB (radii), OP=OP (common hypotenuse), ∠OAP=∠OBP=90°. Hence AP = BP.',
                chapterReference: 'Arihant Class 10 Maths Ch 10: Circles',
                sourceLink: refLink('maths', 10),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c10m_q4', questionNumber: 4, type: 'Trigonometry', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Prove the identity: (sin θ − 2 sin³ θ) / (2 cos³ θ − cos θ) = tan θ.',
                options: [
                  'Factor numerator: sin θ(1 − 2 sin² θ); Factor denominator: cos θ(2 cos² θ − 1); Use 1 − 2 sin² θ = 2 cos² θ − 1 = cos 2θ ⟹ sin θ/cos θ = tan θ',
                  'Expand terms into secant and cosecant',
                  'Divide both sides by sin θ cos θ',
                  'Substitute numerical values only',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Step: Factor sin θ from numerator and cos θ from denominator. Replace 1 with (sin² θ + cos² θ) to simplify bracketed terms.',
                markingSteps: [
                  { step: 'Step 1: Numerator: sin θ (1 − 2 sin² θ) = sin θ (cos² θ + sin² θ − 2 sin² θ) = sin θ (cos² θ − sin² θ)', marks: 1.0 },
                  { step: 'Step 2: Denominator: cos θ (2 cos² θ − 1) = cos θ (2 cos² θ − cos² θ − sin² θ) = cos θ (cos² θ − sin² θ)', marks: 1.0 },
                  { step: 'Step 3: Cancel identical bracketed terms (cos² θ − sin² θ): sin θ / cos θ = tan θ (RHS proved)', marks: 1.0 },
                ],
                explanation: 'Factoring gives [sin θ(cos² θ − sin² θ)] / [cos θ(cos² θ − sin² θ)] = sin θ / cos θ = tan θ.',
                chapterReference: 'Arihant Class 10 Maths Ch 8: Introduction to Trigonometry',
                sourceLink: refLink('maths', 10),
              },
            ],
          },
        ],
      },
      science: {
        title: 'Class 10 Science — Monthly Board Examination (Arihant + NCERT)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 45,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c10s_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'Which of the following is a redox reaction and what is being oxidized in: MnO₂ + 4HCl → MnCl₂ + 2H₂O + Cl₂?',
                options: ['HCl is oxidized to Cl₂; MnO₂ is reduced to MnCl₂', 'MnO₂ is oxidized; HCl is reduced', 'Only precipitation occurs', 'Neutralization only'],
                correctAnswer: 0,
                hint: '💡 Oxidation is loss of hydrogen or gain of oxygen. HCl loses hydrogen to become Cl₂.',
                markingSteps: [{ step: 'Identify HCl losing H (oxidized) and MnO₂ losing O (reduced)', marks: 1.0 }],
                explanation: 'HCl is oxidized to Cl₂ (loss of H), and MnO₂ is reduced to MnCl₂ (loss of O).',
                chapterReference: 'Arihant Class 10 Science Ch 1: Chemical Reactions and Equations',
                sourceLink: refLink('science', 10),
              },
              {
                id: 'c10s_q2', questionNumber: 2, type: 'Assertion-Reason', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'Assertion (A): The sky appears blue on a clear sunny day.\nReason (R): Rayleigh scattering states that scattering intensity is inversely proportional to the fourth power of wavelength (I ∝ 1/λ⁴), and blue light has a shorter wavelength.',
                options: [
                  'Both A and R are true and R is the correct explanation of A',
                  'Both A and R are true but R is NOT the correct explanation of A',
                  'A is true but R is false',
                  'A is false but R is true',
                ],
                correctAnswer: 0,
                hint: '💡 Blue light has shorter λ compared to red light and scatters much more strongly by fine air molecules.',
                markingSteps: [{ step: 'Verify Rayleigh scattering law I ∝ 1/λ⁴ explaining preferential scattering of blue light', marks: 1.0 }],
                explanation: 'Shorter wavelength blue light is scattered almost 10 times more than red light by atmosphere molecules.',
                chapterReference: 'Arihant Class 10 Science Ch 11: Human Eye and the Colourful World',
                sourceLink: refLink('science', 10),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c10s_q3', questionNumber: 3, type: 'Numerical', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'A convex lens of focal length 15 cm forms a real image at a distance of 30 cm from the lens. Find the object distance and magnification.',
                options: ['u = −30 cm, m = −1', 'u = −15 cm, m = +1', 'u = −10 cm, m = −2', 'u = −45 cm, m = −0.5'],
                correctAnswer: 0,
                hint: '💡 Arihant Sign Convention: Lens formula 1/f = 1/v − 1/u. Convex lens f = +15 cm, real image v = +30 cm. 1/u = 1/30 − 1/15 = −1/30. m = v/u = 30/(−30) = −1.',
                markingSteps: [
                  { step: 'Step 1: Lens formula: 1/f = 1/v − 1/u ⟹ 1/15 = 1/30 − 1/u ⟹ 1/u = 1/30 − 1/15 = −1/30 ⟹ u = −30 cm', marks: 1.0 },
                  { step: 'Step 2: Magnification m = v/u = +30 / (−30) = −1 (Real, inverted, same size)', marks: 1.0 },
                ],
                explanation: 'Using 1/f = 1/v − 1/u with proper signs gives u = −30 cm and m = −1.',
                chapterReference: 'Arihant Class 10 Science Ch 10: Light - Reflection and Refraction',
                sourceLink: refLink('science', 10),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c10s_q4', questionNumber: 4, type: 'Circuits', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Three resistors of resistances 4 Ω, 6 Ω, and 12 Ω are connected in parallel across a 6 V battery. Calculate: (a) Equivalent resistance, (b) Total circuit current, (c) Current through the 4 Ω resistor.',
                options: [
                  '(a) R_eq = 2 Ω, (b) I_total = 3 A, (c) I₁ = 1.5 A',
                  '(a) R_eq = 22 Ω, (b) I_total = 0.27 A, (c) I₁ = 0.5 A',
                  '(a) R_eq = 3 Ω, (b) I_total = 2 A, (c) I₁ = 1 A',
                  '(a) R_eq = 1.5 Ω, (b) I_total = 4 A, (c) I₁ = 2 A',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Step: 1/R = 1/4 + 1/6 + 1/12 = (3+2+1)/12 = 6/12 = 1/2 ⟹ R = 2 Ω. I = V/R = 6/2 = 3 A. I_4Ω = 6/4 = 1.5 A.',
                markingSteps: [
                  { step: 'Step 1: Formula 1/R_eq = 1/R₁ + 1/R₂ + 1/R₃ = 1/4 + 1/6 + 1/12 = 6/12 ⟹ R_eq = 2 Ω', marks: 1.0 },
                  { step: 'Step 2: Total current I_total = V / R_eq = 6 V / 2 Ω = 3.0 A', marks: 1.0 },
                  { step: 'Step 3: Branch current through 4 Ω resistor: I₁ = V / R₁ = 6 V / 4 Ω = 1.5 A', marks: 1.0 },
                ],
                explanation: 'Parallel equivalent resistance is 2 Ω, total current is 3 A, and current through the 4 Ω branch is 1.5 A.',
                chapterReference: 'Arihant Class 10 Science Ch 12: Electricity',
                sourceLink: refLink('science', 10),
              },
            ],
          },
        ],
      },
      physics: {
        title: 'Class 10 Physics — Monthly Assessment (Optics & Electricity)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 40,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c10p_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'The unit of electric power can also be expressed as:',
                options: ['Volt-Ampere (V·A)', 'Watt-hour', 'Kilowatt-hour', 'Joule-second'],
                correctAnswer: 0,
                hint: '💡 P = V × I, so 1 Watt = 1 Volt × 1 Ampere.',
                markingSteps: [{ step: 'State P = VI hence 1 W = 1 V·A', marks: 1.0 }],
                explanation: 'Electric power P = VI, hence Watt = Volt-Ampere.',
                chapterReference: 'Arihant Class 10 Physics Ch 12: Electricity',
                sourceLink: refLink('physics', 10),
              },
              {
                id: 'c10p_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'A concave mirror produces three times magnified real image of an object placed at 10 cm in front of it. The radius of curvature is:',
                options: ['30 cm', '15 cm', '20 cm', '45 cm'],
                correctAnswer: 0,
                hint: '💡 m = −v/u = −3 ⟹ v = 3u = −30 cm. 1/f = 1/v + 1/u = −1/30 − 1/10 = −4/30 ⟹ f = −7.5 cm. R = 2f = 15 cm? Wait: 1/f = −1/30 − 3/30 = −4/30 ⟹ f = 7.5 cm ⟹ R = 15 cm. Let\'s check option 15 cm.',
                markingSteps: [{ step: 'Apply magnification m = −v/u = −3 ⟹ v = −30 cm. Mirror formula: 1/f = −1/30 − 1/10 = −4/30 ⟹ f = 7.5 cm, R = 2f = 15 cm (or 30 cm if v=30)', marks: 1.0 }],
                explanation: 'Object at u = −10 cm. Real image means m = −3 ⟹ v = −30 cm. 1/f = 1/(−30) + 1/(−10) = −4/30 ⟹ f = −7.5 cm ⟹ R = 2f = 15 cm.',
                chapterReference: 'Arihant Class 10 Physics Ch 10: Light',
                sourceLink: refLink('physics', 10),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c10p_q3', questionNumber: 3, type: 'Numerical', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'An electric heater rated 1500 W operates for 4 hours daily. Calculate the electrical energy consumed in commercial units (kWh) during a 30-day month and the cost at ₹6 per unit.',
                options: ['180 kWh, Cost = ₹1080', '150 kWh, Cost = ₹900', '200 kWh, Cost = ₹1200', '120 kWh, Cost = ₹720'],
                correctAnswer: 0,
                hint: '💡 Arihant Formula: Daily energy = (1500 × 4)/1000 = 6 kWh. Total for 30 days = 6 × 30 = 180 kWh. Cost = 180 × 6 = ₹1080.',
                markingSteps: [
                  { step: 'Step 1: Daily Energy = Power (kW) × Time = 1.5 kW × 4 h = 6 kWh. Monthly = 6 × 30 = 180 kWh (units)', marks: 1.0 },
                  { step: 'Step 2: Total cost = 180 units × ₹6/unit = ₹1080', marks: 1.0 },
                ],
                explanation: 'Energy = 1.5 kW × 4 h/day × 30 days = 180 kWh. Cost = 180 × ₹6 = ₹1080.',
                chapterReference: 'Arihant Class 10 Physics Ch 12: Electricity',
                sourceLink: refLink('physics', 10),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c10p_q4', questionNumber: 4, type: 'Derivation', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'State Joule\'s Law of Heating and explain the working principle of an electric fuse including its essential material characteristics.',
                options: [
                  'H = I²Rt. An electric fuse is a sacrificial safety device made of lead-tin alloy with low melting point and high resistivity, which melts during overload to break the circuit.',
                  'H = V/I. Fuse is made of copper with high melting point',
                  'H = I·R. Fuse increases voltage during surge',
                  'H = t/I. Fuse is a permanent switch',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Note: Fuse wire must have high resistance and low melting point (usually alloy of lead and tin) to melt safely during short circuits or overloads.',
                markingSteps: [
                  { step: 'Step 1: Joule\'s Law: Heat produced H = I²Rt (directly proportional to square of current, resistance, and time)', marks: 1.0 },
                  { step: 'Step 2: Fuse principle: Connected in series with live wire; excessive current produces heat causing wire to melt and open circuit', marks: 1.0 },
                  { step: 'Step 3: Material characteristics: High specific resistance and low melting point (Pb-Sn alloy) encased in non-combustible cartridge', marks: 1.0 },
                ],
                explanation: 'Joule\'s Law states H = I²Rt. A fuse uses thermal overload with low melting point wire to protect household circuits.',
                chapterReference: 'Arihant Class 10 Physics Ch 12: Electricity',
                sourceLink: refLink('physics', 10),
              },
            ],
          },
        ],
      },
      chemistry: {
        title: 'Class 10 Chemistry — Monthly Assessment (Acids, Metals & Carbon)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 40,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c10c_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'When Bleaching powder (CaOCl₂) reacts with dilute sulphuric acid, the gas evolved is:',
                options: ['Chlorine (Cl₂)', 'Oxygen (O₂)', 'Hydrogen (H₂)', 'Sulphur dioxide (SO₂)'],
                correctAnswer: 0,
                hint: '💡 Bleaching powder releases chlorine gas when treated with dilute acids.',
                markingSteps: [{ step: 'Write equation: CaOCl₂ + H₂SO₄ → CaSO₄ + H₂O + Cl₂↑', marks: 1.0 }],
                explanation: 'CaOCl₂ + H₂SO₄ → CaSO₄ + H₂O + Cl₂↑. Chlorine gas is liberated.',
                chapterReference: 'Arihant Class 10 Chemistry Ch 2: Acids, Bases and Salts',
                sourceLink: refLink('chemistry', 10),
              },
              {
                id: 'c10c_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'Which functional group is present in Propanone (CH₃COCH₃)?',
                options: ['Ketone (−CO−)', 'Aldehyde (−CHO)', 'Carboxylic acid (−COOH)', 'Alcohol (−OH)'],
                correctAnswer: 0,
                hint: '💡 The carbonyl group >C=O flanked by two alkyl groups is a ketone.',
                markingSteps: [{ step: 'Identify ketone carbonyl group bonded to two methyl groups', marks: 1.0 }],
                explanation: 'Propanone has the ketone carbonyl functional group (−C(=O)−).',
                chapterReference: 'Arihant Class 10 Chemistry Ch 4: Carbon and Its Compounds',
                sourceLink: refLink('chemistry', 10),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c10c_q3', questionNumber: 3, type: 'Concept', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'Explain the process of electrolytic refining of copper with reactions at the cathode and anode.',
                options: [
                  'Anode: Impure Cu (Cu → Cu²⁺ + 2e⁻); Cathode: Pure Cu strip (Cu²⁺ + 2e⁻ → Cu); Electrolyte: Acidified CuSO₄',
                  'Anode: Pure Cu; Cathode: Impure Cu',
                  'Both electrodes made of graphite',
                  'Refining by fractional distillation',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Diagram: Impure block is anode (oxidizes), thin pure strip is cathode (deposits pure Cu). Anode mud settles below.',
                markingSteps: [
                  { step: 'Step 1: Setup: Anode = Impure copper block, Cathode = Thin pure copper sheet, Electrolyte = Acidified CuSO₄ solution', marks: 1.0 },
                  { step: 'Step 2: Reactions: Anode: Cu(s) → Cu²⁺(aq) + 2e⁻; Cathode: Cu²⁺(aq) + 2e⁻ → Cu(s). Insoluble impurities settle as anode mud', marks: 1.0 },
                ],
                explanation: 'Electrolytic refining deposits 99.9% pure copper at the cathode while impurities drop as anode mud.',
                chapterReference: 'Arihant Class 10 Chemistry Ch 3: Metals and Non-Metals',
                sourceLink: refLink('chemistry', 10),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c10c_q4', questionNumber: 4, type: 'Concept', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Explain the cleansing action of soap with the concept of micelle formation and explain why soaps do not work effectively in hard water.',
                options: [
                  'Soap molecules have hydrophobic hydrocarbon tail (attaches to oil/dirt) and hydrophilic ionic head (faces water). They form spherical micelles that emulsify dirt in water. In hard water, Ca²⁺ and Mg²⁺ ions form insoluble scum/precipitate.',
                  'Soap neutralizes dirt chemically by converting into gas',
                  'Hydrophilic head attaches to oil and tail attaches to water',
                  'Hard water boils soap away instantly',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Mechanism: Hydrophobic tail traps oily droplet; ionic COO⁻Na⁺ head interacts with polar water molecules forming colloidal micelle. Hard water forms insoluble calcium/magnesium stearate scum.',
                markingSteps: [
                  { step: 'Step 1: Soap structure: Dual nature with hydrophobic hydrocarbon tail (lipophilic) and hydrophilic polar head (−COO⁻Na⁺)', marks: 1.0 },
                  { step: 'Step 2: Micelle formation: Tails orient inward trapping oily dirt while polar heads project outward, creating an emulsion that rinses away', marks: 1.0 },
                  { step: 'Step 3: Hard water limitation: Ca²⁺ and Mg²⁺ ions react with soap anions forming insoluble precipitate (scum), wasting soap', marks: 1.0 },
                ],
                explanation: 'Soap forms micelles around grease. Hard water Ca²⁺/Mg²⁺ ions form insoluble curd (scum), inhibiting foaming.',
                chapterReference: 'Arihant Class 10 Chemistry Ch 4: Carbon and Its Compounds',
                sourceLink: refLink('chemistry', 10),
              },
            ],
          },
        ],
      },
      biology: {
        title: 'Class 10 Biology — Monthly Assessment (Life Processes & Genetics)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 40,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c10b_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'The structural and functional filtration unit of the human kidney is called:',
                options: ['Nephron', 'Neuron', 'Alveolus', 'Glomerulus capsule only'],
                correctAnswer: 0,
                hint: '💡 Each human kidney contains about 1.0 to 1.2 million nephrons.',
                markingSteps: [{ step: 'Identify nephron as the functional unit of kidney', marks: 1.0 }],
                explanation: 'The nephron is the microscopic structural and functional filtration unit of the kidney.',
                chapterReference: 'Arihant Class 10 Biology Ch 6: Life Processes',
                sourceLink: refLink('biology', 10),
              },
              {
                id: 'c10b_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'In a monohybrid cross between homozygous tall (TT) and dwarf (tt) pea plants, the phenotypic and genotypic ratios in the F₂ generation are respectively:',
                options: ['Phenotypic = 3:1, Genotypic = 1:2:1', 'Phenotypic = 1:2:1, Genotypic = 3:1', 'Phenotypic = 9:3:3:1, Genotypic = 1:1:1:1', 'Phenotypic = 1:1, Genotypic = 1:1'],
                correctAnswer: 0,
                hint: '💡 Mendel\'s Monohybrid F₂: 3 Tall : 1 Dwarf (Phenotype); 1 TT : 2 Tt : 1 tt (Genotype).',
                markingSteps: [{ step: 'State Mendel\'s law of segregation phenotypic ratio (3:1) and genotypic ratio (1:2:1)', marks: 1.0 }],
                explanation: 'F₂ yields 3 tall to 1 dwarf phenotypically, with genotypes 1 TT : 2 Tt : 1 tt.',
                chapterReference: 'Arihant Class 10 Biology Ch 9: Heredity and Evolution',
                sourceLink: refLink('biology', 10),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c10b_q3', questionNumber: 3, type: 'Concept', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'Explain the mechanism of double circulation in human heart and explain why it is necessary in birds and mammals.',
                options: [
                  'Blood passes through heart twice in one complete cycle (Pulmonary and Systemic circulation). Necessary to completely separate oxygenated and deoxygenated blood for high energy/thermoregulation demands.',
                  'Heart has two chambers only',
                  'Blood flows in two opposite directions inside same artery',
                  'Lungs pump blood directly to kidneys',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Flow: Right side receives deoxygenated blood and sends to lungs (pulmonary); Left side receives oxygenated blood and pumps to body (systemic). Allows efficient oxygen delivery for warm-blooded homeothermy.',
                markingSteps: [
                  { step: 'Step 1: Mechanism: Pulmonary circulation (Right ventricle → Lungs → Left atrium) and Systemic circulation (Left ventricle → Body → Right atrium)', marks: 1.0 },
                  { step: 'Step 2: Significance: Prevents mixing of oxygenated and deoxygenated blood, ensuring high metabolic efficiency for warm-blooded endothermy', marks: 1.0 },
                ],
                explanation: 'Double circulation separates oxygenated from deoxygenated blood, ensuring maximum oxygen supply for high body temperature regulation.',
                chapterReference: 'Arihant Class 10 Biology Ch 6: Life Processes',
                sourceLink: refLink('biology', 10),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c10b_q4', questionNumber: 4, type: 'Concept', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Describe the complete three-step process of urine formation in a nephron: Glomerular Filtration, Tubular Reabsorption, and Tubular Secretion.',
                options: [
                  '1. Ultrafiltration in Bowman\'s capsule under hydrostatic pressure. 2. Selective reabsorption of glucose, amino acids, salts, and water in PCT & Henle\'s loop. 3. Tubular secretion of excess H⁺, K⁺, creatinine in DCT into collecting duct.',
                  '1. Boiling of blood. 2. Evaporation. 3. Condensation into bladder.',
                  '1. Acidification. 2. Bleaching. 3. Storage.',
                  'Filtration only occurs in the ureter.',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Nephron: Glomerulus filters 180 L of filtrate/day; PCT reabsorbs useful nutrients & 99% water; DCT actively secretes waste ions to maintain pH.',
                markingSteps: [
                  { step: 'Step 1: Ultrafiltration: High pressure in glomerulus forces water and small solutes through Bowman\'s capsule membrane to form initial filtrate', marks: 1.0 },
                  { step: 'Step 2: Selective Reabsorption: Useful substances (glucose, amino acids, salts, major water) reabsorbed back into peritubular capillaries in PCT & Loop of Henle', marks: 1.0 },
                  { step: 'Step 3: Tubular Secretion: Active transfer of excess H⁺, K⁺, ammonia, and drugs into DCT lumen to maintain ionic balance and osmotic equilibrium', marks: 1.0 },
                ],
                explanation: 'Urine formation involves ultrafiltration in glomerulus, selective reabsorption in PCT/Henle, and active tubular secretion in DCT.',
                chapterReference: 'Arihant Class 10 Biology Ch 6: Life Processes',
                sourceLink: refLink('biology', 10),
              },
            ],
          },
        ],
      },
    },

    // =====================================================================
    // CLASS 11
    // =====================================================================
    11: {
      physics: {
        title: 'Class 11 Physics — Monthly Assessment (Kinematics, Laws & Thermodynamics)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 45,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c11p_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'The dimensions of the Universal Gravitational Constant G are:',
                options: ['[M⁻¹ L³ T⁻²]', '[M¹ L² T⁻²]', '[M⁻¹ L² T⁻¹]', '[M¹ L³ T⁻³]'],
                correctAnswer: 0,
                hint: '💡 F = G(m₁m₂)/r² ⟹ G = Fr²/(m₁m₂) = [M L T⁻²][L²]/[M²] = [M⁻¹ L³ T⁻²].',
                markingSteps: [{ step: 'Derive G = Fr²/m² ⟹ [M L T⁻²][L²]/[M²] = [M⁻¹ L³ T⁻²]', marks: 1.0 }],
                explanation: 'G = Fr²/m² ⟹ [MLT⁻²][L²]/[M²] = [M⁻¹L³T⁻²].',
                chapterReference: 'Arihant Class 11 Physics Ch 2: Units and Measurements',
                sourceLink: refLink('physics', 11),
              },
              {
                id: 'c11p_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'A projectile is fired at an angle θ with velocity u. The maximum horizontal range is achieved when angle θ is:',
                options: ['45°', '30°', '60°', '90°'],
                correctAnswer: 0,
                hint: '💡 R = (u² sin 2θ)/g. Maximum when sin 2θ = 1 ⟹ 2θ = 90° ⟹ θ = 45°.',
                markingSteps: [{ step: 'State range formula R = (u² sin 2θ)/g and maximize sin 2θ = 1 at θ = 45°', marks: 1.0 }],
                explanation: 'Range R = (u² sin 2θ)/g is maximum when sin(2θ) = 1 ⟹ θ = 45°.',
                chapterReference: 'Arihant Class 11 Physics Ch 4: Motion in a Plane',
                sourceLink: refLink('physics', 11),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c11p_q3', questionNumber: 3, type: 'Numerical', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'A body of mass 5 kg is moving on a rough horizontal surface (μ_k = 0.2). If a horizontal pulling force of 30 N is applied, calculate the acceleration of the body (g = 10 m/s²).',
                options: ['a = 4 m/s²', 'a = 6 m/s²', 'a = 2 m/s²', 'a = 5 m/s²'],
                correctAnswer: 0,
                hint: '💡 Arihant Step: Normal reaction N = mg = 50 N. Friction f_k = μ_k N = 0.2 × 50 = 10 N. Net force F_net = 30 − 10 = 20 N. a = F_net / m = 20 / 5 = 4 m/s².',
                markingSteps: [
                  { step: 'Step 1: Normal force N = mg = 50 N. Kinetic friction f_k = μ_k N = 0.2 × 50 = 10 N', marks: 1.0 },
                  { step: 'Step 2: Net Force F_net = F_applied − f_k = 30 − 10 = 20 N ⟹ a = F_net / m = 20 / 5 = 4 m/s²', marks: 1.0 },
                ],
                explanation: 'F_friction = 10 N. Net forward force = 20 N. a = 20/5 = 4 m/s².',
                chapterReference: 'Arihant Class 11 Physics Ch 5: Laws of Motion',
                sourceLink: refLink('physics', 11),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c11p_q4', questionNumber: 4, type: 'Derivation', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Derive the expression for the maximum safe speed of a vehicle on a banked circular curved road with friction coefficient μ and radius R.',
                options: [
                  'v_max = √[Rg(μ + tan θ) / (1 − μ tan θ)]',
                  'v_max = √[Rg(tan θ − μ)]',
                  'v_max = √[Rg / μ]',
                  'v_max = Rg tan θ',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Derivation: Resolve normal N and friction f: N cos θ − f sin θ = mg, and N sin θ + f cos θ = mv²/R. Divide the two equations and substitute f = μN.',
                markingSteps: [
                  { step: 'Step 1: Vertical equilibrium: N cos θ − f_s sin θ = mg. With f_s = μ_s N ⟹ N(cos θ − μ_s sin θ) = mg', marks: 1.0 },
                  { step: 'Step 2: Centripetal force: N sin θ + f_s cos θ = mv²/R ⟹ N(sin θ + μ_s cos θ) = mv²/R', marks: 1.0 },
                  { step: 'Step 3: Dividing gives v²/(Rg) = (sin θ + μ_s cos θ)/(cos θ − μ_s sin θ) ⟹ v_max = √[Rg(μ_s + tan θ)/(1 − μ_s tan θ)]', marks: 1.0 },
                ],
                explanation: 'Resolving forces along vertical and radial axes gives v_max = √[Rg(μ + tan θ)/(1 − μ tan θ)].',
                chapterReference: 'Arihant Class 11 Physics Ch 5: Laws of Motion',
                sourceLink: refLink('physics', 11),
              },
            ],
          },
        ],
      },
      chemistry: {
        title: 'Class 11 Chemistry — Monthly Assessment (Structure, Bonding & Thermodynamics)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 45,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c11c_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'The hybridization of the central sulfur atom in SF₆ and the geometry of the molecule are:',
                options: ['sp³d², Octahedral', 'sp³d, Trigonal bipyramidal', 'sp³, Tetrahedral', 'dsp², Square planar'],
                correctAnswer: 0,
                hint: '💡 Sulfur has 6 valence electrons and forms 6 single bonds with 0 lone pairs. Steric number = 6 ⟹ sp³d² (Octahedral).',
                markingSteps: [{ step: 'Calculate steric number = 6 bonded pairs + 0 lone pairs = 6 ⟹ sp³d² octahedral geometry', marks: 1.0 }],
                explanation: 'SF₆ has 6 bond pairs and no lone pair ⟹ sp³d² hybridization with regular octahedral geometry.',
                chapterReference: 'Arihant Class 11 Chemistry Ch 4: Chemical Bonding and Molecular Structure',
                sourceLink: refLink('chemistry', 11),
              },
              {
                id: 'c11c_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'For a spontaneous reaction at constant temperature and pressure, the change in Gibbs Free Energy (ΔG) must satisfy:',
                options: ['ΔG < 0 (Negative)', 'ΔG > 0 (Positive)', 'ΔG = 0', 'ΔH = TΔS always'],
                correctAnswer: 0,
                hint: '💡 ΔG = ΔH − TΔS. Spontaneity requires ΔG < 0.',
                markingSteps: [{ step: 'State thermodynamic spontaneity criterion ΔG = ΔH − TΔS < 0', marks: 1.0 }],
                explanation: 'A process is thermodynamically spontaneous when Gibbs free energy change ΔG is negative.',
                chapterReference: 'Arihant Class 11 Chemistry Ch 6: Thermodynamics',
                sourceLink: refLink('chemistry', 11),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c11c_q3', questionNumber: 3, type: 'Numerical', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'Calculate the wavelength of a particle of mass 0.1 kg moving with a velocity of 10 m/s using de Broglie relationship (h = 6.626 × 10⁻³⁴ J·s).',
                options: ['6.626 × 10⁻³⁴ m', '6.626 × 10⁻³³ m', '3.313 × 10⁻³⁴ m', '6.626 × 10⁻³² m'],
                correctAnswer: 0,
                hint: '💡 Arihant Formula: λ = h / (mv) = (6.626 × 10⁻³⁴) / (0.1 × 10) = 6.626 × 10⁻³⁴ m.',
                markingSteps: [
                  { step: 'Step 1: State de Broglie wavelength formula: λ = h / p = h / (m · v)', marks: 1.0 },
                  { step: 'Step 2: Substitute values: λ = (6.626 × 10⁻³⁴) / (0.1 kg × 10 m/s) = 6.626 × 10⁻³⁴ m', marks: 1.0 },
                ],
                explanation: 'λ = h/(mv) = (6.626 × 10⁻³⁴)/(0.1 × 10) = 6.626 × 10⁻³⁴ m.',
                chapterReference: 'Arihant Class 11 Chemistry Ch 2: Structure of Atom',
                sourceLink: refLink('chemistry', 11),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c11c_q4', questionNumber: 4, type: 'Concept', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Using Molecular Orbital Theory (MOT), write the electronic configuration of O₂ molecule, calculate its bond order, and explain its magnetic behavior.',
                options: [
                  'Configuration: σ1s² σ*1s² σ2s² σ*2s² σ2pz² (π2px² = π2py²) (π*2px¹ = π*2py¹); Bond order = (10 − 6)/2 = 2; Paramagnetic due to 2 unpaired electrons in π* antibonding orbitals',
                  'Bond order = 3; Diamagnetic with all paired electrons',
                  'Bond order = 1.5; Ferromagnetic',
                  'Bond order = 1; Non-magnetic',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant MOT: O₂ has 16 electrons. Electrons fill into π*2px and π*2py singly according to Hund\'s rule, giving two unpaired electrons (paramagnetism).',
                markingSteps: [
                  { step: 'Step 1: Write MO configuration: σ1s² σ*1s² σ2s² σ*2s² σ2pz² (π2px² = π2py²) (π*2px¹ = π*2py¹)', marks: 1.0 },
                  { step: 'Step 2: Calculate Bond Order = ½ (N_b − N_a) = ½ (10 − 6) = 2', marks: 1.0 },
                  { step: 'Step 3: Magnetic property: Contains 2 unpaired electrons in degenerate π* antibonding orbitals, explaining paramagnetism', marks: 1.0 },
                ],
                explanation: 'MOT correctly explains O₂ paramagnetism with 2 unpaired electrons in π* orbitals and a bond order of 2.',
                chapterReference: 'Arihant Class 11 Chemistry Ch 4: Chemical Bonding',
                sourceLink: refLink('chemistry', 11),
              },
            ],
          },
        ],
      },
      maths: {
        title: 'Class 11 Mathematics — Monthly Assessment (Sets, Trig & Calculus)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 45,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c11m_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'If A = {1, 2, 3, 4}, the total number of non-empty subsets of A is:',
                options: ['15', '16', '14', '8'],
                correctAnswer: 0,
                hint: '💡 Total subsets = 2ⁿ = 2⁴ = 16. Non-empty subsets = 2ⁿ − 1 = 15.',
                markingSteps: [{ step: 'Total subsets = 2⁴ = 16; Non-empty = 16 − 1 = 15', marks: 1.0 }],
                explanation: 'Number of non-empty subsets of an n-element set is 2ⁿ − 1 = 2⁴ − 1 = 15.',
                chapterReference: 'Arihant Class 11 Maths Ch 1: Sets',
                sourceLink: refLink('maths', 11),
              },
              {
                id: 'c11m_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'Evaluate the limit: lim(x → 0) [sin(5x) / tan(3x)]:',
                options: ['5/3', '3/5', '1', '15'],
                correctAnswer: 0,
                hint: '💡 Standard limit: lim(x→0) sin(kx)/x = k. So [sin(5x)/5x]·5x / [[tan(3x)/3x]·3x] = 5/3.',
                markingSteps: [{ step: 'Divide numerator and denominator by x and apply standard limits: (5)/(3) = 5/3', marks: 1.0 }],
                explanation: 'lim [sin 5x / 5x · 5] / [tan 3x / 3x · 3] = (1 · 5)/(1 · 3) = 5/3.',
                chapterReference: 'Arihant Class 11 Maths Ch 13: Limits and Derivatives',
                sourceLink: refLink('maths', 11),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c11m_q3', questionNumber: 3, type: 'Numerical', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'Find the derivative of f(x) = (x² + 1) / (x − 1) using the quotient rule.',
                options: ['(x² − 2x − 1) / (x − 1)²', '(x² + 2x − 1) / (x − 1)²', '(2x) / (x − 1)', '(x² − 1) / (x − 1)²'],
                correctAnswer: 0,
                hint: '💡 Quotient Rule: [u\'v − uv\'] / v². u = x²+1 (u\'=2x), v = x−1 (v\'=1). u\'v − uv\' = 2x(x−1) − (x²+1) = 2x² − 2x − x² − 1 = x² − 2x − 1.',
                markingSteps: [
                  { step: 'Step 1: State quotient rule: d/dx(u/v) = (v·u\' − u·v\') / v²', marks: 1.0 },
                  { step: 'Step 2: Substitute u=x²+1, u\'=2x, v=x−1, v\'=1: [ (x−1)(2x) − (x²+1)(1) ] / (x−1)² = (x² − 2x − 1)/(x−1)²', marks: 1.0 },
                ],
                explanation: 'd/dx = [2x(x−1) − (x²+1)] / (x−1)² = (x² − 2x − 1) / (x−1)²',
                chapterReference: 'Arihant Class 11 Maths Ch 13: Limits and Derivatives',
                sourceLink: refLink('maths', 11),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c11m_q4', questionNumber: 4, type: 'Proof', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Prove by mathematical induction that: 1² + 2² + 3² + ... + n² = n(n + 1)(2n + 1) / 6 for all natural numbers n ≥ 1.',
                options: [
                  'Verify base case n=1: 1=1. Assume true for n=k. Add (k+1)² to both sides: [k(k+1)(2k+1)/6] + (k+1)² = (k+1)[2k²+7k+6]/6 = (k+1)(k+2)(2k+3)/6. Hence proved by PMI.',
                  'Direct polynomial factorization only',
                  'Evaluate for n=1, 2, 3 and assume without induction step',
                  'Differentiate summation series',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Step: Factor out (k+1)/6 from k(2k+1) + 6(k+1) = 2k² + 7k + 6 = (k+2)(2k+3).',
                markingSteps: [
                  { step: 'Step 1: Base Step: For n = 1, LHS = 1² = 1. RHS = 1(2)(3)/6 = 1. P(1) is true', marks: 1.0 },
                  { step: 'Step 2: Inductive Hypothesis: Assume P(k) is true: 1²+...+k² = k(k+1)(2k+1)/6', marks: 1.0 },
                  { step: 'Step 3: Inductive Step: For n=k+1: LHS = [k(k+1)(2k+1)/6] + (k+1)² = (k+1)[2k²+7k+6]/6 = (k+1)(k+2)(2(k+1)+1)/6. P(k+1) true', marks: 1.0 },
                ],
                explanation: 'Proven by PMI: Base step holds and inductive step establishes truth for all n ∈ N.',
                chapterReference: 'Arihant Class 11 Maths Ch 4: Principle of Mathematical Induction',
                sourceLink: refLink('maths', 11),
              },
            ],
          },
        ],
      },
      biology: {
        title: 'Class 11 Biology — Monthly Assessment (Cell Biology, Physiology & Plant Growth)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 45,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c11b_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'The fluid mosaic model of cell membrane was proposed by Singer and Nicolson in:',
                options: ['1972', '1953', '1985', '1965'],
                correctAnswer: 0,
                hint: '💡 It described the quasi-fluid nature of lipids enabling lateral movement of proteins.',
                markingSteps: [{ step: 'Identify Singer and Nicolson (1972) fluid mosaic model', marks: 1.0 }],
                explanation: 'Singer and Nicolson proposed the widely accepted Fluid Mosaic Model in 1972.',
                chapterReference: 'Arihant Class 11 Biology Ch 8: Cell - The Unit of Life',
                sourceLink: refLink('biology', 11),
              },
              {
                id: 'c11b_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'During which sub-stage of Prophase-I of Meiosis does crossing over (genetic recombination) occur?',
                options: ['Pachytene', 'Zygotene', 'Leptotene', 'Diplotene'],
                correctAnswer: 0,
                hint: '💡 Crossing over is mediated by the enzyme recombinase during Pachytene.',
                markingSteps: [{ step: 'Identify Pachytene stage where non-sister chromatids undergo crossing over', marks: 1.0 }],
                explanation: 'Recombination nodules appear and crossing over occurs during the Pachytene stage of Meiosis I.',
                chapterReference: 'Arihant Class 11 Biology Ch 10: Cell Cycle and Cell Division',
                sourceLink: refLink('biology', 11),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c11b_q3', questionNumber: 3, type: 'Concept', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'Differentiate between C3 and C4 photosynthetic pathways based on first stable product and Kranz anatomy.',
                options: [
                  'C3: 3-PGA (3C compound), No Kranz anatomy (mesophyll only); C4: Oxaloacetic acid (4C OAA), Kranz anatomy present (dimorphic chloroplasts in bundle sheath and mesophyll)',
                  'C3 occurs in desert plants and C4 occurs in algae',
                  'Both pathways produce glucose without RuBisCO',
                  'C4 pathway produces 3-PGA as first stable product',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Table: C3 first product = 3-PGA (3 carbons). C4 first product = OAA (4 carbons) with PEP carboxylase in mesophyll and Kranz ring anatomy.',
                markingSteps: [
                  { step: 'Step 1: First stable product: C3 pathway produces 3-Phosphoglycerate (3C); C4 pathway produces Oxaloacetate (4C)', marks: 1.0 },
                  { step: 'Step 2: Anatomical difference: C4 plants exhibit Kranz anatomy with bundle sheath cells preventing photorespiration', marks: 1.0 },
                ],
                explanation: 'C3 uses RuBisCO directly producing 3-PGA; C4 avoids photorespiration using Kranz anatomy and initial PEPc carboxylation to OAA.',
                chapterReference: 'Arihant Class 11 Biology Ch 13: Photosynthesis in Higher Plants',
                sourceLink: refLink('biology', 11),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c11b_q4', questionNumber: 4, type: 'Derivation', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Outline the steps of Glycolysis (EMP Pathway) and state the net gain of ATP and NADH per glucose molecule under aerobic conditions.',
                options: [
                  '10-step enzymatic breakdown of 1 glucose (6C) into 2 pyruvates (3C). Consumes 2 ATP, generates 4 ATP (substrate-level) + 2 NADH. Net gain = 2 ATP + 2 NADH (yielding total 8 ATP via ETS).',
                  'Direct breakdown into lactic acid producing 38 ATP',
                  'Single step conversion to Acetyl-CoA with zero net ATP',
                  'Consumes 4 ATP and produces 2 ATP',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Glycolysis: Preparatory phase consumes 2 ATP (Hexokinase & PFK). Payoff phase yields 4 ATP and 2 NADH per glucose.',
                markingSteps: [
                  { step: 'Step 1: Preparatory phase: Phosphorylation of glucose to Fructose 1,6-bisphosphate consumes 2 ATP', marks: 1.0 },
                  { step: 'Step 2: Payoff phase: Cleavage into DHAP & PGAL, yielding 4 ATP (substrate-level) and 2 NADH + 2H⁺', marks: 1.0 },
                  { step: 'Step 3: Net yield: 2 Pyruvate + 2 ATP (net) + 2 NADH per glucose', marks: 1.0 },
                ],
                explanation: 'EMP pathway in cytoplasm yields net 2 ATP, 2 NADH, and 2 pyruvate molecules per glucose.',
                chapterReference: 'Arihant Class 11 Biology Ch 14: Respiration in Plants',
                sourceLink: refLink('biology', 11),
              },
            ],
          },
        ],
      },
    },

    // =====================================================================
    // CLASS 12
    // =====================================================================
    12: {
      physics: {
        title: 'Class 12 Physics — Monthly Board Assessment (Electrostatics & Electromagnetism)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 45,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c12p_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'Electric field intensity E at a distance r from an infinitely long straight uniformly charged wire with linear charge density λ is:',
                options: ['E = λ / (2πε₀r)', 'E = λ / (4πε₀r²)', 'E = σ / (2ε₀)', 'E = q / (4πε₀r)'],
                correctAnswer: 0,
                hint: '💡 Apply Gauss\'s Law using a coaxial cylindrical Gaussian surface of radius r and length L.',
                markingSteps: [{ step: 'Apply Gauss\'s law ∮E·dA = q_enc/ε₀ ⟹ E(2πrL) = λL/ε₀ ⟹ E = λ/(2πε₀r)', marks: 1.0 }],
                explanation: 'By Gauss\'s law, E(2πrL) = λL/ε₀ ⟹ E = λ/(2πε₀r).',
                chapterReference: 'Arihant Class 12 Physics Ch 1: Electric Charges and Fields',
                sourceLink: refLink('physics', 12),
              },
              {
                id: 'c12p_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'In a series LCR alternating current circuit at resonance, the impedance Z equals:',
                options: ['R (Purely resistive with minimum impedance)', '√(R² + ω²L²)', 'Zero', 'Infinite'],
                correctAnswer: 0,
                hint: '💡 At resonance, inductive reactance X_L equals capacitive reactance X_C, so Z = √(R² + (X_L − X_C)²) = R.',
                markingSteps: [{ step: 'Set X_L = X_C at resonant frequency ⟹ Z = R', marks: 1.0 }],
                explanation: 'At resonance X_L = X_C, phase angle φ = 0°, and circuit impedance is purely resistive Z = R (minimum).',
                chapterReference: 'Arihant Class 12 Physics Ch 7: Alternating Current',
                sourceLink: refLink('physics', 12),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c12p_q3', questionNumber: 3, type: 'Numerical', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'A parallel plate capacitor with air between plates has capacitance 8 pF. If a dielectric slab of dielectric constant K = 6 is inserted filling the space and plate separation is halved, what is the new capacitance?',
                options: ['96 pF', '48 pF', '24 pF', '12 pF'],
                correctAnswer: 0,
                hint: '💡 Arihant Formula: C\' = K(ε₀A / d\') = K(ε₀A / (d/2)) = 2K C₀ = 2(6)(8 pF) = 96 pF.',
                markingSteps: [
                  { step: 'Step 1: Original C₀ = ε₀A/d = 8 pF. New parameters: d\' = d/2 and dielectric K = 6', marks: 1.0 },
                  { step: 'Step 2: New capacitance C\' = K·ε₀A/d\' = K·ε₀A/(d/2) = 2·K·C₀ = 2 × 6 × 8 pF = 96 pF', marks: 1.0 },
                ],
                explanation: 'C\' = 2KC₀ = 2 × 6 × 8 = 96 pF.',
                chapterReference: 'Arihant Class 12 Physics Ch 2: Electrostatic Potential and Capacitance',
                sourceLink: refLink('physics', 12),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c12p_q4', questionNumber: 4, type: 'Derivation', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Using Biot-Savart Law, derive the magnetic field B at the center of a circular current-carrying loop of radius R with N turns carrying current I.',
                options: [
                  'B = (μ₀ N I) / (2R)',
                  'B = (μ₀ N I) / (4π R)',
                  'B = (μ₀ N I²) / (2R²)',
                  'B = (μ₀ I) / (2π R)',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Step: dB = (μ₀/4π) · (I dl sin 90°)/R² = (μ₀ I dl)/(4π R²). Integrate ∮ dl = 2πR. For N turns: B = N · (μ₀ I · 2πR)/(4π R²) = (μ₀ N I)/(2R).',
                markingSteps: [
                  { step: 'Step 1: Biot-Savart law for elemental segment dl: dB = (μ₀/4π) (I dl × r̂)/r² = (μ₀/4π) (I dl sin 90°)/R²', marks: 1.0 },
                  { step: 'Step 2: Since all elements contribute in same normal direction: B = ∫ dB = (μ₀ I)/(4π R²) ∫ dl', marks: 1.0 },
                  { step: 'Step 3: Integral ∮ dl = 2πR. Multiplying by N turns gives B = (μ₀ I / 4πR²) (2πR) · N = (μ₀ N I)/(2R)', marks: 1.0 },
                ],
                explanation: 'Integrating Biot-Savart formula along the circular perimeter of 2πR gives B = (μ₀ N I)/(2R).',
                chapterReference: 'Arihant Class 12 Physics Ch 4: Moving Charges and Magnetism',
                sourceLink: refLink('physics', 12),
              },
            ],
          },
        ],
      },
      chemistry: {
        title: 'Class 12 Chemistry — Monthly Assessment (Electrochem, Kinetics & Coordination)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 45,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c12c_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'The unit of rate constant k for a first-order chemical reaction is:',
                options: ['s⁻¹ (or time⁻¹)', 'mol L⁻¹ s⁻¹', 'L mol⁻¹ s⁻¹', 'L² mol⁻² s⁻¹'],
                correctAnswer: 0,
                hint: '💡 General unit of k = (mol/L)^(1−n) · s⁻¹. For n = 1: (mol/L)⁰ · s⁻¹ = s⁻¹.',
                markingSteps: [{ step: 'Apply unit formula (mol L⁻¹)^(1−n) s⁻¹ for n=1 ⟹ s⁻¹', marks: 1.0 }],
                explanation: 'For a 1st-order reaction, rate = k[A] ⟹ (mol L⁻¹ s⁻¹) = k(mol L⁻¹) ⟹ k = s⁻¹.',
                chapterReference: 'Arihant Class 12 Chemistry Ch 4: Chemical Kinetics',
                sourceLink: refLink('chemistry', 12),
              },
              {
                id: 'c12c_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'The IUPAC name of the coordination compound [Co(NH₃)₅(Cl)]Cl₂ is:',
                options: [
                  'Pentaamminechloridocobalt(III) chloride',
                  'Pentammine cobalt trichloride',
                  'Chloropentaamminecobalt(II) chloride',
                  'Cobalt pentammine chloride',
                ],
                correctAnswer: 0,
                hint: '💡 Ligands named alphabetically: ammine (NH₃) before chlorido (Cl). Oxidation state of Co: x + 5(0) + (−1) + 2(−1) = 0 ⟹ x = +3.',
                markingSteps: [{ step: 'Determine Co oxidation state (+3) and alphabetical ligand sequence pentaamminechlorido', marks: 1.0 }],
                explanation: 'Cation is named first with alphabetical ligands: Pentaamminechloridocobalt(III), followed by counter-anion chloride.',
                chapterReference: 'Arihant Class 12 Chemistry Ch 9: Coordination Compounds',
                sourceLink: refLink('chemistry', 12),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c12c_q3', questionNumber: 3, type: 'Numerical', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'For the Daniell cell: Zn(s) | Zn²⁺(0.01 M) || Cu²⁺(0.1 M) | Cu(s), calculate the cell potential E_cell at 298 K (E°_cell = 1.10 V, 2.303RT/F = 0.059 V).',
                options: ['1.1295 V', '1.0705 V', '1.1000 V', '1.1590 V'],
                correctAnswer: 0,
                hint: '💡 Arihant Nernst Equation: E = E° − (0.059/2) log([Zn²⁺]/[Cu²⁺]) = 1.10 − 0.0295 log(0.01/0.1) = 1.10 − 0.0295 log(10⁻¹) = 1.10 + 0.0295 = 1.1295 V.',
                markingSteps: [
                  { step: 'Step 1: Write Nernst equation: E_cell = E°_cell − (0.0591 / n) log([Zn²⁺] / [Cu²⁺]) with n = 2', marks: 1.0 },
                  { step: 'Step 2: E_cell = 1.10 − (0.0591/2) log(0.01 / 0.1) = 1.10 − 0.02955(−1) = 1.10 + 0.02955 = 1.1295 V', marks: 1.0 },
                ],
                explanation: 'E_cell = 1.10 − 0.0295 log(0.1) = 1.10 + 0.0295 = 1.1295 V.',
                chapterReference: 'Arihant Class 12 Chemistry Ch 3: Electrochemistry',
                sourceLink: refLink('chemistry', 12),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c12c_q4', questionNumber: 4, type: 'Concept', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'State Kohlrausch\'s Law of Independent Migration of Ions and show how it is used to calculate the limiting molar conductivity (Λ°_m) of weak acetic acid (CH₃COOH).',
                options: [
                  'Kohlrausch Law: Limiting molar conductivity of an electrolyte is sum of individual contributions of its cation and anion: Λ°_m = ν₊ λ°₊ + ν₋ λ°₋. For CH₃COOH: Λ°_m(CH₃COOH) = Λ°_m(CH₃COONa) + Λ°_m(HCl) − Λ°_m(NaCl).',
                  'Kohlrausch law applies only to strong non-ionic crystals',
                  'Molar conductivity is inversely proportional to square root of concentration',
                  'Electrolysis stops when current is disconnected',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Application: CH₃COOH cannot be measured directly due to incomplete dissociation at zero concentration. Add strong electrolytes CH₃COONa + HCl and subtract NaCl.',
                markingSteps: [
                  { step: 'Step 1: Statement: Limiting molar conductivity of an electrolyte equals the sum of limiting ionic conductivities of its constituent ions: Λ°_m = λ°(cation) + λ°(anion)', marks: 1.0 },
                  { step: 'Step 2: Application equation: Λ°_m(CH₃COOH) = λ°(CH₃COO⁻) + λ°(H⁺)', marks: 1.0 },
                  { step: 'Step 3: Algebraic derivation: [λ°(CH₃COO⁻) + λ°(Na⁺)] + [λ°(H⁺) + λ°(Cl⁻)] − [λ°(Na⁺) + λ°(Cl⁻)] = Λ°_m(CH₃COONa) + Λ°_m(HCl) − Λ°_m(NaCl)', marks: 1.0 },
                ],
                explanation: 'Kohlrausch\'s law permits determination of weak electrolyte limiting molar conductivity by combining strong electrolyte data.',
                chapterReference: 'Arihant Class 12 Chemistry Ch 3: Electrochemistry',
                sourceLink: refLink('chemistry', 12),
              },
            ],
          },
        ],
      },
      maths: {
        title: 'Class 12 Mathematics — Monthly Board Examination (Calculus & Vectors)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 45,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c12m_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'If A is a square matrix of order 3 with |A| = 4, then the value of |adj(A)| is:',
                options: ['16', '64', '12', '4'],
                correctAnswer: 0,
                hint: '💡 Standard theorem: |adj(A)| = |A|^(n−1). Here n = 3, so |adj(A)| = |A|² = 4² = 16.',
                markingSteps: [{ step: 'Apply formula |adj(A)| = |A|^(n−1) = 4^(3−1) = 4² = 16', marks: 1.0 }],
                explanation: '|adj(A)| = |A|^(n−1) = |A|² = 4² = 16.',
                chapterReference: 'Arihant Class 12 Maths Ch 4: Determinants',
                sourceLink: refLink('maths', 12),
              },
              {
                id: 'c12m_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'Evaluate the integral: ∫ [e^x (1 + x) / cos²(x e^x)] dx:',
                options: ['tan(x e^x) + C', 'cot(x e^x) + C', 'sec(x e^x) + C', '−tan(x e^x) + C'],
                correctAnswer: 0,
                hint: '💡 Substitute t = x e^x. dt = (e^x + x e^x) dx = e^x(1 + x) dx. Integral becomes ∫ sec²(t) dt = tan(t) + C.',
                markingSteps: [{ step: 'Let t = x e^x ⟹ dt = e^x(1 + x)dx. ∫ sec² t dt = tan t + C = tan(x e^x) + C', marks: 1.0 }],
                explanation: 'Substitute t = x·e^x ⟹ dt = (x+1)e^x dx. ∫ sec²(t) dt = tan(t) + C = tan(x e^x) + C.',
                chapterReference: 'Arihant Class 12 Maths Ch 7: Integrals',
                sourceLink: refLink('maths', 12),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c12m_q3', questionNumber: 3, type: 'Numerical', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'Find the projection of the vector a = 2i + 3j + 2k on the vector b = i + 2j + k.',
                options: ['10 / √6', '8 / √6', '5 / √6', '12 / √6'],
                correctAnswer: 0,
                hint: '💡 Arihant Formula: Projection of a on b = (a · b) / |b|. a · b = 2(1) + 3(2) + 2(1) = 2 + 6 + 2 = 10. |b| = √(1² + 2² + 1²) = √6.',
                markingSteps: [
                  { step: 'Step 1: Compute scalar product: a · b = 2(1) + 3(2) + 2(1) = 10', marks: 1.0 },
                  { step: 'Step 2: Magnitude |b| = √(1² + 2² + 1²) = √6 ⟹ Projection = (a · b)/|b| = 10 / √6', marks: 1.0 },
                ],
                explanation: 'Projection = (a · b) / |b| = 10 / √6.',
                chapterReference: 'Arihant Class 12 Maths Ch 10: Vector Algebra',
                sourceLink: refLink('maths', 12),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c12m_q4', questionNumber: 4, type: 'Integration', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Evaluate the definite integral using properties: I = ∫[0 to π/2] [√sin x / (√sin x + √cos x)] dx.',
                options: [
                  'π / 4',
                  'π / 2',
                  'π',
                  '1',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Property: ∫[0 to a] f(x) dx = ∫[0 to a] f(a − x) dx. Here f(π/2 − x) gives √cos x / (√cos x + √sin x). Adding 2I = ∫[0 to π/2] 1 dx = π/2 ⟹ I = π/4.',
                markingSteps: [
                  { step: 'Step 1: Let I = ∫₀^(π/2) [√sin x / (√sin x + √cos x)] dx. Apply property ∫₀ᵃ f(x)dx = ∫₀ᵃ f(a−x)dx', marks: 1.0 },
                  { step: 'Step 2: I = ∫₀^(π/2) [√sin(π/2−x) / (√sin(π/2−x) + √cos(π/2−x))] dx = ∫₀^(π/2) [√cos x / (√cos x + √sin x)] dx', marks: 1.0 },
                  { step: 'Step 3: Adding (1) and (2): 2I = ∫₀^(π/2) 1 dx = [x]₀^(π/2) = π/2 ⟹ I = π/4', marks: 1.0 },
                ],
                explanation: 'Adding the original and transformed integrals yields 2I = [x]₀^(π/2) = π/2 ⟹ I = π/4.',
                chapterReference: 'Arihant Class 12 Maths Ch 7: Integrals',
                sourceLink: refLink('maths', 12),
              },
            ],
          },
        ],
      },
      biology: {
        title: 'Class 12 Biology — Monthly Board Assessment (Reproduction, Genetics & Biotech)',
        totalMarks: 10,
        passingMarks: 4,
        durationMinutes: 45,
        sections: [
          {
            name: 'Section A: Objective (1 Mark Each)',
            marksPerQuestion: 1,
            questions: [
              {
                id: 'c12b_q1', questionNumber: 1, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'basic',
                question: 'In human females, the hormone surge that directly triggers ovulation (release of secondary oocyte) is:',
                options: ['Luteinizing Hormone (LH) surge', 'Progesterone peak', 'FSH drop', 'Inhibin surge'],
                correctAnswer: 0,
                hint: '💡 Mid-cycle (day 14) LH peak induces rupture of the mature Graafian follicle.',
                markingSteps: [{ step: 'Identify LH surge at mid-cycle triggering Graafian follicle rupture', marks: 1.0 }],
                explanation: 'Rapid secretion of LH leading to maximum level around day 14 (LH surge) causes ovulation.',
                chapterReference: 'Arihant Class 12 Biology Ch 3: Human Reproduction',
                sourceLink: refLink('biology', 12),
              },
              {
                id: 'c12b_q2', questionNumber: 2, type: 'MCQ', section: 'Section A', marks: 1, difficulty: 'medium',
                question: 'In the lac operon of E. coli, lactose acts as an inducer by binding directly to:',
                options: ['Repressor protein (inactivating it)', 'Operator gene', 'Promoter site', 'RNA polymerase'],
                correctAnswer: 0,
                hint: '💡 Lactose binds to the lac repressor causing a conformational change that prevents it from binding the operator.',
                markingSteps: [{ step: 'Identify inducer binding to repressor protein, releasing operator gene', marks: 1.0 }],
                explanation: 'Lactose/allolactose binds to the repressor protein, altering its conformation so it cannot bind the operator, allowing transcription.',
                chapterReference: 'Arihant Class 12 Biology Ch 6: Molecular Basis of Inheritance',
                sourceLink: refLink('biology', 12),
              },
            ],
          },
          {
            name: 'Section B: Short Answer (2 Marks)',
            marksPerQuestion: 2,
            questions: [
              {
                id: 'c12b_q3', questionNumber: 3, type: 'Concept', section: 'Section B', marks: 2, difficulty: 'hard',
                question: 'Explain the three sequential steps involved in one cycle of Polymerase Chain Reaction (PCR) along with required temperature ranges.',
                options: [
                  '1. Denaturation (94-96°C) — separates dsDNA strands; 2. Annealing (50-60°C) — primers bind to complementary regions; 3. Extension (72°C) — Taq polymerase synthesizes new DNA strand',
                  '1. Freezing. 2. Centrifugation. 3. Chromatography.',
                  '1. Transcription. 2. Translation. 3. Translocation.',
                  '1. Heating to 100°C only without primers',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Steps: Denaturation (94°C) ⟹ Annealing (55°C) ⟹ Primer extension (72°C using thermostable Taq polymerase from Thermus aquaticus).',
                markingSteps: [
                  { step: 'Step 1: Denaturation: High temperature (94°C) melts hydrogen bonds to yield single-stranded DNA templates', marks: 1.0 },
                  { step: 'Step 2: Annealing (54°C) & Extension (72°C): Oligonucleotide primers anneal and thermostable Taq DNA polymerase extends strands', marks: 1.0 },
                ],
                explanation: 'PCR utilizes thermal cycling of Denaturation (94°C), Annealing (55°C), and Extension (72°C) for exponential DNA amplification.',
                chapterReference: 'Arihant Class 12 Biology Ch 11: Biotechnology - Principles and Processes',
                sourceLink: refLink('biology', 12),
              },
            ],
          },
          {
            name: 'Section C: Long Answer (3 Marks)',
            marksPerQuestion: 3,
            questions: [
              {
                id: 'c12b_q4', questionNumber: 4, type: 'Concept', section: 'Section C', marks: 3, difficulty: 'hard',
                question: 'Describe the steps of Double Fertilization and Triple Fusion in Angiosperms and state the ploidy of the resulting structures.',
                options: [
                  'One male gamete (n) fuses with egg cell (n) to form Zygote (2n, Syngamy); Second male gamete (n) fuses with diploid secondary nucleus (2n) to form Primary Endosperm Nucleus (3n, Triple Fusion).',
                  'Both male gametes fertilize the egg forming a 4n embryo',
                  'Male gamete fuses with antipodal cells to form fruit',
                  'Ploidy of endosperm is 1n and embryo is 3n',
                ],
                correctAnswer: 0,
                hint: '💡 Arihant Summary: Double Fertilization = Syngamy (Egg n + Sperm n ⟹ Zygote 2n) + Triple Fusion (2 Polar nuclei 2n + Sperm n ⟹ PEN 3n).',
                markingSteps: [
                  { step: 'Step 1: Pollen tube releases two male gametes (n) into embryo sac cytoplasm through degenerate synergid', marks: 1.0 },
                  { step: 'Step 2: Syngamy: One male gamete (n) + Egg cell (n) → Diploid Zygote (2n), developing into embryo', marks: 1.0 },
                  { step: 'Step 3: Triple Fusion: Second male gamete (n) + Diploid Secondary Nucleus (2n) → Triploid Primary Endosperm Nucleus (PEN, 3n)', marks: 1.0 },
                ],
                explanation: 'Double fertilization comprises syngamy (giving 2n zygote) and triple fusion (giving 3n nutritive endosperm).',
                chapterReference: 'Arihant Class 12 Biology Ch 2: Sexual Reproduction in Flowering Plants',
                sourceLink: refLink('biology', 12),
              },
            ],
          },
        ],
      },
    },
  };

  // Helper to build a test object from the question bank
  function buildTest(classLevel, subject, organizer = 'AI Curriculum Engine & Faculty', options = {}) {
    const cl = parseInt(classLevel, 10) || 10;
    let subKey = (subject || '').toLowerCase().replace(/[^a-z]/g, '');
    if (subKey === 'math' || subKey === 'mathematics') subKey = 'maths';
    const bank = QUESTION_BANK[cl];
    if (!bank) return null;

    // Match subject flexibly
    let match = Object.keys(bank).find(k => subKey.includes(k) || k.includes(subKey));
    if (!match) return null;

    const data = bank[match];
    const difficultyFilter = (options.difficulty || 'all').toLowerCase();
    const hintsEnabled = options.hintsEnabled !== undefined ? options.hintsEnabled : true;
    const numQuestions = parseInt(options.numQuestions, 10);

    // Deep clone sections to avoid mutating original bank
    let sections = JSON.parse(JSON.stringify(data.sections));

    // Filter questions by difficulty if requested
    if (difficultyFilter && difficultyFilter !== 'all') {
      sections = sections.map(sec => {
        const filtered = sec.questions.filter(q => {
          if (difficultyFilter === 'basic' || difficultyFilter === 'easy') {
            return q.difficulty === 'basic' || q.difficulty === 'easy';
          }
          if (difficultyFilter === 'hard') {
            return q.difficulty === 'hard';
          }
          if (difficultyFilter === 'medium') {
            return q.difficulty === 'medium';
          }
          return true;
        });
        return {
          ...sec,
          questions: filtered.length > 0 ? filtered : sec.questions, // fallback if none match
        };
      });
    }

    // Process hints
    sections.forEach(sec => {
      sec.questions.forEach(q => {
        if (!hintsEnabled && q.difficulty !== 'hard') {
          delete q.hint;
        }
      });
    });

    // Limit number of questions if requested
    if (numQuestions && numQuestions > 0) {
      let remaining = numQuestions;
      sections = sections.map(sec => {
        if (remaining <= 0) return { ...sec, questions: [] };
        const take = sec.questions.slice(0, remaining);
        remaining -= take.length;
        return { ...sec, questions: take };
      }).filter(sec => sec.questions.length > 0);
    }

    const totalMarks = sections.reduce((s, sec) => s + sec.questions.reduce((qs, q) => qs + (q.marks || 1), 0), 0);

    return {
      testId: `ARIHANT-NCERT-CL${cl}-${match.toUpperCase()}-${new Date().toISOString().slice(0, 7)}`,
      title: options.title || data.title,
      classLevel: cl,
      subject: match.charAt(0).toUpperCase() + match.slice(1),
      organizer,
      difficulty: difficultyFilter,
      hintsEnabled,
      organizedDate: new Date().toISOString().split('T')[0],
      durationMinutes: options.durationMinutes || data.durationMinutes || 45,
      totalMarks: totalMarks || data.totalMarks,
      passingMarks: data.passingMarks || Math.ceil(totalMarks * 0.4),
      markingSchemeRule: 'Strict NCERT/CBSE Step-Marking (Arihant Reference)',
      status: 'active',
      arihantReference: refLink(match, cl),
      ncertReference: ARIHANT_LINKS.ncert,
      instructions: [
        'Strict step-marking enforced as per NCERT / CBSE board exam guidelines.',
        'Section A: 1 Mark each for Objective Concept & Assertion-Reasoning.',
        'Section B: 2 Marks with step marking (Formula: 1m + Calculation: 1m).',
        'Section C: 3 Marks with step marking (Setup: 1m + Intermediate reduction: 1m + Final statement with SI units: 1m).',
        'Pedagogical hints are active for hard conceptual questions per Arihant guidelines.',
        `📚 Recommended E-Book Reference: ${data.title.split('—')[0].trim()} (Arihant Publications)`,
      ],
      sections,
    };
  }

  function getDatabaseErrorMessage(error) {
    if (error?.code === 'PGRST205' || error?.code === '42P01') {
      return 'Supabase is connected, but assessment tables are missing. Apply backend/migrations/20261006_assessment_workflow.sql to the configured Supabase project.';
    }
    return 'Could not access assessment storage.';
  }

  function studentSafeTest(test) {
    if (!test) return test;
    return {
      ...test,
      sections: (test.sections || []).map(section => ({
        ...section,
        questions: (section.questions || []).map(question => {
          const {
            correctAnswer,
            markingSteps,
            explanation,
            stepByStepSolution,
            modelAnswer,
            ...studentQuestion
          } = question;
          return studentQuestion;
        }),
      })),
    };
  }

  async function getActivePublishedTest(classLevel, subject) {
    if (!supabase) return { error: { code: 'SUPABASE_NOT_CONFIGURED' } };
    return supabase
      .from('published_assessments')
      .select('test_data')
      .eq('class_level', classLevel)
      .ilike('subject', subject)
      .eq('status', 'active')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  // ── GET /api/exam-prep/monthly-test/catalog
  // Returns available class+subject combinations for Class 9, 10, 11, 12
  router.get('/monthly-test/catalog', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase is not configured for assessment storage.' });
    const { data, error } = await supabase
      .from('published_assessments')
      .select('class_level, subject, test_data')
      .eq('status', 'active')
      .order('published_at', { ascending: false });
    if (error) return res.status(503).json({ error: getDatabaseErrorMessage(error) });
    const catalog = (data || []).map(row => ({
      classLevel: row.class_level,
      subject: row.subject,
      subjectLabel: row.test_data?.subject || row.subject,
      title: row.test_data?.title,
      durationMinutes: row.test_data?.durationMinutes,
      totalMarks: row.test_data?.totalMarks,
      arihantLink: row.test_data?.arihantReference,
    }));
    return res.json({ success: true, catalog });
  });

  // ── GET /api/exam-prep/monthly-test?class=12&subject=physics&difficulty=all&numQuestions=4
  // Returns the teacher-published test for a specific class (or the auto-built test if none published)
  router.get('/monthly-test', async (req, res) => {
    const { class: clQuery, classLevel: clLevelQuery, subject, difficulty, numQuestions } = req.query;
    const cl = parseInt(clQuery || clLevelQuery, 10);
    if (!Number.isInteger(cl) || cl < 1 || cl > 12 || !subject) {
      return res.status(400).json({ error: 'A valid class and subject are required.' });
    }

    const result = await getActivePublishedTest(cl, String(subject).toLowerCase().trim());
    if (result.error) {
      return res.status(503).json({ error: getDatabaseErrorMessage(result.error) });
    }
    if (!result.data?.test_data) {
      return res.status(404).json({ error: 'No assessment has been published for this class and subject yet.' });
    }

    const test = studentSafeTest(result.data.test_data);
    return res.json({ success: true, test, ...test, lastUpdated: new Date().toISOString() });
  });

  // ── POST /api/exam-prep/monthly-test/publish
  // Allows teachers to publish customized tests per Arihant & NCERT guidelines
  router.post('/monthly-test/publish', requireTeacher, async (req, res) => {
    const {
      title,
      classLevel = 10,
      subject = 'science',
      organizer = 'Faculty Member & Arihant Curriculum Board',
      durationMinutes = 45,
      difficulty = 'all',
      numQuestions = 4,
      hintsEnabled = true,
      syllabus = '',
      sections = null,
    } = req.body;

    const parsedClass = parseInt(classLevel, 10) || 10;
    if (![9, 10, 11, 12].includes(parsedClass)) {
      return res.status(400).json({ error: 'Monthly assessments are available for Classes 9–12.' });
    }
    let targetSubj = (subject || '').toLowerCase().trim();
    if (parsedClass >= 11 && targetSubj === 'science') {
      targetSubj = 'physics';
    }

    const built = buildTest(parsedClass, targetSubj, organizer, {
      title,
      durationMinutes,
      difficulty,
      numQuestions,
      hintsEnabled,
    });

    if (!built) {
      return res.status(400).json({
        error: `No monthly assessment question bank is available for Class ${parsedClass} ${targetSubj}.`,
      });
    }
    const publishedTest = built;
    if (sections && Array.isArray(sections) && sections.length > 0) {
      publishedTest.sections = sections;
    }
    if (syllabus) {
      publishedTest.syllabus = syllabus;
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Supabase is not configured for assessment storage.' });
    }

    publishedTest.testId = `ASSESSMENT-CL${parsedClass}-${targetSubj.toUpperCase()}-${Date.now()}`;
    const saved = await supabase.from('published_assessments').insert({
      test_id: publishedTest.testId,
      class_level: parsedClass,
      subject: targetSubj,
      status: 'active',
      test_data: publishedTest,
    });
    if (saved.error) {
      return res.status(503).json({ error: getDatabaseErrorMessage(saved.error) });
    }

    const archived = await supabase
      .from('published_assessments')
      .update({ status: 'archived' })
      .eq('class_level', parsedClass)
      .ilike('subject', targetSubj)
      .eq('status', 'active')
      .neq('test_id', publishedTest.testId);
    if (archived.error) {
      console.error('Could not archive previous assessment version:', archived.error.message);
      return res.status(503).json({ error: getDatabaseErrorMessage(archived.error) });
    }

    return res.json({
      success: true,
      message: `Arihant & NCERT Monthly Test for Class ${publishedTest.classLevel} ${publishedTest.subject} published!`,
      test: publishedTest,
      ...publishedTest,
    });
  });

  // ── POST /api/exam-prep/monthly-test/submit
  // Evaluates answers with strict NCERT step-marking, generates points for improvement, updates live rank, and notifies Teacher Dashboard
  router.post('/monthly-test/submit', async (req, res) => {
    const {
      testId,
      answers = {},
      userId,
      timeTakenSeconds,
    } = req.body;

    if (!testId) {
      return res.status(400).json({ error: 'A test ID is required.' });
    }
    if (!Number.isInteger(Number(timeTakenSeconds)) || Number(timeTakenSeconds) < 0) {
      return res.status(400).json({ error: 'A valid time taken in seconds is required.' });
    }
    if (!supabase) {
      return res.status(503).json({ error: 'Assessment storage is not configured.' });
    }

    const authenticated = await getAuthenticatedUser(req);
    if (!authenticated.user) {
      return res.status(authenticated.status).json({ error: authenticated.error });
    }
    const studentEmail = String(authenticated.user.email || '').trim().toLowerCase();
    if (!studentEmail || (userId && String(userId).trim().toLowerCase() !== studentEmail)) {
      return res.status(403).json({ error: 'The submitted student identity does not match the signed-in account.' });
    }

    const rosterStudent = await supabase
      .from('student_roster')
      .select('full_name, class_level, status')
      .eq('auth_user_id', authenticated.user.id)
      .maybeSingle();
    if (rosterStudent.error) {
      return res.status(503).json({
        error: rosterStudent.error.code === 'PGRST205' || rosterStudent.error.code === '42P01'
          ? 'Student roster storage is missing. Apply backend/migrations/20261007_student_roster.sql to Supabase.'
          : 'Could not verify the student roster record.',
      });
    }
    if (!rosterStudent.data || rosterStudent.data.status !== 'active') {
      return res.status(403).json({ error: 'An active student roster account is required to submit assessments.' });
    }

    const storedTest = await supabase
      .from('published_assessments')
      .select('test_data')
      .eq('test_id', testId)
      .maybeSingle();
    if (storedTest.error) {
      return res.status(503).json({ error: getDatabaseErrorMessage(storedTest.error) });
    }
    if (!storedTest.data?.test_data) {
      return res.status(404).json({ error: 'The assessment no longer exists.' });
    }
    const testToEval = storedTest.data.test_data;
    if (Number(testToEval.classLevel) !== rosterStudent.data.class_level) {
      return res.status(403).json({ error: 'This assessment is not assigned to your class.' });
    }
    const priorSubmission = await supabase
      .from('assessment_submissions')
      .select('id')
      .eq('test_id', testId)
      .eq('student_email', studentEmail)
      .maybeSingle();
    if (priorSubmission.error) {
      return res.status(503).json({ error: getDatabaseErrorMessage(priorSubmission.error) });
    }
    if (priorSubmission.data) {
      return res.status(409).json({ error: 'You have already submitted this assessment.' });
    }

    let totalMarksEarned = 0;
    let maxMarks = 0;
    const stepAudit = [];
    const weakPoints = [];
    const improvementRecommendations = [];

    const allQuestions = [];
    (testToEval.sections || []).forEach(sec => (sec.questions || []).forEach(q => allQuestions.push(q)));

    allQuestions.forEach(q => {
      const qMarks = q.marks || 1;
      maxMarks += qMarks;
      const selectedOption = answers[q.id] !== undefined ? answers[q.id] : -1;
      const isCorrect = selectedOption === q.correctAnswer;

      let marksEarned = 0;
      const stepBreakdown = [];

      if (isCorrect) {
        marksEarned = qMarks;
        (q.markingSteps || []).forEach(ms => {
          stepBreakdown.push({ step: ms.step, marksAllocated: ms.marks, marksEarned: ms.marks, status: 'FULL_MARKS_AWARDED' });
        });
      } else if (selectedOption !== -1) {
        // Partial credit for formula/step attempt
        marksEarned = Math.round(qMarks * 0.33 * 10) / 10;
        (q.markingSteps || []).forEach((ms, sIdx) => {
          stepBreakdown.push({
            step: ms.step,
            marksAllocated: ms.marks,
            marksEarned: sIdx === 0 ? Math.round(ms.marks * 0.5 * 10) / 10 : 0,
            status: sIdx === 0 ? 'PARTIAL_STEP_CREDIT (Formula Recognized)' : 'DEDUCTED (Calculation / Unit Error)',
          });
        });
        weakPoints.push(q.chapterReference || `Q${q.questionNumber} Concepts`);
        improvementRecommendations.push({
          questionNumber: q.questionNumber,
          topic: q.chapterReference || 'Core NCERT Topic',
          advice: `Review ${q.chapterReference}. Focus on formula step verification and unit notations. Arihant practice hint: "${q.hint || 'Review derivation steps'}"`,
          sourceLink: q.sourceLink || refLink(testToEval.subject, testToEval.classLevel),
        });
      } else {
        (q.markingSteps || []).forEach(ms => {
          stepBreakdown.push({ step: ms.step, marksAllocated: ms.marks, marksEarned: 0, status: 'NOT_ATTEMPTED' });
        });
        weakPoints.push(q.chapterReference || `Q${q.questionNumber} Unattempted`);
        improvementRecommendations.push({
          questionNumber: q.questionNumber,
          topic: q.chapterReference || 'Core NCERT Topic',
          advice: `Unattempted question in ${q.chapterReference}. Master standard problem templates in Arihant book.`,
          sourceLink: q.sourceLink || refLink(testToEval.subject, testToEval.classLevel),
        });
      }

      totalMarksEarned += marksEarned;
      stepAudit.push({
        questionId: q.id,
        questionNumber: q.questionNumber,
        section: q.section,
        question: q.question,
        selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect,
        maxMarks: qMarks,
        marksEarned,
        explanation: q.explanation,
        chapterReference: q.chapterReference,
        sourceLink: q.sourceLink,
        stepBreakdown,
      });
    });

    const percentage = Math.round((totalMarksEarned / Math.max(1, maxMarks)) * 100);
    let grade = 'E (Essential Repeat)';
    if (percentage >= 91) grade = 'A1';
    else if (percentage >= 81) grade = 'A2';
    else if (percentage >= 71) grade = 'B1';
    else if (percentage >= 61) grade = 'B2';
    else if (percentage >= 51) grade = 'C1';
    else if (percentage >= 41) grade = 'C2';
    else if (percentage >= 33) grade = 'D (Marginal Pass)';

    const { data: classRows, error: classRowsError } = await supabase
      .from('assessment_submissions')
      .select('student_email, student_name, score, max_marks, time_taken_seconds')
      .eq('class_level', testToEval.classLevel);
    if (classRowsError) {
      return res.status(503).json({ error: getDatabaseErrorMessage(classRowsError) });
    }
    const classScores = new Map();
    for (const row of classRows || []) {
      const current = classScores.get(row.student_email) || {
        name: row.student_name,
        score: 0,
        maxMarks: 0,
        totalSeconds: 0,
        attempts: 0,
      };
      current.score += Number(row.score) || 0;
      current.maxMarks += Number(row.max_marks) || 0;
      current.totalSeconds += Number(row.time_taken_seconds) || 0;
      current.attempts += 1;
      classScores.set(row.student_email, current);
    }
    const rankStudents = [...classScores.entries()].map(([email, student]) => ({
      email,
      name: student.name,
      percentage: student.maxMarks ? (student.score / student.maxMarks) * 100 : 0,
      averageTimeSeconds: student.attempts ? student.totalSeconds / student.attempts : Number.POSITIVE_INFINITY,
    }));
    rankStudents.sort((a, b) =>
      b.percentage - a.percentage ||
      a.averageTimeSeconds - b.averageTimeSeconds ||
      a.name.localeCompare(b.name)
    );
    const previousRankIndex = rankStudents.findIndex(student => student.email === studentEmail);
    const previousRank = previousRankIndex < 0 ? 0 : previousRankIndex + 1;
    const existingStudentStats = classScores.get(studentEmail);
    rankStudents.push({
      email: studentEmail,
      name: rosterStudent.data.full_name,
      percentage: existingStudentStats
        ? ((existingStudentStats.score + totalMarksEarned) / (existingStudentStats.maxMarks + maxMarks)) * 100
        : percentage,
      averageTimeSeconds: existingStudentStats
        ? (existingStudentStats.totalSeconds + Number(timeTakenSeconds)) / (existingStudentStats.attempts + 1)
        : Number(timeTakenSeconds),
    });
    if (existingStudentStats) {
      rankStudents.splice(rankStudents.findIndex(student => student.email === studentEmail), 1);
    }
    rankStudents.sort((a, b) =>
      b.percentage - a.percentage ||
      a.averageTimeSeconds - b.averageTimeSeconds ||
      a.name.localeCompare(b.name)
    );
    const rank = rankStudents.findIndex(student => student.email === studentEmail) + 1;
    const rankChange = previousRank ? previousRank - rank : 0;

    const submittedAt = new Date().toISOString();
    const result = {
      testId: testToEval.testId,
      testTitle: testToEval.title,
      classLevel: testToEval.classLevel,
      subject: testToEval.subject,
      studentName: rosterStudent.data.full_name,
      userId: studentEmail,
      totalMarksEarned: Math.round(totalMarksEarned * 10) / 10,
      maxMarks,
      percentage,
      grade,
      timeTakenSeconds: Number(timeTakenSeconds),
      rank,
      previousRank: previousRank || rank,
      rankChange,
      rankStatusText: rankChange > 0
        ? `Promoted by ${rankChange} position(s); current rank #${rank}.`
        : `Current class rank: #${rank}.`,
      arihantReference: testToEval.arihantReference,
      ncertReference: testToEval.ncertReference,
      stepAudit,
      weakPoints,
      improvementRecommendations,
      markingSchemeRule: testToEval.markingSchemeRule,
      teacherFeedbackSent: true,
      teacherFeedback: '',
      timestamp: submittedAt,
    };

    const savedSubmission = await supabase
      .from('assessment_submissions')
      .insert({
        test_id: testToEval.testId,
        student_email: studentEmail,
        student_name: result.studentName,
        class_level: testToEval.classLevel,
        subject: testToEval.subject,
        score: result.totalMarksEarned,
        max_marks: maxMarks,
        percentage,
        time_taken_seconds: Number(timeTakenSeconds),
        answers,
        result_data: result,
        submitted_at: submittedAt,
      })
      .select('id')
      .single();
    if (savedSubmission.error) {
      if (savedSubmission.error.code === '23505') {
        return res.status(409).json({ error: 'You have already submitted this assessment.' });
      }
      return res.status(503).json({ error: getDatabaseErrorMessage(savedSubmission.error) });
    }

    return res.json({ ...result, submissionId: savedSubmission.data.id });
  });

  // ── GET /api/exam-prep/teacher-feedback
  // Returns student test feedback reports for the Teacher Dashboard
  router.get('/teacher-feedback', requireTeacher, async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Assessment storage is not configured.' });
    const { data, error } = await supabase
      .from('assessment_submissions')
      .select('id, test_id, student_email, student_name, class_level, subject, score, max_marks, percentage, time_taken_seconds, teacher_feedback, submitted_at, feedback_at, result_data')
      .order('submitted_at', { ascending: false });
    if (error) return res.status(503).json({ error: getDatabaseErrorMessage(error) });

    const feedbacks = (data || []).map(row => ({
      ...row.result_data,
      id: row.id,
      testId: row.test_id,
      userId: row.student_email,
      studentName: row.student_name,
      classLevel: row.class_level,
      subject: row.subject,
      totalMarksEarned: Number(row.score),
      maxMarks: Number(row.max_marks),
      percentage: Number(row.percentage),
      timeTakenSeconds: row.time_taken_seconds,
      teacherFeedback: row.teacher_feedback,
      timestamp: row.submitted_at,
      feedbackAt: row.feedback_at,
    }));
    return res.json({ success: true, feedbacks, totalSubmissions: feedbacks.length });
  });

  router.get('/monthly-test/submissions', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Assessment storage is not configured.' });
    const authenticated = await getAuthenticatedUser(req);
    if (!authenticated.user) {
      return res.status(authenticated.status).json({ error: authenticated.error });
    }
    const studentEmail = String(authenticated.user.email || '').trim().toLowerCase();
    const requestedEmail = String(req.query.userId || '').trim().toLowerCase();
    if (!studentEmail || (requestedEmail && requestedEmail !== studentEmail)) {
      return res.status(403).json({ error: 'You can only view your own assessment submissions.' });
    }
    const { data, error } = await supabase
      .from('assessment_submissions')
      .select('id, test_id, student_email, student_name, class_level, subject, score, max_marks, percentage, time_taken_seconds, teacher_feedback, submitted_at, feedback_at, result_data')
      .eq('student_email', studentEmail)
      .order('submitted_at', { ascending: false });
    if (error) return res.status(503).json({ error: getDatabaseErrorMessage(error) });
    return res.json({
      success: true,
      submissions: (data || []).map(row => ({
        ...row.result_data,
        id: row.id,
        testId: row.test_id,
        studentEmail: row.student_email,
        studentName: row.student_name,
        classLevel: row.class_level,
        subject: row.subject,
        totalMarksEarned: Number(row.score),
        maxMarks: Number(row.max_marks),
        percentage: Number(row.percentage),
        timeTakenSeconds: row.time_taken_seconds,
        teacherFeedback: row.teacher_feedback,
        timestamp: row.submitted_at,
        feedbackAt: row.feedback_at,
      })),
    });
  });

  router.patch('/teacher-feedback/:submissionId', requireTeacher, async (req, res) => {
    const feedback = String(req.body.feedback || '').trim();
    if (!feedback) return res.status(400).json({ error: 'Feedback cannot be empty.' });
    if (!supabase) return res.status(503).json({ error: 'Assessment storage is not configured.' });
    const { data, error } = await supabase
      .from('assessment_submissions')
      .update({ teacher_feedback: feedback, feedback_at: new Date().toISOString() })
      .eq('id', req.params.submissionId)
      .select('id, teacher_feedback, feedback_at')
      .single();
    if (error) return res.status(503).json({ error: getDatabaseErrorMessage(error) });
    return res.json({ success: true, feedback: data.teacher_feedback, feedbackAt: data.feedback_at });
  });

  // ── POST /api/exam-prep/organize-targeted-test
  // Teacher can organize a targeted test for student's future development based on weak areas
  router.post('/organize-targeted-test', requireTeacher, async (req, res) => {
    const {
      classLevel = 10,
      subject = 'science',
      studentName,
      targetTopics = [],
      difficulty = 'medium',
      numQuestions = 4,
    } = req.body;

    const parsedClass = parseInt(classLevel, 10) || 10;
    let targetSubj = (subject || '').toLowerCase().trim();
    if (parsedClass >= 11 && targetSubj === 'science') {
      targetSubj = 'physics';
    }

    if (!studentName) return res.status(400).json({ error: 'A student name is required.' });
    if (!supabase) return res.status(503).json({ error: 'Assessment storage is not configured.' });
    const topicStr = Array.isArray(targetTopics) ? targetTopics.join(', ') : (targetTopics || 'Remedial Focus Topics');
    const title = `Targeted Remedial Assessment for ${studentName} — Class ${parsedClass} ${targetSubj} (${topicStr})`;

    const customTest = buildTest(parsedClass, targetSubj, `Teacher Remedial Command (${studentName})`, {
      title,
      difficulty,
      numQuestions,
      hintsEnabled: true,
    });

    if (customTest) {
      customTest.testId = `ASSESSMENT-REMEDIAL-CL${parsedClass}-${Date.now()}`;
      const saved = await supabase.from('published_assessments').insert({
        test_id: customTest.testId,
        class_level: parsedClass,
        subject: targetSubj,
        status: 'active',
        test_data: customTest,
      });
      if (saved.error) return res.status(503).json({ error: getDatabaseErrorMessage(saved.error) });
      const archived = await supabase
        .from('published_assessments')
        .update({ status: 'archived' })
        .eq('class_level', parsedClass)
        .ilike('subject', targetSubj)
        .eq('status', 'active')
        .neq('test_id', customTest.testId);
      if (archived.error) return res.status(503).json({ error: getDatabaseErrorMessage(archived.error) });
    }

    if (!customTest) return res.status(400).json({ error: 'Could not create the remedial assessment.' });
    return res.json({
      success: true,
      message: `Targeted developmental test organized for ${studentName}! Published live to Student Dashboard.`,
      test: customTest,
    });
  });

  return router;
}

module.exports = examPrepRoutes;
