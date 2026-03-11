from fastapi import APIRouter, HTTPException
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

# Load database credentials from the .env file
load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

router = APIRouter(prefix="/api/patients", tags=["Patient Data"])

# ==========================================
# DSA CONCEPT: Hashing / In-Memory Caching O(1)
# ==========================================
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

    # STEP 2: Cache Miss. Query the REAL Database
    print(f"🔍 CACHE MISS: Querying PostgreSQL for patient {patient_id}...")
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Querying your real medical_records table
        cursor.execute("""
            SELECT record_id, diagnosis, prescription, visit_date AS date 
            FROM medical_records 
            WHERE patient_id = %s
            ORDER BY visit_date DESC;
        """, (patient_id,))
        
        records = cursor.fetchall()
        
        # If the database is empty, we don't throw an error! We just return an empty list.
        if not records:
            print("Database checked, but no records exist for this patient yet.")
            records = []
        else:
            # Only save to cache if we actually found real data
            patient_cache[patient_id] = records
        
        return {
            "retrieval_speed": "O(log N) Logarithmic Time",
            "source": "PostgreSQL Database",
            "patient_id": patient_id,
            "data": records
        }
    
    except psycopg2.Error as e:
        # This will only trigger if your table is missing or DB is offline
        print(f"Database Error: {e}")
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()