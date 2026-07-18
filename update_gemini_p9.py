import os

file_path = "backend/services/geminiService.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_methods = """
exports.simulateCareerPath = async (resumeContext, targetRole) => {
  try {
    const prompt = `You are an expert career strategist. Based on the user's current resume and their target role of "${targetRole}", generate an exploratory multi-year career trajectory.
Identify current skill gaps and propose a timeline (e.g. Year 1-2, Year 3-5) of role progression and skill acquisition needed to reach that target.

Resume Context:
${resumeContext}

Return a JSON array of timeline steps, each containing:
- timeframe (string, e.g. "Years 1-2")
- title (string, expected role)
- focus (string, what to learn/do)
- milestones (array of strings, key achievements to hit)

Respond with pure JSON only, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```json\\n/, '').replace(/\\n```$/, '');
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini simulateCareerPath Error:', error);
    throw error;
  }
};

exports.draftRecommendation = async (relationship, requestNotes) => {
  try {
    const prompt = `You are helping write a professional recommendation letter.
The writer's relationship to the candidate is: ${relationship}.
The writer provided these rough notes/points to include: "${requestNotes || 'Please draft a generic positive endorsement.'}"

Draft a cohesive, professional 2-3 paragraph recommendation letter. 
Return a JSON object with:
- draft (string, the letter body)

Respond with pure JSON only, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```json\\n/, '').replace(/\\n```$/, '');
    return JSON.parse(text).draft;
  } catch (error) {
    console.error('Gemini draftRecommendation Error:', error);
    return "Error drafting letter. Please try writing it manually.";
  }
};

exports.proposeResumeEdit = async (resumeContext, userInstruction) => {
  try {
    const prompt = `You are an AI resume editing assistant. The user wants to modify their resume via a chat instruction.
Current Resume:
${JSON.stringify(resumeContext)}

User Instruction: "${userInstruction}"

Return a JSON object representing ONLY the fields or sections of the resume that should be changed, added, or deleted to fulfill the instruction.
For example, if they say "add a project called X", return { projects: [...existing projects, new project] }.
If they say "make my last job's bullets more results-focused", return the updated 'experience' array.
Do NOT return fields that don't need changing.
Ensure the structure strictly matches standard resume JSON schema.

Respond with pure JSON only, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```json\\n/, '').replace(/\\n```$/, '');
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini proposeResumeEdit Error:', error);
    throw error;
  }
};
"""

if "exports.simulateCareerPath" not in content:
    content = content.replace("module.exports = {", new_methods + "\nmodule.exports = {")
    content = content.replace("module.exports = {", "module.exports = {\n  simulateCareerPath: exports.simulateCareerPath,\n  draftRecommendation: exports.draftRecommendation,\n  proposeResumeEdit: exports.proposeResumeEdit,")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated geminiService.js with Phase 9 methods")
