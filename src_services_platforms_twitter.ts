import { BasePlatformService, PostPayload, ScheduledPost, AnalyticsData } from './base-platform';

export class TwitterService extends BasePlatformService {
  private apiEndpoint = 'https://api.twitter.com/2';

  constructor(accountId: string, accessToken: string) {
    super(accountId, accessToken, 'Twitter');
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${this.apiEndpoint}/users/me`, 'GET');
      return !!response.data?.id;
    } catch (error) {
      console.error('Twitter authentication failed:', error);
      return false;
    }
  }

  async publishPost(payload: PostPayload): Promise<{ postId: string; url: string }> {
    const body: any = {
      text: payload.content,
    };

    if (payload.mediaUrls && payload.mediaUrls.length > 0) {
      const mediaIds = await this.uploadMedia(payload.mediaUrls);
      body.media = { media_ids: mediaIds };
    }

    const response = await this.makeRequest(`${this.apiEndpoint}/tweets`, 'POST', body);
    return {
      postId: response.data.id,
      url: `https://twitter.com/i/web/status/${response.data.id}`,
    };
  }

  async schedulePost(payload: ScheduledPost): Promise<{ scheduleId: string }> {
    // Twitter doesn't have native scheduling via API, so we handle this via our scheduler
    throw new Error('Use central scheduler service for Twitter scheduling');
  }

  async getAnalytics(tweetId: string, startDate: Date, endDate: Date): Promise<AnalyticsData> {
    const response = await this.makeRequest(
      `${this.apiEndpoint}/tweets/${tweetId}?tweet.fields=public_metrics`,
      'GET'
    );

    const metrics = response.data.public_metrics;
    return {
      impressions: metrics.impression_count || 0,
      engagement: metrics.like_count + metrics.reply_count + metrics.retweet_count,
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      shares: metrics.retweet_count || 0,
      reach: metrics.impression_count || 0,
    };
  }

  async deletePost(postId: string): Promise<boolean> {
    await this.makeRequest(`${this.apiEndpoint}/tweets/${postId}`, 'DELETE');
    return true;
  }

  async updatePost(postId: string, payload: PostPayload): Promise<boolean> {
    // Twitter doesn't support editing, must delete and repost
    await this.deletePost(postId);
    await this.publishPost(payload);
    return true;
  }

  private async uploadMedia(mediaUrls: string[]): Promise<string[]> {
    // Implementation for media upload
    return [];
  }
}