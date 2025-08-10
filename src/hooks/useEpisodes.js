import { useState, useEffect } from 'react';
import { episodeService } from '../services/episodeService';

export function useEpisodes(megaphoneId) {
  const [state, setState] = useState({
    loading: false,
    error: null,
    episodes: [],
    totalCount: 0,
    n8nEpisodes: [] // Track n8n episodes separately
  });

  useEffect(() => {
    if (megaphoneId) {
      loadEpisodes();
    }
  }, [megaphoneId]);

  const loadEpisodes = async () => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));
      
      console.log('📻 Loading episodes from Supabase for Megaphone ID:', megaphoneId);
      
      // First get the podcast ID from the megaphone ID
      const podcastId = await episodeService.getPodcastIdFromMegaphoneId(megaphoneId);
      if (!podcastId) {
        throw new Error('Podcast not found in database');
      }

      // Then get episodes from Supabase
      const result = await episodeService.getEpisodesFromSupabase(podcastId);
      
      if (result.success) {
        console.log('📊 Raw episodes from Supabase:', result.episodes);
        let transformedEpisodes = episodeService.transformEpisodeData(result.episodes);
        console.log('🔄 Transformed episodes:', transformedEpisodes.map(ep => ({ 
          id: ep.id, 
          title: ep.title, 
          status: ep.status, 
          source: ep.source 
        })));
        
        // TODO: Enrich episodes with Megaphone API status when n8n proxy is ready
        // For now, skip Megaphone API calls due to CORS restrictions
        console.log('⚠️ Megaphone API enrichment temporarily disabled due to CORS restrictions');
        console.log('💡 Use n8n proxy workflow to enable real-time status updates');
        
        setState(s => ({ 
          ...s, 
          episodes: transformedEpisodes, 
          totalCount: result.totalCount,
          loading: false 
        }));
        console.log(`✅ Loaded ${transformedEpisodes.length} episodes from Supabase`);
      } else {
        throw new Error(result.error || 'Failed to load episodes');
      }
    } catch (error) {
      console.error('❌ Failed to load episodes:', error);
      setState(s => ({ 
        ...s, 
        error: error.message, 
        loading: false,
        episodes: [],
        totalCount: 0
      }));
    }
  };

  const refreshEpisodes = async () => {
    if (megaphoneId) {
      await loadEpisodes();
    }
  };

  // Add newly created episodes from n8n workflow results
  const addN8nEpisodes = (n8nResults, originalVideoData = null) => {
    console.log('📺 Adding n8n episodes to display:', n8nResults);
    
    if (!n8nResults || !Array.isArray(n8nResults)) {
      console.warn('Invalid n8n results provided:', n8nResults);
      return;
    }

    // Transform n8n data for display, optionally with original video data for better titles
    const transformedN8nEpisodes = episodeService.transformN8nEpisodeData(n8nResults, originalVideoData);
    
    setState(s => {
      // Remove any existing n8n episodes with same IDs to avoid duplicates
      const existingEpisodes = s.episodes.filter(ep => ep.source !== 'n8n');
      const combinedEpisodes = [...transformedN8nEpisodes, ...existingEpisodes];
      
      console.log(`✅ Added ${transformedN8nEpisodes.length} n8n episodes to display`);
      
      return {
        ...s,
        episodes: combinedEpisodes,
        n8nEpisodes: transformedN8nEpisodes,
        totalCount: combinedEpisodes.length
      };
    });

    // Refresh from Supabase after a delay to get the persisted data
    setTimeout(async () => {
      console.log('🔄 Refreshing episodes from Supabase after n8n creation...');
      console.log('📊 Current episodes before refresh:', transformedN8nEpisodes.map(ep => ({ id: ep.id, videoId: ep.videoId, source: ep.source })));
      
      // Store the video IDs of newly created episodes for comparison
      const newlyCreatedVideoIds = transformedN8nEpisodes.map(ep => ep.videoId);
      console.log('🎯 Newly created video IDs:', newlyCreatedVideoIds);
      
      // Clear all n8n episodes first
      setState(s => ({
        ...s,
        episodes: s.episodes.filter(ep => ep.source !== 'n8n'),
        n8nEpisodes: []
      }));
      
      // Then refresh from Supabase to get the permanent data
      await refreshEpisodes();
      console.log('✅ Removed temporary n8n episodes and refreshed from Supabase');
    }, 5000); // Increased to 5 seconds to give Supabase more time to sync
  };

  // Clear n8n episodes (when they've been persisted to Supabase)
  const clearN8nEpisodes = () => {
    setState(s => ({
      ...s,
      n8nEpisodes: [],
      episodes: s.episodes.filter(ep => ep.source !== 'n8n')
    }));
  };

  return {
    ...state,
    refreshEpisodes,
    addN8nEpisodes,
    clearN8nEpisodes
  };
}