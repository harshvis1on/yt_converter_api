import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function VideoSyncPanel({ sync, onEpisodesCreated }) {
  const { videos, episodes, loading, syncToMegaphone, isYouTubeConnected } = sync;
  const [selectedVideos, setSelectedVideos] = useState([]);

  const handleSelectAll = () => {
    if (selectedVideos.length === videos?.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(videos?.map(v => v.id) || []);
    }
  };

  const handleSelectVideo = (videoId) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleSync = async () => {
    if (!selectedVideos.length) {
      toast.warning('Please select videos to sync');
      return;
    }
    
    const videosToSync = videos?.filter(v => selectedVideos.includes(v.id)) || [];
    
    try {
      const result = await syncToMegaphone(videosToSync);
      
      // If episodes were created successfully, notify parent to refresh
      if (result?.success && onEpisodesCreated) {
        console.log('🔄 Episodes created, refreshing data...');
        onEpisodesCreated();
      }
    } catch (error) {
      console.error('Failed to sync videos:', error);
    }
  };

  if (!isYouTubeConnected || !videos?.length) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
        <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Available</h3>
        <p className="text-gray-600">Connect your YouTube channel to see available videos</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">YouTube Videos</h3>
            <p className="text-gray-600 text-sm">Select videos to convert to podcast episodes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {selectedVideos.length === videos?.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleSync}
              disabled={!selectedVideos.length || loading}
              className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors ${
                selectedVideos.length && !loading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin inline mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating Episodes...
                </>
              ) : (
                <>
                  <svg className="inline mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Episodes ({selectedVideos.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {videos?.map((video, index) => {
          const episode = episodes?.find(e => e.id === video.id);
          const isSelected = selectedVideos.includes(video.id);
          
          return (
            <div
              key={video.id}
              className={`p-4 border-b border-gray-100 last:border-b-0 ${
                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectVideo(video.id)}
                  className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                
                {video.thumbnail && (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-16 h-12 object-cover rounded flex-shrink-0"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                        {video.title}
                      </h4>
                      <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                        {video.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                        <a
                          href={`https://youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-indigo-600 hover:text-indigo-800"
                        >
                          <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View on YouTube
                        </a>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      {episode ? (
                        <div className="flex items-center">
                          {episode.publishedToMegaphone ? (
                            <>
                              <svg className="h-4 w-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-green-600 text-xs font-medium">Published</span>
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span className="text-red-600 text-xs font-medium">Failed</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Not synced</span>
                      )}
                    </div>
                  </div>
                  
                  {episode?.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      Error: {episode.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {videos?.length === 0 && (
        <div className="p-8 text-center">
          <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
          <p className="text-gray-600">No videos found in your YouTube channel</p>
        </div>
      )}
    </div>
  );
}