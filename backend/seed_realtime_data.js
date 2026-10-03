const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || 'https://pzyfbgdcflobybkwpirp.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(url, serviceKey);

const additionalQA = [
  // Mathematics
  {
    question: 'What is the quadratic formula used to solve ax² + bx + c = 0?',
    answer: 'x = (-b ± √(b² - 4ac)) / (2a)',
    explanation: 'The quadratic formula yields solutions for any quadratic equation, with b² - 4ac acting as the discriminant determining root types.',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    chapter_reference: 'Chapter 4: Quadratic Equations',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.96,
    source: 'NCERT Class 10 Mathematics',
  },
  {
    question: 'What is the Pythagorean theorem?',
    answer: 'a² + b² = c²',
    explanation: 'In a right-angled triangle, the square of the hypotenuse (c) is equal to the sum of the squares of the other two sides (a and b).',
    subject: 'Mathematics',
    topic: 'Triangles',
    chapter_reference: 'Chapter 6: Triangles',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'basic',
    quality_score: 0.98,
    source: 'NCERT Class 10 Mathematics',
  },
  {
    question: 'What is the derivative of sin(x) with respect to x?',
    answer: 'cos(x)',
    explanation: 'By the limit definition of the derivative and standard trigonometric limits, d/dx[sin(x)] = cos(x).',
    subject: 'Mathematics',
    topic: 'Calculus',
    chapter_reference: 'Chapter 5: Continuity and Differentiability',
    curriculum: 'NCERT',
    class_level: 12,
    difficulty: 'medium',
    quality_score: 0.95,
    source: 'NCERT Class 12 Mathematics',
  },
  {
    question: 'How do you calculate the arithmetic mean of n numbers?',
    answer: 'Mean = (Sum of all observations) / (Total number of observations)',
    explanation: 'Symbolically, x̄ = (∑xi) / n, representing the central value of a finite set of numbers.',
    subject: 'Mathematics',
    topic: 'Statistics',
    chapter_reference: 'Chapter 14: Statistics',
    curriculum: 'NCERT',
    class_level: 9,
    difficulty: 'basic',
    quality_score: 0.92,
    source: 'NCERT Class 9 Mathematics',
  },

  // Physics
  {
    question: 'What is the acceleration due to gravity on the surface of Earth?',
    answer: 'g ≈ 9.8 m/s²',
    explanation: 'The acceleration experienced by an object solely due to Earth’s gravitational force at sea level is approximately 9.8 meters per second squared.',
    subject: 'Physics',
    topic: 'Gravitation',
    chapter_reference: 'Chapter 10: Gravitation',
    curriculum: 'NCERT',
    class_level: 9,
    difficulty: 'basic',
    quality_score: 0.97,
    source: 'NCERT Class 9 Science',
  },
  {
    question: 'State Archimedes’ principle.',
    answer: 'When a body is immersed fully or partially in a fluid, it experiences an upward buoyant force equal to the weight of the fluid displaced by it.',
    explanation: 'This buoyant force explains why ships float and forms the basis for calculating specific gravity using hydrometers.',
    subject: 'Physics',
    topic: 'Fluids and Gravitation',
    chapter_reference: 'Chapter 10: Gravitation',
    curriculum: 'NCERT',
    class_level: 9,
    difficulty: 'medium',
    quality_score: 0.94,
    source: 'NCERT Class 9 Science',
  },
  {
    question: 'What is Snell’s law of refraction?',
    answer: 'sin(i) / sin(r) = n₂ / n₁ (constant)',
    explanation: 'The ratio of the sine of the angle of incidence to the sine of the angle of refraction is constant for a given pair of media and frequency.',
    subject: 'Physics',
    topic: 'Light - Optics',
    chapter_reference: 'Chapter 10: Light - Reflection and Refraction',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.95,
    source: 'NCERT Class 10 Science',
  },

  // Chemistry
  {
    question: 'What is Avogadro’s number?',
    answer: '6.022 × 10²³ particles/mole',
    explanation: 'Avogadro’s number represents the number of constituent particles (usually atoms or molecules) contained in one mole of any chemical substance.',
    subject: 'Chemistry',
    topic: 'Mole Concept',
    chapter_reference: 'Chapter 3: Atoms and Molecules',
    curriculum: 'NCERT',
    class_level: 9,
    difficulty: 'basic',
    quality_score: 0.98,
    source: 'NCERT Class 9 Science',
  },
  {
    question: 'What is the difference between an exothermic and endothermic reaction?',
    answer: 'Exothermic reactions release heat (ΔH < 0), while endothermic reactions absorb heat from the surroundings (ΔH > 0).',
    explanation: 'Combustion and respiration are exothermic; photosynthesis and thermal decomposition of calcium carbonate are endothermic.',
    subject: 'Chemistry',
    topic: 'Chemical Reactions and Equations',
    chapter_reference: 'Chapter 1: Chemical Reactions and Equations',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.93,
    source: 'NCERT Class 10 Science',
  },
  {
    question: 'What is the periodic law proposed by Dmitri Mendeleev?',
    answer: 'The properties of elements are a periodic function of their atomic masses.',
    explanation: 'Modern periodic law, amended by Henry Moseley, states that properties are periodic functions of atomic numbers instead.',
    subject: 'Chemistry',
    topic: 'Periodic Classification',
    chapter_reference: 'Chapter 5: Periodic Classification of Elements',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'medium',
    quality_score: 0.91,
    source: 'NCERT Class 10 Science',
  },

  // Biology
  {
    question: 'What is the role of hemoglobin in human blood?',
    answer: 'Hemoglobin binds to oxygen in the lungs and transports it to tissues throughout the body.',
    explanation: 'Hemoglobin is an iron-containing metalloprotein found in red blood cells that reversibly binds molecular oxygen.',
    subject: 'Biology',
    topic: 'Respiration and Circulation',
    chapter_reference: 'Chapter 6: Life Processes',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'basic',
    quality_score: 0.96,
    source: 'NCERT Class 10 Science',
  },
  {
    question: 'What is DNA and what does it stand for?',
    answer: 'Deoxyribonucleic Acid; the hereditary molecule that carries genetic instructions for development and functioning of living organisms.',
    explanation: 'DNA has a double helix structure discovered by Watson and Crick, composed of nucleotides (adenine, thymine, cytosine, guanine).',
    subject: 'Biology',
    topic: 'Heredity and Evolution',
    chapter_reference: 'Chapter 9: Heredity and Evolution',
    curriculum: 'NCERT',
    class_level: 10,
    difficulty: 'basic',
    quality_score: 0.97,
    source: 'NCERT Class 10 Science',
  },
];

