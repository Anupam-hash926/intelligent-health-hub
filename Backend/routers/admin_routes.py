from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

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
        # 4. Uses ILIKE to catch any capitalization of "scheduled"
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
            WHERE a.status ILIKE '%schedule%'
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
        # --- THIS IS THE MAGIC LINE TO CATCH THE BUG ---
        print(f"🔥 ADMIN BUTTON ERROR: {e}")
        
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to update appointment")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()