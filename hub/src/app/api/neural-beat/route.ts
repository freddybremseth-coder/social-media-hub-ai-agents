import { NextRequest, NextResponse } from 'next/server';
import { getSongs, isConfigured } from '@/server/services/integrations/airtable-client';
import { generateId } from '@/lib/utils';

const MOCK_SONGS = [
  {
    id: 'rec_mock_nb_001',
    title: 'Midnight Pulse',
    artist: 'Neural Beat',
    audioUrl: 'https://example.com/audio/midnight-pulse.mp3',
    status: 'Done' as const,
    genre: 'Synthwave',
    mood: 'dark, energetic',
    bpm: 128,
    imageUrl: 'https://example.com/images/midnight-pulse-cover.jpg',
    videoUrl: 'https://example.com/videos/midnight-pulse.mp4',
    youtubeUrl: 'https://www.youtube.com/watch?v=mock001',
    youtubeVideoId: 'mock001',
  },
  {
    id: 'rec_mock_nb_002',
    title: 'Solar Drift',
    artist: 'Neural Beat',
    audioUrl: 'https://example.com/audio/solar-drift.mp3',
    status: 'Processing' as const,
    genre: 'Chillwave',
    mood: 'relaxed, dreamy',
    bpm: 95,
    imageUrl: 'https://example.com/images/solar-drift-cover.jpg',
  },
  {
    id: 'rec_mock_nb_003',
    title: 'Neon Cascade',
    artist: 'Neural Beat',
    audioUrl: 'https://example.com/audio/neon-cascade.mp3',
    status: 'Trigger' as const,
    genre: 'Synthwave',
    mood: 'energetic, uplifting',
    bpm: 135,
  },
  {
    id: 'rec_mock_nb_004',
    title: 'Chrome Horizon',
    artist: 'Neural Beat',
    audioUrl: 'https://example.com/audio/chrome-horizon.mp3',
    status: 'Done' as const,
    genre: 'Retrowave',
    mood: 'nostalgic, powerful',
    bpm: 118,
    imageUrl: 'https://example.com/images/chrome-horizon-cover.jpg',
    videoUrl: 'https://example.com/videos/chrome-horizon.mp4',
    youtubeUrl: 'https://www.youtube.com/watch?v=mock004',
    youtubeVideoId: 'mock004',
  },
  {
    id: 'rec_mock_nb_005',
    title: 'Electric Reverie',
    artist: 'Neural Beat',
    audioUrl: 'https://example.com/audio/electric-reverie.mp3',
    status: 'Done' as const,
    genre: 'Ambient Electronic',
    mood: 'ethereal, contemplative',
    bpm: 90,
    imageUrl: 'https://example.com/images/electric-reverie-cover.jpg',
    videoUrl: 'https://example.com/videos/electric-reverie.mp4',
    youtubeUrl: 'https://www.youtube.com/watch?v=mock005',
    youtubeVideoId: 'mock005',
  },
];

export async function GET() {
  try {
    if (isConfigured()) {
      const songs = await getSongs();
      return NextResponse.json({
        songs,
        total: songs.length,
        source: 'airtable',
      });
    }

    return NextResponse.json({
      songs: MOCK_SONGS,
      total: MOCK_SONGS.length,
      source: 'mock',
      message: 'Airtable not configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID for live data.',
    });
  } catch (error) {
    // Fallback to mock if Airtable call fails
    return NextResponse.json({
      songs: MOCK_SONGS,
      total: MOCK_SONGS.length,
      source: 'mock-fallback',
      message: error instanceof Error ? error.message : 'Airtable error, using mock data',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId } = body;

    if (!recordId) {
      return NextResponse.json(
        { error: 'recordId is required' },
        { status: 400 }
      );
    }

    // Placeholder: In production this would trigger the Neural Beat pipeline
    const result = {
      id: `run_${generateId()}`,
      recordId,
      pipelineType: 'neural-beat',
      status: 'queued',
      message: `Neural Beat processing queued for record ${recordId}. Pipeline will: fetch audio, generate image, create video, generate SEO, upload to YouTube.`,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to trigger Neural Beat processing' },
      { status: 500 }
    );
  }
}
