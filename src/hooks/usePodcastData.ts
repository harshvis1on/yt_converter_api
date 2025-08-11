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
    // First check localStorage for existing podcast data
    const storedPodcast = localStorage.getItem('currentPodcast');
    if (storedPodcast && !currentPodcast) {
      try {
        const parsedPodcast = JSON.parse(storedPodcast);
        setCurrentPodcast(parsedPodcast);
        console.log('📱 Restored podcast from localStorage:', parsedPodcast.title);
      } catch (error) {
        console.error('Error parsing stored podcast:', error);
        // Clear corrupted data
        localStorage.removeItem('currentPodcast');
      }
    }

    if (!userInfo?.id) {
      setLoading(false);
      return;
    }

    const fetchPodcasts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🎙️ Fetching podcasts for user:', userInfo.id);
        
        // First, sync podcast data from Megaphone to ensure we have fresh data
        try {
          const { syncPodcastDataFromMegaphone } = await import('../services/n8nApi');
          console.log('🔄 Syncing podcast data from Megaphone before fetching...');
          await syncPodcastDataFromMegaphone(userInfo.id);
          console.log('✅ Podcast data synced from Megaphone');
        } catch (syncError) {
          console.warn('⚠️ Failed to sync from Megaphone (non-critical):', syncError);
        }
        
        const userPodcasts = await getUserPodcasts(userInfo.id);
        
        setPodcasts(userPodcasts);
        
        // Set the first podcast as current if available
        if (userPodcasts.length > 0) {
          setCurrentPodcast(userPodcasts[0]);
          // Also store in localStorage for other components
          localStorage.setItem('currentPodcast', JSON.stringify(userPodcasts[0]));
        } else if (!storedPodcast) {
          // Only clear if there's no stored podcast data
          setCurrentPodcast(null);
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