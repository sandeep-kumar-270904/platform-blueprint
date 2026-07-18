const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock_key');
    this.isMock = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock_key';
  }

  async scoreResume(resumeData) {
    if (this.isMock) {
      logger.info('Mocking Gemini ATS Score...');
      return {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        breakdown: {
          keyword_relevance: "Good",
          formatting: "Excellent",
          quantified_impact: "Needs Improvement"
        },
        tips: [
          { issue: "Missing Metrics", severity: "high", tip: "Add quantified metrics to your recent experience." },
          { issue: "Summary Length", severity: "low", tip: "Your summary is slightly too short." }
        ]
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are an expert ATS (Applicant Tracking System) and recruiter. 
        Evaluate the following structured resume data and provide:
        1. An overall score from 0 to 100.
        2. A breakdown of categories (keyword_relevance, formatting, quantified_impact, completeness, action_verb_strength) with a short string value (e.g. "Excellent", "Good", "Needs Improvement").
        3. A list of specific, actionable tips to improve this resume (each tip having an 'issue', 'severity' (high/medium/low), and 'tip').
        
        Resume Data:
        ${JSON.stringify(resumeData)}
        
        Respond STRICTLY with a valid JSON object matching this schema, without markdown formatting or code blocks:
        {
          "score": 85,
          "breakdown": {
            "keyword_relevance": "Good",
            "formatting": "Excellent",
            "quantified_impact": "Needs Improvement",
            "completeness": "Good",
            "action_verb_strength": "Excellent"
          },
          "tips": [
            { "issue": "Missing Metrics", "severity": "high", "tip": "..." }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Clean up markdown block if present
      let jsonString = responseText;
      if (jsonString.startsWith('\`\`\`json')) {
        jsonString = jsonString.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      } else if (jsonString.startsWith('\`\`\`')) {
        jsonString = jsonString.replace(/\`\`\`/g, '').trim();
      }

      return JSON.parse(jsonString);
    } catch (error) {
      logger.error('Gemini API Error:', error);
      throw new Error('Scoring temporarily unavailable, try again');
    }
  }
}

module.exports = new GeminiService();
