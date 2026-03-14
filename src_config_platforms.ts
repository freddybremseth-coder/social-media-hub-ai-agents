export interface PlatformConfig {
  name: string;
  apiEndpoint: string;
  credentialsRequired: string[];
  rateLimit: {
    requests: number;
    window: number; // in seconds
  };
  features: {
    scheduling: boolean;
    analytics: boolean;
    crossPosting: boolean;
    mediaSupport: string[];
  };
}

export const SUPPORTED_PLATFORMS: Record<string, PlatformConfig> = {
  twitter: {
    name: 'Twitter/X',
    apiEndpoint: 'https://api.twitter.com/2',
    credentialsRequired: ['apiKey', 'apiSecret', 'accessToken', 'accessTokenSecret'],
    rateLimit: { requests: 450, window: 900 },
    features: {
      scheduling: true,
      analytics: true,
      crossPosting: true,
      mediaSupport: ['image', 'video', 'gif'],
    },
  },
  instagram: {
    name: 'Instagram',
    apiEndpoint: 'https://graph.instagram.com/v18.0',
    credentialsRequired: ['accessToken', 'businessAccountId'],
    rateLimit: { requests: 200, window: 3600 },
    features: {
      scheduling: true,
      analytics: true,
      crossPosting: true,
      mediaSupport: ['image', 'video', 'carousel'],
    },
  },
  facebook: {
    name: 'Facebook',
    apiEndpoint: 'https://graph.facebook.com/v18.0',
    credentialsRequired: ['accessToken', 'pageId'],
    rateLimit: { requests: 200, window: 3600 },
    features: {
      scheduling: true,
      analytics: true,
      crossPosting: true,
      mediaSupport: ['image', 'video', 'link'],
    },
  },
  linkedin: {
    name: 'LinkedIn',
    apiEndpoint: 'https://api.linkedin.com/v2',
    credentialsRequired: ['accessToken', 'organizationId'],
    rateLimit: { requests: 100, window: 3600 },
    features: {
      scheduling: true,
      analytics: true,
      crossPosting: true,
      mediaSupport: ['image', 'document', 'video'],
    },
  },
  tiktok: {
    name: 'TikTok',
    apiEndpoint: 'https://open.tiktokapis.com/v1',
    credentialsRequired: ['accessToken', 'businessAccountId'],
    rateLimit: { requests: 100, window: 3600 },
    features: {
      scheduling: true,
      analytics: true,
      crossPosting: false,
      mediaSupport: ['video'],
    },
  },
};