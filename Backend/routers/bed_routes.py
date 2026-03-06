from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

# Load the connection string from .env
load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

router = APIRouter()

def get_db_connection():
    # Connects to PostgreSQL using the URI
    return psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor)

class BedAllocationRequest(BaseModel):
    patient_id: int
    ward_type: str

@router.post("/api/beds/allocate")
def allocate_bed(request: BedAllocationRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # PESSIMISTIC LOCKING: 'FOR UPDATE SKIP LOCKED' handles the race condition.
        # It locks the row so another admin cannot book the same bed at the same time.
        cursor.execute("""
            SELECT bed_id FROM beds 
            WHERE ward_type = %s AND is_occupied = FALSE 
            LIMIT 1 
            FOR UPDATE SKIP LOCKED; 
        """, (request.ward_type,))
        
        available_bed = cursor.fetchone()
        
        if not available_bed:
            conn.rollback()
            raise HTTPException(status_code=404, detail="No beds available in this ward.")

        bed_id = available_bed['bed_id']

        # Update the bed status within the same transaction
        cursor.execute("""
            UPDATE beds 
            SET is_occupied = TRUE, current_patient_id = %s 
            WHERE bed_id = %s;
        """, (request.patient_id, bed_id))

        conn.commit() # Save changes and release the lock
        return {"message": "Bed allocated successfully", "bed_id": bed_id}
        
    except Exception as e:
        conn.rollback() # Undo changes if an error occurs (ACID property)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()