import { NextRequest, NextResponse } from 'next/server';
import {
  getSongs,
  getSongsWithoutYouTube,
  isConfigured,
  getRecord,
  clearSongFields,
} from '@/server/services/integrations/airtable-client';
import { deleteVideo, extractVideoId } from '@/server/services/integrations/youtube-client';
import { NeuralBeatPipeline } from '@/server/services/pipelines/neural-beat-pipeline';
import type { AirtableSongRecord, PipelineRun } from '@/lib/types';

// Field mapping for the "Make.com Songs" Airtable table
const SONG_FIELD_MAP = {
  trackName: 'Track Name',
  audioFile: 'Audio File',
  youtubeUrl: 'YouTube URL',
  aiMetadata: 'AI Metadata',
  generatedImage: 'Generated Image',
  lastModifiedTime: 'Last Modified Time',
  created: 'Created',
} as const;

function extractAttachmentUrl(field: any): string | undefined {
  if (!field) return undefined;
  if (typeof field === 'string') return field;
  if (Array.isArray(field) && field.length > 0) return field[0].url || undefined;
  return undefined;
}

function mapRawRecordToSong(record: { id: string; fields: Record<string, any> }): AirtableSongRecord {
  const f = record.fields;

  let metadata: Record<string, any> | undefined;
  const rawMeta = f[SONG_FIELD_MAP.aiMetadata];
  if (rawMeta) {
    if (typeof rawMeta === 'string') {
      try { metadata = JSON.parse(rawMeta); } catch { metadata = { raw: rawMeta }; }
    } else {
      metadata = rawMeta;
    }
  }

  return {
    id: record.id,
    title: f[SONG_FIELD_MAP.trackName] || '',
    artist: 'Neural Beat',
    audioUrl: extractAttachmentUrl(f[SONG_FIELD_MAP.audioFile]),
    status: undefined,
    genre: metadata?.genre,
    mood: metadata?.mood,
    bpm: metadata?.bpm,
    imageUrl: extractAttachmentUrl(f[SONG_FIELD_MAP.generatedImage]),
    youtubeUrl: f[SONG_FIELD_MAP.youtubeUrl] || undefined,
    metadata,
    lastModifiedTime: f[SONG_FIELD_MAP.lastModifiedTime],
    createdTime: f[SONG_FIELD_MAP.created],
  };
}

// ─── In-memory pipeline tracking ────────────────────────────────────
// Stores running/completed pipeline results so the frontend can poll.
const activePipelines = new Map<string, {
  recordId: string;
  pipeline: NeuralBeatPipeline;
  startedAt: string;
}>();

// Clean up old entries after 30 minutes
function cleanupOldPipelines() {
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
  activePipelines.forEach((val, key) => {
    if (new Date(val.startedAt).getTime() < thirtyMinAgo && val.pipeline.currentRun?.status !== 'running') {
      activePipelines.delete(key);
    }
  });
}

export async function GET(request: NextRequest) {
  const statusId = request.nextUrl.searchParams.get('statusId');

  // If statusId provided, return pipeline status
  if (statusId) {
    const pipeline = activePipelines.get(statusId);
    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }
    const run = pipeline.pipeline.currentRun;
    return NextResponse.json({
      id: statusId,
      recordId: pipeline.recordId,
      status: run?.status || 'running',
      steps: run?.steps || [],
      output: run?.output || null,
      error: run?.error || null,
      startedAt: pipeline.startedAt,
      completedAt: run?.completedAt || null,
    });
  }

  // Default: list all songs
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
      songs: [],
      total: 0,
      source: 'not-configured',
      message: 'Airtable not configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID for live data.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        songs: [],
        total: 0,
        source: 'error',
        message: error instanceof Error ? error.message : 'Airtable error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { recordId } = body;
    const { auto } = body;

    // Auto-mode: pick the next unpublished song automatically
    if (auto && !recordId) {
      const unpublished = await getSongsWithoutYouTube();
      const withAudio = unpublished.filter((s) => s.audioUrl);
      if (withAudio.length === 0) {
        return NextResponse.json(
          { message: 'No unpublished songs with audio available', status: 'idle' },
          { status: 200 }
        );
      }
      recordId = withAudio[0].id;
    }

    if (!recordId) {
      return NextResponse.json(
        { error: 'recordId is required (or use { auto: true })' },
        { status: 400 }
      );
    }

    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'Airtable is not configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.' },
        { status: 503 }
      );
    }

    // Fetch the song record from Airtable
    const songsTable = process.env.AIRTABLE_SONGS_TABLE || 'Songs';
    const rawRecord = await getRecord(songsTable, recordId);
    const songRecord = mapRawRecordToSong(rawRecord);

    // Generate a pipeline ID
    const pipelineId = `${Date.now()}_${recordId}`;

    // Create and register the pipeline instance
    const pipeline = new NeuralBeatPipeline();
    activePipelines.set(pipelineId, {
      recordId,
      pipeline,
      startedAt: new Date().toISOString(),
    });

    // Fire-and-forget: start the pipeline in the background
    // pipeline.currentRun is updated in real-time during execution,
    // so the GET polling endpoint can return live step progress.
    pipeline.execute(songRecord).then((pipelineRun) => {
      console.log(`[NeuralBeat] Pipeline ${pipelineId} finished: ${pipelineRun.status}`);
    }).catch((err) => {
      console.error(`[NeuralBeat] Pipeline ${pipelineId} crashed:`, err);
    });

    // Clean up old entries periodically
    cleanupOldPipelines();

    // Return immediately with the pipeline ID for polling
    return NextResponse.json(
      {
        id: pipelineId,
        recordId,
        status: 'running',
        message: 'Pipeline started. Poll GET /api/neural-beat?statusId=' + pipelineId + ' for updates.',
      },
      { status: 202 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to trigger Neural Beat processing' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/neural-beat
 * Delete a video from YouTube and clear Airtable fields.
 * Body: { recordId: string, youtubeUrl: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId, youtubeUrl } = body;

    if (!recordId || !youtubeUrl) {
      return NextResponse.json(
        { error: 'recordId and youtubeUrl are required' },
        { status: 400 }
      );
    }

    // 1. Extract video ID from YouTube URL
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: `Could not extract video ID from URL: ${youtubeUrl}` },
        { status: 400 }
      );
    }

    // 2. Delete from YouTube
    try {
      await deleteVideo(videoId);
    } catch (ytError) {
      const msg = ytError instanceof Error ? ytError.message : String(ytError);
      // If video already deleted (404), continue to clear Airtable
      if (!msg.includes('404') && !msg.includes('videoNotFound')) {
        throw new Error(`YouTube delete failed: ${msg}`);
      }
      console.warn(`[NeuralBeat] Video ${videoId} already deleted or not found, clearing Airtable anyway`);
    }

    // 3. Clear Airtable fields (YouTube URL, AI Metadata, Generated Image)
    await clearSongFields(recordId);

    return NextResponse.json({
      success: true,
      message: `Video ${videoId} deleted from YouTube and Airtable fields cleared.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete video' },
      { status: 500 }
    );
  }
}
