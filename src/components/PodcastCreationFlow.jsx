import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PodcastOnboardingWizard from './PodcastOnboardingWizard';
import { createPodcast } from '../services/n8nApi';
import { getUserPodcasts } from '../services/supabase';
import { safeGetItem } from '../utils/localStorage';
import { markOnboardingCompleted } from '../utils/onboarding';

export default function PodcastCreationFlow() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [channelData, setChannelData] = useState(null);
  const [prefillData, setPrefillData] = useState(null);
  const [checkingExistingPodcast, setCheckingExistingPodcast] = useState(true);

  // Check for existing podcasts and validate user access
  useEffect(() => {
    const checkUserPodcastStatus = async () => {
      try {
        // Get user info from localStorage
        const userInfo = safeGetItem('user_info');
        if (!userInfo || !userInfo.id) {
          toast.error('User information not found. Please sign in again.');
          navigate('/auth', { replace: true });
          return;
        }

        console.log('🔍 Checking if user already has a podcast...');
        
        // Check if user already has a podcast
        const existingPodcasts = await getUserPodcasts(userInfo.id);
        
        if (existingPodcasts && existingPodcasts.length > 0) {
          console.log('⚠️ User already has a podcast, redirecting to dashboard');
          toast.info(`You already have a podcast: "${existingPodcasts[0].title}". Redirecting to dashboard.`);
          
          // Mark onboarding as complete and set current podcast
          localStorage.setItem('currentPodcast', JSON.stringify(existingPodcasts[0]));
          localStorage.setItem('onboardingCompleted', 'true');
          
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
          return;
        }

        console.log('✅ No existing podcast found, user can create new one');
        
        // Load channel data and validate
        const storedChannelData = safeGetItem('channelData');
        const storedPrefillData = safeGetItem('prefillData');
        
        setChannelData(storedChannelData);
        setPrefillData(storedPrefillData);
        setCheckingExistingPodcast(false);
        
        // Redirect if no channel data after check
        if (!storedChannelData) {
          console.log('No channel data found, redirecting to auth');
          toast.error('No channel data found. Please start over.');
          setTimeout(() => {
            navigate('/auth', { replace: true });
          }, 1000);
        }
        
      } catch (error) {
        console.error('❌ Error checking podcast status:', error);
        toast.error('Error checking your account status. Please try again.');
        setCheckingExistingPodcast(false);
      }
    };

    checkUserPodcastStatus();
  }, [navigate]);

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    
    try {
      // Double-check that user doesn't already have a podcast (safety measure)
      const userInfo = safeGetItem('user_info');
      if (userInfo && userInfo.id) {
        console.log('🛡️ Final check: Ensuring user can create podcast...');
        const existingPodcasts = await getUserPodcasts(userInfo.id);
        
        if (existingPodcasts && existingPodcasts.length > 0) {
          console.log('🚫 User already has a podcast, blocking creation');
          toast.error(`You already have a podcast: "${existingPodcasts[0].title}". Cannot create another.`);
          setLoading(false);
          navigate('/dashboard', { replace: true });
          return;
        }
      }

      console.log('✅ User verified to create podcast, proceeding...');
      const result = await createPodcast(formData);
      
      if (result && result.success) {
        // Mark onboarding as completed using utility
        markOnboardingCompleted(result.podcastId, result.podcast);
        
        // Clean up temporary data (keep YouTube data for episode creation)
        localStorage.removeItem('prefillData');
        
        // Show success message
        toast.success(`🎉 Podcast "${formData.title}" created successfully!`);
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
        
      } else {
        throw new Error(result?.message || 'Podcast creation failed');
      }
    } catch (error) {
      console.error('Podcast creation error:', error);
      toast.error('Failed to create podcast: ' + error.message);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Clean up stored data and redirect back to auth
    localStorage.removeItem('prefillData');
    
    toast.info('Podcast creation cancelled');
    navigate('/auth', { replace: true });
  };

  // Show loading while checking existing podcasts or loading data
  if (checkingExistingPodcast || !channelData || !prefillData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {checkingExistingPodcast ? 'Checking your account status...' : 'Loading channel data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PodcastOnboardingWizard
      channelData={channelData}
      prefillData={prefillData}
      onSubmit={handleFormSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}