import React, { useState, useEffect } from 'react';
import { useYouTubeSync } from '../hooks/useYouTubeSync';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
// Note: This component is deprecated - GoogleAuth.jsx handles the full OAuth flow

const YOUTUBE_SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';
const CLIENT_ID = '678018511336-jgd34uakj7vika3m6nvf028ekcfu2ucf.apps.googleusercontent.com';

function startYouTubeOAuth() {
  const redirectUri = window.location.origin + '/connect-youtube';
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(YOUTUBE_SCOPES)}&include_granted_scopes=true&prompt=consent`;
  window.location.href = url;
}

function extractTokenFromUrl() {
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    return params.get('access_token');
  }
  return null;
}

export default function YouTubeConnect({ onConnected }) {
  const navigate = useNavigate();
  const { loading, error, channel, connectYouTube, status } = useYouTubeSync();
  const [connected, setConnected] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [creatingPodcast, setCreatingPodcast] = useState(false);
  const [creationError, setCreationError] = useState(null);
  const [megaphoneStatus, setMegaphoneStatus] = useState(null);

  // 1. If podcastId exists, redirect to dashboard
  useEffect(() => {
    const podcastId = localStorage.getItem('podcastId');
    if (podcastId) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // 2. On mount, check for OAuth redirect and test Megaphone connection
  useEffect(() => {
    const token = extractTokenFromUrl();
    if (token) {
      localStorage.setItem('google_token', token);
      window.location.hash = '';
      toast.success('YouTube authentication successful!');
    }
    
    // Mock megaphone status for backward compatibility
    setMegaphoneStatus({ connected: true, message: 'Using n8n workflows' });
    
    setTokenChecked(true);
  }, []);

  useEffect(() => {
    if (channel && channel.id) setConnected(true);
  }, [channel]);

  // 3. Enhanced connect handler with better error handling and feedback
  const handleConnect = async () => {
    setCreationError(null);
    setCreatingPodcast(false);
    
    let accessToken = localStorage.getItem('google_token');
    if (!accessToken) {
      toast.info('Redirecting to Google for YouTube access...');
      startYouTubeOAuth();
      return;
    }
    
    setCreatingPodcast(true);
    toast.info('Connecting to your YouTube channel...');
    
    try {
      const result = await connectYouTube(accessToken);
      
      if (result && result.success) {
        // Store all relevant data
        if (result.podcastId) {
          localStorage.setItem('podcastId', result.podcastId);
        }
        if (result.channel) {
          localStorage.setItem('channelData', JSON.stringify(result.channel));
        }
        
        setCreatingPodcast(false);
        
        // Show success message based on what was accomplished
        if (result.podcastCreated) {
          toast.success(`🎉 Podcast created! Found ${result.videos?.length || 0} videos to sync.`);
        } else {
          toast.success(`✅ YouTube channel connected! Found ${result.videos?.length || 0} videos.`);
        }
        
        // Call the onConnected callback
        if (onConnected) onConnected();
        
        // Navigate to dashboard
        navigate('/dashboard', { replace: true });
        return;
        
      } else {
        throw new Error('Connection failed - no valid result returned');
      }
      
    } catch (err) {
      console.error('YouTube connection error:', err);
      const errorMessage = err.message || 'Failed to connect YouTube channel';
      setCreationError(errorMessage);
      setCreatingPodcast(false);
      toast.error(errorMessage);
    }
  };

  if (!tokenChecked) {
    return null; // Wait for token check
  }

  if (!tokenChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg px-8 py-10 w-full max-w-lg flex flex-col items-center">
        <div className="text-center mb-6">
          <span className="text-3xl font-bold text-red-500 mb-2 block">🎥 YouTube</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect your YouTube Channel</h2>
          <p className="text-gray-600 text-sm">We'll create a podcast from your YouTube videos</p>
        </div>
        
        {/* Status Messages */}
        {creatingPodcast && (
          <div className="w-full mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
              <div>
                <div className="font-semibold text-blue-800">Setting up your podcast...</div>
                <div className="text-blue-600 text-sm">{status || 'Please wait...'}</div>
              </div>
            </div>
          </div>
        )}
        
        {connected && channel && (
          <div className="w-full mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-800 font-semibold">✅ Connected to</div>
            <div className="text-green-700 font-bold">{channel.title}</div>
            {channel.subscriberCount && (
              <div className="text-green-600 text-sm">{channel.subscriberCount} subscribers</div>
            )}
          </div>
        )}
        
        {/* Connection Button */}
        {!connected && (
          <button
            onClick={handleConnect}
            disabled={loading || creatingPodcast}
            className={
              `w-full px-6 py-3 rounded-lg font-semibold text-lg transition-colors mb-4 ${
                loading || creatingPodcast 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`
            }
          >
            {loading ? 'Connecting...' : creatingPodcast ? 'Creating Podcast...' : 'Connect YouTube'}
          </button>
        )}
        
        {/* Error Messages */}
        {(error || creationError) && (
          <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div className="text-red-800 font-semibold">❌ Error</div>
            <div className="text-red-700 text-sm">{error || creationError}</div>
          </div>
        )}
        
        {/* Megaphone Status */}
        {megaphoneStatus && !megaphoneStatus.connected && megaphoneStatus.message.includes('No API token') && (
          <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800 text-sm">
              ⚠️ Running in development mode - podcasts will be mocked
            </div>
          </div>
        )}
        
        {/* Help Text */}
        <div className="text-center text-gray-500 text-xs mt-4">
          By connecting, you agree to let PodPay access your YouTube channel data
          <br />to create and manage your podcast.
        </div>
      </div>
    </div>
  );
} 