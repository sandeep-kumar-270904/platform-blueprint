const SkillOffer = require('../models/SkillOffer');
const SkillMatch = require('../models/SkillMatch');

/**
 * Normalizes a string for matching by converting to lowercase and removing extra spaces.
 */
const normalize = (str) => {
  if (!str) return '';
  return str.toLowerCase().trim();
};

/**
 * Checks if a skill name matches any of the requested skills.
 * Returns score: 100 for exact/substring match.
 */
const getSkillMatchScore = (offeredSkill, requestedSkillsArray) => {
  if (!requestedSkillsArray || requestedSkillsArray.length === 0) return 0;
  
  const normOffered = normalize(offeredSkill);
  
  for (const req of requestedSkillsArray) {
    const normReq = normalize(req);
    // Simple substring match (e.g. "React" matches "ReactJS" or "react")
    if (normOffered.includes(normReq) || normReq.includes(normOffered)) {
      return 100;
    }
  }
  return 0;
};

/**
 * Computes live matches for a given user based on their active offers.
 * This is a simple O(N) matching algorithm for Phase 1.
 */
const computeMatchesForUser = async (userId) => {
  try {
    // 1. Get all active offers by this user
    const myOffers = await SkillOffer.find({ user: userId, status: 'active' });
    if (myOffers.length === 0) return [];

    // 2. Get all active offers by OTHER users
    const otherOffers = await SkillOffer.find({ 
      user: { $ne: userId }, 
      status: 'active' 
    }).populate('user', 'name avatar');

    const potentialMatches = [];

    // 3. Evaluate each of my offers against all other offers
    for (const myOffer of myOffers) {
      for (const otherOffer of otherOffers) {
        
        // Check if other offer provides what I want
        const iWantWhatTheyOffer = getSkillMatchScore(otherOffer.skillName, myOffer.wantsToLearn);
        
        // Check if I provide what they want
        const theyWantWhatIOffer = getSkillMatchScore(myOffer.skillName, otherOffer.wantsToLearn);

        // Mutual exchange potential exists if BOTH have > 0 match score
        // For Phase 1, we allow partial mutual (one strong, one weak/category) but ideally both > 0
        // To be more forgiving, if they are in the same category, we add 50 points.
        
        let score = iWantWhatTheyOffer + theyWantWhatIOffer;
        
        // Bonus for same category
        if (myOffer.category && otherOffer.category && normalize(myOffer.category) === normalize(otherOffer.category)) {
          score += 50;
        }

        // We consider it a match if score > 50 (at least a category match + some interest, or exact match)
        if (score > 50 && (iWantWhatTheyOffer > 0 || theyWantWhatIOffer > 0)) {
          potentialMatches.push({
            myOffer,
            otherOffer,
            matchScore: Math.min(score, 100) // cap at 100
          });
        }
      }
    }

    // Sort by highest match score
    potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    return potentialMatches;
  } catch (error) {
    console.error("Error computing matches:", error);
    return [];
  }
};

module.exports = {
  computeMatchesForUser
};
