import { n8nApi } from './n8nApi.js';
import { adInsertionService } from './adInsertionService.js';
import { supabase } from './supabase.js';
import { toast } from 'react-toastify';

/**
 * Automated Workflow Orchestrator
 * Manages the complete user flow from signup to ad insertion
 */
class AutomatedWorkflow {
  constructor() {
    this.workflows = new Map(); // Track active workflows
    this.defaultAdPreferences = {
      preRoll: {
        enabled: true,
        adCount: 2
      },
      midRoll: {
        enabled: true,
        adCount: 2,
        intervalMinutes: 8
      }
    };
  }

  /**
   * Start the complete automated workflow
   * @param {Object} userInfo - User information from OAuth
   * @param {Object} channelData - YouTube channel data
   * @param {Object} podcastFormData - Podcast creation form data
   * @param {Object} adPreferences - Ad insertion preferences (optional)
   * @returns {Promise<Object>} Workflow results
   */
  async startAutomatedFlow(userInfo, channelData, podcastFormData, adPreferences = null) {
    const workflowId = `workflow_${Date.now()}_${userInfo.id}`;
    
    console.log('🚀 Starting automated workflow:', workflowId);
    console.log('User:', userInfo.id);
    console.log('Channel:', channelData?.title);
    console.log('Ad preferences provided:', !!adPreferences);

    // Initialize workflow tracking
    this.workflows.set(workflowId, {
      status: 'started',
      steps: {},
      startTime: new Date(),
      userInfo,
      channelData,
      podcastFormData,
      adPreferences: adPreferences || this.defaultAdPreferences
    });

    try {
      // Step 1: Create Podcast
      const podcastResult = await this.createPodcast(workflowId, userInfo, channelData, podcastFormData);
      
      if (!podcastResult.success) {
        throw new Error(`Podcast creation failed: ${podcastResult.error}`);
      }

      // Step 2: Create Episodes (if video selection is available)
      let episodeResult = null;
      if (podcastFormData.selectedVideos && podcastFormData.selectedVideos.length > 0) {
        episodeResult = await this.createEpisodes(workflowId, podcastResult.podcastId, podcastFormData.selectedVideos, userInfo);
      }

      // Step 3: Auto-trigger Ad Insertion (if episodes were created and ad preferences exist)
      let adResult = null;
      const finalAdPreferences = adPreferences || this.loadSavedAdPreferences(userInfo.id) || this.defaultAdPreferences;
      
      if (episodeResult?.success && (finalAdPreferences.preRoll.enabled || finalAdPreferences.midRoll.enabled)) {
        adResult = await this.autoInsertAds(workflowId, podcastResult.podcastId, userInfo.id, finalAdPreferences);
      }

      // Mark workflow as completed
      this.updateWorkflowStatus(workflowId, 'completed', {
        podcastResult,
        episodeResult,
        adResult,
        completedAt: new Date()
      });

      const summary = this.generateWorkflowSummary(workflowId);
      
      console.log('✅ Automated workflow completed:', workflowId);
      console.log('Summary:', summary);

      // Show user-friendly success notification
      this.showSuccessNotification(summary);

      return {
        success: true,
        workflowId,
        summary,
        podcastId: podcastResult.podcastId,
        results: {
          podcast: podcastResult,
          episodes: episodeResult,
          ads: adResult
        }
      };

    } catch (error) {
      console.error('❌ Automated workflow failed:', workflowId, error);
      
      this.updateWorkflowStatus(workflowId, 'failed', {
        error: error.message,
        failedAt: new Date()
      });

      toast.error(`Workflow failed: ${error.message}`);

      return {
        success: false,
        workflowId,
        error: error.message,
        partialResults: this.getPartialResults(workflowId)
      };
    }
  }

