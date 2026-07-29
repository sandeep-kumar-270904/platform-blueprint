const Team = require('../models/Team');
const TeamApplication = require('../models/TeamApplication');
const User = require('../models/User');
const { sendNotification } = require('./notificationService');
const teamBadgeService = require('./teamBadgeService');

class TeamIntegrationService {
  /**
   * Get all active teams a user belongs to (as creator or accepted member)
   */
  async getUserTeams(userId, status = 'open') {
    try {
      const query = {};
      if (status && status !== 'all') {
        query.status = status;
      }

      const createdTeams = await Team.find({ ...query, creator: userId }).lean();
      
      const applications = await TeamApplication.find({ applicant: userId, status: 'accepted' }).lean();
      const joinedTeamIds = applications.map(a => a.team);
      const joinedTeams = await Team.find({ ...query, _id: { $in: joinedTeamIds } }).lean();

      // Merge and deduplicate
      const allTeamsMap = new Map();
      createdTeams.forEach(t => allTeamsMap.set(t._id.toString(), { ...t, role: 'creator' }));
      joinedTeams.forEach(t => {
        if (!allTeamsMap.has(t._id.toString())) {
          allTeamsMap.set(t._id.toString(), { ...t, role: 'member' });
        }
      });

      return Array.from(allTeamsMap.values());
    } catch (err) {
      console.error('teamIntegrationService.getUserTeams error:', err);
      return [];
    }
  }

  /**
   * Programmatically create a team from another module (e.g. Hackathons, Classroom)
   */
  async createTeamForProject({ creatorId, title, description, maxMembers = 4, category = 'Hackathon', requiredSkills = [], tags = [] }) {
    try {
      const team = await Team.create({
        creator: creatorId,
        title,
        description,
        teamSize: {
          current: 1,
          max: maxMembers
        },
        category,
        requiredSkills,
        tags,
        status: 'open'
      });

      return team;
    } catch (err) {
      console.error('teamIntegrationService.createTeamForProject error:', err);
      return null;
    }
  }

  /**
   * Check if a user has sufficient skill overlap with a team's requirements
   */
  async checkTeamEligibility(userId, teamId) {
    try {
      const [user, team] = await Promise.all([
        User.findById(userId).lean(),
        Team.findById(teamId).lean()
      ]);

      if (!user || !team) return { eligible: false, matchScore: 0 };
      if (!team.requiredSkills || team.requiredSkills.length === 0) return { eligible: true, matchScore: 100 };

      const userSkills = (user.skills || []).map(s => (typeof s === 'string' ? s : s.skillName || s.name || '').toLowerCase());
      const reqSkills = team.requiredSkills.map(s => s.toLowerCase());

      const matched = reqSkills.filter(rs => userSkills.some(us => us.includes(rs) || rs.includes(us))).length;
      const matchScore = Math.round((matched / reqSkills.length) * 100);

      return {
        eligible: matchScore >= 40,
        matchScore
      };
    } catch (err) {
      console.error('teamIntegrationService.checkTeamEligibility error:', err);
      return { eligible: false, matchScore: 0 };
    }
  }

  /**
   * Notify all members of a team (creator + accepted applicants)
   */
  async notifyTeamMembers(teamId, { type, title, body, actorId }) {
    try {
      const team = await Team.findById(teamId).lean();
      if (!team) return false;

      const applications = await TeamApplication.find({ team: teamId, status: 'accepted' }).lean();
      const memberIds = new Set([
        team.creator.toString(),
        ...applications.map(a => a.applicant.toString())
      ]);

      if (actorId) {
        memberIds.delete(actorId.toString());
      }

      for (const userId of memberIds) {
        await sendNotification({
          userId,
          type: type || 'team_update',
          title: title || 'Team Update',
          body: body || 'You have a new notification from your team.',
          relatedContentId: teamId.toString(),
          actorId
        });
      }

      return true;
    } catch (err) {
      console.error('teamIntegrationService.notifyTeamMembers error:', err);
      return false;
    }
  }

  /**
   * Award badges when a team completes a milestone or project
   */
  async triggerMilestoneBadges(userId) {
    try {
      if (teamBadgeService && typeof teamBadgeService.evaluateUserBadges === 'function') {
        return await teamBadgeService.evaluateUserBadges(userId);
      }
      return null;
    } catch (err) {
      console.error('teamIntegrationService.triggerMilestoneBadges error:', err);
      return null;
    }
  }
}

module.exports = new TeamIntegrationService();
