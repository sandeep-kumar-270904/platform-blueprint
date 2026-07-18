import os

gemini_path = "backend/services/geminiService.js"
with open(gemini_path, "r", encoding="utf-8") as f:
    content = f.read()

panic_rebuild = """
exports.panicRebuild = async (resumeContext, targetRole, focus, topSkills) => {
  try {
    const prompt = `You are an expert resume editor working under extreme time pressure for a user.
    The user is applying for: "${targetRole}"
    They want to emphasize this recent experience: "${focus}"
    Their top skills for this job: "${topSkills}"
    
    Here is their EXISTING resume data:
    ${JSON.stringify(resumeContext)}
    
    YOUR ONLY TASK: Reorder and prioritize the EXISTING bullets, experience entries, and skills so that the most relevant information for "${targetRole}" appears first.
    DO NOT FABRICATE OR INVENT NEW EXPERIENCE, SKILLS, OR BULLET POINTS. Only reorder and re-weigh what is provided.
    
    Return the restructured resume data in the exact same JSON format (summary, experience array, education array, skills array, projects array).`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    return JSON.parse((await result.response).text());
  } catch (error) {
    console.error("Gemini Panic Rebuild Error:", error);
    throw new Error("Failed to rapidly rebuild resume via Gemini");
  }
};
"""

if "exports.panicRebuild" not in content:
    content += "\n" + panic_rebuild
    with open(gemini_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated geminiService.js")

