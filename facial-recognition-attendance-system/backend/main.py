from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone

import os
import json
import traceback

import cv2
import numpy as np
import uvicorn
import validators

from asyncpg.exceptions import UniqueViolationError
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from passlib.context import CryptContext
from supabase import create_client

import db
import face_recognition

load_dotenv()

# Configuration
PORT = int(os.getenv("PORT", 3000))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 1
BUCKET = "student_images"

# Initialize Supabase
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database pool
    await db.init_pool()
    
    if db.pool is None:
        raise RuntimeError("Failed to initialize database pool")

    yield
    await db.close_pool()

app = FastAPI(lifespan=lifespan)

origins = [
    "https://fras-virid.vercel.app",
    "https://vinaykatikireddy.is-a.dev",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Middleware for logging
@app.middleware("http")
async def log_requests(request, call_next):
    print(f"Incoming: {request.method} {request.url.path}")
    return await call_next(request)


# ============ HELPER FUNCTIONS ============
async def get_current_user(authorization: str):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token format")

async def enrich_with_images(students):
    if not supabase:
        return students
    
    for student in students:
        try:
            filename = f"{student['batch']}/{student['programme']}-{student['class_section']}/{student['regid']}.jpg"
            signed = supabase.storage.from_(BUCKET).create_signed_url(filename, 360)
            student["image"] = signed["signedURL"]
        except Exception as e:
            student["image"] = None
    return students

# ============ ROUTES ============
# @app.get("/")
# def home():
#     return {"message": "Backend API is running..."}

# ============ AUTH ENDPOINTS ============

@app.post("/auth/login")
async def login(username: str = Form(...), password: str = Form(...)):
    try:
        if not username or not password:
            raise HTTPException(status_code=401)

        user = await db.query(
            "SELECT * FROM logins WHERE username = $1",
            [username]
        )

        if not user or len(user) == 0 or not pwd_context.verify(password, user[0]["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Create JWT token
        expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
        to_encode = {"sub": username, "exp": expire}
        token = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return {
            "access_token": token,
            "username": username
        }
    except HTTPException:
        raise
    except Exception as err:
        print(f"Login error: {err}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": "Login failed"})

@app.post("/auth/register")
async def register(username: str = Form(...), email: str = Form(...), password: str = Form(...)):
    try:
        username = validators.validate_username(username)
        email = validators.validate_email(email)
        password = validators.validate_password(password)

        existing = await db.query(
            "SELECT * FROM logins WHERE username = $1 OR email = $2",
            [username, email]
        )
        if existing and len(existing) > 0:
            raise HTTPException(status_code=400, detail="Username or email already exists")

        hashed_password = pwd_context.hash(password)
        await db.query(
            "INSERT INTO logins (username, email, password) VALUES ($1, $2, $3)",
            [username, email, hashed_password]
        )
        return {"message": "User registered successfully"}
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except HTTPException:
        raise
    except Exception as err:
        print(f"Register error: {err}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": "Registration failed"})

@app.post("/change-password")
async def change_password(current_password: str = Form(...), new_password: str = Form(...), authorization: str = Header(...)):
    try:
        current_user = await get_current_user(authorization)

        if not current_password:
            raise ValueError("Current password is required")
        new_password = validators.validate_password(new_password)

        user = await db.query("SELECT * FROM logins WHERE username = $1", [current_user])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not pwd_context.verify(current_password, user[0]["password"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        hashed_password = pwd_context.hash(new_password)
        await db.query(
            "UPDATE logins SET password = $1 WHERE username = $2",
            [hashed_password, current_user]
        )

        return {"message": "Password changed successfully"}
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except HTTPException:
        raise
    except Exception as err:
        print(f"Change password error: {err}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": "Password change failed"})

# ============ STUDENT ENDPOINTS ============

@app.post("/students")
async def add_student(
    name: str = Form(...),
    regid: str = Form(...),
    email: str = Form(...),
    mobile: str = Form(...),
    dob: str = Form(...),
    class_section: str = Form(...),
    fatherMobile: str = Form(...),
    gender: str = Form(...),
    lab_section: str = Form(...),
    programme: str = Form(...),
    regulation: str = Form(...),
    batch: str = Form(...),
    residence: str = Form(...),
    semester: str = Form(...),
    image: UploadFile = File(None),
    embedding: str = Form(...),
    authorization: str = Header(...),
):
    try:
        await get_current_user(authorization)

        # Validations
        name = validators.validate_name(name)
        regid = validators.validate_regid(regid)
        email = validators.validate_email(email)
        mobile = validators.validate_phone(mobile)
        father_mobile = validators.validate_phone(fatherMobile)
        dob_parsed = validators.validate_dob(dob)
        gender = validators.validate_gender(gender)
        class_section = validators.validate(class_section, "Class section", validators.VALID_SECTIONS)
        lab_section = validators.validate(lab_section, "Lab section", validators.VALID_LAB_SECTIONS)
        programme = validators.validate(programme, "Programme", validators.VALID_PROGRAMMES)
        regulation = validators.validate(regulation, "Regulation", validators.VALID_REGULATIONS)
        batch = validators.validate(batch, "Batch", validators.VALID_BATCHES)
        residence = validators.validate(residence, "Residence", validators.VALID_RESIDENCES)
        semester = validators.validate(semester, "Semester", validators.VALID_SEMESTERS)
        validators.validate_image(image)

        # Use transaction for all database operations
        try:
            embedding_list = json.loads(embedding)
            if isinstance(embedding_list, list) and len(embedding_list) == 512:
                from pgvector import Vector
                
                await db.query(
                    """
                    INSERT INTO students (
                        name, regid, email, mobile, dob, class_section,
                        father_mobile, gender, lab_section, programme,
                        regulation, batch, residence, semester
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
                    """,
                    [name, regid, email, mobile, dob_parsed, class_section, father_mobile,
                     gender, lab_section, programme, regulation, batch, residence, semester],
                    transaction=True
                )
                
                await db.query(
                    """
                    INSERT INTO face_embeddings (regid, embedding)
                    VALUES ($1, $2)
                    ON CONFLICT (regid) DO UPDATE SET embedding = EXCLUDED.embedding
                    """,
                    [regid, embedding_list],
                    transaction=True
                )
        except Exception as e:
            print(f"Error adding new student: {e}")
            raise HTTPException(status_code=500, detail="Failed to add new student")

        # Upload profile image to Supabase if provided
        if image and supabase:
            try:
                contents = await image.read()
                filename = f"{batch}/{programme}-{class_section}/{regid}.jpg"
                
                # Remove destination if it exists (overwrite)
                try:
                    supabase.storage.from_(BUCKET).remove([filename])
                except Exception:
                    pass
                
                # Upload the image
                supabase.storage.from_(BUCKET).upload(filename, contents)
                
            except Exception as e:
                print(f"Error uploading image to Supabase: {e}")
                raise HTTPException(status_code=500, detail="Failed to upload profile image")

    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from None
    except HTTPException:
        raise
    except Exception as err:
        print(f"Add student error: {err}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": "Failed to add student"})

@app.get("/students/filter")
async def filter_students(programme: str, batch: str, section: str, semester: str, authorization: str = Header(...)):
    try:
        await get_current_user(authorization)

        programme = validators.validate(programme, "Programme", validators.VALID_PROGRAMMES)
        batch = validators.validate(batch, "Batch", validators.VALID_BATCHES)
        section = validators.validate(section, "Class section", validators.VALID_SECTIONS)
        semester = validators.validate(semester, "Semester", validators.VALID_SEMESTERS)

        students = await db.query(
            "SELECT * FROM students WHERE programme = $1 AND batch = $2 AND class_section = $3 AND semester = $4 ORDER BY regid",
            [programme, batch, section, semester]
        )
        return await enrich_with_images(students)
    except HTTPException:
        raise
    except Exception as err:
        print(f"Filter students error: {err}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": "Failed to filter students"})

