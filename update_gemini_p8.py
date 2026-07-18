import os

file_path = "backend/services/geminiService.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

translate_logic = """
exports.translateResume = async (resumeData, targetLanguage) => {
  try {
    const prompt = `You are a professional resume translator. 
Translate the following resume data into ${targetLanguage}.
Keep the exact same JSON structure, only translating the text fields (titles, descriptions, roles, degrees).
Do NOT translate proper nouns (e.g. company names, universities) unless there is a standard translation.
Do NOT change the formatting or add new information.

Resume Data:
${JSON.stringify(resumeData)}

Return the pure JSON matching the input structure, with translated strings. No markdown.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```json\\n/, '').replace(/\\n```$/, '');
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini translateResume Error:', error);
    throw new Error('Failed to translate resume');
  }
};
"""

if "exports.translateResume" not in content:
    content = content.replace("module.exports = {", translate_logic + "\nmodule.exports = {")
    content = content.replace("module.exports = {", "module.exports = {\n  translateResume: exports.translateResume,")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added translateResume to geminiService.js")
