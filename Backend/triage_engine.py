import fitz  # PyMuPDF for PDFs
import pytesseract
from PIL import Image
import io

# 1. The Base Urgency Matrix
SYMPTOM_URGENCY_MAP = {
    "Routine Checkup": 1,
    "Mild Pain": 3,
    "Fever/Cold": 4,
    "Breathing Difficulty": 8,
    "Chest Pain": 10
}

# 2. Historical Risk Flags
# In a real hospital, this is thousands of words. For our paper, this proves the concept.
RISK_KEYWORDS = ["diabetic", "asthma", "hypertension", "cardiac", "heart", "cancer", "surgery"]

def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extracts text from either a PDF or an Image."""
    text = ""
    try:
        if filename.lower().endswith('.pdf'):
            # Handle PDF
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                text += page.get_text("text").lower()
        elif filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            # Handle Image using OCR
            image = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(image).lower()
    except Exception as e:
        print(f"File extraction error: {e}")
    
    return text

def calculate_dynamic_priority(symptom: str, file_text: str = "") -> int:
    """Calculates Final Priority: Base Score + History Modifier"""
    
    # Get Base Score (Default to 2 if unknown)
    base_score = SYMPTOM_URGENCY_MAP.get(symptom, 2)
    history_modifier = 0
    
    # NLP Keyword Matching
    if file_text:
        found_risks = [word for word in RISK_KEYWORDS if word in file_text]
        if found_risks:
            print(f"--- TRIAGE ALERT: Found historical risks {found_risks} ---")
            
            # --- NEW: THE SILENT RISK OVERRIDE ---
            # If they have critical history (like heart issues) but booked a routine checkup
            if any(critical in found_risks for critical in ["cardiac", "heart", "surgery"]):
                if base_score < 5:
                    print("--- CRITICAL OVERRIDE: Elevating high-risk patient to Level 5 ---")
                    base_score = 5
            # -------------------------------------

            # Only boost priority if the current symptom warrants it
            # (e.g., A routine checkup doesn't become an emergency just because they have asthma)
            if base_score >= 3:
                history_modifier = 2 
                
    # Calculate and cap the maximum score at 10
    final_score = min(base_score + history_modifier, 10)
    return final_score