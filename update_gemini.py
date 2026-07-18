import os

file_path = "backend/services/geminiService.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_methods = """
exports.generateInterviewQuestions = async (resumeContext, jobDescription) => {
  try {
    const prompt = `You are an expert technical recruiter and hiring manager conducting a mock interview.
I will provide a candidate's resume and optionally a job description.
Your task is to generate exactly 3 interview questions grounded specifically in the candidate's actual listed projects, experience, or skills.
If a job description is provided, ensure the questions are tailored to assess fit for that role.
Do NOT use generic static question banks. E.g., Instead of "What is a challenge you faced?", ask "Tell me about a challenge you faced while building the real-time pipeline at Company X."
    
Return a JSON array where each object has:
- question (string)
- category (string, must be one of: 'behavioral', 'technical', 'resume_specific')

Resume:
${resumeContext}

Job Description (if any):
${jobDescription || 'N/A'}

Respond with pure JSON only, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```json\\n/, '').replace(/\\n```$/, '');
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini generateInterviewQuestions Error:', error);
    return [
      { question: "Tell me about a challenging project you worked on.", category: "behavioral" }
    ];
  }
};

exports.evaluateInterviewAnswer = async (question, answer, category) => {
  try {
    const prompt = `You are an expert interviewer evaluating a candidate's answer during a practice interview session.
This is practice, so provide constructive feedback. NEVER give a pass/fail gate.

Question (${category}): "${question}"
Candidate's Answer: "${answer}"

Evaluate the answer and provide:
- strengths: Array of 1-3 strings highlighting what they did well.
- improvementAreas: Array of 1-3 strings offering specific, actionable advice on how to improve.
- score: An integer from 0 to 100 representing the quality of the answer (be constructive).

Respond with pure JSON only, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```json\\n/, '').replace(/\\n```$/, '');
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini evaluateInterviewAnswer Error:', error);
    return {
      strengths: ["Attempted to answer the question."],
      improvementAreas: ["Could be more detailed."],
      score: 50
    };
  }
};

exports.generateNegotiationPoints = async (resumeContext, role, offerAmount, marketData) => {
  try {
    const prompt = `You are an expert career coach and salary negotiation assistant.
A candidate has received an offer for the role of "${role}" for the amount of ${offerAmount}.
Their resume is provided below. I have also provided market salary data if available.

Your task is to generate 3-5 specific negotiation talking points that the candidate can use to ask for a higher salary or better benefits.
CRITICAL: You MUST ground these talking points in the candidate's actual resume achievements (quantified impact bullets) as leverage points. E.g. "Because I drove a 20% increase in sales at Company X, I can bring immediate ROI..."

Resume:
${resumeContext}

Market Data:
${marketData ? JSON.stringify(marketData) : 'No aggregate market data available for this role/location.'}

Return a pure JSON array of strings, where each string is a single talking point/argument. No markdown formatting.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```json\\n/, '').replace(/\\n```$/, '');
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini generateNegotiationPoints Error:', error);
    return ["Highlight your past experience and quantified achievements during negotiation."];
  }
};

exports.exportLinkedInSummary = async (resumeContext) => {
  try {
    const prompt = `You are a professional LinkedIn profile writer. 
I will provide a resume. Generate a LinkedIn-formatted summary (About section) and suggest bullet formatting for the Experience section, suited to LinkedIn's conventions (engaging, narrative-driven first-person summary, and punchy achievements).

Resume:
${resumeContext}

Return a JSON object with:
- summary: string (The "About" section text)
- experiences: Array of objects { title, company, description (string, formatted with bullets or paragraphs for LinkedIn) }

Respond with pure JSON only, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```json\\n/, '').replace(/\\n```$/, '');
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini exportLinkedInSummary Error:', error);
    return { summary: "Error generating summary.", experiences: [] };
  }
};
"""

content = content.replace("module.exports = {", new_methods + "\nmodule.exports = {")
content = content.replace("module.exports = {", "module.exports = {\n  generateInterviewQuestions: exports.generateInterviewQuestions,\n  evaluateInterviewAnswer: exports.evaluateInterviewAnswer,\n  generateNegotiationPoints: exports.generateNegotiationPoints,\n  exportLinkedInSummary: exports.exportLinkedInSummary,")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated geminiService.js with Phase 7 methods")
