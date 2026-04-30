from fastapi import APIRouter, HTTPException, File, Form, UploadFile
from pydantic import BaseModel
from typing import Optional
import psycopg2
import psycopg2.extras
import os
import heapq  
import joblib  # ML Brain
import numpy as np  # ML Math
from dotenv import load_dotenv
from datetime import datetime

# Import Phase 2 Triage Logic
from triage_engine import extract_text, calculate_dynamic_priority

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

router = APIRouter(prefix="/api/appointments", tags=["Appointment Scheduling"])

# ==========================================
# 1. INTEGRATED AI BRAIN (PHASE 3)
# ==========================================
try:
    model = joblib.load('noshow_model.pkl')
    scaler = joblib.load('scaler.pkl')
    print("✅ ML Intelligence integrated into Appointment Routes!")
except Exception as e:
    print(f"⚠️ ML Integration Warning: Models not found. Using default 0.0 risk. Error: {e}")
    model = None
    scaler = None

def get_db_connection():
    return psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor)

# ==========================================
# DSA CONCEPT: PRIORITY QUEUE (Max-Heap)
# ==========================================
waiting_room_queue = []
entry_counter = 0 

class QueueRequest(BaseModel):
    patient_name: str
    priority_score: int 

@router.post("/waiting-room/add")
def add_patient_to_queue(request: QueueRequest):
    global entry_counter
    heapq.heappush(waiting_room_queue, (-request.priority_score, entry_counter, request.patient_name))
    entry_counter += 1
    return {"message": f"{request.patient_name} added.", "current_queue_size": len(waiting_room_queue)}

@router.get("/waiting-room/call-next")
def call_next_patient():
    if not waiting_room_queue:
        return {"message": "The waiting room is empty!"}
    neg_priority, count, patient_name = heapq.heappop(waiting_room_queue)
    return {"message": "Next patient called!", "patient_name": patient_name, "priority_score": -neg_priority}

# ==========================================
# ACTUAL DATABASE BOOKING ROUTE (Standard)
# ==========================================
class AppointmentCreate(BaseModel):
    patient_id: str          
    doctor_id: str = "1"     
    appointment_time: str    
    status: str = "scheduled"
    priority_score: int = 1  
    no_show_risk: float = 0.0

@router.post("/book")
def book_appointment(data: AppointmentCreate):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO appointments (patient_id, doctor_id, appointment_time, status, priority_score, no_show_risk)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING appointment_id;
        """
        cursor.execute(query, (data.patient_id, data.doctor_id, data.appointment_time, data.status, data.priority_score, data.no_show_risk))
        result = cursor.fetchone()
        conn.commit()
        return {"status": "success", "appointment_id": result['appointment_id'] if result else None}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to book")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ==========================================
# PHASE 2 & 3: INTELLIGENT TRIAGE BOOKING ROUTE
# ==========================================
@router.post("/book-with-triage")
async def book_appointment_triage(
    patient_id: str = Form(...),
    doctor_id: str = Form(...),
    appointment_time: str = Form(...),
    current_symptom: str = Form(...),
    file: Optional[UploadFile] = File(None) # NOTE: We completely removed no_show_risk from React!
):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # --- STEP 1: OCR Processing (Phase 2) ---
        extracted_text = ""
        if file:
            file_bytes = await file.read()
            extracted_text = extract_text(file_bytes, file.filename)
            
        # --- STEP 2: Priority Calculation (Phase 2) ---
        final_priority = calculate_dynamic_priority(current_symptom, extracted_text)
        
        # --- STEP 3: DYNAMIC NO-SHOW PREDICTION (PHASE 3) ---
        no_show_risk_percentage = 0.0
        
        if model and scaler:
            try:
                # A. Calculate Lead Time Days
                # Appointment time usually comes in as "YYYY-MM-DD HH:MM"
                apt_date = datetime.strptime(appointment_time[:16], "%Y-%m-%d %H:%M")
                lead_time_days = (apt_date - datetime.now()).days
                lead_time_days = max(0, lead_time_days)

                # B. Fetch Patient Profile (Age, Distance, History)
                metrics_query = """
                    SELECT age, distance_miles,
                    (SELECT COUNT(*) FROM appointments WHERE patient_id = %s AND status IN ('No-Show', 'no_show', 'No Show')) as history
                    FROM patient_profiles WHERE uid = %s;
                """
                cursor.execute(metrics_query, (patient_id, patient_id))
                m = cursor.fetchone()

                # C. Run AI Prediction if they have a complete profile
                if m and m['age'] is not None and m['distance_miles'] is not None:
                    features = np.array([[m['age'], m['distance_miles'], lead_time_days, m['history']]])
                    features_scaled = scaler.transform(features)
                    # Probability[0] = No-Show, Probability[1] = Show
                    no_show_risk_percentage = float(round(model.predict_proba(features_scaled)[0][0] * 100, 2))
            except Exception as ml_err:
                print(f"Prediction skipped/error: {ml_err}")

        # --- STEP 4: Insert Final Appointment ---
        query = """
            INSERT INTO appointments (patient_id, doctor_id, appointment_time, status, priority_score, no_show_risk)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING appointment_id;
        """
        cursor.execute(query, (patient_id, doctor_id, appointment_time, "scheduled", final_priority, no_show_risk_percentage))
        result = cursor.fetchone()
        conn.commit()
        
        return {
            "status": "success", 
            "appointment_id": result['appointment_id'] if result else None,
            "assigned_priority": final_priority,
            "message": f"Appointment booked successfully."
        }
        
    except Exception as e:
        print(f"🔥 Error in triage booking: {e}")
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to process triage booking.")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ==========================================
# UPDATE APPOINTMENT STATUS (Admin Confirm/Reschedule)
# ==========================================
class UpdateStatusRequest(BaseModel):
    status: str

@router.put("/{appointment_id}/status")
def update_appointment_status(appointment_id: int, request: UpdateStatusRequest):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "UPDATE appointments SET status = %s WHERE appointment_id = %s"
        cursor.execute(query, (request.status, appointment_id))
        conn.commit()
        
        return {"status": "success", "message": f"Status updated to {request.status}"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to update status")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ==========================================
# GET APPOINTMENTS FOR PATIENT HISTORY TAB
# ==========================================
@router.get("/patient/{patient_id}")
def get_patient_appointments(patient_id: str):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                appointment_id as id, 
                CAST(appointment_time AS TEXT) as date, 
                status, 
                CASE 
                    WHEN doctor_id = '1' THEN 'Dr. Sarah Chen'
                    WHEN doctor_id = '2' THEN 'Dr. James Wilson'
                    WHEN doctor_id = '3' THEN 'Dr. Emily Park'
                    WHEN doctor_id = '4' THEN 'Dr. Michael Ross'
                    WHEN doctor_id = '5' THEN 'Dr. Robert King'
                    WHEN doctor_id = '6' THEN 'Dr. Lisa Cuddy'
                    ELSE 'Dr. ' || doctor_id 
                END as doctor, 
                CASE 
                    WHEN doctor_id = '1' THEN 'Cardiology'
                    WHEN doctor_id = '2' THEN 'General Medicine'
                    WHEN doctor_id = '3' THEN 'Orthopedics'
                    WHEN doctor_id = '4' THEN 'Dermatology'
                    WHEN doctor_id = '5' THEN 'Neurology'
                    WHEN doctor_id = '6' THEN 'Pediatrics'
                    ELSE 'General'
                END as department, 
                'Consultation' as diagnosis
            FROM appointments 
            WHERE patient_id = %s 
            ORDER BY appointment_time DESC;
        """
        cursor.execute(query, (patient_id,))
        records = cursor.fetchall()
        
        return {"status": "success", "data": records}
        
    except Exception as e:
        print(f"🔥 Error fetching history: {e}")
        return {"status": "error", "data": []}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ==========================================