@app.get("/students/{search}")
async def search_students(search: str, authorization: str = Header(...)):
    try:
        await get_current_user(authorization)

        if len(search) < 3:
            raise HTTPException(status_code=400, detail="Search term must be at least 3 characters long")

        students = await db.query(
            "SELECT * FROM students WHERE name ILIKE $1 OR email ILIKE $1 OR regid ILIKE $1",
            [f"%{search}%"]
        )
        return await enrich_with_images(students)
    except HTTPException:
        raise
    except Exception as err:
        print(f"Search error: {err}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": "Search failed"})

@app.post("/update-students")
async def update_student(
    name: str = Form(...),
    regid: str = Form(...),
    email: str = Form(...),
    mobile: str = Form(...),
    dob: str = Form(...),
    class_section: str = Form(...),
    fatherMobile: str = Form(...),
    gender: str = Form(...),
    lab_section: str = Form(...),
    programme: str = Form(...),
    regulation: str = Form(...),
    batch: str = Form(...),
    residence: str = Form(...),
    semester: str = Form(...),
    oldregid: str = Form(...),
    image: UploadFile = File(None),
    authorization: str = Header(...),
):
    try:
        await get_current_user(authorization)

        # Validations
        name = validators.validate_name(name)
        regid = validators.validate_regid(regid)
        email = validators.validate_email(email)
        mobile = validators.validate_phone(mobile)
        father_mobile = validators.validate_phone(fatherMobile)
        dob_parsed = validators.validate_dob(dob)
        gender = validators.validate_gender(gender)
        class_section = validators.validate(class_section, "Class section", validators.VALID_SECTIONS)
        lab_section = validators.validate(lab_section, "Lab section", validators.VALID_LAB_SECTIONS)
        programme = validators.validate(programme, "Programme", validators.VALID_PROGRAMMES)
        regulation = validators.validate(regulation, "Regulation", validators.VALID_REGULATIONS)
        batch = validators.validate(batch, "Batch", validators.VALID_BATCHES)
        residence = validators.validate(residence, "Residence", validators.VALID_RESIDENCES)
        semester = validators.validate(semester, "Semester", validators.VALID_SEMESTERS)
        oldregid_upper = oldregid.strip().upper()
        if not oldregid_upper:
            raise ValueError("Old Reg ID is required")
        validators.validate_image(image)

        # Verify student exists
        existing = await db.query(
            "SELECT regid FROM students WHERE regid = $1",
            [oldregid_upper]
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Student not found")

        # Check regid collision if regid changed
        if oldregid_upper != regid:
            collision = await db.query(
                "SELECT regid FROM students WHERE regid = $1",
                [regid]
            )
            if collision:
                raise HTTPException(status_code=400, detail="A student with this Reg ID already exists")

        try:
            await db.query("BEGIN")
            if oldregid_upper != regid:

                await db.query(
                    """
                    WITH update_students AS (
                        UPDATE students
                        SET
                            name = $1,
                            regid = $2,
                            email = $3,
                            mobile = $4,
                            dob = $5,
                            class_section = $6,
                            father_mobile = $7,
                            gender = $8,
                            lab_section = $9,
                            programme = $10,
                            regulation = $11,
                            batch = $12,
                            residence = $13,
                            semester = $14
                        WHERE regid = $15
                        RETURNING regid
                    )
                    UPDATE face_embeddings
                    SET regid = $2
                    WHERE regid = $15
                    """,
                    [
                        name, regid, email, mobile, dob_parsed, class_section, father_mobile,
                        gender, lab_section, programme, regulation, batch, residence,
                        semester, oldregid_upper
                    ],
                    transaction=True
                )
            else:
                # No regid change, just update students
                await db.query(
                    """
                    UPDATE students
                    SET
                        name = $1,
                        email = $2,
                        mobile = $3,
                        dob = $4,
                        class_section = $5,
                        father_mobile = $6,
                        gender = $7,
                        lab_section = $8,
                        programme = $9,
                        regulation = $10,
                        batch = $11,
                        residence = $12,
                        semester = $13
                    WHERE regid = $14
                    """,
                    [
                        name, email, mobile, dob_parsed, class_section, father_mobile,
                        gender, lab_section, programme, regulation, batch, residence,
                        semester, oldregid_upper
                    ],
                    transaction=True
                )
            await db.query("COMMIT")
        except Exception as e:
            await db.query("ROLLBACK")
            raise e

        if supabase:
            new_filename = f"{batch}/{programme}-{class_section}/{regid}.jpg"
            old_filename = f"{batch}/{programme}-{class_section}/{oldregid_upper}.jpg"
            is_regid_changed = oldregid_upper != regid

            if image:
                contents = await image.read()
                # Remove destination if it exists (overwrite)
                try:
                    supabase.storage.from_(BUCKET).remove([new_filename])
                except Exception:
                    pass
                supabase.storage.from_(BUCKET).upload(new_filename, contents)
                
                # Clean up old file if regid changed
                if is_regid_changed:
                    try:
                        supabase.storage.from_(BUCKET).remove([old_filename])
                    except Exception:
                        pass
            elif is_regid_changed:
                # No new image but regid changed — move old file to new path
                try:
                    old_data = supabase.storage.from_(BUCKET).download(old_filename)
                    try:
                        supabase.storage.from_(BUCKET).remove([new_filename])
                    except Exception:
                        pass
                    supabase.storage.from_(BUCKET).upload(new_filename, old_data)
                    supabase.storage.from_(BUCKET).remove([old_filename])
                except Exception:
                    pass

        return {"message": "Student updated successfully"}
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except HTTPException:
        raise
    except Exception as err:
        print(f"Update student error: {err}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": "Failed to update student"})

