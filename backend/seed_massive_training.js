const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || 'https://pzyfbgdcflobybkwpirp.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(url, serviceKey);

const massiveQA = [
  // --- MATHEMATICS (Classes 9, 10, 11, 12) ---
  {
    question: 'Find the HCF of 96 and 404 by the prime factorisation method. Hence, find their LCM.',
    answer: 'HCF = 4, LCM = 9696',
    explanation: '96 = 2⁵ × 3, 404 = 2² × 101. HCF = 2² = 4. Using LCM(a,b) = (a × b)/HCF(a,b) = (96 × 404)/4 = 9696.',
    subject: 'Mathematics',
    topic: 'Real Numbers',
    chapter_reference: 'NCERT Class 10 Maths Chapter 1',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.98,
    source: 'https://ncert.nic.in/textbook.php?jemh1=1-15'
  },
  {
    question: 'Find a quadratic polynomial whose zeros are 5 and -2.',
    answer: 'k(x² - 3x - 10) where k is any non-zero real constant',
    explanation: 'Sum of zeros S = 5 + (-2) = 3. Product of zeros P = 5 × (-2) = -10. Polynomial is x² - Sx + P = x² - 3x - 10.',
    subject: 'Mathematics',
    topic: 'Polynomials',
    chapter_reference: 'NCERT Class 10 Maths Chapter 2',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'basic',
    quality_score: 0.99,
    source: 'https://ncert.nic.in/textbook.php?jemh1=2-15'
  },
  {
    question: 'Solve for x: 3x² - 2√6x + 2 = 0.',
    answer: 'x = √(2/3), √(2/3) (Equal real roots)',
    explanation: 'Discriminant D = (-2√6)² - 4(3)(2) = 24 - 24 = 0. Roots x = -b/(2a) = 2√6 / 6 = √6/3 = √(2/3).',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    chapter_reference: 'NCERT Class 10 Maths Chapter 4',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.97,
    source: 'https://ncert.nic.in/textbook.php?jemh1=4-15'
  },
  {
    question: 'How many two-digit numbers are divisible by 3?',
    answer: '30 numbers',
    explanation: 'The AP is 12, 15, 18, ..., 99. a = 12, d = 3, aₙ = 99. 99 = 12 + (n - 1)3 ⇒ 87 = 3(n - 1) ⇒ n - 1 = 29 ⇒ n = 30.',
    subject: 'Mathematics',
    topic: 'Arithmetic Progressions',
    chapter_reference: 'NCERT Class 10 Maths Chapter 5',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.98,
    source: 'https://ncert.nic.in/textbook.php?jemh1=5-15'
  },
  {
    question: 'Find the ratio in which the y-axis divides the line segment joining the points (5, -6) and (-1, -4).',
    answer: '5 : 1',
    explanation: 'Any point on y-axis has x-coordinate 0. Using section formula: 0 = [m₁(-1) + m₂(5)] / (m₁ + m₂) ⇒ -m₁ + 5m₂ = 0 ⇒ m₁/m₂ = 5/1.',
    subject: 'Mathematics',
    topic: 'Coordinate Geometry',
    chapter_reference: 'NCERT Class 10 Maths Chapter 7',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.98,
    source: 'https://ncert.nic.in/textbook.php?jemh1=7-15'
  },
  {
    question: 'Prove the identity: (sin θ - 2 sin³ θ) / (2 cos³ θ - cos θ) = ?',
    answer: 'tan θ',
    explanation: 'Numerator = sin θ(1 - 2 sin² θ) = sin θ cos 2θ. Denominator = cos θ(2 cos² θ - 1) = cos θ cos 2θ. Ratio = sin θ/cos θ = tan θ.',
    subject: 'Mathematics',
    topic: 'Introduction to Trigonometry',
    chapter_reference: 'NCERT Class 10 Maths Chapter 8',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'hard',
    quality_score: 0.96,
    source: 'https://ncert.nic.in/textbook.php?jemh1=8-15'
  },
  {
    question: 'From a point Q, the length of the tangent to a circle is 24 cm and the distance of Q from the centre is 25 cm. Find the radius of the circle.',
    answer: '7 cm',
    explanation: 'In right △OPQ, OP² + PQ² = OQ² ⇒ r² + 24² = 25² ⇒ r² = 625 - 576 = 49 ⇒ r = 7 cm.',
    subject: 'Mathematics',
    topic: 'Circles',
    chapter_reference: 'NCERT Class 10 Maths Chapter 10',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'basic',
    quality_score: 0.99,
    source: 'https://ncert.nic.in/textbook.php?jemh1=10-15'
  },
  {
    question: 'A metallic sphere of radius 4.2 cm is melted and recast into the shape of a cylinder of radius 6 cm. Find the height of the cylinder.',
    answer: '2.74 cm',
    explanation: 'Volume of cylinder = Volume of sphere ⇒ π(6)²h = (4/3)π(4.2)³ ⇒ 36h = (4/3)(74.088) = 98.784 ⇒ h = 2.744 cm.',
    subject: 'Mathematics',
    topic: 'Surface Areas and Volumes',
    chapter_reference: 'NCERT Class 10 Maths Chapter 13',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'hard',
    quality_score: 0.97,
    source: 'https://ncert.nic.in/textbook.php?jemh1=13-15'
  },
  {
    question: 'What is the derivative of f(x) = e^(3x) · sin(2x)?',
    answer: 'e^(3x) · [3 sin(2x) + 2 cos(2x)]',
    explanation: 'Using product rule d/dx[u·v] = u\'v + uv\': (3e^(3x))sin(2x) + e^(3x)(2 cos(2x)) = e^(3x)[3 sin(2x) + 2 cos(2x)].',
    subject: 'Mathematics',
    topic: 'Calculus',
    chapter_reference: 'NCERT Class 12 Maths Chapter 5',
    curriculum: 'NCERT',
    class_level: 12,
    difficulty: 'hard',
    quality_score: 0.98,
    source: 'https://ncert.nic.in/textbook.php?lemh1=5-13'
  },

  // --- PHYSICS (Classes 9, 10, 11, 12) ---
  {
    question: 'A concave mirror produces three times magnified real image of an object placed at 10 cm in front of it. Where is the image located and what is the focal length?',
    answer: 'v = -30 cm, f = -7.5 cm',
    explanation: 'm = -v/u = -3 ⇒ v = 3u = 3(-10) = -30 cm. 1/f = 1/v + 1/u = 1/(-30) + 1/(-10) = -4/30 = -2/15 ⇒ f = -7.5 cm.',
    subject: 'Physics',
    topic: 'Light - Reflection and Refraction',
    chapter_reference: 'NCERT Class 10 Science Chapter 10',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'hard',
    quality_score: 0.98,
    source: 'https://ncert.nic.in/textbook.php?jesc1=10-16'
  },
  {
    question: 'Calculate the resistance of 1 km long copper wire of radius 1 mm (Resistivity of copper = 1.72 × 10⁻⁸ Ω·m).',
    answer: '5.47 Ω',
    explanation: 'Area A = πr² = π(10⁻³)² = 3.1416 × 10⁻⁶ m². R = ρL/A = (1.72 × 10⁻⁸ × 1000)/(3.1416 × 10⁻⁶) ≈ 5.47 Ω.',
    subject: 'Physics',
    topic: 'Electricity',
    chapter_reference: 'NCERT Class 10 Science Chapter 12',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'hard',
    quality_score: 0.97,
    source: 'https://ncert.nic.in/textbook.php?jesc1=12-16'
  },
  {
    question: 'An electric heater rated 1000 W operates for 2 hours daily. What is the electrical energy consumed in 30 days in commercial units (kWh)?',
    answer: '60 kWh (units)',
    explanation: 'Energy per day = Power × Time = 1 kW × 2 h = 2 kWh. In 30 days = 2 × 30 = 60 kWh.',
    subject: 'Physics',
    topic: 'Electricity',
    chapter_reference: 'NCERT Class 10 Science Chapter 12',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.99,
    source: 'https://ncert.nic.in/textbook.php?jesc1=12-16'
  },
  {
    question: 'Why are magnetic field lines continuous closed curves and do not intersect each other?',
    answer: 'If they intersected, at the point of intersection a compass needle would point in two different directions, which is physically impossible.',
    explanation: 'Magnetic field lines emerge from North pole and enter South pole externally, continuing South to North internally, forming continuous closed loops.',
    subject: 'Physics',
    topic: 'Magnetic Effects of Electric Current',
    chapter_reference: 'NCERT Class 10 Science Chapter 13',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.98,
    source: 'https://ncert.nic.in/textbook.php?jesc1=13-16'
  },
  {
    question: 'State Lenz’s law of electromagnetic induction.',
    answer: 'The direction of induced electromotive force (or current) always opposes the change in magnetic flux that produces it.',
    explanation: 'Lenz’s law is a direct consequence of the Law of Conservation of Energy applied to electromagnetic induction (E = -dΦ/dt).',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    chapter_reference: 'NCERT Class 12 Physics Chapter 6',
    curriculum: 'NCERT',
    class_level: 12,
    difficulty: 'medium',
    quality_score: 0.99,
    source: 'https://ncert.nic.in/textbook.php?leph1=6-14'
  },

  // --- CHEMISTRY (Classes 9, 10, 11, 12) ---
  {
    question: 'Balance the chemical equation: Fe + H₂O (steam) → Fe₃O₄ + H₂.',
    answer: '3Fe + 4H₂O → Fe₃O₄ + 4H₂',
    explanation: '3 Fe atoms on both sides, 8 H atoms (4H₂O and 4H₂), and 4 O atoms (4H₂O and Fe₃O₄).',
    subject: 'Chemistry',
    topic: 'Chemical Reactions and Equations',
    chapter_reference: 'NCERT Class 10 Science Chapter 1',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'basic',
    quality_score: 0.99,
    source: 'https://ncert.nic.in/textbook.php?jesc1=1-16'
  },
  {
    question: 'What is the difference between calcination and roasting in metallurgy?',
    answer: 'Calcination heats carbonate ores in limited/no air; Roasting heats sulphide ores in excess air.',
    explanation: 'Calcination: ZnCO₃ → ZnO + CO₂. Roasting: 2ZnS + 3O₂ → 2ZnO + 2SO₂. Both convert concentrated ores into metal oxides.',
    subject: 'Chemistry',
    topic: 'Metals and Non-metals',
    chapter_reference: 'NCERT Class 10 Science Chapter 3',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.98,
    source: 'https://ncert.nic.in/textbook.php?jesc1=3-16'
  },
  {
    question: 'Explain the cleansing action of soap and the formation of micelles.',
    answer: 'Hydrophobic hydrocarbon tails bind oily dirt while hydrophilic ionic heads interact with water, forming spherical clusters called micelles that suspend dirt in emulsion.',
    explanation: 'Soap molecules (RCOO⁻Na⁺) have dual polarity. In water, tails cluster internally and heads face outward, washing oily droplets away upon agitation.',
    subject: 'Chemistry',
    topic: 'Carbon and its Compounds',
    chapter_reference: 'NCERT Class 10 Science Chapter 4',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'hard',
    quality_score: 0.98,
    source: 'https://ncert.nic.in/textbook.php?jesc1=4-16'
  },
  {
    question: 'What happens when ethanol is heated with concentrated sulfuric acid at 443 K?',
    answer: 'Ethanol undergoes dehydration to form Ethene (CH₂=CH₂) and water.',
    explanation: 'CH₃CH₂OH --(Conc H₂SO₄, 443 K)--> CH₂=CH₂ + H₂O. Concentrated sulfuric acid acts as a powerful dehydrating agent.',
    subject: 'Chemistry',
    topic: 'Carbon and its Compounds',
    chapter_reference: 'NCERT Class 10 Science Chapter 4',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.99,
    source: 'https://ncert.nic.in/textbook.php?jesc1=4-16'
  },

  // --- BIOLOGY (Classes 9, 10, 11, 12) ---
  {
    question: 'Why is double circulation in human heart necessary?',
    answer: 'It completely separates oxygenated and deoxygenated blood, ensuring highly efficient oxygen delivery to maintain constant body temperature (warm-blooded).',
    explanation: 'The human heart has 4 distinct chambers (2 atria, 2 ventricles) preventing oxygen-rich blood from mixing with carbon dioxide-rich blood.',
    subject: 'Biology',
    topic: 'Life Processes',
    chapter_reference: 'NCERT Class 10 Science Chapter 6',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.99,
    source: 'https://ncert.nic.in/textbook.php?jesc1=6-16'
  },
  {
    question: 'What is a reflex arc and how does it ensure rapid involuntary response to stimuli?',
    answer: 'The neural pathway from receptor → sensory neuron → spinal cord relay neuron → motor neuron → effector muscle.',
    explanation: 'By routing the reflex signal through the spinal cord before reaching the conscious brain, response time is minimized to prevent bodily harm.',
    subject: 'Biology',
    topic: 'Control and Coordination',
    chapter_reference: 'NCERT Class 10 Science Chapter 7',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.98,
    source: 'https://ncert.nic.in/textbook.php?jesc1=7-16'
  },
  {
    question: 'How is sex determined in human beings genetically?',
    answer: 'By sex chromosomes: Females have XX (homogametic, producing only X ova), Males have XY (heterogametic, producing 50% X and 50% Y sperm).',
    explanation: 'Fertilization of an ovum with X sperm results in a female child (XX); with Y sperm results in a male child (XY).',
    subject: 'Biology',
    topic: 'Heredity and Evolution',
    chapter_reference: 'NCERT Class 10 Science Chapter 9',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'basic',
    quality_score: 0.99,
    source: 'https://ncert.nic.in/textbook.php?jesc1=9-16'
  },
  {
    question: 'What causes ozone layer depletion in the stratosphere and what international agreement curtailed it?',
    answer: 'Chlorofluorocarbons (CFCs) releasing reactive chlorine free radicals; Montreal Protocol (1987) froze and phased out CFC production.',
    explanation: 'A single chlorine radical from UV-dissociated CFCs can catalytically destroy up to 100,000 ozone (O₃) molecules.',
    subject: 'Biology',
    topic: 'Our Environment',
    chapter_reference: 'NCERT Class 10 Science Chapter 15',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'basic',
    quality_score: 0.98,
    source: 'https://ncert.nic.in/textbook.php?jesc1=15-16'
  }
];

