# Supabase Schema for AI Tutor Platform

## Tables

### 1. profiles
Stores user profile information.

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text check (role in ('student', 'teacher', 'admin')) default 'student',
  school_name text,
  grade_level integer check (grade_level >= 1 and grade_level <= 12),
  curriculum text default 'NCERT', -- NCERT, CBSE, ICSE, State Board, etc.
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
```

### 2. doubt_sessions
Stores student doubts and AI responses.

```sql
create table doubt_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  question text not null,
  subject text not null, -- e.g., Mathematics, Physics, Chemistry
  topic text not null, -- e.g., Algebra, Mechanics, Organic Chemistry
  chapter_reference text, -- Reference to specific chapter in textbook
  curriculum text default 'NCERT', -- NCERT, CBSE, ICSE, State Board
  class_level integer check (class_level >= 1 and class_level <= 12), -- Class 1-12
  level text check (level in ('basic', 'medium', 'overview')) not null,
  ai_response text,
  feedback text, -- Optional student feedback on the AI response
  rating integer check (rating >= 1 and rating <= 5), -- Optional rating 1-5
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

alter table doubt_sessions enable row level security;

create policy "Users can view their own doubt sessions" on doubt_sessions for select using (auth.uid() = user_id);
create policy "Users can insert their own doubt sessions" on doubt_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update their own doubt sessions" on doubt_sessions for update using (auth.uid() = user_id);
```

### 3. quiz_questions
Store questions for quizzes and question banks.

```sql
create table quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  question_text text not null,
  subject text not null,
  topic text not null,
  chapter_reference text,
  curriculum text default 'NCERT',
  class_level integer check (class_level >= 1 and class_level <= 12), -- Class 1-12
  difficulty text check (difficulty in ('easy', 'medium', 'hard')) not null,
  question_type text check (question_type in ('multiple_choice', 'short_answer', 'long_answer', 'numerical')) not null,
  options jsonb, -- For multiple choice questions: {"A": "option1", "B": "option2", "C": "option3", "D": "option4"}
  correct_answer text not null,
  explanation text, -- Explanation of the answer
  marks integer default 1,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

alter table quiz_questions enable row level security;

