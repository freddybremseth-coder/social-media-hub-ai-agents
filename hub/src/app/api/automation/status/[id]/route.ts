import { NextRequest, NextResponse } from 'next/server';

const MOCK_STATUSES: Record<string, any> = {
  'run_nb_001': {
    id: 'run_nb_001',
    pipelineType: 'neural-beat',
    recordId: 'rec_song_001',
    recordTitle: 'Midnight Pulse',
    status: 'completed',
    progress: 100,
    steps: [
      { name: 'fetch-audio', status: 'completed', duration: '12s', output: 'Audio fetched: 4.2MB, 3:24 duration' },
      { name: 'generate-image', status: 'completed', duration: '45s', output: 'Cover image generated: 1920x1080, cyberpunk aesthetic' },
      { name: 'create-video', status: 'completed', duration: '2m 15s', output: 'Video rendered: 1080p, 3:24 duration, audio-reactive visuals' },
      { name: 'generate-seo', status: 'completed', duration: '8s', output: 'SEO metadata generated: title, description, 15 tags' },
      { name: 'upload-youtube', status: 'completed', duration: '1m 30s', output: 'Uploaded as private. Video ID: dQw4w9WgXcQ' },
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 2500000).toISOString(),
    totalDuration: '4m 50s',
  },
  'run_nb_002': {
    id: 'run_nb_002',
    pipelineType: 'neural-beat',
    recordId: 'rec_song_002',
    recordTitle: 'Solar Drift',
    status: 'running',
    progress: 50,
    steps: [
      { name: 'fetch-audio', status: 'completed', duration: '10s', output: 'Audio fetched: 3.8MB, 2:58 duration' },
      { name: 'generate-image', status: 'completed', duration: '38s', output: 'Cover image generated: 1920x1080, sunset gradient' },
      { name: 'create-video', status: 'in_progress', elapsed: '1m 45s' },
      { name: 'generate-seo', status: 'pending' },
      { name: 'upload-youtube', status: 'pending' },
    ],
    createdAt: new Date(Date.now() - 600000).toISOString(),
    startedAt: new Date(Date.now() - 600000).toISOString(),
  },
  'run_bv_001': {
    id: 'run_bv_001',
    pipelineType: 'brand-video',
    recordId: 'rec_brand_001',
    recordTitle: 'ZenecoHomes - Villa Showcase Biar',
    status: 'completed',
    progress: 100,
    steps: [
      { name: 'fetch-video', status: 'completed', duration: '25s', output: 'Video fetched: 85MB, 2:12 duration' },
      { name: 'generate-seo', status: 'completed', duration: '6s', output: 'SEO metadata generated with YouTube agent' },
      { name: 'upload-youtube', status: 'completed', duration: '2m 10s', output: 'Uploaded as unlisted. Video ID: abc123xyz' },
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 6800000).toISOString(),
    totalDuration: '2m 41s',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const runStatus = MOCK_STATUSES[id];

    if (!runStatus) {
      return NextResponse.json(
        {
          error: `Pipeline run "${id}" not found`,
          availableIds: Object.keys(MOCK_STATUSES),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      run: runStatus,
      source: 'mock',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch pipeline status' },
      { status: 500 }
    );
  }
}
