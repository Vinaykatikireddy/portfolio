---
title: Face Recognition
emoji: 🐨
colorFrom: red
colorTo: pink
sdk: docker
pinned: false
---
# FRAS Backend - Face Recognition Attendance System

FastAPI backend for the Face Recognition Attendance System.

## Setup

### 1. Installation

```bash
cd fras
python -m venv venv
source venv\Scripts\activate  # On Linux: venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Authentication

- `POST /auth/login` - User login
  - Body: `username`, `password` (form-data)
  - Returns: `{ access_token, token_type, username }`

- `POST /auth/register` - User registration
  - Body: `username`, `email`, `password` (form-data)
  - Returns: `{ message, username }`

- `POST /change-password` - Change password (requires auth)
  - Headers: `Authorization: Bearer <token>`
  - Body: `currentPassword`, `newPassword` (form-data)
  - Returns: `{ message }`

### Students

- `GET /students/{search}` - Search students (requires auth)
- `POST /students` - Add new student (requires auth)
  - Body: Form data with all student fields + optional `images` file array
- `POST /update-students` - Update student (requires auth)
  - Body: Form data with all student fields + `oldregid`
- `DELETE /students/{regid}` - Delete student (requires auth)

### Attendance

- `POST /attendance` - Submit attendance (requires auth)
  - Body: `{ class, date, students: [{ regid, status }] }`
- `GET /attendance/today` - Get today's attendance (requires auth)
- `GET /attendance/student/{student_id}` - Get student attendance (requires auth)
  - Query: `fromDate`, `toDate`

### Dashboard

- `GET /api/dashboard` - Get dashboard stats (requires auth)
  - Returns: `{ todayPresent, totalStudents, attendanceRate, classesToday }`

## Image Storage

Student images are stored in Supabase Storage bucket `student_images` with structure:
```
{batch}/{programme}-{class_section}/{regid}_{filename}.jpg
```

## Security Notes

- Change the default admin password immediately
- Use a strong `JWT_SECRET` in production
- Enable HTTPS in production
- Set appropriate CORS origins
- Review Supabase storage policies