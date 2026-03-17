import os
import sys
import argparse
import json
import garth
from dotenv import load_dotenv

# Optional: load .env if running manually
load_dotenv()

def mfa_callback():
    """Callback for MFA when garth requires it."""
    # If we were running interactively, we'd do input().
    # But since we're called by an API, we expect the MFA code to be passed in from the start if we have it,
    # OR we exit with a specific code so the API knows to ask the user.
    return None

def main():
    parser = argparse.ArgumentParser(description="Garmin Connect Authentication Utility")
    parser.add_argument("--email", help="Garmin account email")
    parser.add_argument("--password", help="Garmin account password")
    parser.add_argument("--mfa", help="Multi-Factor Authentication code")
    parser.add_argument("--token-dir", help="Directory to save tokens")
    
    args = parser.parse_args()
    
    email = args.email or os.getenv("GARMIN_EMAIL")
    password = args.password or os.getenv("GARMIN_PASSWORD")
    token_dir = args.token_dir or os.getenv("TOKEN_DIR", os.path.expanduser("~/.garminconnect"))
    
    if not email or not password:
        print(json.dumps({"success": False, "error": "Email and password are required."}))
        sys.exit(1)

    # Use a custom callback to handle MFA
    # If MFA is required and not provided in args, we exit with status 10
    def handle_mfa():
        if args.mfa:
            return args.mfa
        # No MFA provided but requested by Garmin
        return None

    try:
        # We try to login. garth.login will call handle_mfa if needed.
        # However, garth's behavior is often to raise an error if 
        # the callback returns None or if it's not provided.
        # Let's see if we can catch the "MFA Required" state.
        
        # NOTE: garminconnect/garth uses a global state for tokens
        # but we want to ensure we save them to the right place.
        
        try:
            garth.login(email, password, mfa_helper=handle_mfa)
        except garth.exc.MfaRequired:
            # Explicitly caught MFA required
            print(json.dumps({"success": False, "mfa_required": True, "error": "MFA code required."}))
            sys.exit(10)
            
        os.makedirs(token_dir, exist_ok=True)
        garth.save(token_dir)
        
        print(json.dumps({"success": True, "message": f"Successfully authenticated. Tokens saved to {token_dir}"}))
        sys.exit(0)
        
    except Exception as e:
        error_msg = str(e)
        if "MFA" in error_msg.upper():
             print(json.dumps({"success": False, "mfa_required": True, "error": error_msg}))
             sys.exit(10)
        print(json.dumps({"success": False, "error": error_msg}))
        sys.exit(1)

if __name__ == "__main__":
    main()
