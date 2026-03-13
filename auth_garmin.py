import os
from dotenv import load_dotenv
import garth

load_dotenv()

user_email = os.getenv("GARMIN_EMAIL")
user_password = os.getenv("GARMIN_PASSWORD")
token_dir = os.getenv("TOKEN_DIR", os.path.expanduser("~/.garminconnect"))

if not user_email or not user_password:
    print("Error: GARMIN_EMAIL and GARMIN_PASSWORD must be set in your .env file.")
    exit(1)

print(f"Authenticating with Garmin Connect using {user_email}...")

try:
    garth.login(user_email, user_password)
    
    os.makedirs(token_dir, exist_ok=True)
    garth.save(token_dir)
    print(f"Success! OAuth tokens saved to {token_dir}")
except Exception as e:
    print(f"Authentication failed: {e}")
