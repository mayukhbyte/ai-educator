const express = require('express');

function quizRoutes(supabase, openai, gemini) {
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
    },
    class11: {
      mathematics: [
        {
          question: 'Let A and B be two sets such that n(A) = 5 and n(B) = 6. If n(A ∩ B) = 3, what is n(A ∪ B)?',
          answer: '8',
          explanation: 'Using the formula n(A ∪ B) = n(A) + n(B) - n(A ∩ B), we get n(A ∪ B) = 5 + 6 - 3 = 8.',
          topic: 'Sets',
          chapter_reference: 'NCERT Class 11 Maths Chapter 1',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?jemh1=1-15'
        },
        {
          question: 'Find the domain of the function f(x) = √(x - 2).',
          answer: '[2, ∞)',
          explanation: 'For the square root function to be defined, the expression inside must be non-negative: x - 2 ≥ 0, which gives x ≥ 2.',
          topic: 'Relations and Functions',
          chapter_reference: 'NCERT Class 11 Maths Chapter 2',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?jemh1=2-15'
        },
        {
          question: 'What is the value of i^4k + i^(4k+1) + i^(4k+2) + i^(4k+3) for any integer k?',
          answer: '0',
          explanation: 'Since i^4k = 1, i^(4k+1) = i, i^(4k+2) = -1, and i^(4k+3) = -i, their sum is 1 + i - 1 - i = 0.',
          topic: 'Complex Numbers and Quadratic Equations',
          chapter_reference: 'NCERT Class 11 Maths Chapter 5',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?jemh1=5-15'
        },
        {
          question: 'In how many ways can 5 distinct books be arranged on a shelf?',
          answer: '120 ways',
          explanation: 'The number of permutations of 5 distinct items is 5! = 5 × 4 × 3 × 2 × 1 = 120.',
          topic: 'Permutations and Combinations',
          chapter_reference: 'NCERT Class 11 Maths Chapter 7',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?jemh1=7-15'
        },
        {
          question: 'What is the sum of an infinite geometric progression with first term a and common ratio r (|r| < 1)?',
          answer: 'S_∞ = a / (1 - r)',
          explanation: 'For an infinite GP where |r| < 1, as n → ∞, r^n → 0, yielding the sum formula S_∞ = a / (1 - r).',
          topic: 'Sequences and Series',
          chapter_reference: 'NCERT Class 11 Maths Chapter 9',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?jemh1=9-15'
        },
        {
          question: 'What is the derivative of sin(x) with respect to x from first principles?',
          answer: 'cos(x)',
          explanation: 'By the definition of derivative, lim(h→0) [sin(x + h) - sin(x)] / h = lim(h→0) [2 cos(x + h/2) sin(h/2)] / h = cos(x).',
          topic: 'Limits and Derivatives',
          chapter_reference: 'NCERT Class 11 Maths Chapter 13',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?jemh1=13-15'
        }
      ],
      physics: [
        {
          question: 'What is the SI unit of pressure?',
          answer: 'Pascal (Pa)',
          explanation: 'Pressure is defined as force per unit area. The SI unit of force is newton (N) and area is square meter (m²), so pressure has unit N/m² which is called pascal (Pa).',
          topic: 'Units and Measurements',
          chapter_reference: 'NCERT Class 11 Physics Chapter 2',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=2-15'
        },
        {
          question: 'What is the work done by a force in displacing a body when the force acts at an angle of 90° to the direction of displacement?',
          answer: 'Zero',
          explanation: 'Work done W = F·d·cosθ. When θ = 90°, cos 90° = 0, therefore W = F·d·0 = 0.',
          topic: 'Work, Energy and Power',
          chapter_reference: 'NCERT Class 11 Physics Chapter 6',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=6-15'
        },
        {
          question: 'What is the escape velocity of a body from the surface of the Earth?',
          answer: '11.2 km/s',
          explanation: 'Escape velocity is v_e = √(2gR) = √(2 × 9.8 × 6.4 × 10⁶) ≈ 11.2 km/s.',
          topic: 'Gravitation',
          chapter_reference: 'NCERT Class 11 Physics Chapter 8',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=8-15'
        },
        {
          question: 'State Hooke’s Law for an elastic material within its proportional limit.',
          answer: 'Stress is directly proportional to Strain',
          explanation: 'Hooke’s Law states that within elastic limit, Stress ∝ Strain, or Stress / Strain = Modulus of Elasticity (E).',
          topic: 'Mechanical Properties of Solids',
          chapter_reference: 'NCERT Class 11 Physics Chapter 9',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=9-15'
        },
        {
          question: 'State the First Law of Thermodynamics in equation form.',
          answer: 'ΔQ = ΔU + ΔW (Heat added = Increase in internal energy + Work done)',
          explanation: 'The first law of thermodynamics is an expression of the principle of conservation of energy: ΔQ = ΔU + PΔV.',
          topic: 'Thermodynamics',
          chapter_reference: 'NCERT Class 11 Physics Chapter 12',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=12-15'
        }
      ],
      chemistry: [
        {
          question: 'What is the number of significant figures in 0.002500?',
          answer: '4',
          explanation: 'Leading zeros are not significant. Trailing zeros after a decimal point are significant. So in 0.002500, the significant digits are 2, 5, 0, 0 which gives 4 significant figures.',
          topic: 'Some Basic Concepts of Chemistry',
          chapter_reference: 'NCERT Class 11 Chemistry Chapter 1',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=1-15'
        },
        {
          question: 'What is the azimuthal quantum number (l) for an electron in a 3p orbital?',
          answer: '1',
          explanation: 'For p orbitals, the azimuthal quantum number l = 1. The principal quantum number n = 3 for 3p orbital.',
          topic: 'Structure of Atom',
          chapter_reference: 'NCERT Class 11 Chemistry Chapter 2',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=2-15'
        },
        {
          question: 'What is the shape and bond angle of methane (CH4) according to VSEPR theory?',
          answer: 'Tetrahedral geometry with bond angle of 109.5°',
          explanation: 'Carbon in CH4 is sp3 hybridized with 4 bonding pairs and 0 lone pairs, minimizing electron repulsion in a tetrahedral geometry.',
          topic: 'Chemical Bonding and Molecular Structure',
          chapter_reference: 'NCERT Class 11 Chemistry Chapter 4',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=4-15'
        },
        {
          question: 'What is the conjugate acid of NH3 (ammonia)?',
          answer: 'NH4+ (Ammonium ion)',
          explanation: 'According to the Bronsted-Lowry concept, a conjugate acid is formed when a base accepts a proton (H+). NH3 + H+ → NH4+.',
          topic: 'Equilibrium',
          chapter_reference: 'NCERT Class 11 Chemistry Chapter 7',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=7-15'
        },
        {
          question: 'What is the oxidation number of chromium in K2Cr2O7?',
          answer: '+6',
          explanation: '2(+1) + 2(Cr) + 7(-2) = 0 ⇒ 2 + 2(Cr) - 14 = 0 ⇒ 2(Cr) = 12 ⇒ Cr = +6.',
          topic: 'Redox Reactions',
          chapter_reference: 'NCERT Class 11 Chemistry Chapter 8',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=8-15'
        },
        {
          question: 'What type of isomerism is shown by but-1-ene and but-2-ene?',
          answer: 'Position isomerism',
          explanation: 'But-1-ene and but-2-ene have the same carbon skeleton but differ in the position of the double bond (C=C), making them position isomers.',
          topic: 'Organic Chemistry: Some Basic Principles and Techniques',
          chapter_reference: 'NCERT Class 11 Chemistry Chapter 12',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=12-15'
        }
      ],
      biology: [
        {
          question: 'Which of the following is not a characteristic of living organisms?',
          answer: 'Isolation',
          explanation: 'Living organisms show growth, reproduction, metabolism, response to stimuli, etc. Isolation is not a biological characteristic; in fact, organisms interact with their environment and other organisms.',
          topic: 'The Living World',
          chapter_reference: 'NCERT Class 11 Biology Chapter 1',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=1-15'
        },
        {
          question: 'What is the function of the ribosome in a cell?',
          answer: 'Protein synthesis',
          explanation: 'Ribosomes are the site of protein synthesis in cells. They read mRNA and assemble amino acids into polypeptide chains.',
          topic: 'Cell: The Unit of Life',
          chapter_reference: 'NCERT Class 11 Biology Chapter 8',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=8-15'
        },
        {
          question: 'Which enzyme is responsible for carbon fixation in C3 plants?',
          answer: 'RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase)',
          explanation: 'RuBisCO catalyzes the first major step of carbon fixation in the Calvin cycle (C3 pathway), combining CO2 with ribulose 1,5-bisphosphate.',
          topic: 'Photosynthesis in Higher Plants',
          chapter_reference: 'NCERT Class 11 Biology Chapter 13',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=13-15'
        },
        {
          question: 'What is the end product of glycolysis under aerobic conditions?',
          answer: 'Pyruvic acid (Pyruvate)',
          explanation: 'In glycolysis, one molecule of glucose is cleaved through 10 enzymatic reactions to yield two molecules of pyruvic acid, along with 2 ATP and 2 NADH.',
          topic: 'Respiration in Plants',
          chapter_reference: 'NCERT Class 11 Biology Chapter 14',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=14-15'
        },
        {
          question: 'Which plant hormone is primarily responsible for apical dominance?',
          answer: 'Auxin (Indole-3-acetic acid)',
          explanation: 'Auxins produced at the shoot tip inhibit the growth of lateral (axillary) buds, a phenomenon called apical dominance.',
          topic: 'Plant Growth and Development',
          chapter_reference: 'NCERT Class 11 Biology Chapter 15',
          class_level: 11,
          source: 'https://ncert.nic.in/textbook.php?iesc1=15-15'
        }
      ]
    },
    class12: {
      mathematics: [
        {
          question: 'What is the principal value of sin⁻¹(-1/2)?',
          answer: '-π/6',
          explanation: 'The principal value branch of sin⁻¹x is [-π/2, π/2]. Since sin(-π/6) = -1/2, the principal value of sin⁻¹(-1/2) = -π/6.',
          topic: 'Inverse Trigonometric Functions',
          chapter_reference: 'NCERT Class 12 Maths Chapter 2',
          class_level: 12,
          source: 'https://ncert.nic.in/textbook.php?jemh1=2-15'
        }
      ],
      physics: [
        {
          question: 'What is the formula for electric potential due to a point charge?',
          answer: 'V = kQ/r',
          explanation: 'Electric potential V due to a point charge Q at distance r is given by V = kQ/r, where k = 1/(4πε₀) is Coulomb\'s constant.',
          topic: 'Electrostatics',
          chapter_reference: 'NCERT Class 12 Physics Chapter 1',
          class_level: 12,
          source: 'https://ncert.nic.in/textbook.php?iesc1=1-15'
        }
      ],
      chemistry: [
        {
          question: 'What is the IUPAC name of CH₃CH₂CH₂CH₂OH?',
          answer: 'Butan-1-ol',
          explanation: 'The compound is a straight chain alcohol with 4 carbon atoms and the OH group on the first carbon, hence butan-1-ol.',
          topic: 'Alcohols, Phenols and Ethers',
          chapter_reference: 'NCERT Class 12 Chemistry Chapter 11',
          class_level: 12,
          source: 'https://ncert.nic.in/textbook.php?iesc1=11-15'
        }
      ],
      biology: [
        {
          question: 'Which part of the flower develops into the fruit after fertilization?',
          answer: 'Ovary',
          explanation: 'After fertilization, the ovary of the flower develops into the fruit, while the ovules develop into seeds.',
          topic: 'Sexual Reproduction in Flowering Plants',
          chapter_reference: 'NCERT Class 12 Biology Chapter 2',
          class_level: 12,
          source: 'https://ncert.nic.in/textbook.php?iesc1=2-15'
        }
      ]
    },
    class9: {
      mathematics: [
        {
          question: 'What is the value of x² + 1/x² if x + 1/x = 3?',
          answer: '7',
          explanation: '(x + 1/x)² = x² + 2 + 1/x² = 9, therefore x² + 1/x² = 9 - 2 = 7.',
          topic: 'Polynomials',
          chapter_reference: 'NCERT Class 9 Maths Chapter 2',
          class_level: 9,
          source: 'https://ncert.nic.in/textbook.php?jemh1=2-15'
        }
      ],
      physics: [
        {
          question: 'What is the SI unit of gravitational constant G?',
          answer: 'N·m²/kg²',
          explanation: 'From Newton\'s law of gravitation F = GMm/r², we get G = Fr²/Mm. Substituting SI units: N·m²/kg².',
          topic: 'Gravitation',
          chapter_reference: 'NCERT Class 9 Science Chapter 10',
          class_level: 9,
          source: 'https://ncert.nic.in/textbook.php?iesc1=10-15'
        }
      ],
      chemistry: [
        {
          question: 'What is the chemical formula of rust?',
          answer: 'Fe₂O₃·xH₂O',
          explanation: 'Rust is hydrated iron(III) oxide, formed when iron reacts with oxygen and water. Its approximate formula is Fe₂O₃·xH₂O.',
          topic: 'Atoms and Molecules',
          chapter_reference: 'NCERT Class 9 Science Chapter 3',
          class_level: 9,
          source: 'https://ncert.nic.in/textbook.php?iesc1=3-15'
        }
      ],
      biology: [
        {
          question: 'Which organelle is known as the \"powerhouse of the cell\"?',
          answer: 'Mitochondria',
          explanation: 'Mitochondria are known as the powerhouse of the cell because they carry out cellular respiration and produce ATP, the energy currency of the cell.',
          topic: 'The Fundamental Unit of Life',
          chapter_reference: 'NCERT Class 9 Science Chapter 5',
          class_level: 9,
          source: 'https://ncert.nic.in/textbook.php?iesc1=5-15'
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

  // Generate questions using Gemini (primary) or OpenAI (fallback)
  async function generateAIQuestions(params) {
    const { classLevel, subject, difficulty, count, prompt = '' } = params;

    const subjectDisplayMap = {
      mathematics: 'Mathematics',
      physics: 'Physics',
      chemistry: 'Chemistry',
      biology: 'Biology',
      science: 'Science',
      all: 'Science & Mathematics'
    };
    const subjectDisplay = subjectDisplayMap[subject] || subject;

    const questionPrompt = `You are an expert NCERT question generator for Class ${classLevel} ${subjectDisplay} (${difficulty} difficulty).
Generate exactly ${count} fresh multiple-choice questions covering ${prompt || 'key concepts from the NCERT curriculum'}.

Rules:
- Each question must be unique, conceptual, and NCERT Class ${classLevel} syllabus aligned
- Difficulty: ${difficulty} (basic=factual recall, medium=application, hard=analysis/HOTS)
- Provide 4 distinct options per question with ONLY ONE correct answer
- correctAnswer is a 0-based index (0=A, 1=B, 2=C, 3=D)
- Include a concise explanation and a pedagogical hint

Return ONLY valid JSON in this exact structure:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why the answer is correct (2-3 sentences)",
      "hint": "💡 Pedagogical clue without giving away the answer",
      "topic": "NCERT Topic Name",
      "chapterReference": "NCERT Class ${classLevel} ${subjectDisplay} Chapter N: Chapter Name",
      "source": "https://ncert.nic.in/textbook.php",
      "classLevel": ${classLevel},
      "difficulty": "${difficulty}"
    }
  ]
}`;

    // --- Try Gemini first (primary) ---
    if (gemini) {
      try {
        console.log(`[Quiz Gemini] Generating ${count} questions | Class ${classLevel} | ${subjectDisplay} | ${difficulty}`);
        const result = await gemini.generateContent(questionPrompt);
        const text = result.response.text();

        // Extract JSON from markdown code fences if present
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
        const jsonStr = (jsonMatch[1] || text).trim();
        const parsed = JSON.parse(jsonStr);

        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          console.log(`[Quiz Gemini] ✅ Got ${parsed.questions.length} questions`);
          return parsed.questions.map((q, idx) => ({
            id: `gemini-${Date.now()}-${idx}`,
            question: q.question || `Class ${classLevel} ${subjectDisplay} question`,
            options: Array.isArray(q.options) && q.options.length >= 4
              ? q.options.slice(0, 4)
              : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
              ? q.correctAnswer
              : 0,
            explanation: q.explanation || `Refer to NCERT Class ${classLevel} ${subjectDisplay} for details.`,
            hint: q.hint || `💡 Focus on NCERT core concepts for Class ${classLevel}.`,
            topic: q.topic || 'Core Concepts',
            chapterReference: q.chapterReference || `NCERT Class ${classLevel} ${subjectDisplay}`,
            source: q.source || 'https://ncert.nic.in/textbook.php',
            subject: subjectDisplay,
            classLevel: parseInt(q.classLevel, 10) || classLevel,
            curriculum: 'NCERT',
            difficulty: q.difficulty || difficulty,
          }));
        }
      } catch (err) {
        console.warn('[Quiz Gemini] Failed, trying OpenAI fallback:', err.message);
      }
    }

    // --- Fallback: OpenAI ---
    if (openai) {
      try {
        console.log(`[Quiz OpenAI] Generating ${count} questions as fallback`);
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: questionPrompt },
            { role: 'user', content: `Generate ${count} MCQs for Class ${classLevel} ${subjectDisplay}. Difficulty: ${difficulty}.` }
          ],
          temperature: 0.4,
          response_format: { type: 'json_object' }
        });

        const parsed = JSON.parse(response.choices[0].message.content);
        if (parsed.questions && Array.isArray(parsed.questions)) {
          return parsed.questions.map((q, idx) => ({
            id: `openai-${Date.now()}-${idx}`,
            question: q.question || `Sample ${subjectDisplay} question`,
            options: Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0,
            explanation: q.explanation || `Refer to NCERT Class ${classLevel} ${subjectDisplay}.`,
            hint: q.hint || `💡 Focus on core concepts.`,
            topic: q.topic || 'Core Concepts',
            chapterReference: q.chapterReference || `NCERT Class ${classLevel} ${subjectDisplay}`,
            source: q.source || 'https://ncert.nic.in/textbook.php',
            subject: subjectDisplay,
            classLevel: parseInt(q.classLevel, 10) || classLevel,
            curriculum: 'NCERT',
            difficulty: q.difficulty || difficulty,
          }));
        }
      } catch (err) {
        console.warn('[Quiz OpenAI] Also failed:', err.message);
      }
    }

    if (!gemini && !openai) {
      console.warn('[Quiz AI] No AI provider configured (no Gemini or OpenAI key)');
    }
    return [];
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

    // 3. Use AI to top-up or fully generate questions when DB has insufficient data
    if (questions.length < count && (gemini || openai)) {
      try {
        const needed = count - questions.length;
        const dbCount = questions.length;
        const aiQuestions = await generateAIQuestions({
          classLevel: parsedClass,
          subject: cleanSubject,
          difficulty: difficulty,
          count: needed,
          prompt: topic || ''
        });

        if (aiQuestions && aiQuestions.length > 0) {
          questions = [...questions, ...aiQuestions];
          // Determine source label: detect if Gemini or OpenAI generated
          const aiLabel = gemini ? 'gemini-generated' : 'openai-generated';
          source = dbCount === 0 ? aiLabel : `supabase-realtime+${aiLabel}`;
          console.log(`[Quiz AI] Added ${aiQuestions.length} AI questions (${aiLabel})`);
        }
      } catch (err) {
        console.warn('[Quiz AI] Generation failed, continuing with other sources:', err.message);
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
        { id: 11, label: 'Class 11 (NCERT Sets)', count: 20 },
        { id: 12, label: 'Class 12 (NCERT Sets)', count: 10 },
        { id: 'all', label: 'All Classes', count: 75 },
      ],
      subjects: [
        { id: 'all', label: 'All Subjects', count: 75 },
        { id: 'mathematics', label: 'Mathematics', count: 20 },
        { id: 'physics', label: 'Physics', count: 20 },
        { id: 'chemistry', label: 'Chemistry', count: 20 },
        { id: 'biology', label: 'Biology', count: 15 },
      ],
      source: 'fallback',
    });
  });

  return router;
}

module.exports = quizRoutes;