@app.delete("/students/{regid}")
async def delete_student(regid: str, authorization: str = Header(...)):
    try:
        await get_current_user(authorization)

        student = await db.query(
            """
            SELECT batch, programme, class_section, regid
            FROM students
            WHERE regid = $1
            """,
            [regid]
        )

        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        student = student[0]

        if supabase:
            filename = (f"{student['batch']}/{student['programme']}-{student['class_section']}/{student['regid']}.jpg")

            try:
                supabase.storage.from_(BUCKET).remove([filename])
            except Exception as e:
                print(f"Storage delete failed: {e}")

        # Delete face embedding
        await db.query(
            "DELETE FROM face_embeddings WHERE regid = $1",
            [regid]
        )
        
        # Delete student
        await db.query(
            "DELETE FROM students WHERE regid = $1",
            [regid]
        )

        return {"message": "Student deleted successfully"}

    except HTTPException:
        raise
    except Exception as err:
        print(f"Delete student error: {err}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": "Failed to delete student"})

@app.post("/generate-embedding")
async def generate_embedding(images: list[UploadFile] = File(...), regid: str = Form(...), authorization: str = Header(...)):
    try:
        await get_current_user(authorization)
        if not images or len(images) > 10:
            raise HTTPException(status_code=400, detail="Please upload 1-10 images")
        
        embeddings = []
        
        for img in images:

            contents = await img.read()
            
            # Convert memory bytes into a NumPy array structure
            nparr = np.frombuffer(contents, np.uint8)
            
            # Decode the array into an OpenCV image matrix
            cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if cv_img is None:
                continue
            
            # Generate the embedding by passing the matrix directly
            embedding = face_recognition.generate_face_embedding(cv_img)
            if embedding.all():
                embeddings.append(embedding)
        
        if not embeddings:
            raise HTTPException(status_code=400, detail="No valid faces detected in the images")

        # Average all embeddings to create a single 512D vector
        avg_embedding = np.mean(embeddings, axis=0).tolist()
        
        return {"embedding": avg_embedding, "regid": regid}
        
    except HTTPException:
        raise
    except Exception as err:
        print(f"Embedding generation error: {err}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": "Failed to generate embedding"})

