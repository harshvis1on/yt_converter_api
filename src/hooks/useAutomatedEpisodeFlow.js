import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { automatedWorkflow } from '../services/automatedWorkflow';
import { adInsertionService } from '../services/adInsertionService';

/**
 * Hook for handling automated episode creation and ad insertion
 * For existing podcasts (not new onboarding)
 */
export const useAutomatedEpisodeFlow = (podcast, userInfo) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({
    step: '',
    current: 0,
    total: 0,
    message: ''
  });

  /**
   * Auto-trigger episode creation with ad insertion
   */
  const processEpisodesWithAds = useCallback(async (selectedVideos, episodeFormat = 'audio', adPreferences = null) => {
    if (!podcast?.megaphone_id || !userInfo?.id || !selectedVideos?.length) {
      toast.error('Missing required information for episode processing');
      return { success: false, error: 'Missing required data' };
    }

    setIsProcessing(true);
    setProgress({
      step: 'creating_episodes',
      current: 1,
      total: 3,
      message: `Creating ${selectedVideos.length} episodes...`
    });

    try {
      console.log('🚀 Starting automated episode + ad flow...');
      
      // Ensure we have fresh podcast data before creating episodes
      try {
        const { syncPodcastDataFromMegaphone } = await import('../services/n8nApi');
        const syncResult = await syncPodcastDataFromMegaphone(userInfo.id);
        if (syncResult.success && syncResult.podcast) {
          console.log('✅ Refreshed podcast data before episode creation');
          localStorage.setItem('currentPodcast', JSON.stringify(syncResult.podcast));
        }
      } catch (syncError) {
        console.warn('⚠️ Failed to refresh podcast data (non-critical):', syncError.message);
      }
      
      // Step 1: Create Episodes
      const { createEpisodes } = await import('../services/n8nApi');
      const episodeResult = await createEpisodes(
        podcast.megaphone_id,
        selectedVideos,
        userInfo.id,
        episodeFormat
      );

      if (!episodeResult.success) {
        throw new Error(episodeResult.error || 'Episode creation failed');
      }

      console.log(`✅ ${episodeResult.results?.length || 0} episodes created`);
      setProgress({
        step: 'episodes_created',
        current: 2,
        total: 3,
        message: `${episodeResult.results?.length || 0} episodes created successfully`
      });

      // Step 2: Wait a bit for processing
      setProgress({
        step: 'waiting_processing',
        current: 2,
        total: 3,
        message: 'Waiting for episodes to be processed...'
      });

      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

      // Step 3: Auto-insert Ads (if preferences provided)
      let adResult = null;
      if (adPreferences && (adPreferences.preRoll?.enabled || adPreferences.midRoll?.enabled)) {
        setProgress({
          step: 'inserting_ads',
          current: 3,
          total: 3,
          message: 'Inserting ads into episodes...'
        });

        try {
          adResult = await adInsertionService.autoTriggerAdInsertion(
            podcast.megaphone_id,
            userInfo.id,
            'episode_batch_with_ads',
            adPreferences
          );

          if (adResult.success) {
            console.log('✅ Ads inserted successfully');
            toast.success(`🎉 ${episodeResult.results?.length || 0} episodes created with ${adResult.summary?.totalAdsScheduled || 0} ads scheduled!`);
          } else {
            console.warn('⚠️ Ad insertion failed but episodes were created');
            toast.success(`✅ ${episodeResult.results?.length || 0} episodes created successfully! Ad insertion will be retried later.`);
          }
        } catch (adError) {
          console.warn('⚠️ Ad insertion error:', adError);
          toast.success(`✅ ${episodeResult.results?.length || 0} episodes created successfully! You can add ads later.`);
        }
      } else {
        toast.success(`✅ ${episodeResult.results?.length || 0} episodes created successfully!`);
      }

      setProgress({
        step: 'completed',
        current: 3,
        total: 3,
        message: 'Process completed successfully!'
      });

      return {
        success: true,
        episodeResult,
        adResult,
        summary: {
          episodesCreated: episodeResult.results?.length || 0,
          adsScheduled: adResult?.summary?.totalAdsScheduled || 0
        }
      };

    } catch (error) {
      console.error('❌ Automated episode flow failed:', error);
      
      setProgress({
        step: 'failed',
        current: 0,
        total: 3,
        message: `Failed: ${error.message}`
      });

      toast.error(`Episode creation failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsProcessing(false);
    }
  }, [podcast, userInfo]);

  /**
   * Just create episodes without ads (legacy flow)
   */
  const createEpisodesOnly = useCallback(async (selectedVideos, episodeFormat = 'audio') => {
    return processEpisodesWithAds(selectedVideos, episodeFormat, null);
  }, [processEpisodesWithAds]);

  /**
   * Auto-insert ads into existing episodes
   */
  const insertAdsIntoExistingEpisodes = useCallback(async (episodeIds = null, adPreferences = null) => {
    if (!podcast?.megaphone_id || !userInfo?.id) {
      toast.error('Missing podcast or user information');
      return { success: false, error: 'Missing required data' };
    }

    setIsProcessing(true);
    setProgress({
      step: 'inserting_ads',
      current: 1,
      total: 1,
      message: 'Inserting ads into episodes...'
    });

    try {
      const finalAdPreferences = adPreferences || adInsertionService.loadPreferences();
      
      const result = await adInsertionService.autoTriggerAdInsertion(
        podcast.megaphone_id,
        userInfo.id,
        'manual_ad_insertion',
        finalAdPreferences
      );

      if (result.success) {
        const totalAds = result.summary?.totalAdsScheduled || 0;
        toast.success(`🎯 ${totalAds} ads scheduled successfully!`);
        
        setProgress({
          step: 'completed',
          current: 1,
          total: 1,
          message: `${totalAds} ads scheduled successfully!`
        });
      } else {
        throw new Error(result.error || 'Ad insertion failed');
      }

      return result;
    } catch (error) {
      console.error('❌ Ad insertion failed:', error);
      toast.error(`Ad insertion failed: ${error.message}`);
      
      setProgress({
        step: 'failed',
        current: 0,
        total: 1,
        message: `Failed: ${error.message}`
      });

      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsProcessing(false);
    }
  }, [podcast, userInfo]);

  /**
   * Reset progress state
   */
  const resetProgress = useCallback(() => {
    setProgress({
      step: '',
      current: 0,
      total: 0,
      message: ''
    });
    setIsProcessing(false);
  }, []);

  return {
    isProcessing,
    progress,
    processEpisodesWithAds,
    createEpisodesOnly,
    insertAdsIntoExistingEpisodes,
    resetProgress
  };
};

export default useAutomatedEpisodeFlow;