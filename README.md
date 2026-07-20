# FRAS - Face Recognition Attendance System

A full-stack Face Recognition Attendance System with a React frontend and FastAPI backend that uses AI-powered face recognition for automated attendance marking.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Authentication**: JWT with bcrypt password hashing
- **Database**: PostgreSQL with Supabase
- **Face Recognition**: DeepFace + MTCNN + pgvector
- **Storage**: Supabase Storage for student images
- **HTTP Client**: Axios

## Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL database with pgvector extension
- Supabase account (for storage and database)

### Backend Setup
```bash
cd backend/
python -m venv venv
# Windows
source venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate

pip install -r requirements.txt

# Enable pgvector extension in your PostgreSQL database
psql -U your_username -d your_database -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run the backend
python main.py
```

### Frontend Setup
```bash
cd frontend/
npm install
npm run dev
```

## Main Features
- **User Authentication**: Secure JWT-based authentication
- **Student Management**: Add, update, delete, and search students
- **Attendance Tracking**: Manual and AI-powered face recognition attendance
- **Dashboard Statistics**: Real-time attendance analytics
- **Camera Integration**: Capture photos directly from browser
- **Profile Management**: User profile and password management
- **Face Recognition**: AI-powered face detection and recognition
- **Multi-angle Recognition**: Generate embeddings from 1-10 photos per student

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /change-password` - Change password

### Students
- `POST /students` - Add new student
- `GET /students/{search}` - Search students
- `POST /update-students` - Update student
- `DELETE /students/{regid}` - Delete student
- `GET /students/filter` - Filter students
- `POST /generate-embedding` - Generate face embedding from multiple images

### Attendance
- `POST /attendance` - Submit attendance
- `GET /attendance/summary/{regid}` - Get attendance summary
- `POST /attendance/recognize` - Recognize students from uploaded images

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Database Schema

### Core Tables
- `logins` - User authentication data
- `students` - Student information
- `face_embeddings` - Face recognition embeddings (128D vectors)
- `attendance` - Attendance records

### Key Features
- **pgvector extension** for efficient vector similarity search
- **HNSW index** for fast face recognition queries
- **Supabase Storage** for student profile images
- **Foreign key constraints** for data integrity

## Face Recognition System

### How It Works
1. **Student Registration**: Capture 1-10 photos of a student from different angles
2. **Embedding Generation**: Generate a 128-dimensional face embedding using DeepFace
3. **Embedding Storage**: Store embeddings in PostgreSQL using pgvector
4. **Attendance Recognition**: Capture classroom photos and match against stored embeddings
5. **Confidence-based Suggestions**: Show attendance suggestions based on recognition confidence

### Confidence Levels
- **≥70% confidence**: ✅ Suggested Present (High confidence)
- **30-70% confidence**: ⚠️ Suggested Doubt (Medium confidence)
- **<30% confidence**: ❌ Suggested Absent (Low confidence)

## Security Best Practices
- Strong JWT secret with 24-hour expiration
- HTTPS for all communications
- Proper CORS configuration
- Secure password hashing with bcrypt
- Input validation for all API endpoints
- Protected routes with JWT authentication

## Future Improvements
- Advanced analytics and reporting
- Bulk import/export functionality
- Mobile application
- Real-time notifications
- Integration with learning management systems

