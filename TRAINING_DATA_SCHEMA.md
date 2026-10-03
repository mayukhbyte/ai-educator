# Training Data Schema for AI Tutor Platform

This schema defines tables for storing training data that can be used to improve AI responses through few-shot prompting and context retrieval.

## Tables

### 1. training_qa_pairs
High-quality question-answer pairs used for few-shot prompting to improve AI response quality.

```sql
create table training_qa_pairs (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  answer text not null,
  explanation text,
  subject text not null,
  topic text not null,
  chapter_reference text,
  curriculum text default 'NCERT',
  class_level integer check (class_level >= 1 and class_level <= 12), -- Class 1-12
  difficulty text check (difficulty in ('basic', 'medium', 'hard')) not null,
  quality_score decimal(3,2) check (quality_score >= 0 and quality_score <= 1) not null, -- Score from 0.00 to 1.00
  source text, -- Source of the question (e.g., 'NCERT Class 10 Maths', 'Previous Year Paper')
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- Indexes for better query performance
create index idx_training_qa_pairs_subject_topic on training_qa_pairs(subject, topic);
create index idx_training_qa_pairs_difficulty on training_qa_pairs(difficulty);
create index idx_training_qa_pairs_quality on training_qa_pairs(quality_score desc);
create index idx_training_qa_pairs_class_level on training_qa_pairs(class_level);
create index idx_training_qa_pairs_curriculum on training_qa_pairs(curriculum);
create index idx_training_qa_pairs_chapter on training_qa_pairs(chapter_reference);

-- Row Level Security
alter table training_qa_pairs enable row level security;

create policy "Training QA pairs are viewable by everyone" on training_qa_pairs for select using (true);
create policy "Only admins can modify training QA pairs" on training_qa_pairs for all using (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 2. educational_content
Structured educational content (definitions, examples, formulas, etc.) for context retrieval.

```sql
create table educational_content (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  subject text not null,
  topic text not null,
  chapter_reference text,
  curriculum text default 'NCERT',
  class_level integer check (class_level >= 1 and class_level <= 12), -- Class 1-12
  content_type text check (content_type in ('definition', 'example', 'formula', 'theorem', 'procedure')) not null,
  difficulty text check (difficulty in ('basic', 'medium', 'hard')) not null,
  quality_score decimal(3,2) check (quality_score >= 0 and quality_score <= 1) not null,
  source text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- Indexes for better query performance
create index idx_educational_content_subject_topic on educational_content(subject, topic);
create index idx_educational_content_class_level on educational_content(class_level);
create index idx_educational_content_curriculum on educational_content(curriculum);
create index idx_educational_content_chapter on educational_content(chapter_reference);

-- Row Level Security
alter table educational_content enable row level security;

create policy "Educational content is viewable by everyone" on educational_content for select using (true);
create policy "Only admins can modify educational content" on educational_content for all using (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 3. ai_response_feedback
Feedback on AI responses to continuously improve training data quality.

```sql
create table ai_response_feedback (
  id uuid primary key default uuid_generate_v4(),
  doubt_session_id uuid references doubt_sessions(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  feedback text,
  helpful boolean not null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Indexes for better query performance
create index idx_ai_response_feedback_session on ai_response_feedback(doubt_session_id);
create index idx_ai_response_feedback_user on ai_response_feedback(user_id);
create index idx_ai_response_feedback_rating on ai_response_feedback(rating);

-- Row Level Security
alter table ai_response_feedback enable row level security;

create policy "Users can view their own AI response feedback" on ai_response_feedback for select using (auth.uid() = user_id);
create policy "Users can insert their own AI response feedback" on ai_response_feedback for insert with check (auth.uid() = user_id);
```

### 4. conversation_contexts
Context for ongoing conversations to improve AI responses through personalization.

```sql
create table conversation_contexts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  session_id text not null, -- Frontend session ID
  context_data jsonb not null, -- Stores conversation history, user preferences, etc.
  subject text,
  topic text,
  chapter_reference text,
  curriculum text default 'NCERT',
  class_level integer check (class_level >= 1 and class_level <= 12), -- Class 1-12
  updated_at timestamp with time zone default timezone('utc', now()) not null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Indexes for better query performance
create index idx_conversation_contexts_user on conversation_contexts(user_id);
create index idx_conversation_contexts_subject_topic on conversation_contexts(subject, topic);
create index idx_conversation_contexts_class_level on conversation_contexts(class_level);
create index idx_conversation_contexts_curriculum on conversation_contexts(curriculum);
create index idx_conversation_contexts_chapter on conversation_contexts(chapter_reference);

-- Row Level Security
alter table conversation_contexts enable row level security;

create policy "Users can view their own conversation contexts" on conversation_contexts for select using (auth.uid() = user_id);
create policy "Users can update their own conversation contexts" on conversation_contexts for update using (auth.uid() = user_id);
create policy "Users can insert their own conversation contexts" on conversation_contexts for insert with check (auth.uid() = user_id);
```

## How to Use Training Data for Few-Shot Prompting

The training data stored in these tables can be retrieved and used to create few-shot prompts for OpenAI GPT-4o to improve response quality and consistency.

### Example Format for Few-Shot Prompts

When retrieving training examples, format them as follows:

```
Example Question: [Question text]
Example Answer: [Answer text]
[Explanation: [Explanation text] if available]
```

### Sample Data

Here's sample data showing how to structure training data for different classes and subjects:

#### Mathematics - Class 10 (NCERT)
```sql
insert into training_qa_pairs (question, answer, explanation, subject, topic, chapter_reference, curriculum, class_level, difficulty, quality_score, source)
values
('What is the Pythagorean theorem?', 'In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides.', 'This theorem helps in calculating the length of any side of a right-angled triangle when the other two sides are known.', 'Mathematics', 'Geometry', 'Chapter 6: Triangles', 'NCERT', 10, 'medium', 0.95, 'NCERT Class 10 Maths Textbook'),
('Solve the quadratic equation: x² - 5x + 6 = 0', 'x = 2 or x = 3', 'Factorizing: (x-2)(x-3) = 0, therefore x = 2 or x = 3.', 'Mathematics', 'Algebra', 'Chapter 4: Quadratic Equations', 'NCERT', 10, 'medium', 0.92, 'NCERT Class 10 Maths Textbook'),
('Find the area of a circle with radius 7 cm.', '154 cm²', 'Area = πr² = (22/7) × 7 × 7 = 154 cm².', 'Mathematics', 'Mensuration', 'Chapter 12: Areas Related to Circles', 'NCERT', 10, 'basic', 0.9, 'NCERT Class 10 Maths Textbook');
```

#### Physics - Class 11 (NCERT)
```sql
insert into training_qa_pairs (question, answer, explanation, subject, topic, chapter_reference, curriculum, class_level, difficulty, quality_score, source)
values
('What is Newton''s Second Law of Motion?', 'F = ma', 'Force equals mass times acceleration. This law explains how the velocity of an object changes when it is subjected to an external force.', 'Physics', 'Mechanics', 'Chapter 3: Laws of Motion', 'NCERT', 11, 'medium', 0.92, 'NCERT Class 11 Physics Textbook'),
('What is the formula for kinetic energy?', 'KE = ½mv²', 'Kinetic energy is the energy possessed by a body due to its motion.', 'Physics', 'Work, Energy and Power', 'Chapter 4: Work, Energy and Power', 'NCERT', 11, 'basic', 0.9, 'NCERT Class 11 Physics Textbook'),
('State Ohm''s law.', 'V = IR', 'At constant temperature, the current flowing through a conductor is directly proportional to the potential difference across its ends.', 'Physics', 'Current Electricity', 'Chapter 3: Current Electricity', 'NCERT', 12, 'basic', 0.88, 'NCERT Class 12 Physics Textbook');
```

#### Chemistry - Class 12 (NCERT)
```sql
insert into training_qa_pairs (question, answer, explanation, subject, topic, chapter_reference, curriculum, class_level, difficulty, quality_score, source)
values
('What is the atomic number of carbon?', '6', 'The atomic number of an element is the number of protons in the nucleus of its atom.', 'Chemistry', 'Atomic Structure', 'Chapter 2: Structure of Atom', 'NCERT', 11, 'basic', 0.85, 'NCERT Class 11 Chemistry Textbook'),
('Write the balanced chemical equation for the reaction between sodium and chlorine.', '2Na + Cl₂ → 2NaCl', 'Sodium metal reacts with chlorine gas to form sodium chloride.', 'Chemistry', 'Chemical Bonding', 'Chapter 3: Classification of Elements and Periodicity in Properties', 'NCERT', 12, 'basic', 0.9, 'NCERT Class 12 Chemistry Textbook');
```

#### Biology - Class 9 (NCERT)
```sql
insert into training_qa_pairs (question, answer, explanation, subject, topic, chapter_reference, curriculum, class_level, difficulty, quality_score, source)
values
('What is the powerhouse of the cell?', 'Mitochondria', 'Mitochondria are known as the powerhouse of the cell because they produce most of the cell''s supply of ATP.', 'Biology', 'Cell Structure', 'Chapter 5: The Fundamental Unit of Life', 'NCERT', 9, 'basic', 0.88, 'NCERT Class 9 Biology Textbook'),
('What is photosynthesis?', 'Photosynthesis is the process by which green plants use sunlight to synthesize foods from carbon dioxide and water.', 'Photosynthesis involves the green pigment chlorophyll and generates oxygen as a byproduct.', 'Biology', 'Plant Physiology', 'Chapter 1: Cell Structure', 'NCERT', 10, 'medium', 0.9, 'NCERT Class 10 Biology Textbook');
```

### Adding More Training Data

To add more training data:
1. Insert additional records into the `training_qa_pairs` table following the format above
2. Ensure proper classification by subject, topic, chapter_reference, curriculum, and class_level
3. Assign appropriate difficulty levels (basic, medium, hard)
4. Provide quality scores based on accuracy and educational value (0.00 to 1.00)
5. Include source information for provenance

### Using Training Data in AI Prompts

The backend retrieves relevant training examples using queries like:
```sql
select question, answer, explanation 
from training_qa_pairs 
where subject = $1 and topic = $2 and class_level = $3 
order by quality_score desc 
limit 3
```

These examples are then formatted into few-shot prompts to guide the AI's response style and quality.

## Educational Content Structure

The `educational_content` table stores structured learning materials that can be used for context retrieval:

### Content Types
- **definition**: Formal definitions of concepts
- **example**: Worked examples illustrating concepts
- **formula**: Mathematical formulas and equations
- **theorem**: Mathematical theorems and their explanations
- **procedure**: Step-by-step procedures or methods

### Sample Educational Content
```sql
insert into educational_content (title, content, subject, topic, chapter_reference, curriculum, class_level, content_type, difficulty, quality_score, source)
values
('Quadratic Formula', 'For any quadratic equation ax² + bx + c = 0, the solutions are given by x = (-b ± √(b² - 4ac)) / 2a', 'Mathematics', 'Algebra', 'Chapter 4: Quadratic Equations', 'NCERT', 10, 'formula', 'medium', 0.93, 'NCERT Class 10 Maths Textbook'),
('Photosynthesis Equation', '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', 'Biology', 'Plant Physiology', 'Chapter 1: Cell Structure', 'NCERT', 9, 'formula', 'basic', 0.9, 'NCERT Class 9 Biology Textbook'),
('Pythagorean Theorem', 'In a right-angled triangle, a² + b² = c² where c is the hypotenuse.', 'Mathematics', 'Geometry', 'Chapter 6: Triangles', 'NCERT', 10, 'theorem', 'medium', 0.95, 'NCERT Class 10 Maths Textbook');
```

This training data schema enables:
- Class-wise organization (Class 1-12)
- Curriculum alignment (NCERT, CBSE, ICSE, State Board)
- Chapter and topic referencing
- Quality-controlled training examples for AI improvement
- Structured educational content for context retrieval
- Continuous improvement through feedback mechanisms