import { NextRequest, NextResponse } from 'next/server';
import {
  getSongs,
  isConfigured,
  getRecord,
} from '@/server/services/integrations/airtable-client';
import { NeuralBeatPipeline } from '@/server/services/pipelines/neural-beat-pipeline';
import type { AirtableSongRecord } from '@/lib/types';

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
    const { recordId } = body;

    if (!recordId) {
      return NextResponse.json(
        { error: 'recordId is required' },
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

    // Execute the Neural Beat pipeline (runs async in background)
    const pipeline = new NeuralBeatPipeline();
    // Fire-and-forget: start the pipeline without blocking the response
    const pipelinePromise = pipeline.execute(songRecord);

    // In development, await the pipeline so we can return the result.
    // In production, you might want to return immediately and poll for status.
    const pipelineRun = await pipelinePromise;

    return NextResponse.json(
      {
        id: pipelineRun.id,
        recordId,
        pipelineType: 'neural-beat',
        status: pipelineRun.status,
        steps: pipelineRun.steps,
        output: pipelineRun.output,
        error: pipelineRun.error,
        startedAt: pipelineRun.startedAt,
        completedAt: pipelineRun.completedAt,
      },
      { status: pipelineRun.status === 'failed' ? 500 : 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to trigger Neural Beat processing' },
      { status: 500 }
    );
  }
}
