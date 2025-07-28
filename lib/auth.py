import time
import requests
from typing import Optional, Dict, Any
from fastapi import HTTPException

class TokenManager:
    """Handles OAuth token validation, refresh, and error handling"""
    
    def __init__(self):
        self.google_token_info_url = "https://oauth2.googleapis.com/tokeninfo"
        self.youtube_api_url = "https://www.googleapis.com/youtube/v3"
    
    def validate_token(self, access_token: str) -> Dict[str, Any]:  # Removed async
        """
        Validate Google OAuth token and return token info
        
        Args:
            access_token: The OAuth access token
            
        Returns:
            Token information dict
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            response = requests.get(
                self.google_token_info_url,
                params={"access_token": access_token},
                timeout=10.0
            )
            
            if response.status_code == 400:
                # Token is invalid or expired
                raise HTTPException(
                    status_code=401,
                    detail="Token expired or invalid. Please re-authenticate."
                )
            elif response.status_code != 200:
                raise HTTPException(
                    status_code=401,
                    detail="Unable to validate token. Please try again."
                )
            
            token_info = response.json()
            
            # Check if token is expired
            expires_in = int(token_info.get('expires_in', 0))
            if expires_in <= 60:  # Token expires in less than 1 minute
                raise HTTPException(
                    status_code=401,
                    detail="Token will expire soon. Please re-authenticate."
                )
            
            return token_info
            
        except requests.exceptions.Timeout:
            raise HTTPException(
                status_code=408,
                detail="Token validation timed out. Please try again."
            )
        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=503,
                detail=f"Network error during token validation: {str(e)}"
            )
    
    # Google OAuth credential methods removed - not used in current implementation

class APIErrorHandler:
    """Handles API errors with user-friendly messages and retry logic"""
    
    @staticmethod
    def get_user_friendly_error(status_code: int, error_detail: str) -> str:
        """Convert technical errors to user-friendly messages"""
        
        error_map = {
            400: "Invalid request. Please check your input and try again.",
            401: "Authentication failed. Please sign in again.",
            403: "Access denied. Please check your YouTube channel permissions.",
            404: "Requested content not found. It may have been deleted or made private.",
            408: "Request timed out. Please try again.",
            429: "Too many requests. Please wait a moment before trying again.",
            500: "Server error. Please try again in a few minutes.",
            502: "Service temporarily unavailable. Please try again later.",
            503: "Service overloaded. Please try again in a few minutes."
        }
        
        # Check for specific YouTube API errors
        if "quota" in error_detail.lower():
            return "YouTube API quota exceeded. Please try again tomorrow."
        elif "private" in error_detail.lower():
            return "This video or channel is private and cannot be accessed."
        elif "deleted" in error_detail.lower():
            return "This video has been deleted or is no longer available."
        elif "copyright" in error_detail.lower():
            return "This video is not available due to copyright restrictions."
        
        return error_map.get(status_code, "An unexpected error occurred. Please try again.")
    
    @staticmethod
    def make_request_with_retry(  # Removed async
        method: str,
        url: str,
        max_retries: int = 3,
        backoff_factor: float = 1.0,
        **kwargs
    ) -> requests.Response:
        """
        Make HTTP request with exponential backoff retry logic
        
        Args:
            method: HTTP method (GET, POST, etc.)
            url: Request URL
            max_retries: Maximum number of retry attempts
            backoff_factor: Multiplier for exponential backoff
            **kwargs: Additional request parameters
            
        Returns:
            HTTP response
            
        Raises:
            HTTPException: If all retry attempts fail
        """
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                response = requests.request(method, url, **kwargs)
                
                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', backoff_factor * (2 ** attempt)))
                    if attempt < max_retries:
                        time.sleep(retry_after)
                        continue
                
                # Handle temporary server errors
                if response.status_code in [502, 503, 504] and attempt < max_retries:
                    wait_time = backoff_factor * (2 ** attempt)
                    time.sleep(wait_time)
                    continue
                
                return response
                
            except requests.exceptions.Timeout as e:
                last_exception = e
                if attempt < max_retries:
                    wait_time = backoff_factor * (2 ** attempt)
                    time.sleep(wait_time)
                    continue
            except requests.exceptions.RequestException as e:
                last_exception = e
                if attempt < max_retries:
                    wait_time = backoff_factor * (2 ** attempt)
                    time.sleep(wait_time)
                    continue
        
        # All retries failed
        if last_exception:
            raise HTTPException(
                status_code=503,
                detail=f"Request failed after {max_retries} attempts: {str(last_exception)}"
            )
        else:
            raise HTTPException(
                status_code=503,
                detail=f"Request failed after {max_retries} attempts"
            )

# asyncio import removed - now using sync requests