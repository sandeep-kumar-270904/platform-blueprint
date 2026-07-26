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
      const userSkills = user.skills.map(s => s.skillName).join(', ');

      const prompt = `You are a matchmaker for a student team platform.
Team Requirements: ${teamRequirements || 'None specified'}
Student Skills: ${userSkills || 'None listed'}
Team Description: ${team.description}

Write a 2-3 sentence explanation directly addressing the student on why they are a good fit for this team, or what they might learn by joining. Keep it encouraging, concise, and professional. Do not use filler text like "Here is an explanation". Just the explanation itself.`;

      // Use the existing claudeService
      const explanation = await claudeService.generateText(prompt, { max_tokens: 150 });
      
      const result = explanation.trim();
      this.cache.set(cacheKey, result);
      return result;

    } catch (err) {
      console.error('Error generating AI match explanation:', err);
      // Fallback
      return "You share some common skills or interests with this team's requirements. This looks like a great opportunity for you to contribute and learn!";
    }
  }
}

module.exports = new TeamMatchExplainer();
