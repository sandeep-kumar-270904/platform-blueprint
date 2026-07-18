import os

gemini_path = "backend/services/geminiService.js"
with open(gemini_path, "r", encoding="utf-8") as f:
    content = f.read()

if "confidenceFlags" not in content:
    content = content.replace(
        "\"skills\": [\"\"]\n          }",
        "\"skills\": [\"\"]\n          },\n          \"confidenceFlags\": {\n            \"summary\": \"high|medium|low\",\n            \"experience\": \"high|medium|low\",\n            \"education\": \"high|medium|low\",\n            \"skills\": \"high|medium|low\"\n          }"
    )
    
    content = content.replace(
        "You are an expert resume parser. Extract the structured data from the following raw resume text and map it",
        "You are an expert resume parser. Extract the structured data from the following raw resume text (which might be from OCR of an image or a messy format) and map it"
    )

    content = content.replace(
        "Return ONLY the JSON.",
        "Return ONLY the JSON. Make sure to populate the confidenceFlags object based on how clear and parseable the sections were (e.g., if experience looks fragmented or guessed, set it to 'low')."
    )

    with open(gemini_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated geminiService.js for confidenceFlags")

