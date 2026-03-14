import { NextResponse } from 'next/server';
import { getChannelInfo, isConfigured } from '@/server/services/integrations/youtube-client';

const MOCK_CHANNEL = {
  id: 'UCmock_channel_id',
  title: 'Freddy Bremseth',
  subscriberCount: 4200,
  videoCount: 47,
  viewCount: 185000,
  thumbnailUrl: 'https://yt3.ggpht.com/placeholder/photo.jpg',
  description: 'Entrepreneur, investor, and content creator. Running ZenecoHomes, Chatgenius, Dona Anna Farm, and Neural Beat.',
  customUrl: '@freddybremseth',
  country: 'NO',
};

export async function GET() {
  try {
    if (isConfigured()) {
      const channelInfo = await getChannelInfo();
      return NextResponse.json({ channel: channelInfo, source: 'youtube-api' });
    }

    return NextResponse.json({
      channel: MOCK_CHANNEL,
      source: 'mock',
      message: 'YouTube API not configured. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN.',
    });
  } catch (error) {
    // Fallback to mock if YouTube API call fails
    return NextResponse.json({
      channel: MOCK_CHANNEL,
      source: 'mock-fallback',
      message: error instanceof Error ? error.message : 'YouTube API error, using mock data',
    });
  }
}
