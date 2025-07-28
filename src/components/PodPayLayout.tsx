import React from 'react';
import PodPaySidebar from './PodPaySidebar';
import PodPayHeader from './PodPayHeader';
import { useAuth } from '../App';
import { UserInfo } from '../types/user';

interface PodPayLayoutProps {
  children: React.ReactNode;
  activeMenuItem?: string;
  headerTitle?: string;
  headerSubtitle?: string | null;
  userInfo?: UserInfo | null;
  onMenuItemClick?: (itemId: string) => void;
  onSearch?: (query: string) => void;
}

const PodPayLayout: React.FC<PodPayLayoutProps> = ({ 
  children, 
  activeMenuItem = 'dashboard',
  headerTitle = 'Dashboard',
  headerSubtitle = null,
  userInfo = null,
  onMenuItemClick = (itemId: string) => {},
  onSearch = (query: string) => {}
}) => {
  const { logout } = useAuth();

  const handleMenuItemClick = (itemId: string) => {
    if (itemId === 'logout') {
      logout();
      return;
    }
    if (onMenuItemClick) {
      onMenuItemClick(itemId);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <PodPaySidebar 
        activeItem={activeMenuItem}
        onItemClick={handleMenuItemClick}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <PodPayHeader 
          title={headerTitle}
          subtitle={headerSubtitle}
          userInfo={userInfo}
          onSearch={onSearch}
        />
        
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PodPayLayout;