-- Additional Training Data for AI Educator Platform
-- Run this script in your Supabase SQL Editor to insert more training QA pairs.

insert into training_qa_pairs (question, answer, explanation, subject, topic, chapter_reference, curriculum, class_level, difficulty, quality_score, source)
values
-- Mathematics
('What is the formula for the volume of a cylinder?', 'V = πr²h', 'The volume of a cylinder is the area of its base (πr²) multiplied by its height (h).', 'Mathematics', 'Mensuration', 'Chapter 13: Surface Areas and Volumes', 'NCERT', 9, 'basic', 0.90, 'NCERT Class 9 Maths Textbook'),
('How do you find the probability of an impossible event?', '0', 'The probability of an impossible event is always 0 because it cannot happen.', 'Mathematics', 'Probability', 'Chapter 15: Probability', 'NCERT', 10, 'basic', 0.95, 'NCERT Class 10 Maths Textbook'),
('What is the sum of the angles in a triangle?', '180 degrees', 'According to the angle sum property of a triangle, the interior angles always add up to 180 degrees.', 'Mathematics', 'Geometry', 'Chapter 6: Lines and Angles', 'NCERT', 9, 'basic', 0.92, 'NCERT Class 9 Maths Textbook'),

-- Science / Physics
('What is the SI unit of power?', 'Watt (W)', 'The SI unit of power is the watt, which is equal to one joule per second.', 'Physics', 'Work and Energy', 'Chapter 11: Work and Energy', 'NCERT', 9, 'basic', 0.90, 'NCERT Class 9 Science Textbook'),
('State the law of reflection.', 'The angle of incidence is equal to the angle of reflection.', 'When light reflects off a surface, the angle it hits the surface (incidence) equals the angle it leaves (reflection), and both angles are measured from the normal.', 'Physics', 'Light', 'Chapter 10: Light - Reflection and Refraction', 'NCERT', 10, 'medium', 0.93, 'NCERT Class 10 Science Textbook'),

-- Science / Chemistry
('What is an isotope?', 'Isotopes are atoms of the same element that have the same atomic number but different mass numbers.', 'They have the same number of protons but different numbers of neutrons in their nuclei.', 'Chemistry', 'Atomic Structure', 'Chapter 4: Structure of the Atom', 'NCERT', 9, 'medium', 0.91, 'NCERT Class 9 Science Textbook'),
('What happens when an acid reacts with a base?', 'It forms salt and water.', 'This is called a neutralization reaction. For example, HCl + NaOH → NaCl + H₂O.', 'Chemistry', 'Acids, Bases and Salts', 'Chapter 2: Acids, Bases and Salts', 'NCERT', 10, 'basic', 0.94, 'NCERT Class 10 Science Textbook'),

-- Biology
('What is the function of the stomata in leaves?', 'They allow for gas exchange (taking in CO2 and releasing O2) and transpiration (release of water vapor).', 'Stomata are tiny pores surrounded by guard cells that regulate their opening and closing.', 'Biology', 'Life Processes', 'Chapter 6: Life Processes', 'NCERT', 10, 'medium', 0.92, 'NCERT Class 10 Science Textbook'),
('Name the longest bone in the human body.', 'Femur', 'The femur, or thigh bone, is the longest and strongest bone in the human body.', 'Biology', 'Human Anatomy', 'General Knowledge', 'NCERT', 6, 'basic', 0.88, 'General Science'),

-- Class 11 Mathematics
('What is the value of i^4k + i^(4k+1) + i^(4k+2) + i^(4k+3)?', '0', 'i^4k = 1, i^(4k+1) = i, i^(4k+2) = -1, i^(4k+3) = -i. Their sum is 1 + i - 1 - i = 0.', 'Mathematics', 'Complex Numbers', 'Chapter 5: Complex Numbers', 'NCERT', 11, 'medium', 0.96, 'NCERT Class 11 Maths Textbook'),
('In how many ways can 5 distinct books be arranged on a shelf?', '120 ways', 'The number of permutations of 5 distinct items is 5! = 5 × 4 × 3 × 2 × 1 = 120.', 'Mathematics', 'Permutations and Combinations', 'Chapter 7: Permutations and Combinations', 'NCERT', 11, 'basic', 0.97, 'NCERT Class 11 Maths Textbook'),
('What is the sum of an infinite GP with first term a and ratio r (|r| < 1)?', 'S_∞ = a / (1 - r)', 'As n approaches infinity, r^n approaches 0, giving the sum formula S_∞ = a / (1 - r).', 'Mathematics', 'Sequences and Series', 'Chapter 9: Sequences and Series', 'NCERT', 11, 'basic', 0.98, 'NCERT Class 11 Maths Textbook'),
('What is the derivative of sin(x) from first principles?', 'cos(x)', 'lim(h→0) [sin(x + h) - sin(x)] / h = lim(h→0) [2 cos(x + h/2) sin(h/2)] / h = cos(x).', 'Mathematics', 'Limits and Derivatives', 'Chapter 13: Limits and Derivatives', 'NCERT', 11, 'medium', 0.96, 'NCERT Class 11 Maths Textbook'),

