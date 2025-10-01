# backend/utils.py

# ... existing imports ...
from jose import JWTError, jwt
from datetime import datetime, timedelta
# Import the constants you defined in config.py
from . import config 

# ... existing get_db, password hashing functions ...

# --- JWT Token Functions ---

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Creates a signed JWT access token."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    # Use the secret key and algorithm to sign the token
    encoded_jwt = jwt.encode(
        to_encode, 
        config.SECRET_KEY, 
        algorithm=config.ALGORITHM
    )
    return encoded_jwt