const { google } = require('googleapis');
const CalendarConnection = require('../models/CalendarConnection');
const crypto = require('crypto');

// Setup AES-256-CBC encryption for tokens
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 32 bytes
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

class CalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
      process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/calendar/auth/google/callback'
    );
    this.isMock = !process.env.GOOGLE_CLIENT_ID;
  }

  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/userinfo.email'],
      prompt: 'consent'
    });
  }

  async handleCallback(code, userId) {
    if (this.isMock) {
      await CalendarConnection.findOneAndUpdate(
        { user_id: userId },
        {
          provider: 'google',
          accessToken: encrypt('mock_access_token'),
          refreshToken: encrypt('mock_refresh_token'),
          tokenExpiry: new Date(Date.now() + 3600 * 1000),
          syncStatus: 'active',
          accountId: 'mock@example.com'
        },
        { upsert: true, new: true }
      );
      return;
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    
    // Get user email
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    await CalendarConnection.findOneAndUpdate(
      { user_id: userId },
      {
        provider: 'google',
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        tokenExpiry: new Date(tokens.expiry_date),
        syncStatus: 'active',
        accountId: userInfo.data.email
      },
      { upsert: true, new: true }
    );
  }

  async getClientForUser(userId) {
    const connection = await CalendarConnection.findOne({ user_id: userId, syncStatus: 'active' });
    if (!connection) return null;

    if (this.isMock) return { mock: true };

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    client.setCredentials({
      access_token: decrypt(connection.accessToken),
      refresh_token: connection.refreshToken ? decrypt(connection.refreshToken) : undefined,
      expiry_date: connection.tokenExpiry.getTime()
    });

    // Handle token refresh automatically
    client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        connection.refreshToken = encrypt(tokens.refresh_token);
      }
      connection.accessToken = encrypt(tokens.access_token);
      connection.tokenExpiry = new Date(tokens.expiry_date);
      await connection.save();
    });

    return client;
  }

  async createEvent(userId, eventDetails) {
    const client = await this.getClientForUser(userId);
    if (!client) return null;

    if (this.isMock) return `mock_event_${Date.now()}`;

    const calendar = google.calendar({ version: 'v3', auth: client });
    try {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        resource: {
          summary: eventDetails.summary,
          description: eventDetails.description,
          start: { dateTime: eventDetails.startTime.toISOString() },
          end: { dateTime: eventDetails.endTime.toISOString() }
        }
      });
      return res.data.id;
    } catch (err) {
      if (err.code === 401 || err.code === 403) {
        await CalendarConnection.updateOne({ user_id: userId }, { syncStatus: 'revoked' });
      }
      console.error('Calendar create event error:', err.message);
      return null;
    }
  }

  async deleteEvent(userId, eventId) {
    const client = await this.getClientForUser(userId);
    if (!client || this.isMock || !eventId) return;

    const calendar = google.calendar({ version: 'v3', auth: client });
    try {
      await calendar.events.delete({ calendarId: 'primary', eventId });
    } catch (err) {
      console.error('Calendar delete event error:', err.message);
    }
  }

  async getBusyBlocks(userId, timeMin, timeMax) {
    const client = await this.getClientForUser(userId);
    if (!client) return [];
    if (this.isMock) return [];

    const calendar = google.calendar({ version: 'v3', auth: client });
    try {
      const res = await calendar.freebusy.query({
        resource: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: 'primary' }]
        }
      });
      return res.data.calendars.primary.busy || [];
    } catch (err) {
      console.error('Calendar freebusy error:', err.message);
      return [];
    }
  }
}

module.exports = new CalendarService();
