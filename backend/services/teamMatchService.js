/**
 * teamMatchService.js
 * 
 * Provides pure functions for calculating match scores between a user and a team.
 */

// A simple synonym map to group related skills for partial credit
const skillSynonyms = {
  'react': ['reactjs', 'react.js', 'frontend', 'ui'],
  'node': ['nodejs', 'node.js', 'backend', 'javascript'],
  'python': ['django', 'flask', 'data science', 'ml', 'machine learning'],
  'javascript': ['js', 'frontend', 'typescript', 'ts'],
  'typescript': ['ts', 'javascript', 'js', 'frontend'],
  'ui/ux': ['design', 'figma', 'ui', 'ux', 'user interface'],
  'machine learning': ['ml', 'ai', 'data science', 'python'],
  'frontend': ['html', 'css', 'javascript', 'react', 'vue', 'angular', 'ui'],
  'backend': ['node', 'python', 'java', 'go', 'ruby', 'sql', 'database'],
  'java': ['spring', 'backend', 'android'],
};

/**
 * Normalize a skill string for comparison
 * @param {string} skill 
 * @returns {string}
 */
const normalize = (skill) => {
  if (!skill) return '';
  return skill.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

/**
 * Get synonyms for a normalized skill
 * @param {string} normalizedSkill 
 * @returns {string[]}
 */
const getSynonyms = (normalizedSkill) => {
  for (const [key, values] of Object.entries(skillSynonyms)) {
    const normKey = normalize(key);
    if (normKey === normalizedSkill || values.map(normalize).includes(normalizedSkill)) {
      return [normKey, ...values.map(normalize)];
    }
  }
  return [normalizedSkill];
};

/**
 * Calculate the match score between a user's skills/roles and a team's requirements.
 * 
 * @param {string[]} userSkills - Array of user's skills
 * @param {string[]} requiredSkills - Array of team's required skills
 * @returns {Object} { score: number (0-100), matchedSkills: string[], missingSkills: string[] }
 */
exports.calculateMatchScore = (userSkills = [], requiredSkills = []) => {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { score: 100, matchedSkills: [], missingSkills: [] };
  }

  const normUserSkills = userSkills.map(normalize).filter(Boolean);
  
  let matchCount = 0;
  const matchedSkills = [];
  const missingSkills = [];

  requiredSkills.forEach(reqSkill => {
    const normReq = normalize(reqSkill);
    if (!normReq) return;

    // Exact match
    if (normUserSkills.includes(normReq)) {
      matchCount += 1;
      matchedSkills.push(reqSkill);
      return;
    }

    // Synonym match (partial weight 0.5)
    const synonyms = getSynonyms(normReq);
    const hasSynonym = normUserSkills.some(us => synonyms.includes(us));
    
    if (hasSynonym) {
      matchCount += 0.5;
      matchedSkills.push(reqSkill); // Consider it matched for UI simplicity, or we could add a "partiallyMatched" array
    } else {
      missingSkills.push(reqSkill);
    }
  });

  // Calculate percentage
  let score = Math.round((matchCount / requiredSkills.length) * 100);
  if (score > 100) score = 100;

  return {
    score,
    matchedSkills,
    missingSkills
  };
};
