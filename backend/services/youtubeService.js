const axios = require('axios');

class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  /**
   * Parse a YouTube URL and identify the resource type and ID
   * @param {string} url - The YouTube URL to parse
   * @returns {Object} { type: 'video' | 'channel' | 'playlist', id: string }
   */
  parseUrl(url) {
    try {
      const parsed = new URL(url);
      
      // Playlist parsing
      if (parsed.searchParams.has('list')) {
        return { type: 'playlist', id: parsed.searchParams.get('list') };
      }

      // Video parsing (standard youtube.com/watch?v=...)
      if (parsed.hostname.includes('youtube.com') && parsed.pathname === '/watch') {
        return { type: 'video', id: parsed.searchParams.get('v') };
      }

      // Video parsing (youtu.be/...)
      if (parsed.hostname === 'youtu.be') {
        return { type: 'video', id: parsed.pathname.substring(1) };
      }

      // Channel parsing (youtube.com/channel/... or youtube.com/c/... or youtube.com/@...)
      if (parsed.pathname.startsWith('/channel/')) {
        return { type: 'channel', id: parsed.pathname.split('/')[2] };
      }
      
      if (parsed.pathname.startsWith('/@') || parsed.pathname.startsWith('/c/')) {
        // Warning: This requires searching the channel ID via API since it's a handle/custom URL.
        // We handle this below in the API fetch by doing a search/channel list.
        return { type: 'channel_handle', handle: parsed.pathname.split('/')[1].replace('@', '') };
      }

      throw new Error('Unsupported YouTube URL format');
    } catch (error) {
      throw new Error('Invalid URL');
    }
  }

  /**
   * Check if API key is configured
   */
  checkApiKey() {
    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is missing.');
    }
  }

  /**
   * Fetch metadata for a specific resource
   */
  async fetchMetadata(parsedResource) {
    this.checkApiKey();
    
    const { type, id, handle } = parsedResource;

    if (type === 'video') {
      return this.fetchVideoData(id);
    } else if (type === 'playlist') {
      return this.fetchPlaylistData(id);
    } else if (type === 'channel' || type === 'channel_handle') {
      return this.fetchChannelData(id, handle);
    }

    throw new Error('Unsupported resource type');
  }

  async fetchVideoData(videoId) {
    try {
      const res = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: this.apiKey
        }
      });

      if (!res.data.items || res.data.items.length === 0) {
        throw new Error('Video not found or is private');
      }

      const item = res.data.items[0];
      const snippet = item.snippet;
      const stats = item.statistics;
      
      return {
        youtubeId: videoId,
        type: 'video',
        title: snippet.title,
        description: snippet.description,
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
        channelId: snippet.channelId,
        channelTitle: snippet.channelTitle,
        duration: item.contentDetails.duration, // PT1H...
        views: parseInt(stats.viewCount || '0', 10),
        likes: parseInt(stats.likeCount || '0', 10)
      };
    } catch (err) {
      console.error('YouTube API Error (Video):', err.response?.data || err.message);
      throw new Error('Failed to fetch video metadata from YouTube.');
    }
  }

  async fetchPlaylistData(playlistId) {
    try {
      const res = await axios.get(`${this.baseUrl}/playlists`, {
        params: {
          part: 'snippet',
          id: playlistId,
          key: this.apiKey
        }
      });

      if (!res.data.items || res.data.items.length === 0) {
        throw new Error('Playlist not found or is private');
      }

      const snippet = res.data.items[0].snippet;
      
      return {
        youtubeId: playlistId,
        type: 'playlist',
        title: snippet.title,
        description: snippet.description,
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
        channelId: snippet.channelId,
        channelTitle: snippet.channelTitle,
        duration: null,
        views: 0,
        likes: 0
      };
    } catch (err) {
      console.error('YouTube API Error (Playlist):', err.response?.data || err.message);
      throw new Error('Failed to fetch playlist metadata from YouTube.');
    }
  }

  async fetchChannelData(channelId, handle) {
    try {
      const params = {
        part: 'snippet,statistics',
        key: this.apiKey
      };

      if (channelId) {
        params.id = channelId;
      } else if (handle) {
        params.forHandle = `@${handle}`;
      } else {
        throw new Error('Missing channel ID or handle');
      }

      const res = await axios.get(`${this.baseUrl}/channels`, { params });

      if (!res.data.items || res.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      const item = res.data.items[0];
      const snippet = item.snippet;
      const stats = item.statistics;
      
      return {
        youtubeId: item.id,
        type: 'channel',
        title: snippet.title,
        description: snippet.description,
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
        channelId: item.id,
        channelTitle: snippet.title,
        duration: null,
        views: parseInt(stats.viewCount || '0', 10),
        likes: 0 // channels don't have likes
      };
    } catch (err) {
      console.error('YouTube API Error (Channel):', err.response?.data || err.message);
      throw new Error('Failed to fetch channel metadata from YouTube.');
    }
  }
}

module.exports = new YouTubeService();
