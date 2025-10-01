import json
import uuid
from google import genai
from google.genai import types
from pydantic import ValidationError
from . import config
# Import the schemas you defined in main.py
from .main import CourseOut, GenerateRequest 
from fastapi import HTTPException, status

# 1. Initialize the Gemini client
try:
    # Client will automatically pick up the API key from config/environment
    client = genai.Client(api_key=config.GEMINI_API_KEY)
except Exception as e:
    print(f"Error initializing Gemini client: {e}. Check API key in .env.")
    client = None

def generate_plan_from_llm(req: GenerateRequest, user_name: str) -> CourseOut:
    """
    Calls the Gemini API to generate a structured course roadmap 
    and validates the output against the CourseOut Pydantic model.
    """
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Service is unavailable. Check backend configuration."
        )

    # 1. Define the System Instruction (The AI's rigid instructions)
    system_instruction = (
        "You are CourseCraft AI, an expert instructional designer. "
        "Your task is to generate a comprehensive, structured learning roadmap "
        "based on the user's request. Your output MUST be a valid JSON object "
        "that strictly conforms to the provided schema. "
        "Ensure the 'id' field for each module is a unique UUID string. "
        "DO NOT include real external links for resources; use placeholder titles "
        "and generic URLs (e.g., 'https://placeholder.com/resource'). "
        "The resource 'type' must be one of: 'video', 'article', or 'project'."
    )

    # 2. Define the User Prompt (The specific request)
    user_prompt = (
        f"Generate a personalized course titled: 'The {req.level} Road to {req.field} Mastery' for {user_name}. "
        f"The roadmap should be split into 6 structured weeks. "
        f"Focus on core concepts for a {req.level} level. "
        "For each module, suggest a realistic duration in hours (5-10 hours). "
        "Generate 3 placeholder resources for each module, mixing video, article, and project types."
    )

    try:
        # 3. Call the API with JSON response mode
        response = client.models.generate_content(
            model='gemini-2.5-flash', # Fast model suitable for JSON generation
            contents=[user_prompt],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                # CRUCIAL: Force the output to match the Pydantic schema
                response_mime_type="application/json",
                response_schema=CourseOut,
            ),
        )

        # 4. Parse and Validate the JSON Output
        # The response.text is the valid JSON string from the LLM
        json_data = json.loads(response.text)
        course_plan = CourseOut.model_validate(json_data)
        
        return course_plan

    except (ValidationError, ConnectionError, json.JSONDecodeError) as e:
        print(f"LLM Output/Validation Error: {e}")
        # Raise a 500 error if the LLM fails to provide valid data
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Service failed to generate valid structured data."
        )
    except Exception as e:
        print(f"Gemini API Exception: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API call failed due to an unknown error."
        )