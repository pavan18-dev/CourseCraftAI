# backend/config.py (New File, Recommended)

from decouple import config # Recommended: pip install python-decouple
from datetime import timedelta

# --- JWT Configuration ---
# Generate a long, random string and store it securely (e.g., in a .env file)
# If using a .env file, you'd load it like: SECRET_KEY = config('SECRET_KEY')
SECRET_KEY = "YOUR_SUPER_SECRET_KEY_REPLACE_ME" 
ALGORITHM = "HS256" # Standard signing algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Token expiration time
# backend/config.py (Add this line)

from decouple import config # NEW IMPORT

# ... existing JWT configuration ...

# --- LLM Configuration ---
GEMINI_API_KEY = config('GEMINI_API_KEY') # Load from .env
# backend/config.py

from decouple import config 
from datetime import timedelta

# ... existing JWT configuration ...

# --- MongoDB Configuration (NEW) ---
# Replace with your actual connection string (e.g., MongoDB Atlas or local)
MONGO_URI = config('MONGO_URI', default='mongodb://localhost:27017')
DB_NAME = config('DB_NAME', default='coursecraft_ai')
# ------------------------------------

# ... existing LLM Configuration ...
# backend/config.py (Snippet)
from decouple import config 

# ... existing JWT configuration ...

# --- LLM Configuration ---
GEMINI_API_KEY = config('GEMINI_API_KEY') # Loads the key from .env
# backend/config.py (Snippet)

# ... existing configurations ...

# --- YouTube API Configuration ---
YOUTUBE_API_KEY = config('YOUTUBE_API_KEY')