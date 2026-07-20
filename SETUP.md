# FRAS Complete Setup Guide

## Quick Start

### 1. Database Setup (PostgreSQL with pgvector)

```sql
-- Create database
CREATE DATABASE fras_db;

-- Connect to database
\c fras_db

-- Enable pgvector extension (required for face recognition)
CREATE EXTENSION IF NOT EXISTS vector;

-- Run the schema.sql file to create tables
\i schema.sql
```

### 2. Supabase Setup

1. Create project at https://supabase.com
2. Get Project URL and Service Role Key from Settings → API
3. Create storage bucket `student_images` (private)
4. Add storage policy:
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student_images');
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Install dependencies (including face recognition packages)
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your credentials:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY  
# - DATABASE_URL (PostgreSQL with pgvector)
# - JWT_SECRET (generate random 32+ character string)

# Run server
python main.py
```

Server starts at: http://localhost:3000

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Update .env if needed
# VITE_API_URL=http://localhost:3000

# Run dev server
npm run dev
```

Frontend starts at: http://localhost:5173

### 5. Test the Application

1. Open http://localhost:5173
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`
3. Change your password immediately!
4. Test face recognition:
   - Add a student with face recognition photos
   - Take attendance using face recognition

## Default Credentials

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT:** Change this password after first login!

## Project Structure

```
face-recognition-attendance-system/
├── backend/                  # Backend (FastAPI)
│   ├── main.py             # Main application with all endpoints
│   ├── db.py               # Database connection pool
│   ├── image.py            # Face detection and recognition utilities
│   ├── schema.sql          # Database schema with pgvector support
│   ├── requirements.txt    # Python dependencies (including pgvector, deepface)
│   └── .env                # Environment variables
│
└── frontend/               # Frontend (React + TypeScript)
    ├── src/
    │   ├── pages/          # Page components (including face recognition)
    │   ├── components/     # Reusable components (Camera, UI elements)
    │   ├── services/       # API client with face recognition endpoints
    │   ├── types/          # TypeScript types and interfaces
    │   └── utils/          # Utilities and validators
    └── package.json        # Frontend dependencies
```

## Face Recognition System

### How It Works
1. **Student Registration**: Capture 1-10 photos of a student from different angles
2. **Embedding Generation**: Generate a 128-dimensional face embedding using DeepFace
3. **Embedding Storage**: Store embeddings in PostgreSQL using pgvector with HNSW index
4. **Attendance Recognition**: Capture classroom photos and match against stored embeddings
5. **Confidence-based Suggestions**: Show attendance suggestions based on recognition confidence

### Key Endpoints
- `POST /generate-embedding` - Generate face embedding from multiple images
- `POST /attendance/recognize` - Recognize students from uploaded classroom photos

### Confidence Levels
- **≥70% confidence**: ✅ Suggested Present (High confidence)
- **30-70% confidence**: ⚠️ Suggested Doubt (Medium confidence)
- **<30% confidence**: ❌ Suggested Absent (Low confidence)

## API Testing with curl

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -d "username=admin" \
  -d "password=admin123"
```

### Add Student with Face Recognition
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=John Doe" \
  -F "regid=2024001" \
  -F "email=john@example.com" \
  -F "mobile=9876543210" \
  -F "dob=2000-01-01" \
  -F "gender=M" \
  -F "programme=CSE" \
  -F "semester=Third Semester" \
  -F "regulation=R23" \
  -F "batch=2022-2026" \
  -F "class_section=A" \
  -F "lab_section=A" \
  -F "residence=hosteler" \
  -F "fatherMobile=9876543211" \
  -F "image=@profile.jpg" \
  -F "embedding=[EMBEDDING_JSON]" \
  http://localhost:3000/students
```

### Generate Face Embedding
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -F "regid=2024001" \
  -F "images=@face1.jpg" \
  -F "images=@face2.jpg" \
  -F "images=@face3.jpg" \
  http://localhost:3000/generate-embedding
```

### Recognize Students for Attendance
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -F "class_info=CSE-A" \
  -F "images=@classroom1.jpg" \
  -F "images=@classroom2.jpg" \
  http://localhost:3000/attendance/recognize
```

### Get Dashboard Stats
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/dashboard
```

## Troubleshooting

### Backend won't start
- Check if PostgreSQL is running with pgvector extension
- Verify DATABASE_URL in .env points to PostgreSQL with pgvector
- Ensure port 3000 is not in use
- Check that all required Python packages are installed

### Face recognition not working
- Verify pgvector extension is enabled in PostgreSQL
- Check that face embeddings table exists
- Ensure DeepFace and TensorFlow are properly installed
- Verify that images contain detectable faces

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check VITE_API_URL in frontend/.env
- Check browser console for CORS errors
- Verify network connectivity

### Login fails
- Verify database has logins table
- Check if default admin user exists:
```sql
SELECT * FROM logins WHERE username = 'admin';
```
- Reset password if needed:
```sql
UPDATE logins SET password = '$2b$12$hashed_password' WHERE username = 'admin';
```

### Images not showing
- Check Supabase bucket exists and is named `student_images`
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
- Check storage policies allow uploads
- Verify image paths in database match Supabase storage paths

## Production Deployment

### Backend
1. Use production PostgreSQL instance with pgvector extension
2. Set strong JWT_SECRET (32+ characters)
3. Enable HTTPS
4. Set appropriate CORS origins in main.py
5. Use environment variables from secrets manager
6. Configure proper logging
7. Set up process manager (like Gunicorn + Uvicorn for production)

### Frontend
1. Build: `npm run build`
2. Deploy `dist/` folder to static hosting (Vercel, Netlify, etc.)
3. Update VITE_API_URL to production backend URL
4. Configure proper environment variables

### Database
1. Set up regular backups
2. Monitor performance of vector search queries
3. Consider database connection pooling
4. Optimize HNSW index parameters for your dataset size

## Database Backup & Restore

```bash
# Backup
pg_dump -U your_user -d fras_db -F c -f fras_backup.dump

# Restore
pg_restore -U your_user -d fras_db -F c fras_backup.dump

# For plain SQL backup
pg_dump -U your_user fras_db > backup.sql

# For plain SQL restore
psql -U your_user fras_db < backup.sql
```

## Performance Optimization

### Database
1. **Vector Index Tuning**: Adjust HNSW index parameters based on your dataset:
```sql
-- Example for larger datasets
CREATE INDEX idx_face_embeddings ON face_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

2. **Regular Maintenance**:
```sql
-- Reindex periodically
REINDEX INDEX idx_face_embeddings;

-- Vacuum to maintain performance
VACUUM ANALYZE face_embeddings;
```

3. **Connection Pooling**: Configure asyncpg connection pool in db.py

### Face Recognition
1. **Image Optimization**: Resize images to consistent dimensions before processing
2. **Batch Processing**: Process multiple faces in batches when possible
3. **Model Selection**: Choose appropriate DeepFace model based on performance needs

## Next Steps

1. ✅ Backend complete with all endpoints including face recognition
2. ✅ Frontend complete with all pages including face recognition UI
3. ✅ Authentication working
4. ✅ Face recognition integration complete
5. ⏳ Add batch student import with face recognition
6. ⏳ Add attendance reports and export functionality
7. ⏳ Add real-time notifications for attendance events
8. ⏳ Add mobile application for on-the-go attendance
9. ⏳ Implement advanced analytics and dashboards

---

**Support:** For issues, check the logs in both backend and frontend consoles.