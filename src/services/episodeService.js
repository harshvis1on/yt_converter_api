import { supabase } from './supabase';

export class EpisodeService {
  // Get episodes from Supabase (episodes table)
  async getEpisodesFromSupabase(podcastId) {
    try {
      console.log('📺 Fetching episodes from Supabase for podcast:', podcastId);
      
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('podcast_id', podcastId)
        .order('published_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      console.log(`✅ Found ${data.length} episodes in Supabase`);
      return {
        success: true,
        episodes: data || [],
        totalCount: data?.length || 0
      };
    } catch (error) {
      console.error('❌ Failed to fetch episodes from Supabase:', error);
      return {
        success: false,
        error: error.message,
        episodes: []
      };
    }
  }

  // Get podcast ID from Megaphone ID
  async getPodcastIdFromMegaphoneId(megaphoneId) {
    try {
      const { data, error } = await supabase
        .from('podcasts')
        .select('id')
        .eq('megaphone_id', megaphoneId)
        .single();

      if (error) {
        throw new Error(`Failed to find podcast: ${error.message}`);
      }

      return data?.id;
    } catch (error) {
      console.error('❌ Failed to get podcast ID:', error);
      return null;
    }
  }

  // Transform Supabase episode data for frontend
  transformEpisodeData(episodes) {
    return episodes.map(episode => ({
      id: `supabase_${episode.id}`,
      title: episode.title || "Untitled Episode",
      status: episode.status === 'published' ? "Published" : 
              episode.status === 'scheduled' ? "Scheduled" :
              episode.status === 'draft' ? "Draft" : "Unknown",
      publishedDate: episode.published_at ? new Date(episode.published_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) : "Unknown",
      format: "Audio",
      preRolls: 1,
      midRolls: 1,
      postRolls: 1,
      duration: episode.duration ? `${Math.floor(episode.duration / 60)}:${String(episode.duration % 60).padStart(2, '0')}` : "Unknown",
      plays: episode.play_count || 0,
      downloads: episode.download_count || 0,
      fileUrl: episode.file_url,
      source: 'supabase'
    }));
  }
}

export const episodeService = new EpisodeService();