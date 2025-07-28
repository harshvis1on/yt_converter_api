// RapidAPI YouTube Conversion Integration
// Handles rate limits: 45 req/min, 160K req/month

const axios = require('axios');
const Queue = require('bull');

class RapidAPIConverter {
  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY;
    this.baseURL = 'https://youtube-mp3-mp4-download.p.rapidapi.com';
    this.rateLimitQueue = new Queue('rapidapi rate limit', {
      redis: { host: 'localhost', port: 6379 }
    });
    
    // Configure rate limiting: 45 requests per minute
    this.setupRateLimiting();
  }

  setupRateLimiting() {
    // Process jobs with rate limiting
    this.rateLimitQueue.process('convert', 1, async (job) => {
      return await this.convertVideo(job.data);
    });

    // Add rate limiting: max 45 jobs per minute
    this.rateLimitQueue.add('convert', {}, {
      repeat: { cron: '* * * * *' }, // Every minute
      removeOnComplete: 100,
      removeOnFail: 50
    });
  }

  // Add video to conversion queue
  async queueConversion(videoId, contentType, title = '') {
    const jobId = `${videoId}_${contentType}_${Date.now()}`;
    
    const job = await this.rateLimitQueue.add('convert', {
      videoId,
      contentType,
      title,
      jobId
    }, {
      attempts: 3,
      backoff: 'exponential',
      delay: this.calculateDelay()
    });

    return {
      success: true,
      jobId: job.id,
      estimatedWaitTime: await this.getEstimatedWaitTime()
    };
  }

  // Calculate delay based on current queue
  async calculateDelay() {
    const waiting = await this.rateLimitQueue.getWaiting();
    const delayMinutes = Math.ceil(waiting.length / 45);
    return delayMinutes * 60 * 1000; // Convert to milliseconds
  }

  // Get estimated wait time
  async getEstimatedWaitTime() {
    const [waiting, active] = await Promise.all([
      this.rateLimitQueue.getWaiting(),
      this.rateLimitQueue.getActive()
    ]);
    
    const totalInQueue = waiting.length + active.length;
    const estimatedMinutes = Math.ceil(totalInQueue / 45);
    
    return {
      queuePosition: totalInQueue,
      estimatedMinutes,
      estimatedTime: new Date(Date.now() + estimatedMinutes * 60 * 1000)
    };
  }

  // Core conversion logic
  async convertVideo({ videoId, contentType, title, jobId }) {
    try {
      const youtubeUrl = `https://youtube.com/watch?v=${videoId}`;
      
      // Step 1: Get download links
      const response = await axios.get(`${this.baseURL}/download`, {
        params: {
          url: youtubeUrl,
          format: contentType === 'audio' ? 'mp3' : 'mp4',
          quality: contentType === 'audio' ? '320' : '1080'
        },
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'youtube-mp3-mp4-download.p.rapidapi.com'
        },
        timeout: 60000
      });

      if (response.data && response.data.download_url) {
        return {
          success: true,
          videoId,
          contentType,
          downloadUrl: response.data.download_url,
          title: response.data.title || title,
          duration: response.data.duration,
          fileSize: response.data.file_size,
          quality: response.data.quality,
          processedAt: new Date().toISOString()
        };
      } else {
        throw new Error('No download URL returned from API');
      }

    } catch (error) {
      console.error(`RapidAPI conversion failed for ${videoId}:`, error.message);
      
      // Handle specific API errors
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded - will retry');
      } else if (error.response?.status === 404) {
        throw new Error('Video not found or unavailable');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied - check API key');
      }
      
      throw error;
    }
  }

  // Get job status
  async getJobStatus(jobId) {
    const job = await this.rateLimitQueue.getJob(jobId);
    
    if (!job) {
      return { status: 'not_found' };
    }

    const status = await job.getState();
    const progress = job.progress();

    return {
      jobId,
      status,
      progress,
      data: job.returnvalue,
      error: job.failedReason,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null
    };
  }

  // Batch conversion with intelligent queuing
  async convertBatch(videos) {
    const results = [];
    
    for (const video of videos) {
      const result = await this.queueConversion(
        video.videoId,
        video.contentType,
        video.title
      );
      results.push(result);
      
      // Small delay between queuing to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: true,
      totalQueued: results.length,
      jobs: results,
      estimatedCompletion: await this.getEstimatedWaitTime()
    };
  }

  // Monitor API usage
  async getUsageStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.rateLimitQueue.getWaiting(),
      this.rateLimitQueue.getActive(),
      this.rateLimitQueue.getCompleted(),
      this.rateLimitQueue.getFailed()
    ]);

    // Estimate monthly usage (rough calculation)
    const dailyAverage = completed.length; // Simplified
    const monthlyEstimate = dailyAverage * 30;

    return {
      queue: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length
      },
      usage: {
        estimatedMonthly: monthlyEstimate,
        remainingQuota: 160000 - monthlyEstimate,
        quotaPercentage: (monthlyEstimate / 160000) * 100
      },
      rateLimits: {
        perMinute: 45,
        currentMinuteUsage: active.length // Simplified
      }
    };
  }
}

module.exports = RapidAPIConverter;

// Usage Examples:
/*
const converter = new RapidAPIConverter();

// Single video conversion
const result = await converter.queueConversion('dQw4w9WgXcQ', 'audio', 'Never Gonna Give You Up');
console.log('Job queued:', result.jobId);

// Check status
const status = await converter.getJobStatus(result.jobId);
console.log('Status:', status);

// Batch conversion
const videos = [
  { videoId: 'video1', contentType: 'audio', title: 'Song 1' },
  { videoId: 'video2', contentType: 'video', title: 'Video 1' }
];

const batchResult = await converter.convertBatch(videos);
console.log('Batch queued:', batchResult);

// Monitor usage
const stats = await converter.getUsageStats();
console.log('API Usage:', stats);
*/