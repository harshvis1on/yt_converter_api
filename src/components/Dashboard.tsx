import React from 'react';
import PodPayLayout from './PodPayLayout';
import VideoSyncPanel from './VideoSyncPanel';
import AnalyticsChart from './AnalyticsChart';
import { usePodcastData } from '../hooks/usePodcastData';
import { Podcast } from '../types/podcast';
import { UserInfo } from '../types/user';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  PlayCircle, 
  Radio,
  Activity,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface DashboardProps {
  sync: any;
  userInfo: UserInfo | null;
}

export default function Dashboard({ sync, userInfo }: DashboardProps) {
  const [activeTab, setActiveTab] = React.useState('outline');
  
  // Get podcast data from Supabase
  const { podcasts, currentPodcast, loading: podcastLoading, error: podcastError } = usePodcastData(userInfo);
  
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

  const stats = React.useMemo(() => [
    {
      title: "Total Podcasts",
      value: podcasts.length.toString(),
      change: podcasts.length > 0 ? "+100%" : "0%",
      trend: podcasts.length > 0 ? "up" : "neutral",
      description: podcasts.length > 0 ? "Active podcasts" : "No podcasts yet",
      icon: <Radio className="h-5 w-5" />
    },
    {
      title: "Episodes Created", 
      value: currentPodcast?.episodes_count?.toString() || "0",
      change: (currentPodcast?.episodes_count ?? 0) > 0 ? "+15%" : "0%",
      trend: (currentPodcast?.episodes_count ?? 0) > 0 ? "up" : "neutral",
      description: (currentPodcast?.episodes_count ?? 0) > 0 ? "Total episodes" : "No episodes yet",
      icon: <PlayCircle className="h-5 w-5" />
    },
    {
      title: "Channel Connected",
      value: channelData?.subscriberCount ? Number(channelData.subscriberCount).toLocaleString() : "Not Connected",
      change: channelData ? "+12.5%" : "0%",
      trend: channelData ? "up" : "neutral",
      description: channelData ? "YouTube subscribers" : "Connect your channel",
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "Podcast Status",
      value: currentPodcast?.status === 'active' ? "Active" : "Inactive",
      change: currentPodcast?.status === 'active' ? "+100%" : "0%",
      trend: currentPodcast?.status === 'active' ? "up" : "neutral",
      description: currentPodcast ? "Podcast is live" : "Create your first podcast",
      icon: <Activity className="h-5 w-5" />
    }
  ], [podcasts.length, currentPodcast, channelData]);

  const handleMenuItemClick = (itemId: string) => {
    if (itemId === 'analytics') {
      setActiveTab('analytics');
    } else if (itemId === 'podcast') {
      setActiveTab('videos');
    } else {
      setActiveTab('overview');
    }
  };

  return (
    <PodPayLayout
      activeMenuItem="dashboard"
      headerTitle="Documents"
      userInfo={userInfo}
      onMenuItemClick={handleMenuItemClick}
    >
      <div className="p-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="podpay-stat-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                <div className="p-2 bg-gray-50 rounded-lg">
                  {stat.icon}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : stat.trend === "down" ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : (
                    <Activity className="h-3 w-3 text-gray-400" />
                  )}
                  <span className={`font-medium ${
                    stat.trend === "up" ? "text-green-600" : 
                    stat.trend === "down" ? "text-red-600" : "text-gray-600"
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-gray-500">{stat.description}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Messages */}
        {status && (
          <div className="podpay-card border-l-4 border-l-blue-500 bg-blue-50">
            <div className="flex items-center space-x-4">
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
              <div className="text-blue-800 font-semibold">{status}</div>
            </div>
          </div>
        )}

        {loading && (
          <div className="podpay-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Processing Videos</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {progress} / {total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${total ? (progress / total) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Converting your videos to podcast episodes...
            </p>
          </div>
        )}

        {done && (
          <div className="podpay-card border-l-4 border-l-green-500 bg-green-50">
            <div className="flex items-center space-x-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-green-800 font-semibold">Sync complete! 🎉</div>
            </div>
          </div>
        )}

        {error && (
          <div className="podpay-card border-l-4 border-l-red-500 bg-red-50">
            <div className="flex items-center space-x-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="text-red-800 font-semibold">Error: {error}</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'outline', label: 'Outline' },
                { id: 'performance', label: 'Past Performance', badge: '3' },
                { id: 'personnel', label: 'Key Personnel', badge: '2' },
                { id: 'focus', label: 'Focus Documents' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm relative ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.badge && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            
            <div className="flex justify-end py-4 space-x-3">
              <button className="podpay-btn-secondary text-sm">
                Customize Columns
              </button>
              <button className="podpay-btn-primary text-sm">
                Add Section
              </button>
            </div>
          </div>

          {activeTab === 'outline' && (
            <div className="space-y-6">
              {/* Current Podcast Info */}
              {currentPodcast && (
                <div className="podpay-card">
                  <div className="flex items-start space-x-4">
                    {currentPodcast?.image_url && (
                      <img 
                        src={currentPodcast.image_url} 
                        alt={currentPodcast.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{currentPodcast.title}</h3>
                      {currentPodcast?.subtitle && (
                        <p className="text-gray-600 text-sm mb-2">{currentPodcast.subtitle}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{currentPodcast?.episodes_count || 0} episodes</span>
                        <span>•</span>
                        <span>{currentPodcast?.language || 'English'}</span>
                        <span>•</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          currentPodcast?.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {currentPodcast?.status}
                        </span>
                      </div>
                    </div>
                    {currentPodcast?.feed_url && (
                      <a 
                        href={currentPodcast.feed_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="podpay-btn-secondary text-xs"
                      >
                        View RSS Feed
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Analytics Chart */}
              <AnalyticsChart />

              {/* Document Table */}
              <div className="podpay-card">
                <table className="podpay-table">
                  <thead>
                    <tr>
                      <th className="w-8"></th>
                      <th>Header</th>
                      <th>Section Type</th>
                      <th>Target</th>
                      <th>Limit</th>
                      <th>Reviewer</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { header: "Cover page", sectionType: "Cover page", target: 18, limit: 5, reviewer: "Eddie Lake" },
                      { header: "Table of contents", sectionType: "Table of contents", target: 29, limit: 24, reviewer: "Eddie Lake" },
                      { header: "Executive summary", sectionType: "Narrative", target: 10, limit: 13, reviewer: "Eddie Lake" }
                    ].map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          </div>
                        </td>
                        <td className="font-medium">{item.header}</td>
                        <td>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border">
                            {item.sectionType}
                          </span>
                        </td>
                        <td>{item.target}</td>
                        <td>{item.limit}</td>
                        <td>{item.reviewer}</td>
                        <td>
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="podpay-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Past Performance</h3>
              <p className="text-gray-600 mb-6">Historical data and performance metrics</p>
              <div className="text-center py-12 text-gray-500">
                Past performance data would be displayed here
              </div>
            </div>
          )}

          {activeTab === 'personnel' && (
            <div className="podpay-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Personnel</h3>
              <p className="text-gray-600 mb-6">Team members and their roles</p>
              <div className="text-center py-12 text-gray-500">
                Personnel information would be displayed here
              </div>
            </div>
          )}

          {activeTab === 'focus' && (
            <div className="podpay-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Focus Documents</h3>
              <p className="text-gray-600 mb-6">Important documents and resources</p>
              <div className="text-center py-12 text-gray-500">
                Focus documents would be displayed here
              </div>
            </div>
          )}
        </div>
      </div>
    </PodPayLayout>
  );
}