const express = require('express');

function quizRoutes(supabase, openai) {
  const router = express.Router();

  // Government / NCERT Free e-Book portal references
  const NCERT_LINKS = {
    class10: {
      mathematics: 'https://ncert.nic.in/textbook.php?jemh1=0-15',
      science: 'https://ncert.nic.in/textbook.php?jesc1=0-16',
      physics: 'https://ncert.nic.in/textbook.php?jesc1=10-16',
      chemistry: 'https://ncert.nic.in/textbook.php?jesc1=1-16',
      biology: 'https://ncert.nic.in/textbook.php?jesc1=6-16',
      portal: 'https://ncert.nic.in/textbook.php',
      diksha: 'https://diksha.gov.in/explore',
    },
    class9: {
      mathematics: 'https://ncert.nic.in/textbook.php?iemh1=0-15',
      science: 'https://ncert.nic.in/textbook.php?iesc1=0-15',
      portal: 'https://ncert.nic.in/textbook.php',
      diksha: 'https://diksha.gov.in/explore',
    },
    general: {
      ncert: 'https://ncert.nic.in/textbook.php',
      diksha: 'https://diksha.gov.in',
      ndli: 'https://ndl.iitkgp.ac.in',
    }
  };

  // Fallback high-quality static question bank categorized by class and subject
  const fallbackBank = {
    class10: {
      mathematics: [
        {
          question: 'What is the discriminant of the quadratic equation 2x² - 4x + 3 = 0?',
          answer: '-8 (No real roots)',
          explanation: 'Discriminant D = b² - 4ac = (-4)² - 4(2)(3) = 16 - 24 = -8. Since D < 0, equation has no real roots.',
          topic: 'Quadratic Equations',
          chapter_reference: 'NCERT Class 10 Maths Chapter 4',
          class_level: 10,
          source: 'https://ncert.nic.in/textbook.php?jemh1=4-15'
        },
        {
          question: 'If the 10th term of an AP is 52 and the 17th term is 20 more than the 13th term, what is the common difference?',
          answer: 'd = 5',
          explanation: 'a₁₇ - a₁₃ = 4d = 20 ⇒ d = 5. Using a + 9(5) = 52 gives first term a = 7.',
          topic: 'Arithmetic Progressions',
          chapter_reference: 'NCERT Class 10 Maths Chapter 5',
          class_level: 10,
          source: 'https://ncert.nic.in/textbook.php?jemh1=5-15'
        },
        {
          question: 'What is the coordinate of the midpoint of the line segment joining (2, 8) and (6, 4)?',
          answer: '(4, 6)',
          explanation: 'Midpoint formula: ((x₁ + x₂)/2, (y₁ + y₂)/2) = ((2 + 6)/2, (8 + 4)/2) = (4, 6).',
          topic: 'Coordinate Geometry',
          chapter_reference: 'NCERT Class 10 Maths Chapter 7',
          class_level: 10,
          source: 'https://ncert.nic.in/textbook.php?jemh1=7-15'
        },
        {
          question: 'Evaluate: (sin 30° + tan 45° - cosec 60°) / (sec 30° + cos 60° + cot 45°)',
          answer: '(43 - 24√3) / 11',
          explanation: 'Substitute standard trigonometric values: sin 30°=1/2, tan 45°=1, cosec 60°=2/√3, sec 30°=2/√3, cos 60°=1/2, cot 45°=1.',
          topic: 'Introduction to Trigonometry',
          chapter_reference: 'NCERT Class 10 Maths Chapter 8',
          class_level: 10,
          source: 'https://ncert.nic.in/textbook.php?jemh1=8-15'
        }
      ],
      physics: [
        {
          question: 'An object is placed at 2F₁ in front of a convex lens. Where will the image be formed?',
          answer: 'At 2F₂ (Real, inverted, and same size)',
          explanation: 'When an object is at 2F₁ of a convex lens, its real and inverted image is formed at 2F₂ with magnification m = -1.',
          topic: 'Light - Reflection and Refraction',
          chapter_reference: 'NCERT Class 10 Science Chapter 10',
          class_level: 10,
          source: 'https://ncert.nic.in/textbook.php?jesc1=10-16'
        },
        {
          question: 'Three resistors of 2Ω, 3Ω, and 6Ω are connected in parallel. What is the equivalent resistance?',
          answer: '1 Ω',
          explanation: '1/R_eq = 1/2 + 1/3 + 1/6 = (3 + 2 + 1)/6 = 6/6 = 1 ⇒ R_eq = 1 Ω.',
          topic: 'Electricity',
          chapter_reference: 'NCERT Class 10 Science Chapter 12',
          class_level: 10,
          source: 'https://ncert.nic.in/textbook.php?jesc1=12-16'
        }
      ],
      chemistry: [
        {
          question: 'What is the pH range of our body for healthy physiological functioning?',
          answer: '7.0 to 7.8',
          explanation: 'Human living organisms can survive only in a narrow range of pH change from 7.0 to 7.8.',
          topic: 'Acids, Bases and Salts',
          chapter_reference: 'NCERT Class 10 Science Chapter 2',
          class_level: 10,
          source: 'https://ncert.nic.in/textbook.php?jesc1=2-16'
        },
        {
          question: 'What is the functional group present in aldehydes?',
          answer: '-CHO',
          explanation: 'Aldehydes have the carbonyl carbon bonded to at least one hydrogen atom (-CHO group, e.g. Methanal HCHO, Ethanal CH₃CHO).',
          topic: 'Carbon and its Compounds',
          chapter_reference: 'NCERT Class 10 Science Chapter 4',
          class_level: 10,
          source: 'https://ncert.nic.in/textbook.php?jesc1=4-16'
        }
      ],
      biology: [
        {
          question: 'Which chamber of the human heart pumps oxygenated blood to the rest of the body through the aorta?',
          answer: 'Left Ventricle',
          explanation: 'The left ventricle has thick muscular walls to pump oxygenated blood through the aorta at high pressure throughout systemic circulation.',
          topic: 'Life Processes - Transportation',
          chapter_reference: 'NCERT Class 10 Science Chapter 6',
          class_level: 10,
          source: 'https://ncert.nic.in/textbook.php?jesc1=6-16'
        },
        {
          question: 'What are the gap junctions between two communicating neurons called?',
          answer: 'Synapse',
          explanation: 'A synapse is a small junction across which electrical nerve impulses are transmitted via chemical neurotransmitters.',
          topic: 'Control and Coordination',
          chapter_reference: 'NCERT Class 10 Science Chapter 7',
          class_level: 10,
          source: 'https://ncert.nic.in/textbook.php?jesc1=7-16'
        }
      ]
    }
  };

  // Fisher-Yates shuffle array helper for unbiased real-time randomization
  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Generate plausible contextual distractors for an MCQ
  function generateDistractors(correctAnswer, subject, topic, siblingPool = []) {
    // 1. First priority: extract real answers from other sibling questions in the same pool
    const siblingAnswers = siblingPool
      .map(s => s.answer)
      .filter(a => a && a.toLowerCase() !== (correctAnswer || '').toLowerCase());

    const subjectDistractorPresets = {
      Mathematics: [
        '0',
        '1',
        'Undefined / Does not exist',
        'Cannot be determined without additional data',
        'x = -b / (2a)',
        'd = √[(x₂ + x₁)² + (y₂ + y₁)²]',
        'sin²θ - cos²θ = 1',
        '4 Median = 2 Mode + Mean',
        '180° / n',
        'πr²h / 2',
      ],
      Physics: [
        'Zero in all reference frames',
        'F = mv²',
        '1/f = 1/v - 1/u (Lens Formula instead of Mirror)',
        'Dioptre per second',
        'V = I / R',
        'H = IR²t',
        'Convex lens of negative focal length',
        'Atmospheric total internal reflection only',
        'Independent of resistance',
      ],
      Chemistry: [
        'CaSO₄ · 2H₂O (Gypsum instead of POP)',
        'Sodium Carbonate (Na₂CO₃)',
        'Bromine (non-metal liquid, not metal)',
        'Acidic oxides only',
        'CₙH₂ₙ (Alkene formula)',
        'pH = 1.0 to 2.0',
        'No reaction occurs at standard STP',
        'Endothermic decomposition',
      ],
      Biology: [
        'Right Atrium',
        'Mitochondria without cristae',
        'Salivary Lipase',
        'Auxin causes immediate fruit abscission',
        '3 : 1 : 3 : 1',
        '90% energy transfer efficiency',
        'Bowman capsule only',
        'Dendrite axon terminal gap is irreversible',
      ],
    };

    const generalPresets = [
      'None of the above',
      'All of the above are valid',
      'Insufficient parameters provided',
      'Dependent on boundary conditions',
    ];

    const pool = [
      ...siblingAnswers,
      ...(subjectDistractorPresets[subject] || []),
      ...generalPresets,
    ];

    // Filter out duplicates and the correct answer
    const seen = new Set();
    seen.add((correctAnswer || '').toLowerCase());

    const filtered = [];
    for (const item of pool) {
      if (!item) continue;
      const lower = item.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        filtered.push(item);
      }
    }

    // Shuffle and pick 3 distinct distractors
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  // Helper to generate smart conceptual NCERT hints for questions (especially hard ones)
  function generateConceptualHint(row) {
    const qText = (row.question || '').toLowerCase();
    const topic = (row.topic || '').toLowerCase();
    const subj = (row.subject || '').toLowerCase();

    if (qText.includes('discriminant') || topic.includes('quadratic')) {
      return '💡 NCERT Clue: Recall the Discriminant formula D = b² - 4ac. When D < 0, there are no real roots; when D > 0, two distinct real roots exist.';
    }
    if (qText.includes('ap') || topic.includes('arithmetic progression') || qText.includes('common difference')) {
      return '💡 NCERT Clue: The nth term is given by a_n = a + (n - 1)d. Notice that a₁₇ - a₁₃ = (17 - 13)d = 4d.';
    }
    if (qText.includes('midpoint') || topic.includes('coordinate')) {
      return '💡 NCERT Clue: Midpoint formula between (x₁, y₁) and (x₂, y₂) is given by ((x₁ + x₂)/2, (y₁ + y₂)/2).';
    }
    if (qText.includes('sin') || qText.includes('cos') || qText.includes('tan') || topic.includes('trigonometry')) {
      return '💡 NCERT Clue: Substitute standard NCERT values: sin 30° = 1/2, tan 45° = 1, cosec 60° = 2/√3, sec 30° = 2/√3.';
    }
    if (qText.includes('convex lens') || qText.includes('2f') || topic.includes('light')) {
      return '💡 NCERT Clue: When an object is placed at the center of curvature (2F₁) of a convex lens, its real and inverted image forms symmetrically at 2F₂ with magnification m = -1.';
    }
    if (qText.includes('resistor') || qText.includes('parallel') || topic.includes('electricity')) {
      return '💡 NCERT Clue: In parallel combination, add reciprocals: 1/R_eq = 1/R₁ + 1/R₂ + 1/R₃, then invert the final sum to get R_eq.';
    }
    if (qText.includes('ph') || topic.includes('acid') || topic.includes('base')) {
      return '💡 NCERT Clue: Human body physiology and systemic enzymes function within a strictly regulated pH range of 7.0 to 7.8.';
    }
    if (qText.includes('aldehyde') || topic.includes('carbon')) {
      return '💡 NCERT Clue: Aldehydes feature the terminal carbonyl functional group (-CHO).';
    }
    if (qText.includes('heart') || qText.includes('ventricle') || topic.includes('life processes')) {
      return '💡 NCERT Clue: The left ventricle has thick muscular walls to generate high systolic blood pressure for systemic circulation via the aorta.';
    }
    if (qText.includes('synapse') || topic.includes('control') || topic.includes('coordination')) {
      return '💡 NCERT Clue: The microscopic gap junction between two neurons across which neurotransmitters diffuse is called the synapse.';
    }

    return `💡 NCERT Clue: Focus on the core definition, governing laws, and standard formulas outlined in ${row.chapter_reference || row.topic || 'the NCERT curriculum'}.`;
  }

  // Transform a row into a complete randomized MCQ question
  function buildQuizQuestion(row, idx, siblingPool = []) {
    const correctAnswer = row.answer || 'Standard answer';
    const distractors = generateDistractors(correctAnswer, row.subject, row.topic, siblingPool);

    // Randomize correct answer position between 0 and 3
    const correctIndex = Math.floor(Math.random() * 4);
    const options = [...distractors.slice(0, 3)];
    options.splice(correctIndex, 0, correctAnswer);

    while (options.length < 4) {
      options.push(`Option ${options.length + 1}`);
    }

    return {
      id: row.id || `q_${idx}_${Date.now()}`,
      question: row.question,
      options: options.slice(0, 4),
      correctAnswer: correctIndex,
      explanation: row.explanation || 'Refer to your NCERT textbook chapter for the detailed conceptual step-by-step breakdown.',
      hint: row.hint || generateConceptualHint(row),
      subject: row.subject || 'General',
      topic: row.topic || 'Curriculum Concepts',
      chapterReference: row.chapter_reference || `NCERT Class ${row.class_level || 10} Syllabus`,
      classLevel: row.class_level || 10,
      curriculum: row.curriculum || 'NCERT',
      difficulty: row.difficulty || 'medium',
      source: row.source || 'https://ncert.nic.in/textbook.php (NCERT e-Book Portal)',
    };
  }

  // =========================================================================
  // ROUTE: POST /api/quiz/generate
  // Generates dynamic, fresh, randomized sets of questions in real-time
  // =========================================================================
  router.post('/generate', async (req, res) => {
    const {
      subject = 'all',
      classLevel = 10,
      difficulty = 'all',
      numQuestions = 5,
      topic = '',
      userId = 'student-guest',
    } = req.body;

    const parsedClass = parseInt(classLevel, 10) || 10;
    const cleanSubject = typeof subject === 'string' ? subject.toLowerCase() : 'all';
    const count = Math.max(1, Math.min(parseInt(numQuestions, 10) || 5, 20));

    // Map subjects to Supabase DB names
    const subjectMap = {
      mathematics: 'Mathematics',
      maths: 'Mathematics',
      physics: 'Physics',
      chemistry: 'Chemistry',
      biology: 'Biology',
      science: 'Science',
    };

    let questions = [];
    let source = 'static-fallback';
    let totalPoolSize = 0;

    // 1. Try querying real-time Supabase 'education' table
    if (supabase) {
      try {
        let query = supabase.from('education').select('*');

        // Filter by class level if specified
        if (parsedClass && parsedClass > 0) {
          query = query.eq('class_level', parsedClass);
        }

        // Filter by subject if not 'all'
        if (cleanSubject !== 'all') {
          const targetSubj = subjectMap[cleanSubject] || cleanSubject;
          query = query.ilike('subject', `%${targetSubj}%`);
        }

        // Filter by topic if specified
        if (topic && topic.trim()) {
          query = query.ilike('topic', `%${topic.trim()}%`);
        }

        // Filter by difficulty if specified
        if (difficulty && difficulty !== 'all') {
          query = query.eq('difficulty', difficulty);
        }

        const { data: dbRows, error } = await query;

        if (!error && dbRows && dbRows.length > 0) {
          totalPoolSize = dbRows.length;
          // REAL-TIME DYNAMIC SHUFFLE: Pick a fresh random set every single time
          const shuffledPool = shuffleArray(dbRows);
          const selectedRows = shuffledPool.slice(0, count);

          questions = selectedRows.map((row, idx) => buildQuizQuestion(row, idx, dbRows));
          source = 'supabase-realtime';

          console.log(`[Quiz Realtime] Class ${parsedClass} | Subject: ${cleanSubject} | Selected ${questions.length} from pool of ${totalPoolSize}`);
        }
      } catch (err) {
        console.warn('[Quiz Realtime] Supabase query failed, falling back:', err.message);
      }
    }

    // 2. Fallback if DB was empty or unavailable
    if (!questions || questions.length === 0) {
      const classKey = `class${parsedClass}` in fallbackBank ? `class${parsedClass}` : 'class10';
      const classObj = fallbackBank[classKey] || fallbackBank.class10;

      let fallbackPool = [];
      if (cleanSubject !== 'all' && classObj[cleanSubject]) {
        fallbackPool = classObj[cleanSubject];
      } else {
        Object.values(classObj).forEach(arr => {
          fallbackPool = fallbackPool.concat(arr);
        });
      }

      const shuffled = shuffleArray(fallbackPool);
      const selected = shuffled.slice(0, count);
      totalPoolSize = fallbackPool.length;
      questions = selected.map((item, idx) => buildQuizQuestion(item, idx, fallbackPool));
      source = 'fallback-ncert-bank';
    }

    // Generate unique set identifier for tracking and analysis
    const setId = `NCERT-CL${parsedClass}-${cleanSubject.toUpperCase()}-SET-${Math.floor(1000 + Math.random() * 9000)}`;

    return res.json({
      setId,
      classLevel: parsedClass,
      subject: cleanSubject,
      difficulty,
      source,
      totalPoolSize,
      ebookLinks: NCERT_LINKS[`class${parsedClass}`] || NCERT_LINKS.general,
      timestamp: new Date().toISOString(),
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        hint: q.hint,
        difficulty: q.difficulty || difficulty,
        topic: q.topic,
        chapterReference: q.chapterReference,
        classLevel: q.classLevel,
        source: q.source,
      })),
    });
  });

  // =========================================================================
  // ROUTE: POST /api/quiz/submit
  // Evaluates quiz, computes topic-level analysis and NCERT revision guides
  // =========================================================================
  router.post('/submit', async (req, res) => {
    const {
      setId = 'NCERT-DYNAMIC-SET',
      classLevel = 10,
      subject = 'all',
      answers = [], // Array of selected option indices [0, 2, 1, ...]
      questionsData = [], // Full questions sent by frontend
      userId = 'student-guest',
    } = req.body;

    const parsedClass = parseInt(classLevel, 10) || 10;
    let score = 0;
    const results = [];
    const topicStats = {}; // { 'Quadratic Equations': { total: 2, correct: 1, chapter: '...' } }

    questionsData.forEach((q, idx) => {
      const selectedIndex = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = selectedIndex === q.correctAnswer;
      if (isCorrect) score++;

      const topicKey = q.topic || 'General';
      if (!topicStats[topicKey]) {
        topicStats[topicKey] = {
          topic: topicKey,
          total: 0,
          correct: 0,
          chapter: q.chapterReference || 'NCERT Textbook',
          sourceUrl: q.source || 'https://ncert.nic.in/textbook.php',
        };
      }
      topicStats[topicKey].total++;
      if (isCorrect) topicStats[topicKey].correct++;

      results.push({
        questionId: q.id,
        question: q.question,
        selectedAnswer: selectedIndex,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic,
        chapterReference: q.chapterReference,
        source: q.source,
      });
    });

    const totalQuestions = questionsData.length || answers.length || 1;
    const percentage = Math.round((score / totalQuestions) * 100);

    // Mastery categorization
    let masteryLevel = 'Developing';
    if (percentage >= 85) masteryLevel = 'Mastered';
    else if (percentage >= 60) masteryLevel = 'Proficient';
    else if (percentage >= 40) masteryLevel = 'Needs Revision';
    else masteryLevel = 'Critical Review Recommended';

    // Identify weak topics for targeted NCERT chapter revision
    const weakTopics = Object.values(topicStats).filter(t => (t.correct / t.total) < 0.7);
    const strongTopics = Object.values(topicStats).filter(t => (t.correct / t.total) >= 0.7);

    const revisionPlan = weakTopics.map(wt => ({
      topic: wt.topic,
      accuracy: Math.round((wt.correct / wt.total) * 100) + '%',
      recommendedChapter: wt.chapter,
      ebookUrl: wt.sourceUrl,
      action: `Review concepts and solved examples in ${wt.chapter} on the NCERT/DIKSHA free e-book portal.`,
    }));

    // Record submission to centralized rank manager for live ranking updates/degradations
    const rankManager = require('../services/rankManager');
    const rankResult = rankManager.recordStudentSubmission({
      userId: userId || 'student@example.com',
      subject: subject || 'General',
      topic: weakTopics.length > 0 ? weakTopics.map(w => w.topic).join(', ') : 'NCERT Quiz Set',
      score,
      totalQuestions,
      percentage,
      weakTopics: weakTopics.map(w => w.topic),
      strongTopics: strongTopics.map(s => s.topic),
      classLevel: parsedClass,
    });

    // Record submission to Supabase 'train' table for persistent learning curve tracking
    if (supabase) {
      try {
        await supabase.from('train').insert([
          {
            title: `Quiz Analysis: Class ${parsedClass} ${subject} (${setId})`,
            content: `Score: ${score}/${totalQuestions} (${percentage}%) | Mastery: ${masteryLevel} | Rank: #${rankResult.rank || 3} | Weak Topics: ${weakTopics.map(w => w.topic).join(', ') || 'None'}`,
            subject: subject,
            topic: 'Quiz Realtime Performance',
            class_level: parsedClass,
            chapter_reference: `Class ${parsedClass} Performance Record`,
            content_type: 'student_analytics',
            difficulty: 'medium',
            quality_score: percentage / 100,
            source: `quiz-eval-${userId}`,
          },
        ]);
      } catch (err) {
        console.warn('[Quiz Submit] Analytics log skipped:', err.message);
      }
    }

    return res.json({
      setId,
      classLevel: parsedClass,
      subject,
      score,
      totalQuestions,
      percentage,
      masteryLevel,
      rank: rankResult.rank,
      previousRank: rankResult.previousRank,
      rankChange: rankResult.rankChange,
      rankStatusText: rankResult.rankChange > 0
        ? `🚀 Promoted by +${rankResult.rankChange} Ranks (Now Rank #${rankResult.rank})!`
        : rankResult.rankChange < 0
        ? `⚠️ Rank Degraded by ${Math.abs(rankResult.rankChange)} (Now Rank #${rankResult.rank}). Review weak topics to recover!`
        : `Rank #${rankResult.rank} (Consistent Performance)`,
      topicBreakdown: Object.values(topicStats),
      weakTopics,
      strongTopics,
      revisionPlan,
      ebookLinks: NCERT_LINKS[`class${parsedClass}`] || NCERT_LINKS.general,
      results,
    });
  });

  // =========================================================================
  // ROUTE: GET /api/quiz/filters
  // Provides live stats of available classes, subjects, and questions count
  // =========================================================================
  router.get('/filters', async (req, res) => {
    try {
      if (supabase) {
        const { data: allData, error } = await supabase
          .from('education')
          .select('subject, class_level, topic');

        if (!error && allData) {
          const classCounts = {};
          const subjectCounts = {};

          allData.forEach(row => {
            const cl = row.class_level ? `Class ${row.class_level}` : 'General';
            classCounts[cl] = (classCounts[cl] || 0) + 1;

            const sb = row.subject || 'General';
            subjectCounts[sb] = (subjectCounts[sb] || 0) + 1;
          });

          return res.json({
            classes: [
              { id: 10, label: 'Class 10 (NCERT Sets)', count: classCounts['Class 10'] || 0 },
              { id: 9, label: 'Class 9 (NCERT Sets)', count: classCounts['Class 9'] || 0 },
              { id: 11, label: 'Class 11 (NCERT Sets)', count: classCounts['Class 11'] || 0 },
              { id: 12, label: 'Class 12 (NCERT Sets)', count: classCounts['Class 12'] || 0 },
              { id: 'all', label: 'All Classes', count: allData.length },
            ],
            subjects: [
              { id: 'all', label: 'All Subjects', count: allData.length },
              { id: 'mathematics', label: 'Mathematics', count: subjectCounts['Mathematics'] || 0 },
              { id: 'physics', label: 'Physics', count: subjectCounts['Physics'] || 0 },
              { id: 'chemistry', label: 'Chemistry', count: subjectCounts['Chemistry'] || 0 },
              { id: 'biology', label: 'Biology', count: subjectCounts['Biology'] || 0 },
            ],
            totalQuestions: allData.length,
            source: 'supabase-realtime',
          });
        }
      }
    } catch (err) {
      console.warn('[Quiz Filters] Error:', err.message);
    }

    return res.json({
      classes: [
        { id: 10, label: 'Class 10 (NCERT Sets)', count: 30 },
        { id: 9, label: 'Class 9 (NCERT Sets)', count: 15 },
        { id: 'all', label: 'All Classes', count: 45 },
      ],
      subjects: [
        { id: 'all', label: 'All Subjects' },
        { id: 'mathematics', label: 'Mathematics' },
        { id: 'physics', label: 'Physics' },
        { id: 'chemistry', label: 'Chemistry' },
        { id: 'biology', label: 'Biology' },
      ],
      source: 'fallback',
    });
  });

  return router;
}

module.exports = quizRoutes;