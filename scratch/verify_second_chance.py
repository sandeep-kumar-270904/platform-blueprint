import os
import subprocess
import sys

def verify_file_exists(path):
    if not os.path.exists(path):
        print(f"[MISSING] {path}")
        sys.exit(1)
    print(f"[OK] Verified file exists: {path}")

def main():
    print("=== VERIFYING SECOND CHANCE MATCH FEATURE ===")
    
    # 1. Check backend files exist
    verify_file_exists("backend/models/SecondChanceLog.js")
    verify_file_exists("backend/services/secondChanceService.js")
    verify_file_exists("src/components/team/SecondChanceBanner.tsx")

    # 2. Check syntax with node for backend JS files
    js_files = [
        "backend/models/SecondChanceLog.js",
        "backend/services/secondChanceService.js",
        "backend/controllers/teamController.js",
        "backend/routes/teams.js",
        "backend/models/Notification.js"
    ]
    for jf in js_files:
        try:
            subprocess.run(["node", "--check", jf], check=True, capture_output=True, text=True)
            print(f"[OK] Syntax valid for {jf}")
        except subprocess.CalledProcessError as e:
            print(f"[ERROR] Syntax error in {jf}:\n{e.stderr}")
            sys.exit(1)

    print("\nALL SECOND CHANCE MATCH COMPONENT CHECKS PASSED!")

if __name__ == "__main__":
    main()
