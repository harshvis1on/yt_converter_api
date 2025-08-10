import React, { useState, useEffect } from 'react';
import PodPayLayout from './PodPayLayout';
import { usePodcastData } from '../hooks/usePodcastData';
import { useYouTubeSync } from '../hooks/useYouTubeSync';
import { useEpisodes } from '../hooks/useEpisodes';
import { syncMegaphoneEpisodes } from '../services/n8nApi';
import { toast } from 'react-toastify';
import { 
  MoreHorizontal,
  Play,
  Eye,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';

export default function PodcastPage({ userInfo }) {
  // ALL HOOKS MUST BE CALLED FIRST - NO EXCEPTIONS
  const { podcasts, currentPodcast, loading, error } = usePodcastData(userInfo);
  const sync = useYouTubeSync();
  const megaphoneEpisodes = useEpisodes(currentPodcast?.megaphone_id);
  const [syncingMegaphone, setSyncingMegaphone] = useState(false);
  const [showYouTubeSync, setShowYouTubeSync] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedContentTypes, setSelectedContentTypes] = useState(['videos', 'shorts', 'livestreams']);
  const [isCreatingEpisodes, setIsCreatingEpisodes] = useState(false);
  const [creatingEpisodeCount, setCreatingEpisodeCount] = useState(0);
  
  // Show loading state (after all hooks are called)
  if (loading) {
    return (
      <PodPayLayout userInfo={userInfo}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading podcast data...</p>
          </div>
        </div>
      </PodPayLayout>
    );
  }
  
  // Use real episodes from Supabase (loaded via useEpisodes hook)
  console.log('🎙️ Podcast page data:', {
    currentPodcast,
    podcastImageUrl: currentPodcast?.image_url,
    megaphoneEpisodes,
    userInfo,
    episodeCount: megaphoneEpisodes?.episodes?.length || 0,
    youtubeSync: sync
  });
  
  // Debug YouTube sync data
  console.log('📺 YouTube sync data:', {
    videos: sync.videos,
    videosLength: sync.videos?.length,
    channel: sync.channel,
    loading: sync.loading,
    error: sync.error
  });

  // Transform YouTube sync episodes (episodes being created from YouTube videos)
  const youtubeEpisodes = sync.episodes?.map(episode => ({
    id: `youtube_${episode.id}`,
    title: episode.title || "Untitled Episode",
    status: episode.publishedToMegaphone ? "Published" : (episode.error ? "Failed" : "Processing"),
    publishedDate: episode.publishedAt ? new Date(episode.publishedAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }) : "Unknown",
    format: "Audio",
    preRolls: 1,
    midRolls: 1,
    postRolls: 1,
    youtubeUrl: episode.mp4Url,
    error: episode.error,
    source: 'youtube'
  })) || [];

  // Transform Megaphone episodes (published episodes from Megaphone)
  const publishedEpisodes = megaphoneEpisodes.episodes?.map(episode => ({
    id: `megaphone_${episode.id}`,
    title: episode.title || "Untitled Episode",
    status: episode.status === 'published' ? "Published" : "Draft",
    publishedDate: episode.publishedAt ? new Date(episode.publishedAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }) : "Unknown",
    format: "Audio",
    preRolls: 1,
    midRolls: 1,
    postRolls: 1,
    duration: episode.duration ? `${Math.floor(episode.duration / 60)}:${String(episode.duration % 60).padStart(2, '0')}` : "Unknown",
    plays: episode.playCount || 0,
    downloads: episode.downloadCount || 0,
    source: 'megaphone'
  })) || [];

  // Combine all episode sources, prioritizing published episodes first
  const allRealEpisodes = [...publishedEpisodes, ...youtubeEpisodes];
  
  // Use real episodes if available, otherwise show empty array (no mock data)
  const displayEpisodes = allRealEpisodes.length > 0 ? allRealEpisodes : [];

  // Helper functions for video type detection and styling
  const getVideoType = (video) => {
    if (!video) return 'videos';
    
    // Check if it's a short (typically under 60 seconds and vertical format)
    if (video.duration && parseDuration(video.duration) <= 60) {
      return 'shorts';
    }
    
    // Check if it's a livestream (has live broadcast content or was a premiere)
    if (video.liveBroadcastContent === 'live' || video.liveBroadcastContent === 'upcoming' || 
        video.wasLive || video.isLivestream) {
      return 'livestreams';
    }
    
    // Default to regular video
    return 'videos';
  };

  const getTypeInfo = (type) => {
    const typeMap = {
      videos: { 
        emoji: '📹', 
        label: 'Video', 
        bgColor: 'bg-blue-100', 
        textColor: 'text-blue-800' 
      },
      shorts: { 
        emoji: '⚡', 
        label: 'Short', 
        bgColor: 'bg-orange-100', 
        textColor: 'text-orange-800' 
      },
      livestreams: { 
        emoji: '🔴', 
        label: 'Live', 
        bgColor: 'bg-red-100', 
        textColor: 'text-red-800' 
      }
    };
    return typeMap[type] || typeMap.videos;
  };

  const parseDuration = (duration) => {
    if (!duration) return 0;
    // Parse YouTube duration format (PT1M30S) or simple formats
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseInt(match[3] || 0);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  };


  if (loading || megaphoneEpisodes.loading) {
    return (
      <PodPayLayout
        activeMenuItem="podcast"
        headerTitle="Podcast"
        userInfo={userInfo}
      >
        <div className="p-8 flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PodPayLayout>
    );
  }

  if (error) {
    return (
      <PodPayLayout
        activeMenuItem="podcast"
        headerTitle="Podcast"
        userInfo={userInfo}
      >
        <div className="p-8">
          <div className="podpay-card border-l-4 border-l-red-500 bg-red-50">
            <p className="text-red-800">Error loading podcast: {error}</p>
            {megaphoneEpisodes.error && (
              <p className="text-red-700 mt-2">Episode loading error: {megaphoneEpisodes.error}</p>
            )}
          </div>
        </div>
      </PodPayLayout>
    );
  }

  // Use real podcast data with proper fallbacks
  const podcast = currentPodcast ? {
    ...currentPodcast,
    // Provide fallbacks for missing data
    summary: currentPodcast.summary || `Welcome to ${currentPodcast.title || 'this podcast'}! A ${currentPodcast.primary_category || 'podcast'} show by ${currentPodcast.author || 'your host'}. This podcast covers topics in ${currentPodcast.primary_category?.toLowerCase() || 'various subjects'} and is presented in ${currentPodcast.language === 'es' ? 'Spanish' : 'English'}. ${currentPodcast.explicit ? 'This content may contain explicit material.' : 'This is family-friendly content.'}\n\nNew episodes are regularly added to keep you informed and entertained. Subscribe to stay updated with the latest content!`,
    subtitle: currentPodcast.subtitle || `${currentPodcast.title || 'Podcast'} - ${currentPodcast.author || 'Your Name'}`,
    primary_category: currentPodcast.primary_category || "Technology",
    distribution_type: currentPodcast.distribution_type || currentPodcast.distributionType || 'audio'
  } : {
    title: "No Podcast Found",
    image_url: null,
    primary_category: "Unknown",
    summary: "No podcast data available. Please create a podcast first through the onboarding process.",
    author: "Unknown",
    subtitle: "Please create a podcast",
    distribution_type: "audio"
  };

  // Get description text - use summary (already has fallback built-in)
  const podcastDescription = podcast.summary;

  // Get categories - only real categories from the podcast
  const categories = [
    podcast.primary_category,
    podcast.secondary_category
  ].filter(Boolean); // Remove null/undefined values

  return (
    <PodPayLayout
      activeMenuItem="podcast"
      headerTitle="Podcast Details"
      headerSubtitle="Podcast"
      userInfo={userInfo}
    >
      <div className="p-8 space-y-8">
        {/* Podcast Header */}
        <div className="flex items-start space-x-8">
          {/* Podcast Artwork */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 rounded-2xl shadow-lg overflow-hidden">
              {podcast.image_url ? (
                <img 
                  src={podcast.image_url} 
                  alt={podcast.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to gradient if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white"
                style={{ display: podcast.image_url ? 'none' : 'flex' }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🎙️</div>
                  <div className="text-lg font-bold">{podcast.title?.split(' ')[0] || 'Podcast'}</div>
                  <div className="text-sm opacity-80">{podcast.primary_category}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Podcast Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-4xl font-bold text-gray-900">
                {podcast.title}
              </h1>
              <button
                onClick={() => setShowYouTubeSync(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Sync Videos
              </button>
            </div>
            
            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-4">
              {podcast.subtitle}
            </p>
            
            {/* Category Tags */}
            <div className="flex items-center space-x-3 mb-6 flex-wrap">
              {categories.map((category, index) => (
                <span key={index} className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-700 border">
                  {category}
                </span>
              ))}
              {/* Show additional metadata as tags */}
              {podcast.language && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-700 border border-blue-200">
                  {podcast.language.toUpperCase()}
                </span>
              )}
              {/* Podcast Format Preference */}
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-purple-100 text-purple-700 border border-purple-200">
                {(() => {
                  const format = podcast.distribution_type || 'audio';
                  if (format === 'video') return '📹 Video';
                  if (format === 'audio') return '🎧 Audio';
                  if (format === 'both' || format === 'mixed') return '🎬 Mixed';
                  return '🎧 Audio'; // Default fallback
                })()}
              </span>
              {podcast.explicit && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-red-100 text-red-700 border border-red-200">
                  Explicit
                </span>
              )}
              {podcast.podcast_type && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-green-100 text-green-700 border border-green-200">
                  {podcast.podcast_type}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="space-y-4 text-gray-600 leading-relaxed max-w-4xl">
              {podcastDescription.split('\n\n').map((paragraph, index) => (
                <p key={index}>
                  {paragraph}
                </p>
              ))}
            </div>


            {/* RSS Feed - Copyable */}
            {podcast.feed_url && (
              <div className="mt-6">
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-gray-500 text-sm block mb-1">RSS Feed</span>
                      <code className="text-sm text-gray-700 break-all">{podcast.feed_url}</code>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(podcast.feed_url);
                        toast.success('RSS feed URL copied to clipboard!');
                      }}
                      className="ml-3 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm transition-colors flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Episodes Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Episodes <span className="text-gray-500 font-normal">({displayEpisodes.length})</span>
            </h2>
            
            {/* Episode Creation Status */}
            {isCreatingEpisodes && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Creating Episodes</h4>
                    <p className="text-sm text-blue-700 mb-3">Converting your selected YouTube videos into podcast episodes...</p>
                    
                    {/* Progress Info */}
                    <div className="bg-white bg-opacity-60 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-blue-800 font-medium">Processing {creatingEpisodeCount} videos</span>
                        <span className="text-blue-600">⏱️ This may take 2-3 minutes</span>
                      </div>
                      
                      {/* Animated progress bar */}
                      <div className="w-full bg-blue-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{width: '60%'}}></div>
                      </div>
                      
                      <div className="text-xs text-blue-600 space-y-1">
                        <div>✓ Analyzing video content</div>
                        <div>✓ Converting to audio format</div>
                        <div className="text-blue-500">⏳ Publishing to Megaphone...</div>
                        <div className="text-blue-400">⏳ Saving episode data...</div>
                      </div>
                    </div>
                    
                    {/* Keep working notice */}
                    <div className="mt-3 p-2 bg-blue-100 rounded-md">
                      <p className="text-xs text-blue-700 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        You can continue using the app while episodes are being created
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Recently Created Episodes Success */}
            {sync.episodes && sync.episodes.length > 0 && sync.done && !isCreatingEpisodes && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="mr-3 h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-green-900">Episodes Created Successfully</h4>
                    <p className="text-sm text-green-700">
                      {sync.episodes.filter(ep => ep.publishedToMegaphone).length} episodes created from your YouTube videos
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Episodes Table or Empty State */}
          {displayEpisodes.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                        <span>Episodes</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Published Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Format
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ad Spots
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayEpisodes.map((episode, index) => (
                    <tr key={episode.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{episode.title}</span>
                              {episode.youtubeUrl && (
                                <a 
                                  href={episode.youtubeUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-red-600 hover:text-red-700"
                                  title="View original YouTube video"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {episode.downloadUrl && (
                                <a 
                                  href={episode.downloadUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-700"
                                  title="Download episode audio"
                                >
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l-3-3z" />
                                  </svg>
                                </a>
                              )}
                            </div>
                            {episode.videoId && (
                              <div className="text-xs text-gray-500 mt-1">
                                Video ID: {episode.videoId}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          episode.status === 'Published' ? 'bg-green-100 text-green-800' :
                          episode.status === 'Created' ? 'bg-blue-100 text-blue-800' :
                          episode.status === 'Failed' ? 'bg-red-100 text-red-800' :
                          episode.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          • {episode.status}
                        </span>
                        {episode.isNew && (
                          <div className="text-xs text-blue-600 mt-1">
                            ✨ Just created
                          </div>
                        )}
                        {episode.error && (
                          <div className="text-xs text-red-600 mt-1" title={episode.error}>
                            Error occurred
                          </div>
                        )}
                        {episode.megaphoneUid && (
                          <div className="text-xs text-gray-500 mt-1" title="Megaphone UID">
                            ID: {episode.megaphoneUid}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {episode.publishedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {episode.format}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Pre: {episode.preRolls}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Mid: {episode.midRolls}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Post: {episode.postRolls}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <button className="p-1 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="text-4xl">🎙️</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No episodes yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Your podcast is set up and ready to go! Start creating episodes by syncing from your YouTube channel or uploading audio files.
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setShowYouTubeSync(true)}
                  disabled={isCreatingEpisodes}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreatingEpisodes ? 'Creating Episodes...' : 'Sync YouTube Videos'}
                </button>
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Upload Episode
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* YouTube Sync Modal */}
      {showYouTubeSync && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Sync YouTube Videos</h3>
              <button
                onClick={() => setShowYouTubeSync(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <p className="text-gray-600">
                Select YouTube content from your channel to convert into podcast episodes.
              </p>
              
              {/* Content Type Selection */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Content Types to Sync</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'videos', label: '📹 Videos', description: 'Regular videos from your channel' },
                    { key: 'shorts', label: '⚡ Shorts', description: 'Short-form content under 60 seconds' },
                    { key: 'livestreams', label: '🔴 Livestreams', description: 'Live streams and premieres' }
                  ].map((type) => (
                    <label key={type.key} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedContentTypes.includes(type.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContentTypes([...selectedContentTypes, type.key]);
                          } else {
                            setSelectedContentTypes(selectedContentTypes.filter(t => t !== type.key));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Content Summary and Select All */}
              {sync.videos && sync.videos.length > 0 && (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">Available:</span> {
                        ['videos', 'shorts', 'livestreams'].map(type => {
                          const count = sync.videos.filter(v => getVideoType(v) === type).length;
                          const typeInfo = getTypeInfo(type);
                          return count > 0 ? `${typeInfo.emoji} ${count} ${typeInfo.label}${count !== 1 ? 's' : ''}` : null;
                        }).filter(Boolean).join(' • ') || 'No content available'
                      }
                    </div>
                  </div>
                  
                  {/* Select All Controls */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-700">
                      {sync.selectedVideos?.length || 0} video{(sync.selectedVideos?.length || 0) !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const filteredVideos = sync.videos.filter(video => {
                            const videoType = getVideoType(video);
                            return selectedContentTypes.includes(videoType);
                          });
                          sync.selectAllVideos(filteredVideos);
                        }}
                        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => sync.deselectAllVideos()}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* YouTube Videos List */}
              {sync.videos && sync.videos.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sync.videos
                    .filter(video => {
                      // Filter based on selected content types
                      const videoType = getVideoType(video);
                      return selectedContentTypes.includes(videoType);
                    })
                    .map((video) => {
                      const videoType = getVideoType(video);
                      const typeInfo = getTypeInfo(videoType);
                      const videoId = video.id || video.videoId;
                      const isSelected = sync.isVideoSelected(videoId);
                      
                      return (
                        <div key={videoId} className={`flex items-center space-x-4 p-4 border rounded-lg transition-colors ${
                          isSelected ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              console.log('📹 Video checkbox changed:', {
                                videoId,
                                videoTitle: video.title,
                                checked: e.target.checked
                              });
                              
                              if (e.target.checked) {
                                console.log('➕ Selecting video:', videoId);
                                sync.selectVideo(videoId);
                              } else {
                                console.log('➖ Deselecting video:', videoId);
                                sync.deselectVideo(videoId);
                              }
                              
                              // Log current selection state
                              setTimeout(() => {
                                console.log('📊 Current selection after change:', {
                                  selectedVideos: sync.selectedVideos,
                                  selectedCount: sync.selectedVideos?.length || 0
                                });
                              }, 100);
                            }}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <div className="relative">
                            <img 
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-20 h-12 object-cover rounded"
                            />
                            <span className="absolute -top-1 -right-1 text-xs px-1 py-0.5 bg-gray-900 text-white rounded text-[10px]">
                              {typeInfo.emoji}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">{video.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.textColor}`}>
                                {typeInfo.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{video.duration} • {video.publishedAt}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">📺</div>
                  <p className="text-gray-600 mb-4">
                    {selectedContentTypes.length === 0 
                      ? 'Please select at least one content type above'
                      : sync.videos && sync.videos.length > 0
                        ? 'No videos match the selected content types'
                        : sync.error
                          ? `Error: ${sync.error}`
                          : 'No YouTube videos found'
                    }
                  </p>
                  {(!sync.videos || sync.videos.length === 0) && selectedContentTypes.length > 0 && (
                    <div className="space-y-3">
                      <button
                        onClick={async () => {
                          console.log('🔄 Manually refreshing YouTube videos...');
                          await sync.connectYouTube();
                        }}
                        disabled={sync.loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {sync.loading ? 'Loading...' : 'Load YouTube Videos'}
                      </button>
                      {sync.error && sync.error.includes('authentication expired') && (
                        <div className="text-center">
                          <p className="text-sm text-orange-600 mb-2">Your Google authentication has expired.</p>
                          <button
                            onClick={() => {
                              // Clear auth data and redirect to sign in
                              localStorage.clear();
                              window.location.href = '/auth';
                            }}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                          >
                            Sign In Again
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowYouTubeSync(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    console.log('🔘 Create Episodes button clicked!');
                    console.log('📋 Button state check:', {
                      selectedVideos: sync.selectedVideos,
                      selectedCount: sync.selectedVideos?.length || 0,
                      isDisabled: !sync.selectedVideos || sync.selectedVideos.length === 0
                    });
                    
                    if (!sync.selectedVideos || sync.selectedVideos.length === 0) {
                      console.warn('⚠️ Button should be disabled - no videos selected');
                      toast.warning('Please select at least one video to create episodes');
                      return;
                    }
                    
                    console.log('✅ Button enabled, calling sync.createEpisodes()');
                    
                    // Store the count and close the modal immediately
                    const episodeCount = sync.selectedVideos?.length || 0;
                    setCreatingEpisodeCount(episodeCount);
                    setShowYouTubeSync(false);
                    setIsCreatingEpisodes(true);
                    
                    // Show immediate feedback
                    toast.info(`Starting creation of ${episodeCount} episodes...`);
                    
                    try {
                      const result = await sync.createEpisodes();
                      console.log('🎉 Episode creation result:', result);
                      
                      // Add the newly created episodes to the display immediately
                      // Handle different response structures - check for 'episodes' or 'results'
                      const episodeData = result.episodes || result.results || [];
                      
                      if (result && result.success && episodeData.length > 0) {
                        console.log('📺 Adding n8n episodes to display:', episodeData);
                        // Pass the original video data for better episode titles
                        const selectedVideoObjects = sync.videos?.filter(v => {
                          const videoId = v.id || v.videoId;
                          return sync.selectedVideos?.includes(videoId);
                        }) || [];
                        megaphoneEpisodes.addN8nEpisodes(episodeData, selectedVideoObjects);
                        toast.success(`${episodeData.length} episodes created successfully!`);
                      } else if (result && result.success) {
                        toast.success('Episodes created successfully!');
                      } else {
                        console.warn('⚠️ Unexpected episode creation result:', result);
                        toast.success('Episodes created - refreshing list...');
                      }
                      
                      // Refresh episodes after creation to get persisted data
                      setTimeout(() => {
                        console.log('🔄 Refreshing episodes after creation...');
                        megaphoneEpisodes.refreshEpisodes();
                        setIsCreatingEpisodes(false);
                        setCreatingEpisodeCount(0);
                      }, 3000);
                    } catch (error) {
                      console.error('❌ Failed to create episodes:', error);
                      
                      // Better error messages based on error type
                      if (error.message.includes('longer than expected')) {
                        toast.warning('Episode creation is taking longer than usual. Please check back in a few minutes - your episodes may still be processing.');
                      } else if (error.message.includes('Unable to connect')) {
                        toast.error('Connection issue detected. Please check your internet connection and try again.');
                      } else if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
                        toast.error('Unable to connect to the workflow service. Please try again or contact support if the issue persists.');
                      } else {
                        toast.error(`Failed to create episodes: ${error.message}`);
                      }
                      
                      setIsCreatingEpisodes(false);
                      setCreatingEpisodeCount(0);
                    }
                  }}
                  disabled={!sync.selectedVideos || sync.selectedVideos.length === 0 || isCreatingEpisodes}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {isCreatingEpisodes ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    `Create Episodes (${sync.selectedVideos?.length || 0})`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Episode Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Upload Episode</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🎧</div>
              <p className="text-gray-600 mb-4">Audio file upload coming soon!</p>
              <p className="text-sm text-gray-500">For now, use the YouTube sync to create episodes from your videos.</p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PodPayLayout>
  );
}