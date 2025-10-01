# backend/resource_service.py

import os
import asyncio
from googleapiclient.discovery import build # Needed for YouTube API
from googleapiclient.errors import HttpError
from typing import List
from .main import Module, Resource, CourseOut # Import your schemas
from . import config # To get YOUTUBE_API_KEY
from fastapi import HTTPException, status

# 1. Initialize the YouTube Client
try:
    # Build the service object using the API key from config
    YOUTUBE_SERVICE = build(
        "youtube", 
        "v3", 
        developerKey=config.YOUTUBE_API_KEY
    )
except Exception as e:
    print(f"Error initializing YouTube client: {e}. Check YOUTUBE_API_KEY in .env.")
    YOUTUBE_SERVICE = None

# --- Helper Function for Single Search ---
async def search_youtube_for_topic(query: str) -> List[Resource]:
    """Searches YouTube for highly relevant videos based on a topic query."""
    if not YOUTUBE_SERVICE:
        # If service failed to initialize, return empty list (or raise error)
        return []

    # Use asyncio.to_thread to run the synchronous YouTube API call asynchronously
    try:
        search_response = await asyncio.to_thread(
            YOUTUBE_SERVICE.search().list,
            q=f"tutorial {query}",  # Prepends 'tutorial' for better results
            part="snippet",
            type="video",
            maxResults=3,  # Only fetch the top 3 results per topic
            videoDuration="medium",
            relevanceLanguage="en",
        )().execute
    except HttpError as e:
        print(f"YouTube API Error for query '{query}': {e}")
        return []
    except Exception as e:
        print(f"General search error: {e}")
        return []

    resources = []
    for item in search_response.get("items", []):
        video_id = item["id"]["videoId"]
        video_title = item["snippet"]["title"]
        
        resources.append(Resource(
            title=video_title,
            url=f"https://www.youtube.com/watch?v={video_id}",
            type="video" # We assume all fetched resources here are videos
        ))
    
    return resources

# --- Main Service Function ---
async def curate_resources_for_plan(course_plan: CourseOut) -> CourseOut:
    """
    Iterates through all modules and resources, replacing placeholder 
    resources with real YouTube links.
    """
    if not YOUTUBE_SERVICE:
        # If API is down, just return the AI-generated plan as is
        return course_plan 

    # We will collect all search tasks to run them concurrently (for speed)
    tasks = []
    
    for module in course_plan.modules:
        # We only want to search if the LLM provided a placeholder to work with.
        # Use the module title as the primary search query for simplicity.
        search_query = f"{module.title} {course_plan.title}"
        
        # Create an asynchronous task for each module search
        task = search_youtube_for_topic(search_query)
        tasks.append(task)
        
    # Run all search tasks concurrently
    all_results = await asyncio.gather(*tasks)

    # Re-assemble the course plan with real links
    for i, module in enumerate(course_plan.modules):
        real_resources = all_results[i]
        
        # Replace the LLM's placeholder list with the real list
        module.resources = real_resources
        
    return course_plan