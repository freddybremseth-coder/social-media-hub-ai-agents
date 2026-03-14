import { NextRequest, NextResponse } from 'next/server';

const MOCK_LOGS = [
  {
    id: 'log_001',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    level: 'info',
    source: 'automation-engine',
    message: 'Poll cycle started. Checking Airtable for new triggers.',
    metadata: { cycle: 142 },
  },
  {
    id: 'log_002',
    timestamp: new Date(Date.now() - 115000).toISOString(),
    level: 'info',
    source: 'automation-engine',
    message: 'Found 1 song trigger: "Neon Cascade" (rec_mock_song_01)',
    metadata: { recordId: 'rec_mock_song_01', pipelineType: 'neural-beat' },
  },
  {
    id: 'log_003',
    timestamp: new Date(Date.now() - 110000).toISOString(),
    level: 'info',
    source: 'neural-beat-pipeline',
    message: 'Pipeline started for "Neon Cascade". Fetching audio from Airtable attachment.',
    metadata: { runId: 'run_nb_003', step: 'fetch-audio' },
  },
  {
    id: 'log_004',
    timestamp: new Date(Date.now() - 95000).toISOString(),
    level: 'info',
    source: 'neural-beat-pipeline',
    message: 'Audio fetched successfully. Size: 4.8MB, Duration: 3:42',
    metadata: { runId: 'run_nb_003', step: 'fetch-audio' },
  },
  {
    id: 'log_005',
    timestamp: new Date(Date.now() - 90000).toISOString(),
    level: 'info',
    source: 'neural-beat-pipeline',
    message: 'Generating cover image with AI. Prompt derived from song metadata.',
    metadata: { runId: 'run_nb_003', step: 'generate-image' },
  },
  {
    id: 'log_006',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    level: 'warn',
    source: 'neural-beat-pipeline',
    message: 'Image generation took longer than expected (30s). Retrying with fallback model.',
    metadata: { runId: 'run_nb_003', step: 'generate-image', retryCount: 1 },
  },
  {
    id: 'log_007',
    timestamp: new Date(Date.now() - 45000).toISOString(),
    level: 'info',
    source: 'neural-beat-pipeline',
    message: 'Cover image generated successfully on retry. Resolution: 1920x1080',
    metadata: { runId: 'run_nb_003', step: 'generate-image' },
  },
  {
    id: 'log_008',
    timestamp: new Date(Date.now() - 40000).toISOString(),
    level: 'info',
    source: 'youtube-agent',
    message: 'Generating YouTube SEO metadata for "Neon Cascade".',
    metadata: { runId: 'run_nb_003', step: 'generate-seo' },
  },
  {
    id: 'log_009',
    timestamp: new Date(Date.now() - 30000).toISOString(),
    level: 'error',
    source: 'brand-video-pipeline',
    message: 'Failed to upload video "Chatgenius Demo" to YouTube: API quota exceeded. Daily limit reached.',
    metadata: { runId: 'run_bv_002', step: 'upload-youtube', errorCode: 'quotaExceeded' },
  },
  {
    id: 'log_010',
    timestamp: new Date(Date.now() - 15000).toISOString(),
    level: 'info',
    source: 'automation-engine',
    message: 'Poll cycle completed. Processed: 1 song, 0 brand videos. Next poll in 60s.',
    metadata: { cycle: 142, processed: 1, skipped: 0 },
  },
  {
    id: 'log_011',
    timestamp: new Date(Date.now() - 10000).toISOString(),
    level: 'warn',
    source: 'automation-engine',
    message: 'YouTube API quota is at 92% of daily limit. Consider spacing out uploads.',
    metadata: { quotaUsed: 9200, quotaLimit: 10000 },
  },
  {
    id: 'log_012',
    timestamp: new Date(Date.now() - 5000).toISOString(),
    level: 'info',
    source: 'automation-engine',
    message: 'System health check passed. All services operational.',
    metadata: { airtable: 'connected', youtube: 'connected', aiService: 'connected' },
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let filteredLogs = [...MOCK_LOGS];

    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }

    if (source) {
      filteredLogs = filteredLogs.filter((log) => log.source === source);
    }

    filteredLogs = filteredLogs.slice(0, limit);

    return NextResponse.json({
      logs: filteredLogs,
      total: filteredLogs.length,
      source: 'mock',
      filters: { level, source, limit },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch automation logs' },
      { status: 500 }
    );
  }
}
