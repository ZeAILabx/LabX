import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    _default_origins = (
        'http://localhost:5173,http://localhost:5174,http://localhost:5175,'
        'http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,'
        'http://127.0.0.1:5175,http://127.0.0.1:3000'
    )
    raw_origins = os.getenv('CORS_ORIGINS', _default_origins)
    CORS_ORIGINS = [o.strip() for o in raw_origins.split(',') if o.strip()]

