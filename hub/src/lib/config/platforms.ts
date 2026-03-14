export interface PlatformConfig {
  name: string;
  id: string;
  icon: string;
  color: string;
  apiEndpoint: string;
  credentialsRequired: string[];
  rateLimit: {
    requests: number;
    window: number;
  };
  features: {
    scheduling: boolean;
    analytics: boolean;
    crossPosting: boolean;
    mediaSupport: string[];
  };
  maxContentLength: number;
}

export const SUPPORTED_PLATFORMS: Record<string, PlatformConfig> = {
  twitter: {
    name: 'Twitter/X',
    id: 'twitter',
    icon: 'Twitter',
    color: '#1DA1F2',
    apiEndpoint: 'https://api.twitter.com/2',
    credentialsRequired: ['apiKey', 'apiSecret', 'accessToken', 'accessTokenSecret'],
    rateLimit: { requests: 450, window: 900 },
    features: {
      scheduling: true,
      analytics: true,
      crossPosting: true,
      mediaSupport: ['image', 'video', 'gif'],
    },
    maxContentLength: 280,
  },
  instagram: {
    name: 'Instagram',
    id: 'instagram',
    icon: 'Instagram',
    color: '#E4405F',
    apiEndpoint: 'https://graph.instagram.com/v18.0',
    credentialsRequired: ['accessToken', 'businessAccountId'],
    rateLimit: { requests: 200, window: 3600 },
    features: {
      scheduling: true,
      analytics: true,
      crossPosting: true,
      mediaSupport: ['image', 'video', 'carousel'],
    },
    maxContentLength: 2200,
  },
  facebook: {
    name: 'Facebook',
    id: 'facebook',
    icon: 'Facebook',
    color: '#1877F2',
    apiEndpoint: 'https://graph.facebook.com/v18.0',
    credentialsRequired: ['accessToken', 'pageId'],
    rateLimit: { requests: 200, window: 3600 },
    features: {
      scheduling: true,
      analytics: true,
      crossPosting: true,
      mediaSupport: ['image', 'video', 'link'],
    },
    maxContentLength: 63206,
  },
  linkedin: {
    name: 'LinkedIn',
    id: 'linkedin',
    icon: 'Linkedin',
    color: '#0A66C2',
    apiEndpoint: 'https://api.linkedin.com/v2',
    credentialsRequired: ['accessToken', 'organizationId'],
    rateLimit: { requests: 100, window: 3600 },
    features: {
      scheduling: true,
      analytics: true,
      crossPosting: true,
      mediaSupport: ['image', 'document', 'video'],
    },
    maxContentLength: 3000,
  },
  tiktok: {
    name: 'TikTok',
    id: 'tiktok',
    icon: 'Music',
    color: '#000000',
    apiEndpoint: 'https://open.tiktokapis.com/v1',
    credentialsRequired: ['accessToken', 'businessAccountId'],
    rateLimit: { requests: 100, window: 3600 },
    features: {
      scheduling: true,
      analytics: true,
      crossPosting: false,
      mediaSupport: ['video'],
    },
    maxContentLength: 2200,
  },
  youtube: {
    name: 'YouTube',
    id: 'youtube',
    icon: 'Youtube',
    color: '#FF0000',
    apiEndpoint: 'https://www.googleapis.com/youtube/v3',
    credentialsRequired: ['apiKey', 'clientId', 'clientSecret', 'refreshToken'],
    rateLimit: { requests: 10000, window: 86400 },
    features: {
      scheduling: true,
      analytics: true,
      crossPosting: false,
      mediaSupport: ['video', 'short'],
    },
    maxContentLength: 5000,
  },
};

export const PLATFORM_LIST = Object.values(SUPPORTED_PLATFORMS);
