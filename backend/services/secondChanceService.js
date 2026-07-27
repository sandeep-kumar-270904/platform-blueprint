/**
 * secondChanceService.js
 * 
 * Provides automated alternative team matching for applicants upon rejection.
 * Reuses pure scoring logic from Phase 3 teamMatchService without duplication.
 */

const Team = require('../models/Team');
const User = require('../models/User');
const TeamApplication = require('../models/TeamApplication');
const SecondChanceLog = require('../models/SecondChanceLog');
const teamMatchService = require('./teamMatchService');

class SecondChanceService {
  /**
   * Find alternative open teams for a rejected applicant.
   * 
   * @param {string} rejectedUserId - The ID of the rejected applicant
   * @param {string} originalTeamId - The ID of the team they were rejected from
   * @param {string} triggerSource - e.g. 'application_rejected' or 'on_demand_view'
   * @returns {Promise<Array<{ teamId: string, title: string, matchScore: number, description: string, category: string }>>}
   */
  async findAlternativeTeams(rejectedUserId, originalTeamId, triggerSource = 'application_rejected') {
    try {
      if (!rejectedUserId || !originalTeamId) {
        return [];
      }

      // Check for existing log to prevent recomputing/resending different suggestions for same rejection event
      const existingLog = await SecondChanceLog.findOne({
        user: rejectedUserId,
        originalTeam: originalTeamId
      }).populate('suggestedTeams.team', 'title description category status teamSize');

      if (existingLog) {
        const validSuggestions = [];
        for (const item of existingLog.suggestedTeams) {
          const t = item.team;
          // Only return previously suggested teams if they are still open and not full
          if (t && t.status === 'open' && t.teamSize && t.teamSize.current < t.teamSize.max) {
            validSuggestions.push({
              teamId: t._id.toString(),
              title: t.title,
              matchScore: item.matchScore,
              description: t.description || '',
              category: t.category || ''
            });
          }
        }
        return validSuggestions.slice(0, 2);
      }

      const user = await User.findById(rejectedUserId);
      const originalTeam = await Team.findById(originalTeamId);

      if (!user || !originalTeam) {
        return [];
      }

      // Extract user skills
      const userSkills = (user.skills || []).map(s => typeof s === 'string' ? s : s.skillName || '').filter(Boolean);

      // Collect all teams the user has already applied to or been rejected from
      const userApps = await TeamApplication.find({ applicant: rejectedUserId }).select('team');
      const excludedTeamIds = [
        originalTeamId,
        ...userApps.map(app => app.team ? app.team.toString() : null).filter(Boolean)
      ];

      // Bounded candidate pool query: limit to 100 most recent open teams not created by user and not full
      const candidateTeams = await Team.find({
        _id: { $nin: excludedTeamIds },
        status: 'open',
        creator: { $ne: rejectedUserId },
        $expr: { $lt: ["$teamSize.current", "$teamSize.max"] }
      })
      .sort({ createdAt: -1 })
      .limit(100);

      const matches = [];
      for (const team of candidateTeams) {
        const requiredSkills = [...(team.requiredSkills || []), ...(team.requiredRoles || [])];
        // Exactly reuse teamMatchService calculation without forked logic
        const matchResult = teamMatchService.calculateMatchScore(userSkills, requiredSkills);

        if (matchResult.score >= 50) {
          matches.push({
            teamId: team._id.toString(),
            title: team.title,
            matchScore: matchResult.score,
            description: team.description || '',
            category: team.category || ''
          });
        }
      }

      // Sort descending by match score and pick top 2
      matches.sort((a, b) => b.matchScore - a.matchScore);
      const topMatches = matches.slice(0, 2);

      // Log suggestions to SecondChanceLog for deduplication and persistence
      await SecondChanceLog.create({
        user: rejectedUserId,
        originalTeam: originalTeamId,
        suggestedTeams: topMatches.map(m => ({
          team: m.teamId,
          matchScore: m.matchScore
        })),
        triggeredBy: triggerSource
      });

      return topMatches;
    } catch (err) {
      console.error('[SecondChanceService] Error finding alternative teams:', err.message || err);
      return [];
    }
  }
}

module.exports = new SecondChanceService();
