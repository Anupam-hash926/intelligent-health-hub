from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/emergency", tags=["Emergency Routing"])

# This represents the data coming FROM your React frontend
class HospitalFromMap(BaseModel):
    id: int
    name: str
    lat: float
    lon: float
    distance_km: float

class EmergencyRoutingRequest(BaseModel):
    patient_lat: float
    patient_lon: float
    hospitals: List[HospitalFromMap]

@router.post("/optimize-route")
def optimize_emergency_route(request: EmergencyRoutingRequest):
    # In a real app, we would query the SQL database here:
    # SELECT icu_beds_available FROM hospitals WHERE name = h.name
    
    # For now, let's mock the database response to prove the algorithm works
    mock_db_bed_data = {
        "City General": {"icu_beds": 0},      # Very close, but FULL!
        "Northside Clinic": {"icu_beds": 2},  # Medium distance, beds available.
        "Apollo Emergency": {"icu_beds": 5}   # Far away, beds available.
    }
    
    analyzed_hospitals = []
    
    for h in request.hospitals:
        # Default to 0 beds if the hospital isn't in our database
        live_beds = mock_db_bed_data.get(h.name, {"icu_beds": 0})["icu_beds"]
        
        # ==========================================
        # DSA ALGORITHM: Weighted Sorting
        # ==========================================
        # If beds are 0, apply a massive penalty distance (essentially ignoring it)
        # If beds exist, use the actual distance.
        effective_distance = h.distance_km if live_beds > 0 else h.distance_km + 9999
        
        analyzed_hospitals.append({
            "name": h.name,
            "actual_distance": h.distance_km,
            "live_icu_beds": live_beds,
            "effective_score": effective_distance
        })
        
    # Sort by our custom algorithm (Effective Score)
    sorted_recommendations = sorted(analyzed_hospitals, key=lambda x: x["effective_score"])
    
    return {
        "message": "Route optimized based on Live Bed Availability.",
        "top_recommendation": sorted_recommendations[0],
        "all_analyzed": sorted_recommendations
    }