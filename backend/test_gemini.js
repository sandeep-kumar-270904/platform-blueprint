require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    const topic = 'React Hooks';
    const difficulty = 'medium';
    const count = 3;
    const numQuestions = Math.min(Math.max(parseInt(count) || 5, 1), 20); // 1 to 20
      
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a quiz generation assistant. Create a multiple choice quiz about "${topic}" at a 
"${difficulty || 'medium'}" difficulty level.
  Generate exactly ${numQuestions} questions.
  For each question, provide 4 options. Exactly 1 option must be correct.
  Provide an explanation for the correct answer.
  
  Output ONLY valid JSON matching this schema:
  [
    {
      "questionText": "Question text here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctOptionIndex": 0,
      "explanation": "Explanation here",
      "points": 1
    }
  ]
  Do not include markdown blocks like \`\`\`json or any other text.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Strip markdown formatting if AI included it
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    console.log("Raw output length:", text.length);
    console.log("Parsed JSON:", JSON.parse(text));
    
  } catch (err) {
    console.error("Error generating content:", err);
  }
}

testGemini();