# ============ ATTENDANCE ENDPOINTS ============
@app.post("/attendance")
async def submit_attendance(data: dict, authorization: str = Header(...)):
    try:
        current_user = await get_current_user(authorization)

        class_name = data.get("class").strip()
        period = data.get("period")
        students = data.get("students")

        if not class_name or not isinstance(students, list) or not students or period is None or period < 1 or period > 8:
            raise HTTPException(status_code=400, detail="Missing required fields: class, period, and students")

        validators.validate_attendance_class(class_name)

        VALID_STATUSES = {1, 0}
        for student in students:
            regid = (student.get("regid") or "").strip()
            status = student.get("status", -1)
            if not regid:
                raise ValueError("Each student must have a valid regid")
            if status not in VALID_STATUSES:
                raise ValueError(f"Invalid attendance status: {status}")

        # Use a single transaction for all attendance inserts
        async with db.pool.acquire() as conn:
            async with conn.transaction():
                for student in students:
                    regid = student.get("regid").strip()
                    status = student.get("status")

                    await conn.execute(
                        """
                        INSERT INTO attendance (regid, period, status, class, marked_by)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (regid, date, period) DO UPDATE SET status = EXCLUDED.status
                        """,
                        regid, period, status, class_name, current_user
                    )

        return {"message": "Attendance submitted successfully"}

    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except UniqueViolationError:
        raise HTTPException(status_code=409, detail=f"Attendance already recorded")
    except HTTPException:
        raise
    except Exception as err:
        print(f"Submit attendance error: {err}")
        return JSONResponse(status_code=500, content={"error": "Failed to submit attendance"})

