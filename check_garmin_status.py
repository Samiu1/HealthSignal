import os
import sys
import json
import garth
from dotenv import load_dotenv

load_dotenv()

def main():
    token_dir = os.getenv("TOKEN_DIR", os.path.expanduser("~/.garminconnect"))
    
    if not os.path.exists(token_dir):
        print(json.dumps({"success": False, "authenticated": False, "error": "No session tokens found."}))
        sys.exit(0)

    try:
        garth.load(token_dir)
        # Check if the tokens are still valid by trying to get the profile or just checking expiration
        # garth.client.username is usually available if loaded
        username = garth.client.username
        
        # We can also check if it's expired
        if garth.client.expired:
            print(json.dumps({"success": True, "authenticated": False, "error": "Session expired."}))
        else:
            print(json.dumps({"success": True, "authenticated": True, "email": username}))
            
    except Exception as e:
        print(json.dumps({"success": False, "authenticated": False, "error": str(e)}))

if __name__ == "__main__":
    main()
