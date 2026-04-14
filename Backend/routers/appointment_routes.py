from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2
import psycopg2.extras
import os
import heapq  
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

router = APIRouter(prefix="/api/appointments", tags=["Appointment Scheduling"])

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
# ACTUAL DATABASE BOOKING ROUTE 
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
# GET APPOINTMENTS FOR PATIENT HISTORY TAB
# ==========================================
@router.get("/patient/{patient_id}")
def get_patient_appointments(patient_id: str):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Updated to dynamically map IDs to names and departments!
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