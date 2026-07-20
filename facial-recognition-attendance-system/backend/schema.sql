-- FRAS Database Schema
-- Run this on your PostgreSQL database

-- Enable pgvector extension for face embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS logins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    regid VARCHAR(50) UNIQUE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    dob DATE NOT NULL,
    programme VARCHAR(50) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    regulation VARCHAR(20) NOT NULL,
    batch VARCHAR(20) NOT NULL,
    father_mobile VARCHAR(20) NOT NULL,
    lab_section VARCHAR(10) NOT NULL,
    class_section VARCHAR(10) NOT NULL,
    residence VARCHAR(50) NOT NULL,
    face_detected BOOLEAN DEFAULT FALSE,
    embedding_generated BOOLEAN DEFAULT FALSE
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_students_regid ON students(regid);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(class_section);
CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch);

-- Face embeddings table for face recognition
CREATE TABLE IF NOT EXISTS face_embeddings (
    regid VARCHAR(50) PRIMARY KEY REFERENCES students(regid) ON DELETE CASCADE,
    embedding vector(128) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector search using HNSW for better performance
-- HNSW provides faster search with comparable accuracy to IVFFlat
CREATE INDEX IF NOT EXISTS idx_face_embeddings ON face_embeddings USING hnsw (embedding vector_cosine_ops);

-- Alternative index using IVFFlat (commented out)
-- CREATE INDEX IF NOT EXISTS idx_face_embeddings_ivf ON face_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    regid VARCHAR(50) NOT NULL,
    class VARCHAR(50) NOT NULL,
    status INTEGER NOT NULL DEFAULT 0,
    period INT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    marked_by VARCHAR(100),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (regid) REFERENCES students(regid) ON DELETE CASCADE
);

-- Create indexes for attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_regid ON attendance(regid);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class);
CREATE INDEX IF NOT EXISTS idx_attendance_date_status ON attendance(date, status);
