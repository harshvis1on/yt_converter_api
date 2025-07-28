import { useState, useEffect } from 'react';
import { getUserPodcasts } from '../services/supabase';
import { Podcast } from '../types/podcast';
import { UserInfo } from '../types/user';

export function usePodcastData(userInfo: UserInfo | null) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userInfo?.id) {
      setLoading(false);
      return;
    }

    const fetchPodcasts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🎙️ Fetching podcasts for user:', userInfo.id);
        const userPodcasts = await getUserPodcasts(userInfo.id);
        
        setPodcasts(userPodcasts);
        
        // Set the first podcast as current if available
        if (userPodcasts.length > 0) {
          setCurrentPodcast(userPodcasts[0]);
          // Also store in localStorage for other components
          localStorage.setItem('currentPodcast', JSON.stringify(userPodcasts[0]));
        }
        
        console.log('✅ Podcasts loaded:', userPodcasts.length);
      } catch (err) {
        console.error('❌ Failed to fetch podcasts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch podcasts');
      } finally {
        setLoading(false);
      }
    };

    fetchPodcasts();

    // Auto-refresh podcast data every 2 minutes
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing podcast data...');
      fetchPodcasts();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(refreshInterval);
  }, [userInfo?.id]);

  const refreshPodcasts = async () => {
    if (!userInfo?.id) return;
    
    try {
      setLoading(true);
      const userPodcasts = await getUserPodcasts(userInfo.id);
      setPodcasts(userPodcasts);
      
      if (userPodcasts.length > 0) {
        setCurrentPodcast(userPodcasts[0]);
        localStorage.setItem('currentPodcast', JSON.stringify(userPodcasts[0]));
      }
    } catch (err) {
      console.error('❌ Failed to refresh podcasts:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh podcasts');
    } finally {
      setLoading(false);
    }
  };

  return {
    podcasts,
    currentPodcast,
    loading,
    error,
    refreshPodcasts
  };
}