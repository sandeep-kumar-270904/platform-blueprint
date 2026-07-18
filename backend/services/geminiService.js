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
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```/g, '').trim();
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
        You are an expert resume parser. Extract the structured data from the following raw resume text (which might be from OCR of an image or a messy format) and map it to this JSON schema:
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
      
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```/g, '').trim();
      }

      return JSON.parse(jsonString);
    } catch (error) {
      logger.error('Gemini API Error parsing resume:', error);
      throw new Error('Parsing temporarily unavailable, try again');
    }
  }

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
  
  async generateNarrative(resumeData, userId) {
    if (this.isMock) {
      return "I am a professional with extensive experience.";
    }
    try {
      if (userId) await this.trackUsage(userId, 'narrative');
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `
      You are an expert career coach and storyteller.
      Take the following structured resume data and weave it into a flowing, professional 3-4 paragraph narrative.
      It should read like an engaging "About Me" or professional biography that could be used on a portfolio page.
      Highlight the progression, key achievements, and core skills without just listing them.
      Do not use bullet points. Make it engaging, professional, and authentic to the person's real experience.
  
      Resume Data:
      ${JSON.stringify(resumeData, null, 2)}
      `;
  
      const result = await withRetry(() => model.generateContent(prompt));
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini Narrative Error:', error);
      throw new Error('Failed to generate narrative');
    }
  }
  
  async panicRebuild(resumeContext, targetRole, focus, topSkills, userId) {
    if (this.isMock) {
      return resumeContext; // Unmodified for mock
    }
    try {
      if (userId) await this.trackUsage(userId, 'panic_rebuild');
      const prompt = `You are an expert resume editor working under extreme time pressure for a user.
      The user is applying for: "${targetRole}"
      They want to emphasize this recent experience: "${focus}"
      Their top skills for this job: "${topSkills}"
      
      Here is their EXISTING resume data:
      ${JSON.stringify(resumeContext)}
      
      YOUR ONLY TASK: Reorder and prioritize the EXISTING bullets, experience entries, and skills so that the most relevant information for "${targetRole}" appears first.
      DO NOT FABRICATE OR INVENT NEW EXPERIENCE, SKILLS, OR BULLET POINTS. Only reorder and re-weigh what is provided.
      
      Return the restructured resume data in the exact same JSON format (summary, experience array, education array, skills array, projects array).`;
  
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await withRetry(() => model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      }));
  
      return JSON.parse((await result.response).text());
    } catch (error) {
      console.error("Gemini Panic Rebuild Error:", error);
      throw new Error("Failed to rapidly rebuild resume via Gemini");
    }
  }

  async chatWithCoach(sessionHistory, userMessage, resumeContext, userId) {
    if (this.isMock) {
      return {
        message: "This is a mock response from your AI resume coach.",
        newFocusAreas: ["Mock Strategy", "Mock Interviewing"]
      };
    }
    try {
      if (userId) await this.trackUsage(userId, 'coach_chat');
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const promptText = `You are an AI Resume Coach assisting the user with their career goals.
YOUR ROLE: You provide objective, task-focused advice based on their actual resume data and past conversation.
DO NOT act as a human relationship or emotional support figure. Stay strictly task-focused and professional.

Resume Data:
${JSON.stringify(resumeContext)}

Conversation History:
${JSON.stringify(sessionHistory.map(m => m.role + ': ' + m.message))}

User Message:
${userMessage}

Based on the context, provide a helpful and constructive response. Also extract up to 3 "focusAreas" (topics the user should work on, like "quantifying impact" or "interview confidence").
Respond STRICTLY with a valid JSON object matching this schema, without markdown blocks:
{
  "message": "Your response to the user",
  "newFocusAreas": ["area1", "area2"]
}`;

      const result = await withRetry(() => model.generateContent(promptText));
      let jsonString = result.response.text();
      
      if (jsonString.startsWith('\`\`\`json')) {
        jsonString = jsonString.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      } else if (jsonString.startsWith('\`\`\`')) {
        jsonString = jsonString.replace(/\`\`\`/g, '').trim();
      }

      return JSON.parse(jsonString);
    } catch (error) {
      logger.error('Gemini API Error in Coach Chat:', error);
      throw new Error('Coach temporarily unavailable, try again');
    }
  }

  async generateScholarshipExplanation(userProfile, scholarshipDetails, userId) {
    if (this.isMock) {
      return "Mock explanation: Based on your major and GPA, you are a strong fit for this scholarship.";
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `
        You are an expert scholarship advisor. Explain briefly (max 3 sentences) why the user is a good match for this scholarship. 
        Focus strictly on factual overlap between the user's profile and the scholarship's eligibility criteria.
        
        User Profile:
        ${JSON.stringify(userProfile, null, 2)}
        
        Scholarship Details:
        ${JSON.stringify(scholarshipDetails, null, 2)}
      `;

      const result = await withRetry(() => model.generateContent(prompt));
      const response = result.response.text();

      // Track usage asynchronously
      this.trackUsage(userId, 'scholarship_explanation', prompt.length + response.length).catch(err => 
        logger.error(`Failed to track Gemini usage: ${err.message}`)
      );

      return response.trim();
    } catch (error) {
      logger.error('Gemini scholarship explanation generation failed:', error);
      throw new Error('Failed to generate match explanation');
    }
  }
}

module.exports = new GeminiService();
