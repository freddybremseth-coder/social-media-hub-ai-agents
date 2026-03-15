import { NextResponse } from 'next/server';
import { getSongsWithoutYouTube, pollForBrandVideoTriggers, isConfigured } from '@/server/services/integrations/airtable-client';

export async function POST() {
  try {
    if (!isConfigured()) {
      return NextResponse.json({
        songs: [],
        brandVideos: [],
        totalTriggers: 0,
        source: 'not-configured',
        message: 'Airtable not configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.',
      });
    }

    // Songs: find records without a YouTube URL (ready for processing)
    // Brand Videos: still uses Status-based polling
    const [songs, brandVideos] = await Promise.all([
      getSongsWithoutYouTube(),
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