const additionalContent = [
  {
    title: 'Newton’s Second Law Formula',
    content: 'F = ma (Force = Mass × Acceleration)',
    subject: 'Physics',
    topic: 'Dynamics',
    chapter_reference: 'Chapter 9: Force and Laws of Motion',
    curriculum: 'NCERT',
    class_level: 9,
    content_type: 'formula',
    difficulty: 'basic',
    quality_score: 0.98,
    source: 'NCERT Class 9 Science',
  },
  {
    title: 'Kinetic Energy Formula',
    content: 'KE = ½mv² (Kinetic Energy = 0.5 × Mass × Velocity²)',
    subject: 'Physics',
    topic: 'Work and Energy',
    chapter_reference: 'Chapter 11: Work and Energy',
    curriculum: 'NCERT',
    class_level: 9,
    content_type: 'formula',
    difficulty: 'basic',
    quality_score: 0.96,
    source: 'NCERT Class 9 Science',
  },
  {
    title: 'Ideal Gas Law',
    content: 'PV = nRT (Pressure × Volume = Moles × Gas Constant × Temperature)',
    subject: 'Chemistry',
    topic: 'States of Matter',
    chapter_reference: 'Chapter 5: States of Matter',
    curriculum: 'NCERT',
    class_level: 11,
    content_type: 'formula',
    difficulty: 'medium',
    quality_score: 0.95,
    source: 'NCERT Class 11 Chemistry',
  },
  {
    title: 'Mitochondria Definition',
    content: 'Double-membraned cell organelles responsible for ATP generation through oxidative phosphorylation.',
    subject: 'Biology',
    topic: 'Cell Biology',
    chapter_reference: 'Chapter 5: The Fundamental Unit of Life',
    curriculum: 'NCERT',
    class_level: 9,
    content_type: 'definition',
    difficulty: 'basic',
    quality_score: 0.94,
    source: 'NCERT Class 9 Science',
  },
];

async function seed() {
  console.log('Inserting additional QA pairs into Supabase education table...');
  const { data: qData, error: qErr } = await supabase.from('education').upsert(additionalQA);
  if (qErr) {
    console.error('Error inserting QA pairs:', qErr);
  } else {
    console.log(`Successfully added ${additionalQA.length} QA pairs to education table!`);
  }

  console.log('Inserting additional content into Supabase train table...');
  const { data: cData, error: cErr } = await supabase.from('train').upsert(additionalContent);
  if (cErr) {
    console.error('Error inserting content:', cErr);
  } else {
    console.log(`Successfully added ${additionalContent.length} items to train table!`);
  }
}

seed();