create policy "Quiz questions are viewable by everyone" on quiz_questions for select using (true);
create policy "Only admins can modify quiz questions" on quiz_questions for all using (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 4. quiz_attempts
Store records of quiz attempts by students.

```sql
create table quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid references quiz_questions on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  answers jsonb not null, -- Stores the answers submitted by the user
  score decimal(5,2) not null,
  completed boolean default false,
  started_at timestamp with time zone default timezone('utc', now()) not null,
  completed_at timestamp with time zone,
  time_taken_seconds integer, -- Time taken to complete the quiz in seconds
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table quiz_attempts enable row level security;

create policy "Users can view their own quiz attempts" on quiz_attempts for select using (auth.uid() = user_id);
create policy "Users can insert their own quiz attempts" on quiz_attempts for insert with check (auth.uid() = user_id);
create policy "Users can update their own quiz attempts" on quiz_attempts for update using (auth.uid() = user_id);
```

### 5. homework_assignments
Store homework assignments created by teachers.

```sql
create table homework_assignments (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid references profiles(id) on delete set null not null,
  title text not null,
  description text,
  subject text not null,
  topic text not null,
  chapter_reference text,
  curriculum text default 'NCERT',
  class_level integer check (class_level >= 1 and class_level <= 12), -- Class 1-12
  due_date timestamp with time zone not null,
  total_marks integer default 100,
  instructions text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

alter table homework_assignments enable row level security;

create policy "Homework assignments are viewable by everyone" on homework_assignments for select using (true);
create policy "Teachers can insert homework assignments" on homework_assignments for insert with check (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'
  )
);
create policy "Teachers can update their own homework assignments" on homework_assignments for update using (
  auth.uid() = teacher_id
);
```

### 6. homework_submissions
Store student submissions for homework assignments.

```sql
create table homework_submissions (
  id uuid primary key default uuid_generate_v4(),
  homework_id uuid references homework_assignments on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  submission_data jsonb not null, -- Contains the submitted answers, files, etc.
  file_urls text[], -- URLs to uploaded files (if any)
  marks_obtained decimal(5,2),
  feedback text,
  submitted_at timestamp with time zone default timezone('utc', now()) not null,
  graded_at timestamp with time zone,
  is_late boolean default false,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

alter table homework_submissions enable row level security;

create policy "Users can view their own homework submissions" on homework_submissions for select using (auth.uid() = student_id);
create policy "Users can insert their own homework submissions" on homework_submissions for insert with check (auth.uid() = student_id);
create policy "Teachers can view submissions for their assignments" on homework_submissions for select using (
  EXISTS (
    SELECT 1 FROM homework_assignments WHERE id = homework_id AND teacher_id = auth.uid()
  )
);
create policy "Teachers can update submissions for grading" on homework_submissions for update using (
  EXISTS (
    SELECT 1 FROM homework_assignments WHERE id = homework_id AND teacher_id = auth.uid()
  )
);
```

### 7. syllabus_materials
Store syllabus information and learning resources.

```sql
create table syllabus_materials (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  subject text not null,
  topic text not null,
  chapter_reference text,
  curriculum text default 'NCERT',
  class_level integer check (class_level >= 1 and class_level <= 12), -- Class 1-12
  content_type text check (content_type in ('text', 'video', 'pdf', 'link', 'ebook')) not null,
  content_url text, -- URL to the content (video, PDF, external link, etc.)
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

alter table syllabus_materials enable row level security;

create policy "Syllabus materials are viewable by everyone" on syllabus_materials for select using (true);
create policy "Teachers and admins can insert syllabus materials" on syllabus_materials for insert with check (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  )
);
create policy "Teachers and admins can update their own syllabus materials" on syllabus_materials for update using (
  auth.uid() IN (
    SELECT uploader_id FROM syllabus_materials WHERE id = syllabus_materials.id
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 8. question_banks
Store collections of questions for exams and practice.

```sql
create table question_banks (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  subject text not null,
  curriculum text default 'NCERT',
  class_level integer check (class_level >= 1 and class_level <= 12), -- Class 1-12
  exam_type text, -- e.g., 'Unit Test', 'Midterm', 'Final', 'Olympiad'
  total_questions integer not null,
  total_marks integer not null,
  duration_minutes integer,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

alter table question_banks enable row level security;

create policy "Question banks are viewable by everyone" on question_banks for select using (true);
create policy "Teachers and admins can insert question banks" on question_banks for insert with check (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  )
);
create policy "Teachers and admins can update their own question banks" on question_banks for update using (
  auth.uid() IN (
    SELECT creator_id FROM question_banks WHERE id = question_banks.id
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 9. training_qa_pairs
Store high-quality question-answer pairs for AI training and few-shot prompting.

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

alter table training_qa_pairs enable row level security;

create policy "Training QA pairs are viewable by everyone" on training_qa_pairs for select using (true);
create policy "Only admins can modify training QA pairs" on training_qa_pairs for all using (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 10. educational_content
Store structured educational content for context retrieval.

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

alter table educational_content enable row level security;

create policy "Educational content is viewable by everyone" on educational_content for select using (true);
create policy "Only admins can modify educational content" on educational_content for all using (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 11. ai_response_feedback
Store feedback on AI responses for continuous improvement.

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

alter table ai_response_feedback enable row level security;

create policy "Users can view their own AI response feedback" on ai_response_feedback for select using (auth.uid() = user_id);
create policy "Users can insert their own AI response feedback" on ai_response_feedback for insert with check (auth.uid() = user_id);
```

### 12. conversation_contexts
Store context for ongoing conversations to improve AI responses.

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
  class_level integer check (class_level >= 1 and class_level <= 12),
  updated_at timestamp with time zone default timezone('utc', now()) not null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table conversation_contexts enable row level security;

create policy "Users can view their own conversation contexts" on conversation_contexts for select using (auth.uid() = user_id);
create policy "Users can update their own conversation contexts" on conversation_contexts for update using (auth.uid() = user_id);
create policy "Users can insert their own conversation contexts" on conversation_contexts for insert with check (auth.uid() = user_id);
```

## Storage Buckets

Supabase Storage buckets for file uploads:

1. **homework-submissions**: For student homework submissions (images, PDFs, etc.)
2. **project-files**: For student project files and assignments
3. **resources**: For learning resources, study materials, reference books
4. **profile-pictures**: For user profile pictures

Storage policies can be defined using the Supabase dashboard or via SQL as needed.

## Real-time Subscriptions

The following tables are suitable for real-time subscriptions:
- doubt_sessions
- quiz_attempts
- homework_submissions
- syllabus_materials
- conversation_contexts

## Indexes for Performance

Recommended indexes for better query performance:

```sql
-- Indexes for doubt_sessions
create index idx_doubt_sessions_user_id on doubt_sessions(user_id);
create index idx_doubt_sessions_subject_topic on doubt_sessions(subject, topic);
create index idx_doubt_sessions_class_level on doubt_sessions(class_level);
create index idx_doubt_sessions_curriculum on doubt_sessions(curriculum);

-- Indexes for quiz_questions
create index idx_quiz_questions_subject_topic on quiz_questions(subject, topic);
create index idx_quiz_questions_difficulty on quiz_questions(difficulty);
create index idx_quiz_questions_class_level on quiz_questions(class_level);
create index idx_quiz_questions_curriculum on quiz_questions(curriculum);
create index idx_quiz_questions_chapter on quiz_questions(chapter_reference);

-- Indexes for training_qa_pairs
create index idx_training_qa_pairs_subject_topic on training_qa_pairs(subject, topic);
create index idx_training_qa_pairs_difficulty on training_qa_pairs(difficulty);
create index idx_training_qa_pairs_quality on training_qa_pairs(quality_score desc);
create index idx_training_qa_pairs_class_level on training_qa_pairs(class_level);
create index idx_training_qa_pairs_curriculum on training_qa_pairs(curriculum);
create index idx_training_qa_pairs_chapter on training_qa_pairs(chapter_reference);

-- Indexes for educational_content
create index idx_educational_content_subject_topic on educational_content(subject, topic);
create index idx_educational_content_class_level on educational_content(class_level);
create index idx_educational_content_curriculum on educational_content(curriculum);
create index idx_educational_content_chapter on educational_content(chapter_reference);

-- Indexes for syllabus_materials
create index idx_syllabus_materials_subject_topic on syllabus_materials(subject, topic);
create index idx_syllabus_materials_class_level on syllabus_materials(class_level);
create index idx_syllabus_materials_curriculum on syllabus_materials(curriculum);
create index idx_syllabus_materials_chapter on syllabus_materials(chapter_reference);
```

## Sample Data Insertion

To get started with sample data, you can insert records like:

```sql
-- Sample training data for Mathematics
insert into training_qa_pairs (question, answer, explanation, subject, topic, chapter_reference, curriculum, class_level, difficulty, quality_score, source)
values
('What is the Pythagorean theorem?', 'In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides.', 'This theorem helps in calculating the length of any side of a right-angled triangle when the other two sides are known.', 'Mathematics', 'Geometry', 'Chapter 6: Triangles', 'NCERT', 10, 'medium', 0.95, 'NCERT Class 10 Maths Textbook'),
('Solve the equation: 2x + 5 = 15', 'x = 5', 'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5.', 'Mathematics', 'Algebra', 'Chapter 2: Linear Equations', 'NCERT', 8, 'basic', 0.9, 'NCERT Class 8 Maths Textbook'),
('What is Newton''s Second Law of Motion?', 'F = ma', 'Force equals mass times acceleration. This law explains how the velocity of an object changes when it is subjected to an external force.', 'Physics', 'Mechanics', 'Chapter 3: Laws of Motion', 'NCERT', 11, 'medium', 0.92, 'NCERT Class 11 Physics Textbook');

-- Sample educational content
insert into educational_content (title, content, subject, topic, chapter_reference, curriculum, class_level, content_type, difficulty, quality_score, source)
values
('Quadratic Formula', 'For any quadratic equation ax² + bx + c = 0, the solutions are given by x = (-b ± √(b² - 4ac)) / 2a', 'Mathematics', 'Algebra', 'Chapter 4: Quadratic Equations', 'NCERT', 10, 'formula', 'medium', 0.93, 'NCERT Class 10 Maths Textbook'),
('Photosynthesis Equation', '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', 'Biology', 'Plant Physiology', 'Chapter 1: Cell Structure', 'NCERT', 9, 'formula', 'basic', 0.9, 'NCERT Class 9 Biology Textbook');

-- Sample syllabus material with ebook reference
insert into syllabus_materials (title, description, subject, topic, chapter_reference, curriculum, class_level, content_type, content_url, source)
values
('NCERT Mathematics Class 10 - Complete Textbook', 'Official NCERT Mathematics textbook for Class 10', 'Mathematics', 'Various', 'Full Book', 'NCERT', 10, 'ebook', 'https://ncert.nic.in/textbook/pdf/ke ma101.pdf', 'NCERT Official Website');
```

This schema provides comprehensive support for:
- Class-wise questions (Class 1-12)
- Curriculum alignment (NCERT, CBSE, ICSE, State Board)
- Chapter and topic references
- Ebook and resource references
- Enhanced quiz and homework generation with curriculum filtering
- Training data for AI improvement with proper categorization