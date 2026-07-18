import os

file_path = "backend/services/geminiService.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add retry function at the top
retry_func = """const GeminiUsage = require('../models/GeminiUsage');

// Helper for exponential backoff
const withRetry = async (fn, maxRetries = 3) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 || error.status >= 500) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn(`Gemini API transient error, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};
"""

content = content.replace("const GeminiUsage = require('../models/GeminiUsage');", retry_func)

# Replace 'const result = await model.generateContent' with 'const result = await withRetry(() => model.generateContent'
# We have three functions to replace: scoreResume, generateCoverLetter, parseResumeData

# For scoreResume
target_1 = "const result = await model.generateContent(prompt);"
rep_1 = "const result = await withRetry(() => model.generateContent(prompt));"
content = content.replace(target_1, rep_1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added withRetry wrapper in geminiService.js")
