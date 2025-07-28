import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GoogleAuth from './components/GoogleAuth';
import Dashboard from './components/Dashboard';
import PodcastCreationFlow from './components/PodcastCreationFlow';
import PodcastDetails from './components/PodcastDetails';
import AnalyticsPage from './components/AnalyticsPage';
import PodcastPage from './components/PodcastPage';
import TransactionsPage from './components/TransactionsPage';
import ReferralsPage from './components/ReferralsPage';
import SettingsPage from './components/SettingsPage';
import { useYouTubeSync } from './hooks/useYouTubeSync';
import { toast } from 'react-toastify';
import { clearOnboardingData, clearAllAuthData } from './utils/onboarding';

// Auth context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);


function PodcastProtectedRoute({ children }) {
  const { signedIn } = useAuth();
  
  if (!signedIn) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
}

function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  
  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('google_token');
    const userData = localStorage.getItem('user_info');
    const podcastId = localStorage.getItem('podcastId');
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    
    console.log('🔍 App initialization - checking stored auth state:', {
      hasToken: !!token,
      hasUserData: !!userData,
      hasPodcastId: !!podcastId,
      onboardingCompleted
    });
    
    if (token && userData) {
      setSignedIn(true);
      try {
        setUserInfo(JSON.parse(userData));
        console.log('✅ Restored user session from localStorage');
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('user_info');
        setSignedIn(false);
      }
    }
  }, []);
  
  const login = () => setSignedIn(true);
  
  const logout = () => {
    // Clear auth data
    localStorage.removeItem('google_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('isYouTubeConnected');
    
    // Clear onboarding data
    clearOnboardingData();
    
    setSignedIn(false);
    setUserInfo(null);
    
    toast.info('You have been signed out');
  };

  // Use the sync hook at the top level to share state
  const sync = useYouTubeSync();


  return (
    <AuthContext.Provider value={{ signedIn, login, logout, userInfo }}>
      <Router>
        <Routes>
          {/* Main authentication route */}
          <Route path="/auth" element={<GoogleAuth />} />
          <Route path="/auth/callback" element={<GoogleAuth />} />
          
          {/* Podcast creation form route - only for users without existing podcasts */}
          <Route path="/create-podcast" element={
            signedIn ? <PodcastCreationFlow /> : <Navigate to="/auth" replace />
          } />
          
          {/* Protected dashboard route */}
          <Route path="/dashboard" element={
            <PodcastProtectedRoute>
              <Dashboard sync={sync} userInfo={userInfo} />
            </PodcastProtectedRoute>
          } />
          
          {/* Podcast details route */}
          <Route path="/podcast" element={
            <PodcastProtectedRoute>
              <PodcastPage userInfo={userInfo} />
            </PodcastProtectedRoute>
          } />
          
          {/* Analytics route */}
          <Route path="/analytics" element={
            <PodcastProtectedRoute>
              <AnalyticsPage userInfo={userInfo} />
            </PodcastProtectedRoute>
          } />
          
          {/* Transactions route */}
          <Route path="/transactions" element={
            <PodcastProtectedRoute>
              <TransactionsPage userInfo={userInfo} />
            </PodcastProtectedRoute>
          } />
          
          {/* Referrals route */}
          <Route path="/referrals" element={
            <PodcastProtectedRoute>
              <ReferralsPage userInfo={userInfo} />
            </PodcastProtectedRoute>
          } />
          
          {/* Settings route */}
          <Route path="/settings" element={
            <PodcastProtectedRoute>
              <SettingsPage userInfo={userInfo} />
            </PodcastProtectedRoute>
          } />
          
          {/* Default route - redirect based on auth status */}
          <Route path="/" element={
            <Navigate to={signedIn ? "/dashboard" : "/auth"} replace />
          } />
          
          {/* Debug route to reset authentication */}
          <Route path="/reset" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold mb-4">Reset Authentication</h1>
                <button 
                  onClick={() => {
                    clearAllAuthData();
                    setSignedIn(false);
                    setUserInfo(null);
                    toast.success('All authentication data cleared!');
                    setTimeout(() => window.location.href = '/auth', 1000);
                  }}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
                >
                  Clear All Data & Reset
                </button>
                <p className="text-gray-600 text-sm mt-4">This will clear all stored authentication data</p>
              </div>
            </div>
          } />
          
          {/* Legacy routes - redirect to new auth flow */}
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<Navigate to="/auth" replace />} />
          <Route path="/connect-youtube" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Router>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </AuthContext.Provider>
  );
}

export default App; 