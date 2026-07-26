// Simple AI-like moderation helper
const assessModeration = async (text) => {
  if (!text) return { flagged: false };
  const t = text.toLowerCase();
  
  if (t.includes('spam') || t.includes('viagra') || t.includes('crypto scam')) {
    return { flagged: true, reason: 'Suspected spam/scam content detected by AI' };
  }
  if (t.includes('hate') || /\bkill\b/.test(t) || t.includes('murder')) {
    return { flagged: true, reason: 'Suspected abusive language detected by AI' };
  }
  
  return { flagged: false };
};

module.exports = {
  assessModeration
};
