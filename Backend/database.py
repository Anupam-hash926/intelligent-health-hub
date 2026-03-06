import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    """Centralized function to connect to Supabase"""
    return psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor)