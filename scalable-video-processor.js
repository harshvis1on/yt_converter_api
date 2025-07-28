// Scalable Video Processing Architecture
// This handles 100+ users with 100-500 videos each

const Queue = require('bull');
const AWS = require('aws-sdk');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Redis-based queue for job management
const videoQueue = new Queue('video processing', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  }
});

// AWS S3 for file storage
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION
});

class ScalableVideoProcessor {
  constructor() {
    this.setupWorkers();
    this.setupMonitoring();
  }

  // Add video to processing queue
  async queueVideo(videoData) {
    const job = await videoQueue.add('process-video', videoData, {
      priority: videoData.priority || 0,
      attempts: 3,
      backoff: 'exponential',
      removeOnComplete: 100,
      removeOnFail: 50
    });

    console.log(`📹 Queued video ${videoData.videoId} for processing (Job: ${job.id})`);
    return job.id;
  }

  // Process multiple videos in batch
  async queueBatch(videos) {
    const jobs = await videoQueue.addBulk(
      videos.map(video => ({
        name: 'process-video',
        data: video,
        opts: {
          priority: video.priority || 0,
          attempts: 3
        }
      }))
    );

    console.log(`🚀 Queued ${jobs.length} videos for batch processing`);
    return jobs.map(job => job.id);
  }

  // Setup worker processes
  setupWorkers() {
    // Configure concurrency based on server capacity
    const concurrency = process.env.WORKER_CONCURRENCY || 5;
    
    videoQueue.process('process-video', concurrency, async (job) => {
      return await this.processVideo(job.data, job);
    });

    // Worker event handlers
    videoQueue.on('completed', (job, result) => {
      console.log(`✅ Video ${job.data.videoId} processed successfully`);
    });

    videoQueue.on('failed', (job, err) => {
      console.error(`❌ Video ${job.data.videoId} failed:`, err.message);
    });

    videoQueue.on('stalled', (job) => {
      console.warn(`⏸️ Video ${job.data.videoId} stalled, retrying...`);
    });
  }

  // Core video processing logic
  async processVideo(videoData, job) {
    const { videoId, userId, distributionType, title, episodeId } = videoData;
    
    try {
      // Update job progress
      await job.progress(10);
      
      // Step 1: Download video using yt-dlp
      const tempDir = `/tmp/videos/${userId}`;
      await fs.mkdir(tempDir, { recursive: true });
      
      const outputPath = path.join(tempDir, `${videoId}.${distributionType === 'audio' ? 'mp3' : 'mp4'}`);
      
      await job.progress(25);
      await this.downloadVideo(videoId, distributionType, outputPath);
      
      // Step 2: Upload to cloud storage
      await job.progress(50);
      const cloudUrl = await this.uploadToCloud(outputPath, videoId, distributionType);
      
      // Step 3: Update Megaphone episode
      await job.progress(75);
      await this.updateMegaphoneEpisode(episodeId, cloudUrl);
      
      // Step 4: Cleanup
      await job.progress(90);
      await fs.unlink(outputPath);
      await fs.rmdir(tempDir, { recursive: true });
      
      await job.progress(100);
      
      return {
        success: true,
        videoId,
        cloudUrl,
        processedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Processing failed for ${videoId}:`, error);
      throw error;
    }
  }

  // Download video using yt-dlp
  async downloadVideo(videoId, distributionType, outputPath) {
    return new Promise((resolve, reject) => {
      const format = distributionType === 'audio' 
        ? 'ba[ext=m4a]/best[ext=m4a]/ba/best'
        : 'bv[ext=mp4][height<=1080]+ba[ext=m4a]/best[ext=mp4]';
      
      const mergeFormat = distributionType === 'audio' ? 'mp3' : 'mp4';
      
      const cmd = [
        'yt-dlp',
        '--user-agent', '"Mozilla/5.0 (Windows NT 10.0; Win64; x64)"',
        '-f', format,
        '--merge-output-format', mergeFormat,
        '--no-playlist',
        '-o', `"${outputPath}"`,
        `"https://youtube.com/watch?v=${videoId}"`
      ].join(' ');

      exec(cmd, { timeout: 600000 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`yt-dlp failed: ${stderr}`));
        } else {
          resolve(outputPath);
        }
      });
    });
  }

  // Upload to cloud storage (S3/GCS/R2)
  async uploadToCloud(filePath, videoId, distributionType) {
    const fileStream = await fs.readFile(filePath);
    const fileName = `episodes/${videoId}.${distributionType === 'audio' ? 'mp3' : 'mp4'}`;
    
    const uploadParams = {
      Bucket: process.env.S3_BUCKET,
      Key: fileName,
      Body: fileStream,
      ContentType: distributionType === 'audio' ? 'audio/mpeg' : 'video/mp4',
      ACL: 'public-read'
    };

    const result = await s3.upload(uploadParams).promise();
    return result.Location;
  }

  // Update Megaphone episode with file URL
  async updateMegaphoneEpisode(episodeId, fileUrl) {
    // Make API call to update Megaphone episode
    const response = await fetch(`https://cms.megaphone.fm/api/episodes/${episodeId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Token token="${process.env.MEGAPHONE_API_TOKEN}"`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        backgroundAudioFileUrl: fileUrl
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update Megaphone episode: ${response.statusText}`);
    }

    return await response.json();
  }

  // Setup monitoring and metrics
  setupMonitoring() {
    setInterval(async () => {
      const waiting = await videoQueue.getWaiting();
      const active = await videoQueue.getActive();
      const completed = await videoQueue.getCompleted();
      const failed = await videoQueue.getFailed();

      console.log(`📊 Queue Status: ${waiting.length} waiting, ${active.length} processing, ${completed.length} completed, ${failed.length} failed`);
    }, 30000); // Every 30 seconds
  }

  // Get queue statistics
  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      videoQueue.getWaiting(),
      videoQueue.getActive(), 
      videoQueue.getCompleted(),
      videoQueue.getFailed()
    ]);

    return {
      waiting: waiting.length,
      processing: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  }
}

module.exports = ScalableVideoProcessor;

// Usage Example:
// const processor = new ScalableVideoProcessor();
// 
// // Queue single video
// await processor.queueVideo({
//   videoId: 'xyz123',
//   userId: 'user123',
//   distributionType: 'audio',
//   title: 'Episode Title',
//   episodeId: 'megaphone_episode_id',
//   priority: 1
// });
//
// // Queue batch of videos
// await processor.queueBatch(videoArray);