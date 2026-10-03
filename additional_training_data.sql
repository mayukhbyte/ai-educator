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
('Name the longest bone in the human body.', 'Femur', 'The femur, or thigh bone, is the longest and strongest bone in the human body.', 'Biology', 'Human Anatomy', 'General Knowledge', 'NCERT', 6, 'basic', 0.88, 'General Science');

-- Additional Educational Content
insert into educational_content (title, content, subject, topic, chapter_reference, curriculum, class_level, content_type, difficulty, quality_score, source)
values
('Ohm''s Law Formula', 'V = IR (Voltage = Current × Resistance)', 'Physics', 'Electricity', 'Chapter 12: Electricity', 'NCERT', 10, 'formula', 'basic', 0.95, 'NCERT Class 10 Science Textbook'),
('Definition of a Cell', 'The cell is the fundamental structural and functional unit of all living organisms.', 'Biology', 'Cell Biology', 'Chapter 5: The Fundamental Unit of Life', 'NCERT', 9, 'definition', 'basic', 0.95, 'NCERT Class 9 Science Textbook');
