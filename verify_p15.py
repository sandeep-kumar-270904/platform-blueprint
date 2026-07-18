import requests
import json

# We need an admin token. We can spoof one or bypass auth.
# Instead of full integration testing, we can just do a syntax check on the modified files to ensure no crashing.

import subprocess

files = [
    "backend/routes/adminResumes.js",
    "backend/server.js",
    "backend/models/IdeaReport.js",
    "backend/controllers/moderationController.js",
    "backend/models/CertificationRecord.js",
    "backend/controllers/certificationController.js",
    "backend/routes/templates.js"
]

print("Running syntax check on modified files...")
all_passed = True
for f in files:
    try:
        subprocess.run(["node", "--check", f], check=True, capture_output=True, text=True)
        print(f"✅ {f}")
    except subprocess.CalledProcessError as e:
        print(f"❌ {f} failed syntax check:\n{e.stderr}")
        all_passed = False

if all_passed:
    print("All syntax checks passed.")