  /**
   * Step 1: Create Podcast
   */
  async createPodcast(workflowId, userInfo, channelData, podcastFormData) {
    console.log('📻 Step 1: Creating podcast...');
    this.updateWorkflowStatus(workflowId, 'creating_podcast');

    try {
      console.log('📻 Calling n8n createPodcast API...');
      // Disable mock fallbacks for automated workflows to prevent duplicates
      const result = await n8nApi.createPodcast(userInfo, channelData, podcastFormData);
      
      this.updateWorkflowStep(workflowId, 'podcast_creation', {
        status: result.success ? 'completed' : 'failed',
        result,
        completedAt: new Date()
      });

      if (result.success) {
        console.log('✅ Podcast created successfully');
        console.log('🔍 Raw n8n createPodcast response:', result);
        
        // Extract podcast ID from n8n response - check multiple possible locations
        let podcastId = result.podcastId || 
                       result.podcast?.id || 
                       result.id || 
                       result.megaphone_id ||
                       result.supabasePodcast?.megaphone_id ||
                       result.podcast?.megaphone_id;
        
        console.log('🎯 Extracted podcast ID:', podcastId);
        
        // Update result to ensure podcast ID is available
        result.podcastId = podcastId;
        
        // Immediately sync podcast data to ensure it's available for episode creation
        console.log('🔄 Syncing podcast data after creation...');
        try {
          const syncResult = await n8nApi.syncPodcastDataFromMegaphone(userInfo.id);
          if (syncResult.success) {
            console.log('✅ Podcast data synced successfully');
            // Update localStorage immediately to ensure episode creation can find it
            if (syncResult.podcast) {
              localStorage.setItem('currentPodcast', JSON.stringify(syncResult.podcast));
              localStorage.setItem('podcastId', syncResult.podcast.megaphone_id || syncResult.podcast.id);
              console.log('📝 Updated localStorage with fresh podcast data');
            }
          } else {
            console.warn('⚠️ Podcast sync failed but continuing:', syncResult.error);
          }
        } catch (syncError) {
          console.warn('⚠️ Podcast sync error (non-critical):', syncError.message);
        }
        
        toast.success(`Podcast "${podcastFormData.title}" created successfully!`);
      }

      return result;
    } catch (error) {
      this.updateWorkflowStep(workflowId, 'podcast_creation', {
        status: 'failed',
        error: error.message,
        failedAt: new Date()
      });
      throw error;
    }
  }

  /**
   * Step 2: Create Episodes
   */
  async createEpisodes(workflowId, podcastId, selectedVideos, userInfo) {
    console.log(`📺 Step 2: Creating ${selectedVideos.length} episodes...`);
    console.log('🎯 Using podcast ID:', podcastId);
    this.updateWorkflowStatus(workflowId, 'creating_episodes');

    try {
      const workflow = this.workflows.get(workflowId);
      const { distributionType } = workflow.podcastFormData;

      // Validate podcast ID
      if (!podcastId || podcastId === 'undefined' || podcastId === 'null') {
        console.error('❌ Invalid podcast ID:', podcastId);
        throw new Error(`Invalid podcast ID (${podcastId}) - cannot create episodes`);
      }
      
      console.log('✅ Valid podcast ID confirmed for episode creation:', podcastId);

      console.log('📋 Episode creation parameters:', {
        podcastId,
        videoCount: selectedVideos.length,
        userId: userInfo.id,
        distributionType
      });

      const result = await n8nApi.createEpisodes(
        podcastId,
        selectedVideos,
        userInfo.id,
        distributionType
      );
      
      this.updateWorkflowStep(workflowId, 'episode_creation', {
        status: result.success ? 'completed' : 'failed',
        result,
        completedAt: new Date()
      });

      if (result.success) {
        console.log(`✅ ${result.results?.length || 0} episodes created successfully`);
        toast.success(`${result.results?.length || 0} episodes created successfully!`);
      }

      return result;
    } catch (error) {
      this.updateWorkflowStep(workflowId, 'episode_creation', {
        status: 'failed',
        error: error.message,
        failedAt: new Date()
      });
      throw error;
    }
  }

  /**
   * Step 3: Auto-insert Ads
   */
  async autoInsertAds(workflowId, podcastId, userId, adPreferences) {
    console.log('🎯 Step 3: Auto-inserting ads...');
    this.updateWorkflowStatus(workflowId, 'inserting_ads');

    try {
      // Save ad preferences first
      await this.saveAdPreferences(userId, adPreferences);

      // Wait a bit for episodes to be fully processed
      await this.waitForEpisodeProcessing(podcastId, 30000); // 30 seconds max

      const result = await adInsertionService.autoTriggerAdInsertion(
        podcastId,
        userId,
        'automated_workflow',
        adPreferences
      );
      
      this.updateWorkflowStep(workflowId, 'ad_insertion', {
        status: result.success ? 'completed' : 'failed',
        result,
        completedAt: new Date()
      });

      if (result.success) {
        const totalAds = result.summary?.totalAdsScheduled || 0;
        console.log(`✅ ${totalAds} ads scheduled successfully`);
        toast.success(`${totalAds} ads scheduled across your episodes!`);
      }

      return result;
    } catch (error) {
      this.updateWorkflowStep(workflowId, 'ad_insertion', {
        status: 'failed',
        error: error.message,
        failedAt: new Date()
      });
      
      // Don't throw - ad insertion failure shouldn't fail the entire workflow
      console.warn('⚠️ Ad insertion failed, but workflow continues:', error);
      toast.warn('Ad insertion failed, but your podcast and episodes were created successfully');
      
      return {
        success: false,
        error: error.message,
        message: 'Ad insertion failed but podcast created successfully'
      };
    }
  }

