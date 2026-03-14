from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv
from datetime import datetime  # <-- ADDED THIS FOR AGE CALCULATION

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

# ==========================================
# ENDPOINT: Fetch Patient Profile (SQL JOIN)
# ==========================================
@router.get("/{patient_id}/profile")
def get_patient_profile(patient_id: int):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # The SQL JOIN: Zipping the users table and patient_profiles table together
        # Added p.dob here so the React frontend can auto-fill the date picker!
        query = """
            SELECT 
                u.user_id, 
                u.full_name, 
                u.email, 
                u.phone,
                p.dob,
                p.age, 
                p.distance_miles, 
                p.blood_group
            FROM users u
            LEFT JOIN patient_profiles p ON u.user_id = p.user_id
            WHERE u.user_id = %s;
        """
        
        cursor.execute(query, (patient_id,))
        profile = cursor.fetchone()

        # Format the date properly for React if it exists
        if profile and profile.get('dob'):
            profile['dob'] = profile['dob'].strftime("%Y-%m-%d")

        if not profile:
            raise HTTPException(status_code=404, detail="Patient profile not found")

        return profile

    except psycopg2.Error as e:
        print(f"Database Error: {e}")
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to fetch patient profile")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ==========================================
# NEW ENDPOINT: Update/Save Patient Profile
# ==========================================
class ProfileUpdate(BaseModel):
    full_name: str
    email: str
    phone: str
    dob: str
    distance_miles: int

@router.post("/{patient_id}/update-profile")
def update_patient_profile(patient_id: int, data: ProfileUpdate):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Smart Age Calculation (Calculates age based on the DOB they provided)
        birth_date = datetime.strptime(data.dob, "%Y-%m-%d")
        today = datetime.today()
        calculated_age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

        # 2. Update the 'users' table (Name, Email, Phone)
        cursor.execute("""
            UPDATE users 
            SET full_name = %s, email = %s, phone = %s
            WHERE user_id = %s;
        """, (data.full_name, data.email, data.phone, patient_id))

        # 3. UPSERT the 'patient_profiles' table (DOB, calculated Age, Distance)
        cursor.execute("""
            INSERT INTO patient_profiles (user_id, dob, age, distance_miles)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                dob = EXCLUDED.dob, 
                age = EXCLUDED.age, 
                distance_miles = EXCLUDED.distance_miles;
        """, (patient_id, data.dob, calculated_age, data.distance_miles))
        
        conn.commit()
        
        return {"status": "success", "message": "Comprehensive Profile saved successfully!"}
        
    except Exception as e:
        print(f"Database Error: {e}")
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to update patient profile")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()