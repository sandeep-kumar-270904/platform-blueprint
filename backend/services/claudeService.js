const axios = require('axios');

class ClaudeService {
  async generateNewsSummary(title, content) {
    console.log(`[ClaudeService] Generating summary for: ${title}`);
    try {
      // Mocking Claude integration pattern
      return `This is a Claude-generated summary for the article "${title}".`;
    } catch (err) {
      console.error('Claude API Error:', err);
      return null;
    }
  }

  async generateText(prompt, options = {}) {
    console.log(`[ClaudeService] Generating text for prompt (length: ${prompt ? prompt.length : 0})`);
    try {
      if (process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY !== 'mock_key') {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: options.max_tokens || 250,
          messages: [{ role: 'user', content: prompt }]
        }, {
          headers: {
            'x-api-key': process.env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          timeout: 6000
        });
        return response.data.content[0].text;
      }
      // Check if it's a skill gap or match explanation prompt
      if (prompt && (prompt.includes('skill gap') || prompt.includes('focus on') || prompt.includes('missing skills') || prompt.includes('here\'s what to learn next'))) {
        return "Focusing on these key skills will give you a strong technical advantage and immediately boost your value for this team's roadmap. Mastering these concepts not only closes the gap for this project, but also aligns your profile with high-demand industry standards.";
      }
      if (prompt && prompt.includes('good fit for this team')) {
        return "Your profile shows strong foundational alignment with this team's core technical goals. Joining this project will give you excellent hands-on collaboration experience while allowing you to expand your specialized skills in a supportive team environment.";
      }
      return "This looks like a great collaborative opportunity where you can contribute your strengths while learning high-impact modern skills.";
    } catch (err) {
      console.error('Claude API Error in generateText:', err.message || err);
      throw err;
    }
  }
}

module.exports = new ClaudeService();
