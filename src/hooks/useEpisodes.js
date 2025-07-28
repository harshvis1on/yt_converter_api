import { useState, useEffect } from 'react';
import { episodeService } from '../services/episodeService';

export function useEpisodes(megaphoneId) {
  const [state, setState] = useState({
    loading: false,
    error: null,
    episodes: [],
    totalCount: 0
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
        const transformedEpisodes = episodeService.transformEpisodeData(result.episodes);
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

  const refreshEpisodes = () => {
    if (megaphoneId) {
      loadEpisodes();
    }
  };

  return {
    ...state,
    refreshEpisodes
  };
}