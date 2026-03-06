from fastapi import APIRouter, HTTPException
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

# Load database credentials from the .env file
load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

router = APIRouter()

# ==========================================
# DSA CONCEPT: Hashing / In-Memory Caching O(1)
# ==========================================
# We use a global Python dictionary to simulate a Redis cache.
# This allows instant retrieval without hitting the database.
patient_cache = {}

def get_db_connection():
    return psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor)

@router.get("/{patient_id}/history")
def get_patient_history(patient_id: int):
    # STEP 1: Check the Cache (O(1) Time Complexity)
    if patient_id in patient_cache:
        print(f"⚡ CACHE HIT: Retrieved records for patient {patient_id} instantly.")
        return {
            "retrieval_speed": "O(1) Constant Time",
            "source": "Memory Cache",
            "patient_id": patient_id,
            "data": patient_cache[patient_id]
        }

    # STEP 2: Cache Miss. Query the Database (O(log N) Time Complexity via B+ Tree Index)
    print(f"🔍 CACHE MISS: Querying PostgreSQL for patient {patient_id}...")
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # This query is lightning fast because we added the B+ Tree index 
        # to the patient_id column in Phase 2!
        cursor.execute("""
            SELECT record_id, diagnosis, prescription, visit_date 
            FROM medical_records 
            WHERE patient_id = %s
            ORDER BY visit_date DESC;
        """, (patient_id,))
        
        records = cursor.fetchall()
        
        if not records:
            raise HTTPException(status_code=404, detail="No medical records found for this patient.")

        # STEP 3: Save to cache so the next request is O(1)
        patient_cache[patient_id] = records
        
        return {
            "retrieval_speed": "O(log N) Logarithmic Time",
            "source": "PostgreSQL Database",
            "patient_id": patient_id,
            "data": records
        }
    
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()