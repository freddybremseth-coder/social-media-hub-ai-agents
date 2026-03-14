import cron from 'node-cron';
import { db } from '../database';
import { posts, schedules } from '../database/schema';
import { eq, lte, and } from 'drizzle-orm';
import { TwitterService } from './platforms/twitter';
import { InstagramService } from './platforms/instagram';
// ... other platform services

export class ContentScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private platformServices: Map<string, any> = new Map();

  constructor() {
    this.initializePlatformServices();
  }

  private initializePlatformServices() {
    // Initialize all platform services
    this.platformServices.set('twitter', TwitterService);
    this.platformServices.set('instagram', InstagramService);
    // ... add other platforms
  }

  async startScheduler() {
    console.log('Starting content scheduler...');

    // Check every minute for posts to publish
    const task = cron.schedule('* * * * *', async () => {
      await this.processScheduledPosts();
    });

    this.tasks.set('scheduler', task);
  }

  private async processScheduledPosts() {
    try {
      const now = new Date();
      const scheduledPosts = await db.query.posts.findMany({
        where: and(
          eq(posts.status, 'scheduled'),
          lte(posts.scheduledAt, now)
        ),
      });

      for (const post of scheduledPosts) {
        await this.publishPost(post);
      }
    } catch (error) {
      console.error('Error processing scheduled posts:', error);
    }
  }

  private async publishPost(post: any) {
    try {
      const { platforms, content, mediaUrls, id } = post;

      for (const platform of platforms) {
        const ServiceClass = this.platformServices.get(platform);
        if (!ServiceClass) {
          console.warn(`Platform service not found: ${platform}`);
          continue;
        }

        // Get account credentials from database
        const account = await this.getAccount(post.userId, platform);
        if (!account) {
          console.warn(`No account found for ${platform}`);
          continue;
        }

        const service = new ServiceClass(account.id, account.accessToken);
        const result = await service.publishPost({ content, mediaUrls });

        // Update post record
        await db.update(posts)
          .set({
            status: 'published',
            publishedAt: new Date(),
            metadata: { ...post.metadata, [platform]: result },
          })
          .where(eq(posts.id, id));
      }
    } catch (error) {
      console.error(`Failed to publish post ${post.id}:`, error);
      await db.update(posts)
        .set({ status: 'failed' })
        .where(eq(posts.id, post.id));
    }
  }

  private async getAccount(userId: string, platform: string) {
    // Implementation to fetch account from database
    return null;
  }

  stopScheduler() {
    this.tasks.forEach(task => task.stop());
    this.tasks.clear();
  }
}