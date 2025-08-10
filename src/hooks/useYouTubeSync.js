import React, { useState, useCallback } from 'react';
import { createEpisodes } from '../services/n8nApi';
import { toast } from 'react-toastify';
import { safeGetItem } from '../utils/localStorage';


export function useYouTubeSync() {
  const [state, setState] = useState({
    loading: false,
    error: null,
    channel: null,
    podcastId: null,
    videos: [],
    episodes: [],
    progress: 0,
    total: 0,
    done: false,
    status: '',
    selectedVideos: [],
  });
  
  // Load data from localStorage on mount
  React.useEffect(() => {
    const channelData = safeGetItem('channelData');
    const videosData = safeGetItem('videosData', []);
    
    // Try multiple sources for podcast ID
    let podcastId = localStorage.getItem('podcastId');
    if (!podcastId) {
      const currentPodcast = safeGetItem('currentPodcast');
      podcastId = currentPodcast?.megaphone_id || currentPodcast?.id;
    }
    
    if (channelData || videosData?.length > 0 || podcastId) {
      setState(s => ({
        ...s,
        channel: channelData,
        videos: videosData,
        podcastId: podcastId || null
      }));
    }
  }, []);

  // Helper: is YouTube connected?
  const isYouTubeConnected = !!(state.channel && state.channel.id);

  // Connect YouTube data - re-fetch if not available
  const connectYouTube = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    
    try {
      // First check if data already exists in localStorage
      let channel = safeGetItem('channelData');
      let videos = safeGetItem('videosData', []);
      const podcastId = localStorage.getItem('podcastId');
      
      // If no YouTube data exists, we need to re-authenticate
      if (!channel || !videos || videos.length === 0) {
        console.log('🔄 No YouTube data found, need to re-authenticate...');
        
        // Check if we have a Google token
        const googleToken = localStorage.getItem('google_token');
        if (!googleToken) {
          throw new Error('No Google authentication found. Please sign in again.');
        }
        
        // Re-fetch YouTube data using existing token
        const userInfo = safeGetItem('user_info', {});
        if (!userInfo.id) {
          throw new Error('User information not found. Please sign in again.');
        }
        
        console.log('🔄 Re-fetching YouTube data with existing token...');
        const { syncYouTubeChannel } = await import('../services/n8nApi');
        const result = await syncYouTubeChannel(googleToken, userInfo.id);
        
        if (result && result.success) {
          // Store the fetched data
          localStorage.setItem('channelData', JSON.stringify(result.channel));
          localStorage.setItem('videosData', JSON.stringify(result.videos));
          
          channel = result.channel;
          videos = result.videos;
          
          console.log('✅ YouTube data re-fetched successfully');
        } else {
          // Check if it's a token expiry issue
          const errorMsg = result?.message || 'Failed to fetch YouTube data';
          if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || 
              errorMsg.includes('token') || errorMsg.includes('auth')) {
            throw new Error('Google authentication expired. Please sign out and sign in again to refresh your YouTube connection.');
          }
          throw new Error(errorMsg);
        }
      }
      
      // Try multiple sources for podcast ID - prioritize megaphone_id for API calls
      let finalPodcastId = podcastId || localStorage.getItem('podcastId');
      if (!finalPodcastId) {
        const currentPodcast = safeGetItem('currentPodcast');
        finalPodcastId = currentPodcast?.megaphone_id || currentPodcast?.id;
      }
      
      setState(s => ({ 
        ...s, 
        channel, 
        videos, 
        podcastId: finalPodcastId || null, 
        loading: false 
      }));
      
      return { channel, videos, podcastId, success: true };
      
    } catch (error) {
      console.error('❌ Failed to connect YouTube:', error);
      setState(s => ({ 
        ...s, 
        error: error.message, 
        loading: false 
      }));
      return { success: false, error: error.message };
    }
  }, []);

  // Create episodes using n8n workflow
  const syncToMegaphone = useCallback(async (videos) => {
    if (!videos || videos.length === 0) {
      toast.warning('No videos to sync');
      return;
    }
    
    setState(s => ({ 
      ...s, 
      loading: true, 
      progress: 0, 
      total: videos.length, 
      done: false, 
      episodes: [], 
      error: null, // Clear any previous errors
      status: 'Creating podcast episodes...' 
    }));
    
    // Try multiple sources for podcast ID - prioritize megaphone_id for API calls
    let podcastId = state.podcastId || localStorage.getItem('podcastId');
    if (!podcastId) {
      const currentPodcast = safeGetItem('currentPodcast');
      podcastId = currentPodcast?.megaphone_id || currentPodcast?.id;
    }
    
    const userInfo = safeGetItem('user_info', {});
    
    if (!podcastId) {
      setState(s => ({ ...s, error: 'No podcast ID found. Please ensure your podcast is properly set up.', loading: false }));
      return;
    }
    
    try {
      // Send full video objects with metadata instead of just IDs
      const videoIds = videos.map(v => v.id || v.videoId).filter(Boolean);
      const videoObjects = videos.map(v => ({
        videoId: v.id || v.videoId,
        title: v.title,
        description: v.description,
        publishedAt: v.publishedAt,
        thumbnail: v.thumbnail,
        duration: v.duration || null
      }));
      
      console.log('🎥 Creating episodes for videos:', videoIds);
      console.log('📊 Full video objects:', videoObjects);
      console.log('📋 Using podcast ID:', podcastId);
      console.log('👤 Using user ID:', userInfo.id);
      
      // Get user's podcast preference for audio/video from Supabase data
      // FORCE fresh data from database - clear localStorage first
      console.log('🧹 Clearing localStorage podcast data to force fresh fetch...');
      localStorage.removeItem('currentPodcast');
      
      let currentPodcast = {};
      
      console.log('🔄 FORCING fresh podcast data fetch from database...');
      console.log('🔍 Looking for podcast with megaphone_id:', podcastId);
      console.log('👤 User ID:', userInfo.id);
      
      try {
        const { getUserPodcasts } = await import('../services/supabase');
        const userPodcasts = await getUserPodcasts(userInfo.id);
        console.log('📊 All user podcasts from database:', userPodcasts);
        console.log('🔍 Raw podcast data with distribution_type:', userPodcasts.map(p => ({ 
          megaphone_id: p.megaphone_id, 
          distribution_type: p.distribution_type, 
          title: p.title 
        })));
        
        const freshPodcast = userPodcasts.find(p => p.megaphone_id === podcastId);
        console.log('🎯 Found matching podcast:', freshPodcast);
        
        if (freshPodcast) {
          console.log('📝 Fresh podcast distribution_type:', freshPodcast.distribution_type);
          console.log('📝 Fresh podcast object keys:', Object.keys(freshPodcast));
          currentPodcast = freshPodcast;
          localStorage.setItem('currentPodcast', JSON.stringify(freshPodcast));
          console.log('✅ Refreshed podcast data from database and updated localStorage');
        } else {
          console.error('❌ Podcast not found in database!');
          console.log('🔍 Available podcast IDs:', userPodcasts.map(p => p.megaphone_id));
          console.log('🔍 Looking for ID:', podcastId);
          // Fallback to first podcast if exact match not found
          if (userPodcasts.length > 0) {
            currentPodcast = userPodcasts[0];
            console.log('⚠️ Using first available podcast as fallback:', currentPodcast);
          }
        }
      } catch (error) {
        console.error('❌ FAILED to refresh podcast data:', error);
      }
      
      console.log('📊 Full currentPodcast object:', currentPodcast);
      console.log('🔍 Checking distribution_type field:', currentPodcast.distribution_type);
      console.log('🔍 Checking distributionType field:', currentPodcast.distributionType);
      
      const distributionType = currentPodcast.distribution_type || currentPodcast.distributionType || 'audio'; // Check both field names, default to audio
      
      console.log('🎧 Final distribution type used:', distributionType);
      console.log('❗ ALERT: If this still shows "audio", check console for database logs above!');
      
      // TEMPORARY MANUAL OVERRIDE FOR TESTING
      const FORCE_VIDEO_MODE = true;
      if (FORCE_VIDEO_MODE) {
        console.log('🔥 FORCING distribution type to "video" for testing!');
        const finalDistributionType = 'video';
        console.log('✅ Overridden distribution type:', finalDistributionType);
      } else {
        const finalDistributionType = distributionType;
      }
      
      // Use finalDistributionType instead of distributionType
      const finalDistributionType = FORCE_VIDEO_MODE ? 'video' : distributionType;
      
      // Call n8n episode creation workflow with full video data
      console.log('🚀 About to call n8n createEpisodes API with full video data');
      console.log('🎯 Using finalDistributionType:', finalDistributionType);
      const result = await createEpisodes(podcastId, videoObjects, userInfo.id, finalDistributionType);
      
      console.log('📤 createEpisodes result:', result);
      
      if (result && result.success) {
        const { successful, failed, total } = result.summary || { successful: 0, failed: 0, total: 0 };
        
        // Handle different response structures - n8n can return 'episodes' or 'results'
        const episodeData = result.episodes || result.results || [];
        console.log('🔍 Episode data found:', episodeData);
        
        // Update state with episode results
        const episodes = episodeData.map(r => ({
          id: r.videoId,
          title: r.title,
          publishedAt: r.publishedAt || new Date().toISOString(),
          mp4Url: `https://youtube.com/watch?v=${r.videoId}`,
          publishedToMegaphone: r.status === 'created',
          error: r.status === 'failed' ? 'Episode creation failed' : undefined
        }));
        
        setState(s => ({ 
          ...s, 
          episodes, 
          progress: total, 
          total, 
          done: true, 
          loading: false, 
          status: `Sync complete! ${successful} successful, ${failed} failed` 
        }));
        
        // Return the result with consistent structure
        return {
          ...result,
          episodes: episodeData, // Ensure episodes are accessible
          results: episodeData   // Keep both for backward compatibility
        };
      } else {
        const errorMsg = result?.error || result?.message || 'Episode creation failed - no response from server';
        console.error('❌ Episode creation failed:', result);
        throw new Error(errorMsg);
      }
      
    } catch (err) {
      console.error('Episode creation process failed:', err);
      setState(s => ({ 
        ...s, 
        error: err.message, 
        loading: false, 
        status: '', 
        episodes: [], // Clear any partial episodes on error
        done: false 
      }));
      toast.error('Episode creation failed: ' + err.message);
      throw err;
    }
  }, [state.podcastId]);

  // Video selection methods
  const selectVideo = useCallback((videoId) => {
    setState(s => {
      const currentSelected = s.selectedVideos || [];
      if (currentSelected.includes(videoId)) {
        return s; // Already selected, no change
      }
      return {
        ...s,
        selectedVideos: [...currentSelected, videoId]
      };
    });
  }, []);

  const deselectVideo = useCallback((videoId) => {
    setState(s => {
      const currentSelected = s.selectedVideos || [];
      if (!currentSelected.includes(videoId)) {
        return s; // Not selected, no change
      }
      return {
        ...s,
        selectedVideos: currentSelected.filter(id => id !== videoId)
      };
    });
  }, []);

  const selectAllVideos = useCallback((videos) => {
    const videoIds = videos.map(v => v.id || v.videoId).filter(Boolean);
    setState(s => {
      const currentSelected = s.selectedVideos || [];
      const newSelected = [...new Set([...currentSelected, ...videoIds])];
      if (newSelected.length === currentSelected.length) {
        return s; // No change
      }
      return {
        ...s,
        selectedVideos: newSelected
      };
    });
  }, []);

  const deselectAllVideos = useCallback(() => {
    setState(s => {
      if (!s.selectedVideos || s.selectedVideos.length === 0) {
        return s; // Already empty, no change
      }
      return {
        ...s,
        selectedVideos: []
      };
    });
  }, []);

  const isVideoSelected = useCallback((videoId) => {
    return (state.selectedVideos || []).includes(videoId);
  }, [state.selectedVideos]);

  const handleCreateEpisodes = useCallback(async () => {
    console.log('🎬 createEpisodes called in hook');
    console.log('📊 Current state:', {
      videos: state.videos?.length || 0,
      selectedVideos: state.selectedVideos?.length || 0,
      selectedVideoIds: state.selectedVideos,
      loading: state.loading
    });
    
    // Prevent duplicate calls if already loading
    if (state.loading) {
      console.log('⏳ Episode creation already in progress, skipping duplicate call');
      return;
    }
    
    const selectedVideoObjects = state.videos.filter(v => {
      const videoId = v.id || v.videoId;
      return state.selectedVideos.includes(videoId);
    });
    
    console.log('🎯 Filtered selectedVideoObjects:', selectedVideoObjects);
    
    if (selectedVideoObjects.length === 0) {
      console.warn('⚠️ No videos selected for episode creation');
      throw new Error('No videos selected for episode creation');
    }
    
    console.log('📞 Calling syncToMegaphone with', selectedVideoObjects.length, 'videos');
    return await syncToMegaphone(selectedVideoObjects);
  }, [state.videos, state.selectedVideos, state.loading, syncToMegaphone]);

  // Refresh data from localStorage
  const refreshData = useCallback(() => {
    const channel = safeGetItem('channelData');
    const videos = safeGetItem('videosData', []);
    
    // Try multiple sources for podcast ID
    let podcastId = localStorage.getItem('podcastId');
    if (!podcastId) {
      const currentPodcast = safeGetItem('currentPodcast');
      podcastId = currentPodcast?.megaphone_id || currentPodcast?.id;
    }
    
    setState(s => ({
      ...s,
      channel,
      videos,
      podcastId: podcastId || null
    }));
  }, []);

  return {
    ...state,
    connectYouTube,
    syncToMegaphone,
    isYouTubeConnected,
    refreshData,
    selectVideo,
    deselectVideo,
    selectAllVideos,
    deselectAllVideos,
    isVideoSelected,
    createEpisodes: handleCreateEpisodes,
  };
} 