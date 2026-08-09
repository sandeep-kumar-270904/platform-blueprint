const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StudentProfile = require('../models/StudentProfile');
const MentorChatHistory = require('../models/MentorChatHistory');
const College = require('../models/College');
const SalaryEntry = require('../models/SalaryEntry');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to fetch context data
async function getContextData(profile, prompt) {
  let contextParts = [];

  // 1. Relevant Colleges
  try {
    // Basic match: if they specified a budget and location, try to find top 3 colleges
    const locationRegex = new RegExp(profile.locationPreference, 'i');
    const colleges = await College.find({
      $or: [
        { 'location.city': locationRegex },
        { 'location.state': locationRegex }
      ]
    }).limit(5);

    if (colleges.length > 0) {
      const collegeSummaries = colleges.map(c => 
        `- ${c.name} (${c.location.city}, ${c.location.state}): Rating ${c.rating}/5, Total Fees (Tuition+Hostel+Other) roughly ₹${c.fees.tuition + c.fees.hostel + c.fees.other}/yr. Type: ${c.type}.`
      ).join('\n');
      contextParts.push(`Relevant Platform Colleges (based on location '${profile.locationPreference}'):\n${collegeSummaries}`);
    }
  } catch (err) {
    console.error("Error fetching colleges for context", err);
  }

  // 2. Real Salary Data for Branch
  try {
    const branchRegex = new RegExp(profile.branchOfInterest, 'i');
    const salaries = await SalaryEntry.find({ branch: branchRegex }).limit(50);
    
    if (salaries.length > 0) {
      const bands = {};
      salaries.forEach(s => {
        bands[s.ctcBand] = (bands[s.ctcBand] || 0) + 1;
      });
      const topBands = Object.entries(bands).sort((a,b) => b[1] - a[1]).slice(0,3);
      const bandStr = topBands.map(([band, count]) => `${band} (${count} reports)`).join(', ');
      contextParts.push(`Real Salary Data for '${profile.branchOfInterest}': Most common reported CTC bands are ${bandStr}.`);
    } else {
      contextParts.push(`Real Salary Data: No platform data available yet for '${profile.branchOfInterest}'.`);
    }
  } catch (err) {
    console.error("Error fetching salaries for context", err);
  }

  // 3. Specific college mention in prompt?
  try {
    const allColleges = await College.find({}, 'name rating totalReviews fees avgPlacementsRating avgCampusLifeRating');
    const mentionedColleges = allColleges.filter(c => prompt.toLowerCase().includes(c.name.toLowerCase()));
    
    if (mentionedColleges.length > 0) {
      const mentionSummaries = mentionedColleges.map(c => 
        `Data for ${c.name}: ${c.rating}/5 stars from ${c.totalReviews} reviews. Placements Rating: ${c.avgPlacementsRating}. Campus Life Rating: ${c.avgCampusLifeRating}. Fees: ₹${c.fees.tuition + c.fees.hostel + c.fees.other}/yr.`
      ).join('\n');
      contextParts.push(`Requested College Data:\n${mentionSummaries}`);
    }
  } catch (err) {
    console.error("Error fetching mentioned colleges", err);
  }

  return contextParts.join('\n\n');
}

// GET /api/mentor/history
router.get('/history', auth, async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    const history = await MentorChatHistory.findOne({ userId: req.user.id });
    
    res.json({
      profile: profile || null,
      messages: history ? history.messages : []
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/mentor/onboarding
router.post('/onboarding', auth, async (req, res) => {
  try {
    const { branchOfInterest, budgetRange, locationPreference, priorities, currentAcademicStanding } = req.body;
    
    let profile = await StudentProfile.findOne({ userId: req.user.id });
    if (profile) {
      profile.branchOfInterest = branchOfInterest;
      profile.budgetRange = budgetRange;
      profile.locationPreference = locationPreference;
      profile.priorities = priorities;
      profile.currentAcademicStanding = currentAcademicStanding;
    } else {
      profile = new StudentProfile({
        userId: req.user.id,
        branchOfInterest,
        budgetRange,
        locationPreference,
        priorities,
        currentAcademicStanding
      });
    }
    
    await profile.save();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/mentor/chat
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(403).json({ message: 'Please complete mentor onboarding first' });

    // Fetch or create history
    let history = await MentorChatHistory.findOne({ userId: req.user.id });
    if (!history) {
      history = new MentorChatHistory({ userId: req.user.id, messages: [] });
    }

    // Save user message
    history.messages.push({ role: 'user', content: message });

    // Fetch Context Data
    const contextData = await getContextData(profile, message);

    // Prepare Gemini Prompt
    if (!process.env.GEMINI_API_KEY) {
      // Fallback for local testing
      const fallbackMsg = "AI Mentor is currently offline because the API key is not configured. However, I can see your profile: " + profile.branchOfInterest;
      history.messages.push({ role: 'model', content: fallbackMsg });
      await history.save();
      return res.json({ response: fallbackMsg });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `You are a real, highly capable AI Mentor for a student on 'College Insights'. You are a real advisor, not a generic summarizer. 
Provide personalized, specific advice. DO NOT hallucinate statistics. Rely heavily on the PLATFORM CONTEXT provided below.

STUDENT PROFILE:
- Branch/Field of Interest: ${profile.branchOfInterest}
- Budget Range: ${profile.budgetRange}
- Location Preference: ${profile.locationPreference}
- Priorities: ${profile.priorities.join(', ')}
- Current Academic Standing: ${profile.currentAcademicStanding}

PLATFORM CONTEXT:
${contextData}

CRITICAL RULES:
1. Ground your answers in the PLATFORM CONTEXT above. If salary data or college stats are provided, use them exactly. If no platform data is available, admit it—do not invent numbers.
2. Proactively flag gaps: If the student asks about a college that fundamentally mismatches their stated Priorities, Location, or Budget, you MUST directly point this out and ask if they are reconsidering their preferences. Do not just agree blindly.
3. Keep responses concise, supportive, but extremely honest like a real career counselor.`;

    // Construct history for Gemini
    const chat = model.startChat({
      history: history.messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        maxOutputTokens: 800,
      }
    });

    // We pass the system instruction as a contextual prefix to the actual message, 
    // since systemInstruction in startChat is supported differently across SDK versions.
    const fullMessage = `[SYSTEM CONTEXT]\n${systemInstruction}\n\n[USER MESSAGE]\n${message}`;
    
    const result = await chat.sendMessage(fullMessage);
    const responseText = await result.response.text();

    // Save AI message
    history.messages.push({ role: 'model', content: responseText });
    await history.save();

    res.json({ response: responseText });

  } catch (err) {
    console.error('AI Mentor Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
