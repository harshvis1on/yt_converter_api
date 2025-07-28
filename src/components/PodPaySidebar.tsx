import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users,
  Radio,
  CreditCard,
  Settings,
  UserCircle,
  BarChart3,
  LogOut,
  LucideIcon
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface PodPaySidebarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

const PodPaySidebar: React.FC<PodPaySidebarProps> = ({ 
  activeItem = 'dashboard', 
  onItemClick = (itemId: string) => {} 
}) => {
  const navigate = useNavigate();
  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'podcast', label: 'Podcast', icon: Radio },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'referrals', label: 'Referrals', icon: UserCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleItemClick = (itemId: string) => {
    if (itemId === 'logout') {
      // Handle logout separately
      if (onItemClick) {
        onItemClick(itemId);
      }
      return;
    }
    
    // Navigate to the appropriate route
    const routes: Record<string, string> = {
      'dashboard': '/dashboard',
      'podcast': '/podcast',
      'analytics': '/analytics',
      'transactions': '/transactions',
      'referrals': '/referrals',
      'settings': '/settings'
    };
    
    if (routes[itemId]) {
      navigate(routes[itemId]);
    }
    
    if (onItemClick) {
      onItemClick(itemId);
    }
  };

  return (
    <div className="podpay-sidebar flex flex-col">
      {/* Logo */}
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-white">
          Pod<span className="text-white/80">Pay</span>
        </h1>
        <p className="text-white/60 text-sm mt-1">Main Menu</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`podpay-sidebar-nav-item w-full text-left ${isActive ? 'active' : ''}`}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-6 py-4 border-t border-white/10">
        <button 
          onClick={() => handleItemClick('logout')}
          className="podpay-sidebar-nav-item w-full text-left"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default PodPaySidebar;