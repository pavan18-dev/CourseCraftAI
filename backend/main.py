# backend/main.py - COMPLETE PHASE 2 BACKEND with Progress Tracking and DELETE

from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, BeforeValidator 
from typing import List, Annotated, Union
from motor.motor_asyncio import AsyncIOMotorClient 
from fastapi.security import OAuth2PasswordRequestForm
import uuid
import json
from datetime import datetime, timedelta
from bson import ObjectId 

# --- SERVICE IMPORTS ---
from .llm_service import generate_plan_from_llm 
from .resource_service import curate_resources_for_plan 
# -----------------------

# --- UTILITY AND CONFIG IMPORTS (Assumed to be correctly implemented) ---
from . import config 
from .database.database import user_collection, course_collection 
from .database.database import get_db_client 
from .utils import get_password_hash, verify_password, create_access_token, get_current_user
# ------------------------------------------------------------------

# 💡 Helper type to convert MongoDB's ObjectId to a string for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

app = FastAPI()

# ---------- AUTH & LIST SCHEMAS (Updated for MongoDB) ----------
class UserBase(BaseModel):
    id: PyObjectId = Field(alias="_id", default=None) 
    email: EmailStr
    full_name: str | None = None
    
    class Config: 
        populate_by_name = True
        arbitrary_types_allowed = True 
        json_encoders = {ObjectId: str}

class User(UserBase):
    hashed_password: str

class UserCreate(UserBase):
    password: str 

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class CourseListItem(BaseModel):
    id: PyObjectId = Field(alias="_id", default=None)
    course_title: str
    is_completed: bool = False
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
# -----------------------------------------------------------


# ---------- CORE COURSE MODELS (Updated for Gamification) ----------
class Resource(BaseModel):
    title: str
    url: str
    type: str  # "video", "article", "doc"

class Module(BaseModel):
    id: str
    week: int
    title: str
    description: str
    durationHours: int
    resources: List[Resource] = []
    is_completed: bool = False 

class CourseOut(BaseModel):
    id: PyObjectId = Field(alias="_id", default=None)
    title: str
    modules: List[Module]
    user_id: PyObjectId = Field(default=None)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
# ----------------------------------------------------------------------


# ---------- ASYNC CRUD HELPERS (Assumed to be in place) ----------
async def get_user_by_email(email: str) -> User | None:
    user_doc = await user_collection.find_one({"email": email})
    if user_doc:
        return User(**user_doc)
    return None

async def get_current_user_async(user_email: str) -> User:
    user = await user_collection.find_one({"email": user_email})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)
# -------------------------------------------------------------


# ---------- AUTH ENDPOINTS (Async/MongoDB Updates) ----------

@app.post("/signup", response_model=UserBase)
async def create_user(user: UserCreate):
    db_user = await get_user_by_email(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    
    user_doc = user.model_dump(exclude=['password'], by_alias=True)
    user_doc['hashed_password'] = hashed_password
    
    new_user = await user_collection.insert_one(user_doc)
    
    created_user = await user_collection.find_one({"_id": new_user.inserted_id})
    return created_user

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], 
):
    user = await get_user_by_email(form_data.username)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# -----------------------------------------------------------


# ---------- PROTECTED ENDPOINTS: COURSE CRUD (With Progress Tracking and DELETE) ----------

@app.post("/generate", response_model=CourseOut)
async def generate_course(
    req: GenerateRequest, 
    current_user: User = Depends(get_current_user)
):
    # 1. LLM Generation
    try:
        course_data_obj = generate_plan_from_llm(req, user_name=current_user.full_name)
    except HTTPException:
         raise
    except Exception as e:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"AI structure generation failed: {e}"
        )
    
    # 2. Resource Curation
    try:
        course_data_obj = await curate_resources_for_plan(course_data_obj)
    except Exception as e:
        print(f"WARNING: Resource curation failed for course: {e}")
    
    
    # 3. Save the final course plan to the MongoDB database
    course_doc = course_data_obj.model_dump(by_alias=True, exclude_none=True)
    course_doc['user_id'] = current_user.id
    
    new_course = await course_collection.insert_one(course_doc)

    saved_course = await course_collection.find_one({"_id": new_course.inserted_id})
    return saved_course


@app.get("/api/courses/my", response_model=List[CourseListItem])
async def get_my_courses(
    current_user: User = Depends(get_current_user)
):
    cursor = course_collection.find({"user_id": current_user.id})
    courses = await cursor.to_list(length=100) 

    return courses


@app.get("/api/courses/{course_id}", response_model=CourseOut)
async def get_course_detail(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid Course ID format")
    
    course_doc = await course_collection.find_one({
        "_id": ObjectId(course_id),
        "user_id": current_user.id
    })

    if not course_doc:
        raise HTTPException(status_code=404, detail="Course not found or access denied")
    
    return course_doc

@app.patch("/api/courses/{course_id}/complete/{module_id}")
async def complete_module(
    course_id: str,
    module_id: str,
    current_user: User = Depends(get_current_user)
):
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid Course ID format")

    result = await course_collection.update_one(
        {"_id": ObjectId(course_id), "user_id": current_user.id, "modules.id": module_id},
        {"$set": {"modules.$.is_completed": True}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course or module not found, or access denied")
    
    pending_module = await course_collection.find_one({
        "_id": ObjectId(course_id),
        "modules.is_completed": False
    })
    
    if not pending_module:
        await course_collection.update_one(
            {"_id": ObjectId(course_id)},
            {"$set": {"is_completed": True}}
        )

    return {"message": f"Module {module_id} successfully marked as complete."}


# 💡 NEW ENDPOINT: Delete Course (Step 10.1)
@app.delete("/api/courses/{course_id}")
async def delete_course(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """Deletes a course plan document from MongoDB."""
    
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid Course ID format")
    
    # Attempt to delete the course, ensuring it belongs to the current user
    result = await course_collection.delete_one({
        "_id": ObjectId(course_id),
        "user_id": current_user.id
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found or access denied")
    
    return {"message": "Course successfully deleted."}