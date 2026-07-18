import os

file_path = "backend/services/geminiService.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

narrative_func = """
exports.generateNarrative = async (resumeData) => {
  try {
    const prompt = `
    You are an expert career coach and storyteller.
    Take the following structured resume data and weave it into a flowing, professional 3-4 paragraph narrative.
    It should read like an engaging "About Me" or professional biography that could be used on a portfolio page.
    Highlight the progression, key achievements, and core skills without just listing them.
    Do not use bullet points. Make it engaging, professional, and authentic to the person's real experience.

    Resume Data:
    ${JSON.stringify(resumeData, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    return text;
  } catch (error) {
    console.error('Gemini Narrative Error:', error);
    throw new Error('Failed to generate narrative');
  }
};
"""

if "exports.generateNarrative" not in content:
    content += "\n" + narrative_func
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated geminiService.js")