-- Class 11 Physics
('What is the escape velocity of a body from the surface of the Earth?', '11.2 km/s', 'Escape velocity is v_e = √(2gR) = √(2 × 9.8 × 6.4 × 10⁶) ≈ 11.2 km/s.', 'Physics', 'Gravitation', 'Chapter 8: Gravitation', 'NCERT', 11, 'medium', 0.97, 'NCERT Class 11 Physics Textbook'),
('State Hooke’s Law for an elastic material within its proportional limit.', 'Stress is directly proportional to Strain', 'Hooke’s Law states that within elastic limit, Stress ∝ Strain, or Stress / Strain = Modulus of Elasticity.', 'Physics', 'Mechanical Properties of Solids', 'Chapter 9: Mechanical Properties of Solids', 'NCERT', 11, 'basic', 0.98, 'NCERT Class 11 Physics Textbook'),
('State the First Law of Thermodynamics.', 'ΔQ = ΔU + ΔW', 'The heat supplied to a system equals the increase in its internal energy plus the work done by the system: ΔQ = ΔU + PΔV.', 'Physics', 'Thermodynamics', 'Chapter 12: Thermodynamics', 'NCERT', 11, 'basic', 0.98, 'NCERT Class 11 Physics Textbook'),

-- Class 11 Chemistry
('What is the shape and bond angle of methane (CH4)?', 'Tetrahedral with bond angle 109.5°', 'Carbon is sp3 hybridized with 4 bonding pairs and 0 lone pairs.', 'Chemistry', 'Chemical Bonding', 'Chapter 4: Chemical Bonding', 'NCERT', 11, 'basic', 0.98, 'NCERT Class 11 Chemistry Textbook'),
('What is the conjugate acid of NH3?', 'NH4+', 'According to Bronsted-Lowry, a conjugate acid forms when a base accepts H+: NH3 + H+ → NH4+.', 'Chemistry', 'Equilibrium', 'Chapter 7: Equilibrium', 'NCERT', 11, 'basic', 0.97, 'NCERT Class 11 Chemistry Textbook'),
('What is the oxidation number of chromium in K2Cr2O7?', '+6', '2(+1) + 2(Cr) + 7(-2) = 0 ⇒ 2(Cr) = 12 ⇒ Cr = +6.', 'Chemistry', 'Redox Reactions', 'Chapter 8: Redox Reactions', 'NCERT', 11, 'medium', 0.96, 'NCERT Class 11 Chemistry Textbook'),

-- Class 11 Biology
('Which enzyme is responsible for carbon fixation in C3 plants?', 'RuBisCO', 'RuBisCO catalyzes the carboxylation of ribulose 1,5-bisphosphate in the Calvin cycle.', 'Biology', 'Photosynthesis in Higher Plants', 'Chapter 13: Photosynthesis', 'NCERT', 11, 'basic', 0.97, 'NCERT Class 11 Biology Textbook'),
('What is the end product of glycolysis under aerobic conditions?', 'Pyruvic acid', 'One glucose molecule produces 2 pyruvates, 2 ATP, and 2 NADH in glycolysis.', 'Biology', 'Respiration in Plants', 'Chapter 14: Respiration', 'NCERT', 11, 'medium', 0.96, 'NCERT Class 11 Biology Textbook'),
('Which plant hormone is primarily responsible for apical dominance?', 'Auxin', 'Auxins produced at shoot tips inhibit the growth of lateral buds.', 'Biology', 'Plant Growth and Development', 'Chapter 15: Plant Growth', 'NCERT', 11, 'basic', 0.95, 'NCERT Class 11 Biology Textbook');

-- Additional Educational Content
insert into educational_content (title, content, subject, topic, chapter_reference, curriculum, class_level, content_type, difficulty, quality_score, source)
values
('Ohm''s Law Formula', 'V = IR (Voltage = Current × Resistance)', 'Physics', 'Electricity', 'Chapter 12: Electricity', 'NCERT', 10, 'formula', 'basic', 0.95, 'NCERT Class 10 Science Textbook'),
('Definition of a Cell', 'The cell is the fundamental structural and functional unit of all living organisms.', 'Biology', 'Cell Biology', 'Chapter 5: The Fundamental Unit of Life', 'NCERT', 9, 'definition', 'basic', 0.95, 'NCERT Class 9 Science Textbook');
