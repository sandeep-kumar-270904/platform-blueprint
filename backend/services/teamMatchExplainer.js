const claudeService = require('./claudeService');
const Team = require('../models/Team');
const User = require('../models/User');

class TeamMatchExplainer {
  constructor() {
    this.cache = new Map();
  }

  async generateExplanation(teamId, userId) {
    const cacheKey = `${teamId}_${userId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const team = await Team.findById(teamId);
      const user = await User.findById(userId);

      if (!team || !user) {
        throw new Error('Team or User not found');
      }

      const teamRequirements = [...(team.requiredSkills || []), ...(team.requiredRoles || [])].join(', ');
      const userSkills = (user.skills || []).map(s => typeof s === 'string' ? s : s.skillName || '').filter(Boolean).join(', ');

      const prompt = `You are a matchmaker for a student team platform.
Team Requirements: ${teamRequirements || 'None specified'}
Student Skills: ${userSkills || 'None listed'}
Team Description: ${team.description}

Write a 2-3 sentence explanation directly addressing the student on why they are a good fit for this team, or what they might learn by joining. Keep it encouraging, concise, and professional. Do not use filler text like "Here is an explanation". Just the explanation itself.`;

      // Use the existing claudeService
      const explanation = await claudeService.generateText(prompt, { max_tokens: 150 });
      
      const result = explanation ? explanation.trim() : null;
      if (!result) throw new Error('Empty AI explanation');
      this.cache.set(cacheKey, result);
      return result;

    } catch (err) {
      console.error('Error generating AI match explanation:', err.message || err);
      // Fallback
      return "You share some common skills or interests with this team's requirements. This looks like a great opportunity for you to contribute and learn!";
    }
  }

  async generateGapAdvice(team, user, missingSkills = []) {
    if (!missingSkills || missingSkills.length === 0) {
      return "You already match the core requirements for this team! Keep refining your skills to lead and contribute effectively.";
    }
    const teamIdStr = team._id ? team._id.toString() : team.toString();
    const userIdStr = user && user._id ? user._id.toString() : (user ? user.toString() : 'anon');
    const cacheKey = `gap_${teamIdStr}_${userIdStr}_${missingSkills.slice().sort().join(',')}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const skillsList = missingSkills.join(', ');
    const teamTitle = team.title || 'this team';
    const teamDesc = team.description || 'collaborative project';

    const prompt = `You are a supportive, encouraging mentor for a student team platform.
Team: ${teamTitle} (${teamDesc})
Missing Skills: ${skillsList}

Write one short, encouraging, specific paragraph (2-3 sentences max) explaining why focusing on learning "${skillsList}" will be a game-changer for contributing to this type of project. Frame it positively as a concrete growth opportunity, NOT a deficiency or failure. Do not use filler introductions like "Here is advice". Just the paragraph itself.`;

    try {
      const advice = await claudeService.generateText(prompt, { max_tokens: 180 });
      if (advice && advice.trim()) {
        const result = advice.trim();
        this.cache.set(cacheKey, result);
        return result;
      }
      throw new Error('Empty response from AI');
    } catch (err) {
      console.error('Error generating AI gap advice:', err.message || err);
      // Graceful fallback template string (no AI dependency for page to function)
      const fallback = `Mastering ${skillsList} is a fantastic next step for your professional growth. Developing these skills will directly empower you to build core features for ${teamTitle} and stand out in similar high-impact team collaborations!`;
      this.cache.set(cacheKey, fallback);
      return fallback;
    }
  }
}

module.exports = new TeamMatchExplainer();
