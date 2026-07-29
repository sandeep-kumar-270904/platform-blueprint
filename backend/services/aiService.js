const axios = require('axios');
const MentorBooking = require('../models/MentorBooking');
const { AMASession } = require('../models/AMA');

class AIService {
  constructor() {
    this.apiKey = process.env.ASSEMBLYAI_API_KEY || 'mock_assembly_key';
    this.isMock = this.apiKey === 'mock_assembly_key';
  }

  async processRecording(bookingId, audioUrl, type = 'booking') {
    if (this.isMock) {
      console.log(`[Mock] Submitting recording for ${type} ${bookingId} to AssemblyAI...`);
      // Simulate async completion after 5 seconds
      setTimeout(async () => {
        try {
          if (type === 'booking') {
            await MentorBooking.findByIdAndUpdate(bookingId, {
              recordingStatus: 'ready',
              transcriptText: 'This is a mocked transcript of the session.',
              aiSummary: 'The mentor and mentee discussed career growth and technical skills.',
              aiActionItems: ['Update resume', 'Practice algorithms']
            });
          } else if (type === 'ama') {
            await AMASession.findByIdAndUpdate(bookingId, {
              recording_status: 'ready',
              transcript_text: 'Mocked AMA transcript.',
              ai_summary: 'AMA covered various topics.',
              ai_action_items: []
            });
          }
        } catch (e) {
          console.error('Mock AI Update Error:', e);
        }
      }, 5000);
      return;
    }

    try {
      const webhookUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/webhooks/assemblyai`;
      
      const response = await axios.post(
        'https://api.assemblyai.com/v2/transcript',
        {
          audio_url: audioUrl,
          webhook_url: webhookUrl,
          summarization: true,
          summary_model: 'informative',
          summary_type: 'bullets',
          auto_chapters: true // Action items could be extracted from chapters
        },
        { headers: { authorization: this.apiKey } }
      );

      // Save the transcript ID to check later or map to the webhook
      const transcriptId = response.data.id;
      
      if (type === 'booking') {
        await MentorBooking.findByIdAndUpdate(bookingId, { 
          recordingStatus: 'processing',
          transcriptText: transcriptId // temporary storage to map webhook back
        });
      } else {
        await AMASession.findByIdAndUpdate(bookingId, { 
          recording_status: 'processing',
          transcript_text: transcriptId
        });
      }

    } catch (err) {
      console.error('Failed to submit to AssemblyAI:', err.response?.data || err.message);
      if (type === 'booking') {
        await MentorBooking.findByIdAndUpdate(bookingId, { recordingStatus: 'failed' });
      } else {
        await AMASession.findByIdAndUpdate(bookingId, { recording_status: 'failed' });
      }
    }
  }

  async handleWebhook(transcriptId, status, summary, text, chapters) {
    if (status !== 'completed') return;

    // Find which record this belongs to
    let booking = await MentorBooking.findOne({ transcriptText: transcriptId });
    if (booking) {
      booking.recordingStatus = 'ready';
      booking.transcriptText = text;
      booking.aiSummary = summary;
      booking.aiActionItems = chapters?.map(c => c.headline) || [];
      await booking.save();
      return;
    }

    let ama = await AMASession.findOne({ transcript_text: transcriptId });
    if (ama) {
      ama.recording_status = 'ready';
      ama.transcript_text = text;
      ama.ai_summary = summary;
      ama.ai_action_items = chapters?.map(c => c.headline) || [];
      await ama.save();
    }
  }
}

module.exports = new AIService();
