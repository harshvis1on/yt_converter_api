import React from 'react';
import VideoSyncPanel from './VideoSyncPanel';

export default function Dashboard({ sync, userInfo }) {

  // Get stored channel data and refresh sync data if needed
  const channelData = React.useMemo(() => {
    const stored = localStorage.getItem('channelData');
    return stored ? JSON.parse(stored) : null;
  }, []);
  
  // Refresh sync data on mount to ensure we have the latest data
  React.useEffect(() => {
    if (sync.refreshData) {
      sync.refreshData();
    }
  }, [sync.refreshData]);

  // Use sync state from props
  const { loading, error, channel, videos, episodes, progress, total, done, status } = sync;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Enhanced Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-indigo-600 mb-3">
                  Welcome to PodPay! 👋
                </h1>
                <p className="text-xl text-gray-600 font-medium">Your YouTube channel is now a podcast</p>
              </div>
              {channelData && (
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-500 text-white shadow-lg">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Channel Connected: {channelData.title}
                  </span>
                </div>
              )}
            </div>
            {channelData && (
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 min-w-[280px]">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-500 mb-2">Connected Channel</div>
                  <div className="font-bold text-2xl text-indigo-600 mb-1">
                    {channelData.title}
                  </div>
                  {channelData.subscriberCount && (
                    <div className="text-lg text-gray-600 font-medium">
                      {Number(channelData.subscriberCount).toLocaleString()} subscribers
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="group bg-green-50 border border-green-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3v-6a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wide">Podcast Status</p>
                <p className="text-3xl font-bold text-green-800 mb-2">Active</p>
                <p className="text-sm text-green-600">Your podcast is live and running</p>
              </div>
            </div>
            
            <div className="group bg-blue-50 border border-blue-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-xs text-blue-600 font-medium">Available</div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">Videos Available</p>
                <p className="text-3xl font-bold text-blue-800 mb-2">{videos?.length || 0}</p>
                <p className="text-sm text-blue-600">Ready to convert to episodes</p>
              </div>
            </div>
            
            <div className="group bg-purple-50 border border-purple-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 5.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6.343 6.343a8 8 0 000 11.314m5.657-5.657a3 3 0 000 4.243" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-xs text-purple-600 font-medium">Published</div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-700 mb-2 uppercase tracking-wide">Episodes Created</p>
                <p className="text-3xl font-bold text-purple-800 mb-2">{episodes?.filter(e => e.publishedToMegaphone)?.length || 0}</p>
                <p className="text-sm text-purple-600">Live podcast episodes</p>
              </div>
            </div>
          </div>
          {/* Enhanced Status Messages */}
          {status && (
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl shadow-lg">
              <div className="flex items-center">
                {loading && (
                  <div className="p-2 bg-blue-100 rounded-full mr-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
                <div className="text-blue-800 font-semibold text-lg">{status}</div>
              </div>
            </div>
          )}
          {loading && (
            <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Processing Videos</h3>
                <span className="text-sm font-medium text-gray-600">{progress} / {total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-indigo-500 h-3 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${total ? (progress / total) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 mt-2">Converting your videos to podcast episodes...</div>
            </div>
          )}
          {done && (
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-2xl shadow-lg">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-full mr-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-green-800 font-semibold text-lg">Sync complete! 🎉</div>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl shadow-lg">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-full mr-4">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-red-800 font-semibold text-lg">Error: {error}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Quick Start Guide */}
        {(!episodes || episodes.length === 0) && videos?.length > 0 && (
          <div className="mb-12 bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-8 shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">🎙️</span>
                </div>
              </div>
              <div className="ml-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Your podcast is ready!</h3>
                <p className="text-gray-700 mb-4 text-lg leading-relaxed">
                  We found <strong className="text-indigo-600">{videos?.length || 0} videos</strong> from your YouTube channel. 
                  Select the videos below to convert them into podcast episodes.
                </p>
                <div className="flex items-center text-indigo-600 bg-white bg-opacity-50 rounded-full px-4 py-2 w-fit">
                  <span className="mr-2 text-lg">✨</span>
                  <span className="font-medium">Episodes will be automatically published to major podcast platforms</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Video Sync Panel */}
        <div className="mb-12 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-indigo-500 p-8">
            <h2 className="text-3xl font-bold text-white mb-2">Video Management</h2>
            <p className="text-white text-lg opacity-90">Sync your YouTube videos and convert them to podcast episodes</p>
          </div>
          <div className="p-8">
            <VideoSyncPanel 
              sync={sync} 
              onEpisodesCreated={() => {
                // Refresh podcast data after episodes are created
                console.log('🔄 Refreshing podcast data after episode creation');
                window.location.reload(); // Simple refresh for now
              }} 
            />
          </div>
        </div>
        
        {/* Enhanced Episodes Table */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-100 p-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Synced Episodes</h2>
            <p className="text-gray-600">Track your converted podcast episodes and their publishing status</p>
          </div>
          <div className="p-8">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="py-4 px-6 text-left font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700 uppercase tracking-wider">Published Date</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(episodes || []).map((ep, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="py-6 px-6 font-semibold text-gray-900 text-lg">{ep.title}</td>
                      <td className="py-6 px-6 text-gray-600 font-medium">{ep.publishedAt}</td>
                      <td className="py-6 px-6">
                        {ep.publishedToMegaphone ? (
                          <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Published to Megaphone
                          </span>
                        ) : ep.error ? (
                          <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Error: {ep.error}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Pending...
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!episodes || episodes.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3v-6a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 text-lg font-medium">No episodes synced yet</p>
                          <p className="text-gray-400 text-sm mt-1">Use the video sync panel above to create your first episodes</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 