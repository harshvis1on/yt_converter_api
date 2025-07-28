import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'react-toastify';
import { syncYouTubeChannel, setupUser, syncPodcastDataFromMegaphone } from '../services/n8nApi';

// YouTube OAuth scopes for full access
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile', 
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

const CLIENT_ID = '678018511336-jgd34uakj7vika3m6nvf028ekcfu2ucf.apps.googleusercontent.com';

function startGoogleOAuth() {
  const redirectUri = window.location.origin + '/auth/callback';
  const state = Math.random().toString(36).substring(2, 15);
  localStorage.setItem('oauth_state', state);
  
  const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=token&` +
    `scope=${encodeURIComponent(YOUTUBE_SCOPES)}&` +
    `include_granted_scopes=true&` +
    `state=${state}&` +
    `prompt=consent`;
    
  window.location.href = url;
}

function extractTokenFromUrl() {
  const hash = window.location.hash;
  console.log('🔍 Extracting token from URL hash:', hash);
  
  if (!hash || !hash.includes('access_token')) {
    console.log('❌ No access_token found in URL hash');
    return null;
  }
  
  try {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const state = params.get('state');
    const storedState = localStorage.getItem('oauth_state');
    
    console.log('🔐 Token extraction details:', {
      accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : 'NULL',
      state: state,
      storedState: storedState,
      stateMatch: state === storedState
    });
    
    // Validate state parameter for security
    if (state && state === storedState) {
      localStorage.removeItem('oauth_state');
      console.log('✅ State validation passed, returning token data');
      return {
        accessToken,
        expiresIn: params.get('expires_in'),
        scope: params.get('scope')
      };
    } else {
      console.error('❌ State validation failed - possible CSRF attack');
      return null;
    }
  } catch (error) {
    console.error('❌ Error extracting token from URL:', error);
    return null;
  }
}

export default function GoogleAuth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState('checking'); // checking, idle, authenticating, fetching, form, error
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [authInProgress, setAuthInProgress] = useState(false); // Prevent multiple auth flows
  const hasRunInitialCheck = useRef(false); // Use ref to persist across re-renders

  // Simple authentication check on mount
  useEffect(() => {
    if (hasRunInitialCheck.current) return; // Prevent reprocessing
    
    const handleAuth = async () => {
      console.log('🔍 Checking authentication...');
      hasRunInitialCheck.current = true; // Mark as processed immediately
      
      // Check for OAuth token in URL
      const tokenData = extractTokenFromUrl();
      if (tokenData) {
        console.log('✅ Found OAuth token, processing...');
        window.history.replaceState(null, null, window.location.pathname);
        setAuthInProgress(true);
        handleAuthSuccess(tokenData);
        return;
      }
      
      // Check if already signed in
      const token = localStorage.getItem('google_token');
      const userData = localStorage.getItem('user_info');
      
      if (token && userData) {
        console.log('✅ User already signed in, syncing podcast data and redirecting to dashboard');
        const user = JSON.parse(userData);
        setUserInfo(user);
        login(); // Mark as logged in
        
        // Sync podcast data from Megaphone on every login
        syncPodcastDataFromMegaphone(user.id)
          .then(result => {
            if (result.success) {
              console.log('✅ Podcast data synced on login:', result.message);
              toast.success('Podcast data updated!');
            } else {
              console.warn('⚠️ Podcast data sync failed:', result.error);
            }
          })
          .catch(error => {
            console.warn('⚠️ Failed to sync podcast data on login:', error);
          });
        
        // Redirect to dashboard
        setTimeout(() => navigate('/dashboard'), 100);
      } else {
        console.log('📝 No authentication, showing login');
        setAuthStep('idle');
      }
    };
    
    handleAuth();
  }, [navigate, login]);

  const handleAuthSuccess = async (tokenData) => {
    if (loading && authInProgress) return; // Prevent multiple calls
    setLoading(true);
    setAuthStep('authenticating');
    
    try {
      // Store the access token
      localStorage.setItem('google_token', tokenData.accessToken);
      
      // Get user info from Google
      const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.accessToken}`);
      let userData = null;
      
      if (userResponse.ok) {
        userData = await userResponse.json();
        setUserInfo(userData);
        localStorage.setItem('user_info', JSON.stringify(userData));
        toast.success(`Welcome back, ${userData.name}!`);
      } else {
        throw new Error('Failed to get user info from Google');
      }
      
      // Mark user as logged in
      login();
      
      // Start the onboarding flow for new OAuth users
      console.log('🔄 Starting onboarding flow...');
      
      // Setup user in n8n
      try {
        await setupUser(tokenData.accessToken, userData);
        console.log('✅ User setup completed, waiting before YouTube sync...');
        // Add delay to prevent n8n execution conflicts
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      } catch (setupError) {
        console.warn('User setup failed, but continuing:', setupError);
      }
      
      // Fetch YouTube channel data for form prefill
      setAuthStep('fetching');
      toast.info('Fetching your YouTube channel data...');
      
      const result = await syncYouTubeChannel(tokenData.accessToken, userData.id);
      
      if (result && result.success) {
        // Store channel data and prefill data for form
        localStorage.setItem('channelData', JSON.stringify(result.channel));
        localStorage.setItem('videosData', JSON.stringify(result.videos));
        localStorage.setItem('prefillData', JSON.stringify(result.prefillData));
        
        // Show success and navigate to podcast creation form
        const channelTitle = result.channel?.title || 'Your Channel';
        const videoCount = result.videos?.length || 0;
        
        toast.success(`Channel data fetched! Found ${videoCount} videos.`);
        
        // Navigate to podcast creation form
        setTimeout(() => {
          navigate('/create-podcast', { replace: true });
        }, 1500);
        
      } else {
        throw new Error(result?.message || 'Failed to fetch YouTube channel data');
      }
      
    } catch (error) {
      console.error('Authentication flow error:', error);
      setError(error.message);
      
      // Show specific error messages
      if (error.message.includes('n8n workflow failed')) {
        toast.error('Connection to our servers failed. Please try again.');
      } else if (error.message.includes('YouTube')) {
        toast.error('Failed to access your YouTube channel. Please check permissions.');
      } else {
        toast.error('Failed to set up your account: ' + error.message);
      }
      
      setAuthStep('error');
      setLoading(false);
      setAuthInProgress(false);
    }
  };

  const handleSignIn = () => {
    if (loading || authInProgress) return; // Prevent multiple clicks
    console.log('🚀 Starting Google OAuth...');
    setLoading(true);
    setAuthStep('authenticating');
    setAuthInProgress(true);
    toast.info('Redirecting to Google...');
    startGoogleOAuth();
  };

  // Show checking state while determining OAuth callback
  if (authStep === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg px-8 py-10 w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h3>
            <p className="text-gray-600 text-sm">Checking authentication status</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (authStep === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg px-8 py-10 w-full max-w-md">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Failed</h3>
            <p className="text-gray-600 text-sm mb-4">{error || 'Something went wrong during authentication'}</p>
            <button
              onClick={() => {
                setError(null);
                setAuthStep('idle');
                setAuthInProgress(false);
                setLoading(false);
                hasRunInitialCheck.current = false; // Allow re-running initial check
              }}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg px-8 py-10 w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            
            {authStep === 'authenticating' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Authenticating...</h3>
                <p className="text-gray-600 text-sm">Verifying your Google account</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-green-600">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    Google OAuth verified
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <div className="w-4 h-4 bg-gray-300 rounded-full mr-3"></div>
                    Connect YouTube channel
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <div className="w-4 h-4 bg-gray-300 rounded-full mr-3"></div>
                    Create podcast
                  </div>
                </div>
              </>
            )}
            
            {authStep === 'fetching' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fetching Channel Data</h3>
                <p className="text-gray-600 text-sm">Getting your YouTube channel information</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-green-600">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    Google OAuth verified
                  </div>
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                    Fetching YouTube data...
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <div className="w-4 h-4 bg-gray-300 rounded-full mr-3"></div>
                    Create podcast form
                  </div>
                </div>
              </>
            )}
            
            {userInfo && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">✅ Signed in as {userInfo.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg px-8 py-10 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl font-bold text-indigo-500 mb-4 block">
            Pod<span className="text-gray-900">Pay</span>
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Turn Your YouTube into a Podcast
          </h1>
          <p className="text-gray-600 text-sm">
            Connect with Google to automatically create a podcast from your YouTube channel
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center text-sm text-gray-700">
            <span className="text-green-500 mr-3">✓</span>
            <span>Connects to your YouTube channel</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="text-green-500 mr-3">✓</span>
            <span>Creates podcast automatically</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="text-green-500 mr-3">✓</span>
            <span>Publishes to major podcast platforms</span>
          </div>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center bg-white border-2 border-gray-300 py-3 px-4 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm mb-4"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            <br />
            We'll access your YouTube channel to create your podcast.
          </p>
        </div>
      </div>
    </div>
  );
}