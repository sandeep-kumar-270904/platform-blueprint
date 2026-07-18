const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require('../utils/logger');
const GeminiUsage = require('../models/GeminiUsage');

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


class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock_key');
    this.isMock = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock_key';
  }

  async trackUsage(userId, feature) {
    if (!userId) return;
    const date = new Date().toISOString().split('T')[0];
    await GeminiUsage.findOneAndUpdate(
      { userId, date, feature },
      { $inc: { calls: 1 } },
      { upsert: true }
    );
  }

  async scoreResume(resumeData, userId) {
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
      if (userId) await this.trackUsage(userId, 'ats_score');

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

      const result = await withRetry(() => model.generateContent(prompt));
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

  async generateCoverLetter(resumeData, jobDescription, tone, userId) {
    if (this.isMock) {
      return `[MOCK COVER LETTER]\n\nDear Hiring Manager,\n\nI am writing to express my interest in the role...`;
    }

    try {
      if (userId) await this.trackUsage(userId, 'cover_letter');

      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are an expert career coach writing a cover letter.
        Tone: ${tone || 'formal'}
        
        Resume Data:
        ${JSON.stringify(resumeData)}
        
        Job Description:
        ${jobDescription ? jobDescription : 'Not provided. Write a general cover letter.'}
        
        Write a cohesive, professional cover letter draft that specifically references the candidate's actual projects and experience from the provided resume data. 
        Ensure it aligns with the job description if provided. Do NOT include placeholder brackets for things like [Date] or [Company Name] if they are absent; adapt the text intelligently. 
        Output ONLY the cover letter text.
      `;

      const result = await withRetry(() => model.generateContent(prompt));
      return result.response.text().trim();
    } catch (error) {
      logger.error('Gemini API Error generating cover letter:', error);
      throw new Error('Generation temporarily unavailable, try again');
    }
  }

  async parseResumeData(rawText, userId) {
    if (this.isMock) {
      return { personalInfo: { fullName: 'Mock User' } };
    }

    try {
      if (userId) await this.trackUsage(userId, 'resume_parse');

      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are an expert resume parser. Extract the structured data from the following raw resume text and map it to this JSON schema:
        {
          "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "" },
          "professionalSummary": "",
          "experience": [{ "company": "", "position": "", "location": "", "startDate": "", "endDate": "", "description": "", "current": false }],
          "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "", "current": false }],
          "skills": [""],
          "projects": [{ "name": "", "description": "", "technologies": [""], "link": "" }]
        }
        
        Raw Text:
        ${rawText}
        
        Respond STRICTLY with a valid JSON object matching this schema. Do not include markdown formatting or code blocks. Best effort parsing.
      `;

      const result = await withRetry(() => model.generateContent(prompt));
      let jsonString = result.response.text();
      
      if (jsonString.startsWith('\`\`\`json')) {
        jsonString = jsonString.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      } else if (jsonString.startsWith('\`\`\`')) {
        jsonString = jsonString.replace(/\`\`\`/g, '').trim();
      }

      return JSON.parse(jsonString);
    } catch (error) {
      logger.error('Gemini API Error parsing resume:', error);
      throw new Error('Parsing temporarily unavailable, try again');
    }
  }
}

module.exports = new GeminiService();
