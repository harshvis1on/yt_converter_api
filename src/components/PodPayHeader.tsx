import React from 'react';
import { Search, Bell, Settings2, ChevronDown } from 'lucide-react';
import { UserInfo } from '../types/user';

interface PodPayHeaderProps {
  title?: string;
  subtitle?: string | null;
  userInfo?: UserInfo | null;
  onSearch?: (query: string) => void;
}

const PodPayHeader: React.FC<PodPayHeaderProps> = ({ 
  title = 'Dashboard', 
  subtitle = null, 
  userInfo = null, 
  onSearch = () => {} 
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between">
        {/* Left: Title and Breadcrumb */}
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
              <span>Podcast</span>
              {subtitle && (
                <>
                  <span>›</span>
                  <span>{subtitle}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Settings2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Right: User Profile and Actions */}
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              1
            </span>
          </button>


          {/* User Profile */}
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <img 
              src={userInfo?.picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
              alt="Profile" 
              className="h-8 w-8 rounded-full"
            />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {userInfo?.name || 'Jon Doe'}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default PodPayHeader;