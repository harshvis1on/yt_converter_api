// Megaphone API Service for fetching episode status and data via n8n proxy
import { n8nApi } from './n8nApi';

class MegaphoneApiService {
  constructor() {
    this.apiToken = process.env.REACT_APP_MEGAPHONE_API_TOKEN;
    this.networkId = process.env.REACT_APP_MEGAPHONE_NETWORK_ID;
  }

  // Fetch episode details via n8n proxy (to avoid CORS issues)
  async getEpisodeStatus(podcastId, episodeId) {
    if (!this.apiToken || !this.networkId) {
      console.warn('⚠️ Megaphone API credentials not configured');
      return null;
    }

    try {
      console.log(`🎧 Fetching episode status via n8n proxy:`, { podcastId, episodeId });
      
      // Call n8n workflow that will proxy the Megaphone API request
      const result = await n8nApi.makeRequest('get-episode-status', {
        podcastId: podcastId,
        episodeId: episodeId,
        apiToken: this.apiToken
      });

      if (!result || !result.success) {
        console.warn(`📻 Episode ${episodeId} not found or API error`);
        return null;
      }

      console.log(`✅ Retrieved episode data via n8n:`, result.episode);

      // Transform Megaphone status to our UI status
      const status = this.transformMegaphoneStatus(result.episode.status);
      
      return {
        status,
        originalStatus: result.episode.status,
        publishedAt: result.episode.published_at,
        createdAt: result.episode.created_at,
        updatedAt: result.episode.updated_at,
        title: result.episode.title,
        summary: result.episode.summary,
        uid: result.episode.uid,
        rawData: result.episode
      };

    } catch (error) {
      console.error(`❌ Failed to fetch episode status via n8n:`, error);
      return null;
    }
  }

  // Transform Megaphone status to UI-friendly status
  transformMegaphoneStatus(megaphoneStatus) {
    if (!megaphoneStatus) return 'Processing';
    
    switch (megaphoneStatus.toLowerCase()) {
      case 'published':
        return 'Live';
      case 'scheduled':
        return 'Scheduled';
      case 'draft':
        return 'Draft';
      case 'processing':
        return 'Processing';
      default:
        console.log(`🔍 Unknown Megaphone status: "${megaphoneStatus}"`);
        return 'Processing';
    }
  }

  // Fetch multiple episodes status in parallel
  async getMultipleEpisodeStatus(episodes) {
    if (!episodes || episodes.length === 0) return [];

    console.log(`🎧 Fetching status for ${episodes.length} episodes from Megaphone API`);
    
    const statusPromises = episodes.map(async (episode) => {
      if (!episode.megaphoneEpisodeId || !episode.podcastId) {
        console.warn(`⚠️ Missing IDs for episode ${episode.id}:`, { 
          megaphoneEpisodeId: episode.megaphoneEpisodeId, 
          podcastId: episode.podcastId 
        });
        return { ...episode, megaphoneStatus: null };
      }

      const statusData = await this.getEpisodeStatus(episode.podcastId, episode.megaphoneEpisodeId);
      return {
        ...episode,
        megaphoneStatus: statusData
      };
    });

    try {
      const results = await Promise.allSettled(statusPromises);
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`❌ Failed to fetch status for episode ${episodes[index].id}:`, result.reason);
          return { ...episodes[index], megaphoneStatus: null };
        }
      });
    } catch (error) {
      console.error('❌ Error in batch episode status fetch:', error);
      return episodes.map(episode => ({ ...episode, megaphoneStatus: null }));
    }
  }
}

export const megaphoneApiService = new MegaphoneApiService();
export default megaphoneApiService;