from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import heapq  # THIS is the DSA magic for Priority Queues!

router = APIRouter(prefix="/api/appointments", tags=["Appointment Scheduling"])

# ==========================================
# DSA CONCEPT: PRIORITY QUEUE (Max-Heap)
# ==========================================
# We use this list to store our live waiting room queue.
waiting_room_queue = []
# We use a counter to handle ties (if two priority 10s arrive, whoever came first goes first)
entry_counter = 0 

class QueueRequest(BaseModel):
    patient_name: str
    priority_score: int # 1 (Routine) to 10 (Emergency)

@router.post("/waiting-room/add")
def add_patient_to_queue(request: QueueRequest):
    global entry_counter
    
    # Python's heapq is naturally a "Min-Heap" (pops the lowest number first).
    # To make it a "Max-Heap" (so Priority 10 pops BEFORE Priority 1), 
    # we multiply the score by -1 before storing it!
    heapq.heappush(
        waiting_room_queue, 
        (-request.priority_score, entry_counter, request.patient_name)
    )
    entry_counter += 1
    
    return {
        "message": f"{request.patient_name} added to the live waiting room queue.",
        "current_queue_size": len(waiting_room_queue)
    }

@router.get("/waiting-room/call-next")
def call_next_patient():
    if not waiting_room_queue:
        return {"message": "The waiting room is empty! Doctors can take a break."}
    
    # This instantly pops the patient with the highest priority score in O(1) time
    neg_priority, count, patient_name = heapq.heappop(waiting_room_queue)
    actual_priority = -neg_priority # Convert it back to a positive number
    
    return {
        "message": "Next patient called to the doctor's office!",
        "patient_name": patient_name,
        "priority_score": actual_priority
    }

# ==========================================
# The standard booking route (Waiting for ML)
# ==========================================
class AppointmentRequest(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_time: datetime
    priority_score: int = 1 

@router.post("/book")
def book_appointment(request: AppointmentRequest):
    # NOTE FOR ML PHASE: We will add the Logistic Regression overbooking logic here soon!
    return {
        "message": "Appointment scheduled in database.",
        "details": {"patient_id": request.patient_id, "time": request.appointment_time}
    }