@app.post("/attendance/recognize")
async def recognize_attendance(images: list[UploadFile] = File(...), authorization: str = Header(...)):
    try:
        await get_current_user(authorization)
        if not images or len(images) > 10:
            raise HTTPException(status_code=400, detail="Please upload 1-10 images")
            
        recognized_students = []

        for image in images:
            contents = await image.read()
            nparr = np.frombuffer(contents, np.uint8)
            cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if cv_img is None:
                continue
            
            faces = face_recognition.detect_faces(cv_img, align=True)
            
            for face_obj in faces:
                face_matrix = (face_obj["face"] * 255).astype(np.uint8)
                
                # Resize to 160x160 (Facenet input size)
                face_matrix = cv2.resize(face_matrix, (160, 160))
                
                face_matrix = cv2.cvtColor(face_matrix, cv2.COLOR_RGB2BGR)
                
                embedding = face_recognition.generate_face_embedding(face_matrix)

                if not embedding.all() or len(embedding) != 512:
                    print("continuing.")
                    continue

                match = await face_recognition.match_face(embedding)
                print(match)

                if match and match["regid"] not in [s["regid"] for s in recognized_students]:
                    recognized_students.append({
                        "regid": match["regid"],
                        "confidence": float(1 - match["distance"])
                    })
 
        return {"recognized_students": recognized_students}
        
    except HTTPException:
        raise
    except Exception as err:
        print(f"Face recognition error: {err}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": "Face recognition failed", "details": str(err)})

@app.get("/attendance/summary/{regid}")
async def get_attendance_summary(regid: str, authorization: str = Header(...)):
    try:
        await get_current_user(authorization)
        regid = validators.validate_regid(regid)

        # Verify student exists
        student = await db.query(
            "SELECT regid FROM students WHERE regid = $1",
            [regid]
        )
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Get total working periods
        total_result = await db.query(
            "SELECT COUNT(*) as count FROM attendance WHERE regid = $1",
            [regid]
        )
        total_working_periods = int(total_result[0]["count"]) if total_result else 0

        # Get attended periods
        attended_result = await db.query(
            "SELECT COUNT(*) as count FROM attendance WHERE regid = $1 AND status = 1",
            [regid]
        )
        attended_periods = int(attended_result[0]["count"]) if attended_result else 0

        return {
            "total_working_periods": total_working_periods,
            "attended_periods": attended_periods
        }
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except HTTPException:
        raise
    except Exception as err:
        print(f"Attendance summary error: {err}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": "Failed to load attendance summary"})

# ============ DASHBOARD ENDPOINTS ============

@app.get("/api/dashboard")
async def get_dashboard_stats(authorization: str = Header(...)):
    """Get dashboard statistics"""
    try:
        await get_current_user(authorization)
        today = date.today()
        
        # Get total no.of students
        total_result = await db.query("SELECT COUNT(*) as count FROM students")
        total_students = int(total_result[0]["count"]) if total_result else 0
        
        # Get today's present students count
        present_result = await db.query(
            "SELECT COUNT(DISTINCT regid) as count FROM attendance WHERE date = $1 AND status = 1",
            [today]
        )
        today_present = int(present_result[0]["count"]) if present_result else 0
        
        # Get today attendance rate
        rate_result = await db.query(
            """
            SELECT 
                COUNT(*) FILTER (WHERE status = 1) as present,
                COUNT(*) as total
            FROM attendance
            WHERE date = $1
            """,
            [today]
        )
        if rate_result and rate_result[0]["total"] > 0:
            attendance_rate = round((rate_result[0]["present"] / rate_result[0]["total"]) * 100, 2)
        else:
            attendance_rate = 0.0
        
        # Get classes with attendance today
        classes_result = await db.query(
            "SELECT COUNT(DISTINCT class) as count FROM attendance WHERE date = $1",
            [today]
        )
        classes_today = int(classes_result[0]["count"]) if classes_result else 0
        
        return {
            "todayPresent": today_present,
            "totalStudents": total_students,
            "attendanceRate": attendance_rate,
            "classesToday": classes_today
        }
    except HTTPException:
        raise
    except Exception as err:
        print(f"Dashboard error: {err}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to load dashboard")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)