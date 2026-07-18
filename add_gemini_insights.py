import os

file_path = "backend/services/geminiService.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_func = """
  async generateCareerNextSteps(userSkills, gapSkills, userId) {
    if (this.isMock) {
      return [
        `Consider taking a course in ${gapSkills[0] || 'advanced skills'} to match market demand.`,
        "Your experience section lacks quantified metrics (e.g., 'increased sales by 20%').",
        "Add a project demonstrating your practical knowledge of the skills in your profile."
      ];
    }
    await this.trackUsage(userId, 'career_insights');
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `You are an expert career coach. The user has these skills on their resume: ${userSkills.join(', ')}. 
    Based on the jobs they applied to, they are missing these key skills: ${gapSkills.join(', ')}.
    Provide 3 concrete, actionable next steps (1 sentence each) they should take to improve their resume and career readiness.
    Format as a raw JSON array of strings.`;
    
    try {
      const result = await withRetry(() => model.generateContent(prompt));
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      logger.error('Gemini insights error:', error);
      return ["Consider adding missing skills to your profile.", "Review job requirements and align your experience.", "Add more quantifiable achievements."];
    }
  }
"""

# Insert before the last brace
content = content[:content.rfind('}')] + new_func + "\n}"

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added generateCareerNextSteps to geminiService.js")
