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
3. This will create all necessary tables and set up Row Level Security policies
4. The schema now includes support for class-wise questions (Class 1-12) and NCERT curriculum alignment

### Environment Variables
Create a `.env` file in the backend directory with:
```
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_here
```

## 2. OpenAI Setup

### Get OpenAI API Key
1. Go to [https://platform.openai.com](https://platform.openai.com) and sign up/log in
2. Navigate to API Keys section
3. Create a new secret key
4. Copy the key and add it to your `.env` file as `OPENAI_API_KEY`

## 3. Training Data

The `TRAINING_DATA_SCHEMA.md` file includes:
- Database schema for training data tables
- Sample training data for mathematics and physics organized by class and curriculum
- Instructions on how to use the training data for few-shot prompting
- Support for class-wise organization (Class 1-12) and curriculum alignment (NCERT, CBSE, etc.)

To add more training data:
1. Insert additional records into the `training_qa_pairs` table
2. Insert additional records into the `educational_content` table
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
- **OpenAI API errors**: Verify your OPENAI_API_KEY is correct and has sufficient credits
- **Port already in use**: Change the PORT in your .env file or stop the conflicting service
- **Database schema errors**: Ensure you've run both SUPABASE_SCHEMA.md and TRAINING_DATA_SCHEMA.md
- **Class-level errors**: Make sure classLevel is between 1 and 12
- **Curriculum errors**: Ensure curriculum is one of: 'NCERT', 'CBSE', 'ICSE', 'State Board'

### Getting Help
- Supabase documentation: https://supabase.com/docs
- OpenAI documentation: https://platform.openai.com/docs
- If you encounter issues, check the server logs for detailed error messages