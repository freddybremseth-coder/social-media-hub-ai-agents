import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/utils';

const MOCK_VIDEOS = [
  {
    id: generateId(),
    title: 'Slik kjoper du bolig i Spania i 2026 (Komplett Guide)',
    description: 'Alt du trenger aa vite om boligkjop i Spania. Fra finansiering til ferdig noekkel.',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnailUrl: 'https://img.youtube.com/vi/placeholder1/maxresdefault.jpg',
    viewCount: 12500,
    likeCount: 890,
    commentCount: 145,
    status: 'published',
  },
  {
    id: generateId(),
    title: 'Neural Beat - Midnight Pulse (Official Visualizer)',
    description: 'Official music visualizer for Midnight Pulse by Neural Beat. Produced with AI-powered audio and visuals.',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnailUrl: 'https://img.youtube.com/vi/placeholder2/maxresdefault.jpg',
    viewCount: 8700,
    likeCount: 620,
    commentCount: 78,
    status: 'published',
  },
  {
    id: generateId(),
    title: 'AI Chatbot for Business - Why You Need One in 2026',
    description: 'Discover how AI chatbots can transform your customer service. Featuring Chatgenius.pro demo.',
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnailUrl: 'https://img.youtube.com/vi/placeholder3/maxresdefault.jpg',
    viewCount: 5400,
    likeCount: 310,
    commentCount: 52,
    status: 'published',
  },
  {
    id: generateId(),
    title: 'Fra Olivenlund til Premium Olje - Dona Anna Farm Tour',
    description: 'Bli med paa en eksklusiv tur gjennom olivenlundene paa Dona Anna-gaarden i Spania.',
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnailUrl: 'https://img.youtube.com/vi/placeholder4/maxresdefault.jpg',
    viewCount: 3200,
    likeCount: 245,
    commentCount: 38,
    status: 'published',
  },
  {
    id: generateId(),
    title: '5 Business Lessons from Running 4 Companies Simultaneously',
    description: 'Real talk about multi-business entrepreneurship. What works, what fails, and what I wish I knew.',
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnailUrl: 'https://img.youtube.com/vi/placeholder5/maxresdefault.jpg',
    viewCount: 15800,
    likeCount: 1200,
    commentCount: 210,
    status: 'published',
  },
  {
    id: generateId(),
    title: 'Neural Beat - Solar Drift (Lyric Visualizer)',
    description: 'AI-generated music meets cutting-edge visuals. Solar Drift from Neural Beat.',
    publishedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnailUrl: 'https://img.youtube.com/vi/placeholder6/maxresdefault.jpg',
    viewCount: 6100,
    likeCount: 480,
    commentCount: 65,
    status: 'published',
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      videos: MOCK_VIDEOS,
      total: MOCK_VIDEOS.length,
      source: 'mock',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl, metadata } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'videoUrl is required' },
        { status: 400 }
      );
    }

    // Placeholder: In production this would upload to YouTube via youtube-client
    const result = {
      id: generateId(),
      videoUrl,
      metadata: metadata || {},
      status: 'queued',
      message: 'Video upload queued. YouTube API integration will process this when configured.',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 500 }
    );
  }
}
