from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

def get_db_connection():
    return psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor)

# ==========================================
# 1. FETCH ALL APPOINTMENTS FOR THE ADMIN
# ==========================================
@router.get("/appointments")
def get_all_appointments():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # BULLETPROOF QUERY: 
        # 1. Casts appointment_time to String so React can read it safely
        # 2. Casts no_show_risk to Float
        # 3. Uses COALESCE to fallback to "Mock Patient XXXX" if they aren't a real registered user
        # 4. STRICT FILTER: Only exactly 'scheduled' and NOT overbooked. Fixes the ILIKE '%schedule%' bug!
        # 5. Added a CASE statement to map doctor_id to doctor_name dynamically
        query = """
            SELECT 
                a.appointment_id, 
                a.patient_id, 
                a.doctor_id,
                CASE 
                    WHEN a.doctor_id = '1' THEN 'Sarah Chen'
                    WHEN a.doctor_id = '2' THEN 'James Wilson'
                    WHEN a.doctor_id = '3' THEN 'Emily Park'
                    WHEN a.doctor_id = '4' THEN 'Michael Ross'
                    WHEN a.doctor_id = '5' THEN 'Robert King'
                    WHEN a.doctor_id = '6' THEN 'Lisa Cuddy'
                    ELSE 'ID: ' || a.doctor_id 
                END as doctor_name,
                CAST(a.appointment_time AS TEXT) as appointment_time, 
                a.status, 
                CAST(a.no_show_risk AS FLOAT) as no_show_risk, 
                a.is_overbooked,
                COALESCE(p.full_name, 'Mock Patient ' || LEFT(CAST(a.patient_id AS TEXT), 4)) as full_name,
                COALESCE(p.phone, 'No Phone') as phone
            FROM appointments a
            LEFT JOIN patient_profiles p ON a.patient_id = p.uid
            WHERE a.status = 'scheduled' AND (a.is_overbooked IS NULL OR a.is_overbooked = FALSE)
            ORDER BY a.appointment_time ASC;
        """
        cursor.execute(query)
        appointments = cursor.fetchall()
        
        return {"status": "success", "data": appointments}

    except Exception as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch appointments")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ==========================================
# 2. HANDLE THE 3 ADMIN BUTTONS
# ==========================================
class AdminAction(BaseModel):
    action: str # "confirm", "double_book", or "dismiss"

