// Utility functions for onboarding state management

export const isOnboardingCompleted = () => {
  const podcastId = localStorage.getItem('podcastId');
  const onboardingCompleted = localStorage.getItem('onboardingCompleted');
  const podcastData = localStorage.getItem('podcastData');
  const currentPodcast = localStorage.getItem('currentPodcast');
  
  // Check multiple indicators for robust onboarding completion detection
  // If user has a current podcast from Supabase, consider onboarding complete
  const hasRequiredData = podcastId && (onboardingCompleted === 'true' || podcastData) || currentPodcast;
  
  console.log('🔍 Onboarding completion check:', {
    podcastId: podcastId ? 'EXISTS' : 'NULL',
    onboardingCompleted,
    podcastData: podcastData ? 'EXISTS' : 'NULL',
    currentPodcast: currentPodcast ? 'EXISTS' : 'NULL',
    hasRequiredData
  });
  
  return hasRequiredData;
};

export const markOnboardingCompleted = (podcastId, podcastData) => {
  localStorage.setItem('podcastId', podcastId);
  localStorage.setItem('podcastData', JSON.stringify(podcastData));
  localStorage.setItem('onboardingCompleted', 'true');
  localStorage.setItem('onboardingCompletedAt', new Date().toISOString());
  
  console.log('✅ Onboarding marked as completed:', {
    podcastId,
    timestamp: new Date().toISOString()
  });
};

export const clearOnboardingData = () => {
  const keysToRemove = [
    'podcastId',
    'podcastData', 
    'channelData',
    'videosData',
    'prefillData',
    'onboardingCompleted',
    'onboardingCompletedAt'
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  console.log('🧹 Onboarding data cleared');
};

export const clearAllAuthData = () => {
  const keysToRemove = [
    // Auth data
    'google_token',
    'user_info',
    'oauth_state',
    // Onboarding data
    'podcastId',
    'podcastData', 
    'channelData',
    'videosData',
    'prefillData',
    'onboardingCompleted',
    'onboardingCompletedAt',
    'currentPodcast',
    // YouTube data
    'isYouTubeConnected'
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  console.log('🧹 All authentication data cleared');
};

export const getOnboardingStatus = () => {
  const podcastId = localStorage.getItem('podcastId');
  const onboardingCompleted = localStorage.getItem('onboardingCompleted');
  const completedAt = localStorage.getItem('onboardingCompletedAt');
  
  return {
    isCompleted: isOnboardingCompleted(),
    podcastId,
    onboardingCompleted: onboardingCompleted === 'true',
    completedAt: completedAt ? new Date(completedAt) : null
  };
};