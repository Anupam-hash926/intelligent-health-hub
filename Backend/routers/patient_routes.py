from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv
from datetime import datetime  

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

# ==========================================
# ENDPOINT: Fetch Patient History
# ==========================================
@router.get("/{uid}/history")
def get_patient_history(uid: str):
    # STEP 1: Check the Cache (O(1) Time Complexity)
    if uid in patient_cache:
        print(f"⚡ CACHE HIT: Retrieved records for patient {uid} instantly.")
        return {
            "retrieval_speed": "O(1) Constant Time",
            "source": "Memory Cache",
            "uid": uid,
            "data": patient_cache[uid]
        }

    # STEP 2: Cache Miss. Query the REAL Database
    print(f"🔍 CACHE MISS: Querying PostgreSQL for patient {uid}...")
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT record_id, diagnosis, prescription, visit_date AS date 
            FROM medical_records 
            WHERE patient_id = %s
            ORDER BY visit_date DESC;
        """, (uid,))
        
        records = cursor.fetchall()
        
        if not records:
            print("Database checked, but no records exist for this patient yet.")
            records = []
        else:
            patient_cache[uid] = records
        
        return {
            "retrieval_speed": "O(log N) Logarithmic Time",
            "source": "PostgreSQL Database",
            "uid": uid,
            "data": records
        }
    
    except psycopg2.Error as e:
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
@router.get("/{uid}/profile")
def get_patient_profile(uid: str):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT 
                u.uid, 
                u.full_name, 
                u.email, 
                u.phone,
                p.dob,
                p.age, 
                p.distance_miles, 
                p.blood_group
            FROM users u
            LEFT JOIN patient_profiles p ON u.uid = p.uid
            WHERE u.uid = %s;
        """
        
        cursor.execute(query, (uid,))
        profile = cursor.fetchone()

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
# ENDPOINT: Update/Save Patient Profile
# ==========================================
class ProfileUpdate(BaseModel):
    full_name: str
    email: str
    phone: str
    dob: str
    distance_miles: int

@router.post("/{uid}/update-profile")
def update_patient_profile(uid: str, data: ProfileUpdate):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        birth_date = datetime.strptime(data.dob, "%Y-%m-%d")
        today = datetime.today()
        calculated_age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

        # 1. Update the Users Table
        cursor.execute("""
            UPDATE users 
            SET full_name = %s, email = %s, phone = %s
            WHERE uid = %s;
        """, (data.full_name, data.email, data.phone, uid))

        # 2. Update the Patient Profiles Table (FIXED: Now includes name, email, and phone)
        cursor.execute("""
            INSERT INTO patient_profiles (uid, full_name, email, phone, dob, age, distance_miles)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (uid) 
            DO UPDATE SET 
                full_name = EXCLUDED.full_name,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                dob = EXCLUDED.dob, 
                age = EXCLUDED.age, 
                distance_miles = EXCLUDED.distance_miles;
        """, (uid, data.full_name, data.email, data.phone, data.dob, calculated_age, data.distance_miles))
        
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

# ==========================================
# ENDPOINT: Sync Firebase User to Supabase
# ==========================================
class UserSync(BaseModel):
    uid: str
    email: str
    role: str

@router.post("/sync")
def sync_firebase_user(data: UserSync):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO users (uid, email, role)
            VALUES (%s, %s, %s)
            ON CONFLICT (uid) DO NOTHING;
        """
        cursor.execute(query, (data.uid, data.email, data.role))
        
        if data.role == "patient":
            profile_query = """
                INSERT INTO patient_profiles (uid)
                VALUES (%s)
                ON CONFLICT (uid) DO NOTHING;
            """
            cursor.execute(profile_query, (data.uid,))

        conn.commit()
        return {"status": "success", "message": "User synced to Supabase successfully"}

    except Exception as e:
        print(f"Database Error: {e}")
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to sync user")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()