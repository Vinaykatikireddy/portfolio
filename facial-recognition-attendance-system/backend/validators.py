import re
from datetime import date

# Allowed values for fixed-choice fields (single source of truth)
VALID_GENDERS = {"M", "F"}
VALID_LAB_SECTIONS = {"A", "B"}
VALID_SEMESTERS = {"First Semester", "Second Semester", "Third Semester", "Fourth Semester", "Fifth Semester", "Sixth Semester", "Seventh Semester", "Eighth Semester"}
VALID_REGULATIONS = {"R20", "R23", "R25"}
VALID_BATCHES = {"2020-2024", "2021-2025", "2022-2026", "2023-2027", "2024-2028", "2025-2029", "2025-2028", "2026-2030"}
VALID_PROGRAMMES = {"BCA", "BBA", "MCA", "MBA", "S&H", "CSE", "AIML", "CSEDS", "CSEAIDS", "CSECS", "CSEBS", "IT", "ECE", "EEE", "MECH", "RBT", "CIV"}
VALID_RESIDENCES = {"Bus", "Hosteler", "Own Transport"}
VALID_SECTIONS = {"A", "B", "C", "D", "E", "F", "G", "H", "I"}

MAX_STRING_LENGTH = 50
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png"}


def validate_name(name: str) -> str:
    if len(name.strip().split()) > 100:
        raise ValueError("Name is too long (max 200 characters)")
    return name.strip()

def validate_regid(regid: str) -> str:
    if len(regid.strip().split()) > 10:
        raise ValueError("Reg ID is too long (max 10 characters)")
    return regid.strip().upper()

def validate_email(email: str) -> str:
    email = email.strip()
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        raise ValueError("Invalid email format")
    if len(email) > MAX_STRING_LENGTH:
        raise ValueError("Email is too long")
    return email

def validate_phone(phone: str) -> str:
    """Indian 10-digit mobile number: starts with 6-9."""
    phone = phone.strip()
    cleaned = re.sub(r'\s+', '', phone)
    if not re.match(r'^[6-9]\d{9}$', cleaned):
        raise ValueError(f"phone number must be a valid 10-digit number")
    return cleaned

def validate_dob(dob_str: str) -> date:
    try:
        dob = date.fromisoformat(dob_str)
    except (ValueError, TypeError):
        raise ValueError("Invalid date format for date of birth")
    if dob > date.today():
        raise ValueError("Date of birth cannot be in the future")
    if dob < date(1990, 1, 1):
        raise ValueError("Date of birth is too far in the past")
    return dob

def validate_gender(gender: str) -> str:
    if gender.strip().upper() not in VALID_GENDERS:
        raise ValueError(f"Gender must be {'or '.join(sorted(VALID_GENDERS))}")
    return gender.strip()

def validate(value: str, field_name: str, allowed: set) -> str:
    if not value:
        raise ValueError(f"{field_name} Required'")

    if value not in allowed:
        raise ValueError(f"Invalid {field_name}: '{value}'")
    return value

def validate_image(image) -> None:
    """Validate uploaded image file type and size. Pass the UploadFile or None."""
    if image is None:
        return
    if image.filename and image.content_type and image.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError(f"Image must be JPEG or PNG, got: {image.content_type}")
    # Check file extension
    filename = image.filename.lower()
    if filename and not (filename.endswith('.jpg') or filename.endswith('.jpeg') or filename.endswith('.png')):
        raise ValueError("Image file must have .jpg or .png extension")
    # Size check — read the file
    if image.size and image.size > MAX_IMAGE_SIZE:
        raise ValueError(f"Image must be under 10 MB")

def validate_attendance_class(value: str) -> str:
    """Validate attendance class name in format PROGRAMME-SECTION (e.g. 'BCA-A')."""
    parts = value.split("-")
    if len(parts) != 2:
        raise ValueError(f"Invalid class format '{value}'. Expected format: PROGRAMME-SECTION (e.g. BCA-A)")
    programme, section = parts[0], parts[1]
    if programme not in VALID_PROGRAMMES:
        raise ValueError(f"Invalid programme in class: '{programme}'")
    if section not in VALID_SECTIONS:
        raise ValueError(f"Invalid section in class: '{section}'")
    return value

def validate_username(username: str) -> str:
    username = username.strip()
    if len(username) > 50:
        raise ValueError("Username is too long")
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise ValueError("Username can only contain letters, numbers, and underscores")
    return username

def validate_password(password: str) -> None:
    """Password strength check. Raise ValueError if weak."""
    password = password.strip()
    if not password:
        raise ValueError("Password is required")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not re.search(r'[A-Z]', password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r'\d', password):
        raise ValueError("Password must contain at least one number")
    return password





