import os

file_path = "backend/services/geminiService.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_func = """
  async generateTailoringSuggestions(resume, jobDescription, userId) {
    if (this.isMock) {
      return [
        { section: 'experience', originalText: 'Built web applications', suggestedText: 'Built scalable web applications matching the job requirements' }
      ];
    }
    await this.trackUsage(userId, 'resume_tailoring');
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `You are an expert resume writer. The user is applying for a job with this description:
    ${jobDescription}
    
    Here is their current resume data:
    ${JSON.stringify(resume)}
    
    Suggest specific rewording of bullet points to better align with the job description. Do not fabricate experience they don't have.
    Return the result as a raw JSON array of objects with the following keys:
    "section" (e.g. "experience", "projects"), "originalText" (the exact text to replace), "suggestedText" (the new text).
    Return ONLY the raw JSON array.`;
    
    try {
      const result = await withRetry(() => model.generateContent(prompt));
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      logger.error('Gemini tailoring error:', error);
      return [];
    }
  }
"""

content = content[:content.rfind('}')] + new_func + "\n}"

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added generateTailoringSuggestions to geminiService.js")