@router.put("/appointments/{appointment_id}/action")
def handle_appointment_action(appointment_id: int, request: AdminAction):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if request.action == "confirm":
            query = "UPDATE appointments SET status = 'confirmed', is_overbooked = FALSE WHERE appointment_id = %s"
            message = "Appointment locked and confirmed."
            
        elif request.action == "double_book":
            query = "UPDATE appointments SET is_overbooked = TRUE WHERE appointment_id = %s"
            message = "Slot marked for double booking. Patient remains scheduled."
            
        elif request.action == "dismiss":
            # --- NEW: Dismiss the patient and trigger the warning ---
            query = "UPDATE appointments SET status = 'reschedule_requested' WHERE appointment_id = %s"
            message = "Patient dismissed. Warning sent to their dashboard."
            
        else:
            raise HTTPException(status_code=400, detail="Invalid action.")
            
        cursor.execute(query, (appointment_id,))
        conn.commit()
        
        return {"status": "success", "message": message}

    except Exception as e:
        print(f"🔥 ADMIN BUTTON ERROR: {e}")
        
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to update appointment")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ==========================================
# 3. GLOBAL HOSPITAL RECORDS (SEARCH BY NAME)
# ==========================================
@router.get("/records")
def get_hospital_records(name: Optional[str] = None, months: Optional[str] = None):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                a.appointment_id, 
                CAST(a.appointment_time AS TEXT) as appointment_time, 
                a.status, 
                a.doctor_id,
                CASE 
                    WHEN a.doctor_id = '1' THEN 'Sarah Chen'
                    WHEN a.doctor_id = '2' THEN 'James Wilson'
                    WHEN a.doctor_id = '3' THEN 'Emily Park'
                    WHEN a.doctor_id = '4' THEN 'Michael Ross'
                    WHEN a.doctor_id = '5' THEN 'Robert King'
                    WHEN a.doctor_id = '6' THEN 'Lisa Cuddy'
                    ELSE 'ID: ' || a.doctor_id 
                END as doctor_name,
                COALESCE(p.full_name, 'Unknown Patient') as patient_name,
                COALESCE(p.phone, 'No Phone') as phone
            FROM appointments a
            LEFT JOIN patient_profiles p ON a.patient_id = p.uid
            WHERE 1=1 
        """
        params = []
        
        # FILTER 1: Name Match (Patient OR Doctor)
        if name:
            query += """ AND (
                p.full_name ILIKE %s 
                OR 
                CASE 
                    WHEN a.doctor_id = '1' THEN 'Sarah Chen'
                    WHEN a.doctor_id = '2' THEN 'James Wilson'
                    WHEN a.doctor_id = '3' THEN 'Emily Park'
                    WHEN a.doctor_id = '4' THEN 'Michael Ross'
                    WHEN a.doctor_id = '5' THEN 'Robert King'
                    WHEN a.doctor_id = '6' THEN 'Lisa Cuddy'
                    ELSE 'ID: ' || a.doctor_id 
                END ILIKE %s
            )"""
            params.extend([f"%{name}%", f"%{name}%"]) 
            
        # FILTER 2: STRICT Timeframe Logic
        if months == "upcoming":
            # Only show appointments scheduled for today or the future
            query += " AND a.appointment_time >= CURRENT_DATE"
        elif months and months.isdigit():
            # Only show appointments bounded exactly within the past X months (no future dates)
            query += " AND a.appointment_time >= CURRENT_DATE - MAKE_INTERVAL(months => %s) AND a.appointment_time <= CURRENT_DATE"
            params.append(int(months))
            
        query += " ORDER BY a.appointment_time DESC;"
        
        cursor.execute(query, tuple(params))
        records = cursor.fetchall()
        
        return {"status": "success", "data": records}

    except Exception as e:
        print(f"🔥 RECORD SEARCH ERROR: {e}")
        raise HTTPException(status_code=500, detail="Failed to search records")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ==========================================
# 4. PATIENT LOOKUP BY PHONE (FETCHING ACCOUNT HISTORY)
# ==========================================
@router.get("/patient-lookup")
def lookup_patient_by_phone(phone: str):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        search_term = f"%{phone.strip()}%"
        
        # We make the `users` table the base since auth details (email, created_at) live there
        query = """
            SELECT 
                u.uid, 
                COALESCE(p.full_name, u.full_name, 'Unknown') as full_name, 
                COALESCE(u.email, p.email, 'No Email') as email, 
                COALESCE(u.phone, p.phone, 'No Phone') as phone, 
                p.dob, 
                p.age, 
                p.distance_miles, 
                p.blood_group,
                u.created_at
            FROM users u
            LEFT JOIN patient_profiles p ON u.uid = p.uid
            WHERE u.phone ILIKE %s OR p.phone ILIKE %s;
        """
        cursor.execute(query, (search_term, search_term))
        patient = cursor.fetchone()
        
        if not patient:
            raise HTTPException(status_code=404, detail="No patient found with this phone number.")

        # Format DOB if it exists
        if patient.get('dob') and hasattr(patient['dob'], 'strftime'):
            patient['dob'] = patient['dob'].strftime("%Y-%m-%d")
            
        # Calculate "Joined X days/months ago" dynamically
        patient['joined_text'] = "Unknown"
        if patient.get('created_at'):
            created_date = patient['created_at']
            
            # Handle naive vs timezone-aware datetimes
            if created_date.tzinfo is None:
                now = datetime.now()
            else:
                now = datetime.now(timezone.utc)
                
            diff = now - created_date
            days = diff.days
            
            if days == 0:
                patient['joined_text'] = "Today"
            elif days == 1:
                patient['joined_text'] = "Yesterday"
            elif days < 30:
                patient['joined_text'] = f"{days} days ago"
            elif days < 365:
                months = days // 30
                patient['joined_text'] = f"{months} month{'s' if months > 1 else ''} ago"
            else:
                years = days // 365
                patient['joined_text'] = f"{years} year{'s' if years > 1 else ''} ago"
                
            # Format the raw date to send back as well
            patient['created_at'] = created_date.strftime("%B %d, %Y")
            
        return {"status": "success", "data": patient}

    except HTTPException:
        raise
    except Exception as e:
        print(f"🔥 PATIENT LOOKUP ERROR: {e}")
        raise HTTPException(status_code=500, detail="Failed to lookup patient")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()