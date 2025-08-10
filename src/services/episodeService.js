import { supabase } from './supabase';
import { megaphoneApiService } from './megaphoneApi';

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
      status: (() => {
        // Enhanced status logic for Supabase episodes
        if (episode.error) {
          return "Failed";
        }
        
        // If we have megaphone URLs, episode is likely live
        if (episode.file_url && episode.file_url.includes('megaphone.fm')) {
          return episode.status === 'published' ? "Live" : 
                 episode.status === 'scheduled' ? "Scheduled" : "Live";
        }
        
        // Map known statuses
        switch (episode.status) {
          case 'published': return "Live";
          case 'scheduled': return "Scheduled";
          case 'draft': return "Draft";
          case 'created': return "Live"; // Created episodes with URLs are essentially live
          default: return "Processing";
        }
      })(),
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
      downloadUrl: episode.file_url, // For compatibility with n8n data format
      megaphoneEpisodeId: episode.megaphone_episode_id,
      megaphoneUid: episode.megaphone_uid,
      videoId: episode.video_id, // If available
      error: episode.error || null,
      source: 'supabase',
      rawData: episode // Keep raw data for debugging
    }));
  }

  // Transform n8n workflow episode data for immediate display
  transformN8nEpisodeData(results, originalVideoData = null) {
    console.log('🔄 transformN8nEpisodeData called with:', { 
      resultsCount: results?.length, 
      originalVideoDataCount: originalVideoData?.length,
      results: results,
      originalVideoData: originalVideoData 
    });

    if (!results || !Array.isArray(results)) {
      console.warn('Invalid n8n episode results:', results);
      return [];
    }

    // Create a lookup map for original video data by videoId
    const videoLookup = {};
    if (originalVideoData && Array.isArray(originalVideoData)) {
      originalVideoData.forEach(video => {
        const videoId = video.id || video.videoId;
        if (videoId) {
          videoLookup[videoId] = video;
          console.log(`📋 Added to videoLookup: ${videoId} -> "${video.title}"`);
        }
      });
    }
    
    console.log('🗂️ Final videoLookup:', videoLookup);

    return results.map(episode => {
      // Try to get original video title if available
      const originalVideo = videoLookup[episode.videoId];
      
      // Priority: 1) Original video title, 2) Episode title (if not generic podcast name), 3) Fallback
      let episodeTitle = "Untitled Episode";
      if (originalVideo?.title) {
        episodeTitle = originalVideo.title;
      } else if (episode.title && !episode.title.includes('Podcast') && episode.title !== 'Harsh ☀️ Podcast') {
        episodeTitle = episode.title;
      }
      
      console.log(`📺 Episode ${episode.videoId}:`);
      console.log(`  - Original video title: "${originalVideo?.title}"`);
      console.log(`  - N8N episode title: "${episode.title}"`);
      console.log(`  - Final title used: "${episodeTitle}"`);
      console.log(`  - Status: "${episode.status}"`);
      console.log(`  - PublishedAt: "${episode.publishedAt}"`);
      console.log(`  - ProcessedAt: "${episode.processedAt}"`);
      
      // For published date, prioritize the original video's publishedAt, then episode dates
      const publishedDate = (() => {
        // Try original video published date first (from YouTube)
        const originalPublishedAt = originalVideo?.publishedAt;
        // Then n8n episode dates
        const episodePublishedAt = episode.publishedAt || episode.processedAt;
        
        const dateToUse = originalPublishedAt || episodePublishedAt;
        console.log(`  - Date selected: "${dateToUse}" (from ${originalPublishedAt ? 'original video' : 'episode data'})`);
        
        if (dateToUse) {
          try {
            return new Date(dateToUse).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
          } catch (error) {
            console.warn(`📅 Date parsing error for episode ${episode.videoId}:`, error, 'Raw date:', dateToUse);
            return "Invalid Date";
          }
        }
        return "Unknown";
      })();
      
      return {
        id: `n8n_${episode.episodeId || episode.supabaseId}`,
        title: episodeTitle,
        status: (() => {
          // Enhanced status logic based on available data
          if (episode.error && episode.error !== 'null') {
            return "Failed";
          }
          
          // If we have a downloadUrl, the episode was successfully created
          if (episode.downloadUrl && episode.downloadUrl.includes('megaphone.fm')) {
            // Episode exists in Megaphone - likely Live or Processing final publishing
            return episode.status === 'published' ? "Live" : 
                   episode.status === 'scheduled' ? "Scheduled" : "Live";
          }
          
          // Map known statuses
          switch (episode.status) {
            case 'published': return "Live";
            case 'scheduled': return "Scheduled";
            case 'processing': return "Processing";
            case 'created': return "Live"; // If created with downloadUrl, it's essentially live
            default: return "Processing";
          }
        })(),
        publishedDate: publishedDate,
        format: "Audio",
        preRolls: 1,
        midRolls: 1,
        postRolls: 1,
        duration: episode.duration || "Unknown",
        plays: 0, // New episodes don't have plays yet
        downloads: 0, // New episodes don't have downloads yet
        fileUrl: episode.downloadUrl,
        downloadUrl: episode.downloadUrl,
        megaphoneEpisodeId: episode.megaphoneEpisodeId,
        megaphoneUid: episode.megaphoneUid,
        videoId: episode.videoId,
        error: episode.error && episode.error !== 'null' ? episode.error : null,
        source: 'n8n',
        rawData: episode, // Keep raw data for debugging
        isNew: true // Flag to indicate this is a newly created episode
      };
    });
  }

  // Enrich episodes with Megaphone API status data
  async enrichEpisodesWithMegaphoneStatus(episodes, podcastMegaphoneId) {
    if (!episodes || episodes.length === 0) return episodes;
    
    console.log(`🎧 Enriching ${episodes.length} episodes with Megaphone status`);
    
    // Prepare episodes with required IDs for Megaphone API
    const episodesWithIds = episodes.map(episode => ({
      ...episode,
      podcastId: podcastMegaphoneId,
      megaphoneEpisodeId: episode.megaphoneEpisodeId
    })).filter(episode => episode.megaphoneEpisodeId); // Only episodes with Megaphone IDs

    if (episodesWithIds.length === 0) {
      console.log('⚠️ No episodes with Megaphone IDs found');
      return episodes;
    }

    // Fetch status from Megaphone API
    const enrichedEpisodes = await megaphoneApiService.getMultipleEpisodeStatus(episodesWithIds);
    
    // Create a lookup map of enriched episodes
    const enrichedLookup = {};
    enrichedEpisodes.forEach(episode => {
      if (episode.megaphoneStatus) {
        enrichedLookup[episode.id] = episode.megaphoneStatus;
      }
    });

    // Apply enriched status to all episodes
    return episodes.map(episode => {
      const megaphoneData = enrichedLookup[episode.id];
      if (megaphoneData) {
        return {
          ...episode,
          status: megaphoneData.status || episode.status,
          publishedDate: megaphoneData.publishedAt ? 
            new Date(megaphoneData.publishedAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            }) : episode.publishedDate,
          megaphoneData: megaphoneData
        };
      }
      return episode;
    });
  }
}

export const episodeService = new EpisodeService();