  /**
   * Wait for episodes to be processed before inserting ads
   */
  async waitForEpisodeProcessing(podcastId, maxWaitTime = 30000) {
    console.log('⏳ Waiting for episodes to be processed...');
    
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check if episodes are ready (have valid megaphone IDs and are published/scheduled)
        const { data: episodes } = await supabase
          .from('episodes')
          .select('megaphone_episode_id, status')
          .eq('podcast_id', podcastId)
          .not('megaphone_episode_id', 'is', null);

        const publishedEpisodes = episodes?.filter(ep => 
          ep.megaphone_episode_id && ['published', 'scheduled'].includes(ep.status)
        ).length || 0;

        if (publishedEpisodes > 0) {
          console.log(`✅ ${publishedEpisodes} episodes ready for ad insertion`);
          return true;
        }

        console.log(`📺 ${episodes?.length || 0} episodes found, ${publishedEpisodes} ready. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        
      } catch (error) {
        console.warn('⚠️ Error checking episode status:', error);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }
    
    console.log('⏱️ Max wait time reached. Proceeding with ad insertion...');
    return false;
  }

  /**
   * Save ad preferences to Supabase
   */
  async saveAdPreferences(userId, adPreferences) {
    try {
      const { error } = await supabase
        .from('user_ad_preferences')
        .upsert({
          user_id: userId,
          preferences: adPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      console.log('✅ Ad preferences saved to database');
    } catch (error) {
      console.error('❌ Failed to save ad preferences:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Load saved ad preferences
   */
  loadSavedAdPreferences(userId) {
    try {
      // Try localStorage first
      const saved = localStorage.getItem(`adPreferences_${userId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('❌ Failed to load saved ad preferences:', error);
    }
    return null;
  }

  /**
   * Update workflow status
   */
  updateWorkflowStatus(workflowId, status, additionalData = {}) {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.status = status;
      workflow.lastUpdated = new Date();
      Object.assign(workflow, additionalData);
      this.workflows.set(workflowId, workflow);
    }
  }

  /**
   * Update individual workflow step
   */
  updateWorkflowStep(workflowId, stepName, stepData) {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.steps[stepName] = stepData;
      workflow.lastUpdated = new Date();
      this.workflows.set(workflowId, workflow);
    }
  }

  /**
   * Generate workflow summary
   */
  generateWorkflowSummary(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const duration = new Date() - workflow.startTime;
    
    return {
      workflowId,
      status: workflow.status,
      duration: Math.round(duration / 1000), // seconds
      steps: {
        podcastCreated: workflow.steps.podcast_creation?.status === 'completed',
        episodesCreated: workflow.steps.episode_creation?.status === 'completed',
        adsInserted: workflow.steps.ad_insertion?.status === 'completed'
      },
      results: {
        podcastId: workflow.steps.podcast_creation?.result?.podcastId,
        episodeCount: workflow.steps.episode_creation?.result?.results?.length || 0,
        adCount: workflow.steps.ad_insertion?.result?.summary?.totalAdsScheduled || 0
      },
      completedAt: workflow.completedAt || workflow.lastUpdated
    };
  }

  /**
   * Get partial results for failed workflows
   */
  getPartialResults(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    return {
      completedSteps: Object.keys(workflow.steps).filter(
        step => workflow.steps[step].status === 'completed'
      ),
      results: workflow.steps
    };
  }

  /**
   * Show success notification to user
   */
  showSuccessNotification(summary) {
    const { results } = summary;
    let message = '🎉 Your podcast is ready! ';
    
    if (results.episodeCount > 0) {
      message += `${results.episodeCount} episodes created`;
      if (results.adCount > 0) {
        message += ` with ${results.adCount} ads scheduled`;
      }
      message += '.';
    } else {
      message += 'You can now add episodes and configure ads.';
    }

    toast.success(message, {
      position: 'top-center',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }

  /**
   * Cleanup completed/failed workflows (call periodically)
   */
  cleanupOldWorkflows(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [workflowId, workflow] of this.workflows.entries()) {
      if (workflow.startTime < cutoff) {
        this.workflows.delete(workflowId);
        console.log('🧹 Cleaned up old workflow:', workflowId);
      }
    }
  }

  /**
   * Get active workflow for user
   */
  getActiveWorkflow(userId) {
    for (const [workflowId, workflow] of this.workflows.entries()) {
      if (workflow.userInfo?.id === userId && ['started', 'creating_podcast', 'creating_episodes', 'inserting_ads'].includes(workflow.status)) {
        return { workflowId, ...workflow };
      }
    }
    return null;
  }

  /**
   * Cancel active workflow
   */
  cancelWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.status = 'cancelled';
      workflow.cancelledAt = new Date();
      this.workflows.set(workflowId, workflow);
      console.log('❌ Workflow cancelled:', workflowId);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const automatedWorkflow = new AutomatedWorkflow();

// Cleanup old workflows every hour
setInterval(() => {
  automatedWorkflow.cleanupOldWorkflows();
}, 60 * 60 * 1000);

export default automatedWorkflow;