const axios = require('axios');

class VideoService {
  constructor() {
    this.apiKey = process.env.DAILY_API_KEY || 'mock_daily_key';
    this.baseUrl = 'https://api.daily.co/v1';
    
    // We'll use a mocked flow if no real key is present to prevent crashing,
    // but the logic here represents the real integration.
    this.isMock = this.apiKey === 'mock_daily_key';
  }

  async createRoom(bookingId, scheduledAt, durationMinutes = 60, enableRecording = true) {
    if (this.isMock) {
      return {
        id: `mock_room_${bookingId}`,
        name: `room_${bookingId}`,
        url: `https://mock.daily.co/room_${bookingId}`
      };
    }

    // Room expires 1 hour after scheduled end time to be safe
    const expiresAt = Math.floor(new Date(scheduledAt).getTime() / 1000) + (durationMinutes * 60) + 3600;

    try {
      const response = await axios.post(
        `${this.baseUrl}/rooms`,
        {
          name: `session_${bookingId}_${Date.now()}`,
          privacy: 'private',
          properties: {
            exp: expiresAt,
            enable_recording: enableRecording ? 'cloud' : null
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        id: response.data.id,
        name: response.data.name,
        url: response.data.url
      };
    } catch (err) {
      console.error('Failed to create Daily.co room:', err.response?.data || err.message);
      throw new Error('Failed to create video room');
    }
  }

  async createMeetingToken(roomName, userName, isOwner = false) {
    if (this.isMock) {
      return `mock_token_${Date.now()}`;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/meeting-tokens`,
        {
          properties: {
            room_name: roomName,
            is_owner: isOwner,
            user_name: userName,
            // enable recording features for the owner
            enable_recording: isOwner ? 'cloud' : null
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.token;
    } catch (err) {
      console.error('Failed to create Daily.co meeting token:', err.response?.data || err.message);
      throw new Error('Failed to generate secure meeting token');
    }
  }
}

module.exports = new VideoService();
