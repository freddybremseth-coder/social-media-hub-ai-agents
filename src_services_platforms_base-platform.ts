export interface PostPayload {
  content: string;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
}

export interface ScheduledPost extends PostPayload {
  scheduledAt: Date;
}

export interface AnalyticsData {
  impressions: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
}

export abstract class BasePlatformService {
  protected accountId: string;
  protected accessToken: string;
  protected platformName: string;

  constructor(accountId: string, accessToken: string, platformName: string) {
    this.accountId = accountId;
    this.accessToken = accessToken;
    this.platformName = platformName;
  }

  abstract authenticate(): Promise<boolean>;
  abstract publishPost(payload: PostPayload): Promise<{ postId: string; url: string }>;
  abstract schedulePost(payload: ScheduledPost): Promise<{ scheduleId: string }>;
  abstract getAnalytics(postId: string, startDate: Date, endDate: Date): Promise<AnalyticsData>;
  abstract deletePost(postId: string): Promise<boolean>;
  abstract updatePost(postId: string, payload: PostPayload): Promise<boolean>;

  protected async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: Record<string, any>
  ) {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`${this.platformName} API Error: ${response.statusText}`);
    }

    return response.json();
  }
}