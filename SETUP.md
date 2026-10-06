# Setup Instructions for AI Tutor Platform

## 1. Supabase Setup

### Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign up/log in
2. Create a new project
3. Note down your project URL and API keys from the project settings

### Get API Keys
From your Supabase project settings:
- **SUPABASE_URL**: Your project URL (e.g., https://xyzcompany.supabase.co)
- **SUPABASE_ANON_KEY**: Public anon key
- **SUPABASE_SERVICE_ROLE_KEY**: Service role key (for backend operations)

### Set Up the Database
1. Copy the SQL from `SUPABASE_SCHEMA.md` and run it in your Supabase SQL editor
2. Copy the SQL from `TRAINING_DATA_SCHEMA.md` and run it in your Supabase SQL editor
3. Run `backend/migrations/20261006_assessment_workflow.sql` in the Supabase SQL editor to enable published assessments, saved student submissions, elapsed time, and teacher feedback
4. Run `backend/migrations/20261007_student_roster.sql` in the Supabase SQL Editor to create the persistent student directory. This file only creates/configures the table; it does not depend on a previous roster table.
5. Optionally, run `backend/migrations/20261008_student_roster_backfill.sql` to import existing Supabase Auth student users.
6. These migrations create the required tables and set up Row Level Security policies
7. Monthly assessments support Classes 9-12; teacher-enrolled students, assessment scores, and completion times are stored in Supabase and used for live class ranks

### Environment Variables
Create a `.env` file in the backend directory with:
```
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
FACULTY_ACCESS_CODE=123456
GEMINI_API_KEY=your_google_ai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_here
```

The frontend only needs `VITE_API_BASE_URL`; the backend handles Supabase Auth using its configured service-role key. Teacher registration requires `FACULTY_ACCESS_CODE`. Set a private code in production. New users are confirmed by the backend during registration; existing Supabase Auth users can continue to sign in.

Exam preparation and homework lookup use stored records in the Supabase `education` table only; those routes do not call AI providers. Exam practice is matched by class, subject, and requested topic. Homework returns only exact or strong stored-question matches and reports when no match exists. Populate the database with `node backend/seed_curriculum_extras.js`.

For local development, keep private credentials in the ignored `backend/.env.local` file. It overrides matching values in `backend/.env`; restart the backend after changes. Never commit or paste provider keys into chat.

## 2. AI Provider Setup

### AI Provider Setup
Gemini/OpenAI keys are used only by other application features. Exam preparation and homework lookup do not require AI provider credentials.

## 3. Training Data

The `TRAINING_DATA_SCHEMA.md` file includes:
- Database schema for training data tables
- Sample training data for mathematics and physics organized by class and curriculum
- Instructions on how to use the training data for few-shot prompting
- Support for class-wise organization (Class 1-12) and curriculum alignment (NCERT, CBSE, etc.)

To add more training data:
1. Insert additional records into the `training_qa_pairs` table
2. Insert additional records into the `educational_content` table
3. Run `node backend/seed_curriculum_extras.js` to add the supplemental class 9–12 homework and exam-practice Q&A set to the `education` table (safe to rerun; existing questions are skipped)
3. Follow the same format as the sample data provided, including class_level and curriculum fields

## 4. Running the Application

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:5173
The backend API will be available at http://localhost:5000

## 5. Verification

To verify your setup is working:
1. Check that the backend server starts without errors
2. Test the health endpoint: http://localhost:5000/health
3. Test the tutoring endpoint with a sample request:
   ```
   POST http://localhost:5000/api/tutoring/solve-doubt
   Content-Type: application/json
   
   {
     "question": "How do I solve the equation 2x + 5 = 15?",
     "level": "basic",
     "userId": "test-user-id",
     "subject": "mathematics",
     "topic": "linear_equations",
     "classLevel": 8,
     "curriculum": "NCERT"
   }
   ```

## 6. Troubleshooting

### Common Issues
- **Supabase connection errors**: Double-check your SUPABASE_URL and API keys
- **AI provider errors**: Verify GEMINI_API_KEY or OPENAI_API_KEY is valid and has access to the configured model
- **Port already in use**: Change the PORT in your .env file or stop the conflicting service
- **Database schema errors**: Ensure you've run both SUPABASE_SCHEMA.md and TRAINING_DATA_SCHEMA.md
- **Class-level errors**: Make sure classLevel is between 1 and 12
- **Curriculum errors**: Ensure curriculum is one of: 'NCERT', 'CBSE', 'ICSE', 'State Board'

### Getting Help
- Supabase documentation: https://supabase.com/docs
- OpenAI documentation: https://platform.openai.com/docs
- If you encounter issues, check the server logs for detailed error messages