const educationalContent = [
  {
    title: 'Class 10 CBSE Board Exam Blueprint & Weightage Breakdown',
    content: 'Mathematics (80 marks): Number Systems (6), Algebra (20), Coordinate Geometry (6), Geometry (15), Trigonometry (12), Mensuration (10), Statistics & Probability (11). Science (80 marks): Chemical Substances (25), World of Living (25), Natural Phenomena (12), Effects of Current (13), Natural Resources (5).',
    subject: 'Exam Prep',
    topic: 'Board Exam Blueprint',
    chapter_reference: 'CBSE / NCERT Annual Exam Curriculum Matrix',
    curriculum: 'NCERT',
    class_level: 10,
    content_type: 'blueprint',
    difficulty: 'medium',
    quality_score: 0.99,
    source: 'https://ncert.nic.in/curriculum.php'
  },
  {
    title: 'Assertion-Reason Solving Strategy Rubric',
    content: '1. Check if Assertion (A) is true independently. 2. Check if Reason (R) is true independently. 3. If both are true, verify if R is the exact scientific cause of A (use "because" connector). 4. If R does not cause A, select option (b).',
    subject: 'Exam Prep',
    topic: 'Assertion-Reason Framework',
    chapter_reference: 'Standard Board Exam Rubric',
    curriculum: 'NCERT',
    class_level: 10,
    content_type: 'exam_strategy',
    difficulty: 'medium',
    quality_score: 0.98,
    source: 'https://ncert.nic.in/exemplar-problems.php'
  },
  {
    title: 'Complete Trigonometric Identities & Value Table Reference',
    content: 'sin²θ + cos²θ = 1 | 1 + tan²θ = sec²θ | 1 + cot²θ = cosec²θ. Values (0°, 30°, 45°, 60°, 90°): sin = (0, 1/2, 1/√2, √3/2, 1); cos = (1, √3/2, 1/√2, 1/2, 0); tan = (0, 1/√3, 1, √3, Undefined).',
    subject: 'Mathematics',
    topic: 'Trigonometry Formula Sheet',
    chapter_reference: 'NCERT Class 10 Maths Chapter 8',
    curriculum: 'NCERT',
    class_level: 10,
    content_type: 'formula_sheet',
    difficulty: 'basic',
    quality_score: 0.99,
    source: 'https://ncert.nic.in/textbook.php?jemh1=8-15'
  },
  {
    title: 'Electricity & Circuits Mastery Guide',
    content: 'Ohm’s law V = IR. Resistance R = ρL/A. Series: R = R₁ + R₂ + ... (same current). Parallel: 1/R = 1/R₁ + 1/R₂ + ... (same voltage). Joule Heating H = I²Rt. Electric Power P = VI = I²R = V²/R.',
    subject: 'Physics',
    topic: 'Electricity Formula Matrix',
    chapter_reference: 'NCERT Class 10 Science Chapter 12',
    curriculum: 'NCERT',
    class_level: 10,
    content_type: 'formula_sheet',
    difficulty: 'basic',
    quality_score: 0.99,
    source: 'https://ncert.nic.in/textbook.php?jesc1=12-16'
  }
];

async function seedMassive() {
  console.log('--- SEEDING EXTENSIVE TRAINING DATA TO SUPABASE ---');

  // Insert Q&A into 'education'
  const { error: qaErr } = await supabase.from('education').insert(massiveQA);
  if (qaErr) {
    console.error('Error inserting QA pairs:', qaErr.message);
  } else {
    console.log(`Successfully added ${massiveQA.length} advanced training QA items!`);
  }

  // Insert blueprints/formulas into 'train'
  const { error: cntErr } = await supabase.from('train').insert(educationalContent);
  if (cntErr) {
    console.error('Error inserting educational content:', cntErr.message);
  } else {
    console.log(`Successfully added ${educationalContent.length} exam blueprints and formula sheets!`);
  }

  const { count: eduCount } = await supabase.from('education').select('*', { count: 'exact', head: true });
  const { count: trainCount } = await supabase.from('train').select('*', { count: 'exact', head: true });
  console.log(`\n✅ Supabase Training Base Size:`);
  console.log(`- 'education' Table: ${eduCount} QA pairs`);
  console.log(`- 'train' Table: ${trainCount} Content & Blueprint records`);
}

seedMassive();
