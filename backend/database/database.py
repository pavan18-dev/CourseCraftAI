# backend/database/database.py

from motor.motor_asyncio import AsyncIOMotorClient
from . import config # Import your config file

# 1. MongoDB Client Initialization
client = AsyncIOMotorClient(config.MONGO_URI)
database = client[config.DB_NAME]

# Define collections (equivalent to tables)
user_collection = database.get_collection("users")
course_collection = database.get_collection("course_plans")

# 2. Dependency for Database Access (Asynchronous)
async def get_db_client():
    """Provides the MongoDB client for the request."""
    return database