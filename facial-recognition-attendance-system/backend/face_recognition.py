import sys
import os
import cv2
import asyncio
import logging
import numpy as np
from typing import List, Dict, Optional
from deepface import DeepFace

from pgvector import Vector
import db

from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)


def count_faces(image_path: str) -> int:
    return len(detect_faces(image_path))


def validate_face_count(image_path: str, expected_count: int = 1) -> bool:
    return count_faces(image_path) == expected_count


async def match_face(embedding: List[float]) -> Optional[str]:
    threshold = float(os.getenv("FACE_MATCHING_THRESHOLD", "0.68"))

    async with db.pool.acquire() as conn:
        match = await conn.fetchrow(
            """
            SELECT regid, distance
            FROM (
                SELECT regid, (embedding <=> $1) AS distance
                FROM face_embeddings
            ) sub
            ORDER BY distance ASC
            LIMIT 1
            """,
            embedding)#, 1 - threshold)
        #WHERE distance <= $2
        if not match:
            print(f"No match found within threshold {threshold}.")
            return None

        print(f"Match found: RegID={match['regid']}, Distance={match['distance']:.4f}")
        return match

def detect_faces(image_input, align: bool = True) -> List[Dict]:
    try:
        if not isinstance(image_input, (str, np.ndarray)):
            raise ValueError("image_input must be a file path (str) or numpy array")

        face_objs = DeepFace.extract_faces(
            img_path=image_input,
            detector_backend="retinaface",
            enforce_detection=True,
            align=align
        )

        return face_objs
    except Exception as e:
        logging.error(f"Detection error: {e}", exc_info=True)
        return []

def generate_face_embedding(face_matrix: np.ndarray) -> Optional[np.ndarray]:
    try:
        if not isinstance(face_matrix, np.ndarray):
            raise ValueError("face_matrix must be a numpy array")

        # Preprocessing
        face_matrix = cv2.resize(face_matrix, (112, 112))  # Standardize size for ArcFace
        if len(face_matrix.shape) == 3 and face_matrix.shape[2] == 3:
            face_matrix = cv2.cvtColor(face_matrix, cv2.COLOR_BGR2RGB)  # Convert to RGB

        # Generate 512D embedding using ArcFace
        embeddings = DeepFace.represent(
            img_path=face_matrix,
            model_name="ArcFace",  # 512D embeddings
            detector_backend="retinaface",
            enforce_detection=False
        )

        if not embeddings:
            return None

        embedding = embeddings[0]["embedding"]
        norm = np.linalg.norm(embedding)

        if norm == 0:
            return None
        
        embedding /= norm

        return embedding
    except Exception as e:
        logging.error(f"Embedding failed: {e}", exc_info=True)
        return None


async def test_face_recognition(image_path: str) -> None:
    if not os.path.exists(image_path):
        print(f"Error: File not found - {image_path}")
        return

    print(f"\n=== Testing Face Recognition for: {image_path} ===")

    # Detect faces
    faces = detect_faces(image_path, align=True)
    print(f"Faces detected: {len(faces)}")
    if not faces:
        print("No faces found or detection failed.")
        return

    # Filter low-confidence detections
    faces = [face for face in faces if face.get("confidence", 0) >= 0.90]
    if not faces:
        print("No faces met the confidence threshold (0.90).")
        return

    print("\n=== Face Detection Details ===")
    for i, face_obj in enumerate(faces, 1):
        print(f"Face {i}:")
        print(f"  - Confidence: {face_obj.get('confidence', 'N/A'):.4f}")
        print(f"  - Facial Area: {face_obj.get('facial_area', 'N/A')}")

    # Generate embedding for the first face
    face_matrix = (faces[0]["face"] * 255).astype(np.uint8)

    embedding = generate_face_embedding(face_matrix)
    if embedding is None:
        print("Failed to generate embedding.")
        return

    print(f"\n=== Embedding Details ===")
    print(f"Embedding length: {len(embedding)}")
    print(f"Embedding (first 5 values): {embedding[:5]}")
    print(f"Embedding norm: {np.linalg.norm(embedding):.4f}")

    # Match face
    await db.init_pool()  # Ensure the pool is initialized
    async with db.pool.acquire() as conn:
        matches = await conn.fetch(
            """
            SELECT regid, embedding <-> $1 as distance
            FROM face_embeddings
            ORDER BY embedding <-> $1
            LIMIT 5
            """,
            Vector(embedding)
        )

        if not matches:
            print("No matches found in the database.")
            return

        print("\n=== Top 5 Matches ===")
        for i, match in enumerate(matches, 1):
            distance = match["distance"]
            match_percentage = max(0, 100 - (distance * 10))  # Example scaling
            print(f"{i}. RegID: {match['regid']}, Distance: {distance:.4f}, Match Percentage: {match_percentage:.2f}%")

        # Check if the closest match meets the threshold
        threshold = float(os.getenv("FACE_MATCHING_THRESHOLD", "0.6"))
        if matches[0]["distance"] <= threshold:
            print(f"\n✅ Match found: RegID={matches[0]['regid']} (Distance: {matches[0]['distance']:.4f})")
        else:
            print(f"\n❌ No match found. Closest RegID: {matches[0]['regid']} (Distance: {matches[0]['distance']:.4f}, Threshold: {threshold})")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python face_recognition.py <image_path>")
    else:
        asyncio.run(test_face_recognition(sys.argv[1]))