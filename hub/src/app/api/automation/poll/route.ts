import { NextResponse } from 'next/server';
import { pollForSongTriggers, pollForBrandVideoTriggers, isConfigured } from '@/server/services/integrations/airtable-client';

const MOCK_TRIGGERS = {
  songs: [
    {
      id: 'rec_mock_song_01',
      title: 'Neon Cascade',
      artist: 'Neural Beat',
      audioUrl: 'https://example.com/audio/neon-cascade.mp3',
      status: 'Trigger' as const,
      genre: 'Synthwave',
      mood: 'energetic',
      bpm: 128,
    },
  ],
  brandVideos: [
    {
      id: 'rec_mock_brand_01',
      brandId: 'zenecohomes',
      title: 'Modern Villa Tour - Biar Heights',
      description: 'Walk-through of newly listed villa with mountain views',
      videoUrl: 'https://example.com/videos/villa-biar.mp4',
      status: 'Trigger' as const,
    },
  ],
};

export async function POST() {
  try {
    if (!isConfigured()) {
      return NextResponse.json({
        songs: MOCK_TRIGGERS.songs,
        brandVideos: MOCK_TRIGGERS.brandVideos,
        totalTriggers: MOCK_TRIGGERS.songs.length + MOCK_TRIGGERS.brandVideos.length,
        source: 'mock',
        message: 'Airtable not configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID. Returning mock triggers.',
      });
    }

    const [songs, brandVideos] = await Promise.all([
      pollForSongTriggers(),
      pollForBrandVideoTriggers(),
    ]);

    return NextResponse.json({
      songs,
      brandVideos,
      totalTriggers: songs.length + brandVideos.length,
      source: 'airtable',
      polledAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to poll for triggers' },
      { status: 500 }
    );
  }
}
