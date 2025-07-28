import React, { useState, useEffect } from 'react';
import { getUserPodcasts } from '../services/supabase';

export default function PodcastDetails() {
  const [podcast, setPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPodcastData();
  }, []);

  const loadPodcastData = async () => {
    try {
      setLoading(true);
      
      // Get user info from localStorage
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      
      if (!userInfo.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch user's podcasts
      const podcasts = await getUserPodcasts(userInfo.id);
      
      if (podcasts && podcasts.length > 0) {
        // Use the first podcast for now
        const latestPodcast = podcasts[0];
        setPodcast(latestPodcast);
        
        // Mock episodes data based on podcast
        setEpisodes([
          {
            id: 1,
            title: "Episode 1: Introduction to " + latestPodcast.title,
            description: "Welcome to our first episode where we introduce the podcast and discuss what's to come.",
            duration: "25:30",
            publishedAt: "2024-01-15",
            status: "published",
            plays: 1250,
            downloads: 892
          },
          {
            id: 2, 
            title: "Episode 2: Deep Dive into " + latestPodcast.primary_category,
            description: "In this episode, we explore the fundamentals and share practical insights.",
            duration: "32:15",
            publishedAt: "2024-01-22",
            status: "published",
            plays: 987,
            downloads: 723
          },
          {
            id: 3,
            title: "Episode 3: Advanced Techniques and Tips",
            description: "Today we're covering advanced strategies and answering listener questions.",
            duration: "28:45",
            publishedAt: "2024-01-29",
            status: "draft",
            plays: 0,
            downloads: 0
          }
        ]);
      } else {
        // No podcasts found, show placeholder
        setPodcast({
          title: "Your Podcast Title",
          subtitle: "Your podcast subtitle goes here",
          author: "Your Name",
          image_url: "https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=Podcast",
          episodes_count: 0,
          primary_category: "Technology",
          language: "en",
          status: "active"
        });
        setEpisodes([]);
      }
    } catch (err) {
      console.error('Failed to load podcast data:', err);
      setError('Failed to load podcast data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPodcast = () => {
    // TODO: Navigate to edit podcast form
    console.log('Edit podcast clicked');
  };

  const handleCreateEpisode = () => {
    // TODO: Navigate to create episode form
    console.log('Create episode clicked');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header Section */}
      <div className="bg-white border-b-2 border-gray-200 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
            {/* Enhanced Podcast Image */}
            <div className="flex-shrink-0 mb-8 lg:mb-0">
              <div className="relative group">
                <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-2xl shadow-xl bg-indigo-100 border-2 border-white overflow-hidden">
                  {podcast?.image_url || podcast?.megaphone_image_url ? (
                    <img
                      src={podcast.image_url || podcast.megaphone_image_url}
                      alt={podcast?.title || "Podcast"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center text-indigo-600" style={{ display: (!podcast?.image_url && !podcast?.megaphone_image_url) ? 'flex' : 'none' }}>
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3v-6a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <div className="text-sm font-semibold text-indigo-600">Podcast</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Podcast Details */}
            <div className="flex-grow space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="flex-grow space-y-6">
                  <div>
                    <h1 className="text-4xl lg:text-6xl font-bold text-indigo-600 mb-4 leading-tight">
                      {podcast?.title || "Your Podcast Title"}
                    </h1>
                    <p className="text-xl lg:text-2xl text-gray-600 font-medium leading-relaxed mb-4">
                      {podcast?.subtitle || "Your podcast subtitle goes here"}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg text-gray-700">By</span>
                      <span className="text-lg font-bold text-indigo-600">{podcast?.author || "Your Name"}</span>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleEditPodcast}
                    className="group inline-flex items-center px-6 py-3 border-2 border-gray-300 rounded-2xl text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-3 group-hover:text-indigo-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Podcast
                  </button>
                  <button
                    onClick={handleCreateEpisode}
                    className="group inline-flex items-center px-6 py-3 border border-transparent rounded-2xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Episode
                  </button>
                </div>
              </div>

              {/* Enhanced Podcast Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="group bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3v-6a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-800 mb-1">{podcast?.episodes_count || 0}</div>
                  <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Episodes</div>
                </div>
                
                <div className="group bg-purple-50 border border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-purple-800 mb-1">{podcast?.primary_category || "Technology"}</div>
                  <div className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Category</div>
                </div>
                
                <div className="group bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-800 mb-1">{podcast?.language?.toUpperCase() || "EN"}</div>
                  <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Language</div>
                </div>
                
                <div className="group bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-amber-100 rounded-xl">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-1">{podcast?.status === 'active' ? 'Active' : 'Inactive'}</div>
                  <div className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Status</div>
                </div>
              </div>

              {/* Enhanced Description */}
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">About This Podcast</h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {podcast?.summary || "This is where your podcast description will appear. You can edit this in your podcast settings to provide more details about what listeners can expect from your show."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Episodes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-indigo-500 px-8 py-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Episodes</h2>
                <p className="text-white text-lg opacity-90">
                  {episodes.length} episode{episodes.length !== 1 ? 's' : ''} published
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl px-6 py-3">
                <div className="text-2xl font-bold text-white">{episodes.length}</div>
                <div className="text-xs text-white opacity-90 uppercase tracking-wide font-medium">Total</div>
              </div>
            </div>
          </div>

          {episodes.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No episodes yet</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                Your podcast is ready to go! Start creating episodes to share your content with the world.
              </p>
              <button
                onClick={handleCreateEpisode}
                className="group inline-flex items-center px-8 py-4 border border-transparent rounded-2xl text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Episode
              </button>
            </div>
          ) : (
            <div className="p-8 space-y-6">
              {episodes.map((episode) => (
                <div key={episode.id} className="group bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow pr-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                          {episode.title}
                        </h3>
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                          episode.status === 'published' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {episode.status === 'published' && (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {episode.status.charAt(0).toUpperCase() + episode.status.slice(1)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-lg mb-6 leading-relaxed">{episode.description}</p>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center bg-blue-50 rounded-xl px-4 py-3">
                          <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <div className="font-semibold text-blue-800">{episode.duration}</div>
                            <div className="text-xs text-blue-600 uppercase tracking-wide">Duration</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center bg-purple-50 rounded-xl px-4 py-3">
                          <svg className="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <div className="font-semibold text-purple-800">{new Date(episode.publishedAt).toLocaleDateString()}</div>
                            <div className="text-xs text-purple-600 uppercase tracking-wide">Published</div>
                          </div>
                        </div>
                        
                        {episode.status === 'published' && (
                          <>
                            <div className="flex items-center bg-green-50 rounded-xl px-4 py-3">
                              <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <div className="font-semibold text-green-800">{episode.plays.toLocaleString()}</div>
                                <div className="text-xs text-green-600 uppercase tracking-wide">Plays</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center bg-amber-50 rounded-xl px-4 py-3">
                              <svg className="w-5 h-5 mr-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293L16 6.414A1 1 0 0016.414 6L14 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div>
                                <div className="font-semibold text-amber-800">{episode.downloads.toLocaleString()}</div>
                                <div className="text-xs text-amber-600 uppercase tracking-wide">Downloads</div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <button className="group/btn p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 