# FETCH SPECIFIC DOCTOR'S APPOINTMENTS
# ==========================================
@router.get("/doctor/{uid}/appointments")
def get_doctor_appointments(uid: str):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                a.appointment_id, 
                COALESCE(p.full_name, 'Unknown Patient') as patient_name, 
                p.phone,
                p.blood_group,
                a.appointment_time, 
                a.status
            FROM appointments a
            JOIN doctors d ON a.doctor_id::VARCHAR = d.doctor_id::VARCHAR
            JOIN users u ON u.email = d.email
            LEFT JOIN patient_profiles p ON a.patient_id = p.uid
            WHERE u.uid = %s
            ORDER BY a.appointment_time ASC;
        """
        cursor.execute(query, (uid,))
        appointments = cursor.fetchall()

        for apt in appointments:
            if hasattr(apt['appointment_time'], 'strftime'):
                apt['appointment_time'] = apt['appointment_time'].strftime("%b %d, %Y - %I:%M %p")
                
        return {"status": "success", "data": appointments}
        
    except Exception as e:
        print(f"🔥 Error fetching appointments: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch appointments")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ==========================================
# GET DOCTOR PROFILE
# ==========================================
@router.get("/doctor/{uid}/profile")
def get_doctor_profile(uid: str):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT full_name, phone, department 
            FROM doctor_profiles 
            WHERE uid = %s;
        """
        cursor.execute(query, (uid,))
        profile = cursor.fetchone()
        
        return {"status": "success", "data": profile or {}}
    except Exception as e:
        print(f"🔥 Error fetching profile: {e}")
        return {"status": "error", "data": {}}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ==========================================
# UPDATE DOCTOR PROFILE
# ==========================================
class DoctorProfileUpdate(BaseModel):
    full_name: str
    phone: str
    department: str

@router.put("/doctor/{uid}/profile")
def update_doctor_profile(uid: str, data: DoctorProfileUpdate):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            UPDATE doctor_profiles 
            SET full_name = %s, phone = %s, department = %s
            WHERE uid = %s;
        """
        cursor.execute(query, (data.full_name, data.phone, data.department, uid))
        
        cursor.execute("UPDATE users SET full_name = %s, phone = %s WHERE uid = %s;", 
                      (data.full_name, data.phone, uid))
        
        conn.commit()
        return {"status": "success", "message": "Profile updated successfully"}
    except Exception as e:
        print(f"🔥 Error updating profile: {e}")
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to update profile")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()