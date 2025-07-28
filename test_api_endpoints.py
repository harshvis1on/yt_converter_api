#!/usr/bin/env python3
"""
Test script to verify YouTube downloader API endpoints are working correctly.
This script tests the alternative API endpoints to replace the 404 errors.
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_youtube_downloader_with_mp3():
    """Test the YouTube Downloader With MP3 API endpoints"""
    
    rapidapi_key = os.getenv("RAPIDAPI_KEY", "YOUR_RAPIDAPI_KEY")
    if rapidapi_key == "YOUR_RAPIDAPI_KEY":
        print("❌ RAPIDAPI_KEY not configured. Please set it in your .env file.")
        return False
    
    host = "youtube-downloader-with-mp3.p.rapidapi.com"
    test_video_id = "dQw4w9WgXcQ"  # Rick Astley - Never Gonna Give You Up
    test_url = f"https://www.youtube.com/watch?v={test_video_id}"
    
    headers = {
        "X-RapidAPI-Key": rapidapi_key,
        "X-RapidAPI-Host": host
    }
    
    print(f"🧪 Testing YouTube Downloader With MP3 API")
    print(f"   Host: {host}")
    print(f"   Test Video: {test_video_id}")
    print()
    
    # Test 1: MP3 endpoint
    print("1️⃣ Testing MP3 endpoint...")
    try:
        response = requests.get(
            f"https://{host}/mp3",
            params={
                "url": test_url,
                "quality": "320"
            },
            headers=headers,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   ✅ Success! Response keys: {list(data.keys())}")
                print(f"   Download URL present: {'url' in data or 'download_url' in data or 'link' in data}")
            except Exception as e:
                print(f"   ⚠️  Success but couldn't parse JSON: {e}")
                print(f"   Raw response: {response.text[:200]}...")
        else:
            print(f"   ❌ Failed: {response.text[:200]}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 2: JSON endpoint (for video)
    print("2️⃣ Testing JSON endpoint (video info)...")
    try:
        response = requests.get(
            f"https://{host}/json",
            params={
                "url": test_url,
                "quality": "720p"
            },
            headers=headers,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   ✅ Success! Response keys: {list(data.keys())}")
                print(f"   Title present: {'title' in data}")
                print(f"   Download URL present: {'url' in data or 'download_url' in data or 'link' in data}")
            except Exception as e:
                print(f"   ⚠️  Success but couldn't parse JSON: {e}")
                print(f"   Raw response: {response.text[:200]}...")
        else:
            print(f"   ❌ Failed: {response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()

def test_free_mp3_mp4_youtube():
    """Test the FREE MP3-MP4 YOUTUBE API as backup"""
    
    rapidapi_key = os.getenv("RAPIDAPI_KEY", "YOUR_RAPIDAPI_KEY")
    if rapidapi_key == "YOUR_RAPIDAPI_KEY":
        print("❌ RAPIDAPI_KEY not configured. Please set it in your .env file.")
        return False
    
    host = "free-mp3-mp4-youtube.p.rapidapi.com"
    test_video_id = "dQw4w9WgXcQ"
    
    headers = {
        "X-RapidAPI-Key": rapidapi_key,
        "X-RapidAPI-Host": host
    }
    
    print(f"🧪 Testing FREE MP3-MP4 YOUTUBE API (Backup)")
    print(f"   Host: {host}")
    print(f"   Test Video: {test_video_id}")
    print()
    
    # Common endpoints to test
    endpoints_to_test = [
        "/download",
        "/convert", 
        "/mp3",
        "/mp4",
        f"/{test_video_id}",
        f"/video/{test_video_id}"
    ]
    
    for endpoint in endpoints_to_test:
        print(f"📡 Testing endpoint: {endpoint}")
        try:
            response = requests.get(
                f"https://{host}{endpoint}",
                params={"url": f"https://www.youtube.com/watch?v={test_video_id}"},
                headers=headers,
                timeout=15
            )
            
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print(f"   ✅ Working endpoint found!")
                try:
                    data = response.json()
                    print(f"   Response keys: {list(data.keys())}")
                except:
                    print(f"   Raw response: {response.text[:100]}...")
            elif response.status_code == 404:
                print(f"   ❌ Not found")
            else:
                print(f"   ⚠️  Status {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        print()

def main():
    """Run all API tests"""
    print("🚀 YouTube Downloader API Endpoint Testing")
    print("=" * 50)
    print()
    
    # Test primary API
    test_youtube_downloader_with_mp3()
    
    print("=" * 50)
    print()
    
    # Test backup API
    test_free_mp3_mp4_youtube()
    
    print("=" * 50)
    print("✅ Testing complete!")
    print()
    print("💡 If any endpoints are working, update your main.py to use them.")
    print("💡 If all tests fail, consider switching to a different YouTube downloader API.")

if __name__ == "__main__":
    main()