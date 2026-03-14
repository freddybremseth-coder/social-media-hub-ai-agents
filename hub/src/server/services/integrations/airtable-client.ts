import type { AirtableRecord, AirtableSongRecord, AirtableBrandVideoRecord } from '@/lib/types';

const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0';

function getConfig() {
  return {
    apiKey: process.env.AIRTABLE_API_KEY || '',
    baseId: process.env.AIRTABLE_BASE_ID || '',
    songsTable: process.env.AIRTABLE_SONGS_TABLE || 'Songs',
    brandVideosTable: process.env.AIRTABLE_BRAND_VIDEOS_TABLE || 'BrandVideos',
  };
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getConfig().apiKey}`,
    'Content-Type': 'application/json',
  };
}

function buildUrl(tableName: string, params?: Record<string, string>): string {
  const { baseId } = getConfig();
  const url = new URL(`${AIRTABLE_BASE_URL}/${baseId}/${tableName}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  return url.toString();
}

// ---- Generic CRUD ----

export async function listRecords(
  tableName: string,
  filterByFormula?: string,
  maxRecords?: number
): Promise<AirtableRecord[]> {
  const params: Record<string, string> = {};
  if (filterByFormula) params.filterByFormula = filterByFormula;
  if (maxRecords) params.maxRecords = String(maxRecords);

  const res = await fetch(buildUrl(tableName, params), { headers: headers() });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Airtable listRecords failed: ${res.status} ${error}`);
  }
  const data = await res.json();
  return data.records || [];
}

export async function getRecord(tableName: string, recordId: string): Promise<AirtableRecord> {
  const res = await fetch(`${AIRTABLE_BASE_URL}/${getConfig().baseId}/${tableName}/${recordId}`, {
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Airtable getRecord failed: ${res.status}`);
  }
  return res.json();
}

export async function updateRecord(
  tableName: string,
  recordId: string,
  fields: Record<string, any>
): Promise<AirtableRecord> {
  const res = await fetch(`${AIRTABLE_BASE_URL}/${getConfig().baseId}/${tableName}/${recordId}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Airtable updateRecord failed: ${res.status} ${error}`);
  }
  return res.json();
}

export async function createRecord(
  tableName: string,
  fields: Record<string, any>
): Promise<AirtableRecord> {
  const res = await fetch(buildUrl(tableName), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`Airtable createRecord failed: ${res.status}`);
  }
  return res.json();
}

// ---- Song-specific helpers ----

export async function pollForSongTriggers(): Promise<AirtableSongRecord[]> {
  const { songsTable } = getConfig();
  const records = await listRecords(songsTable, '{Status} = "Trigger"');
  return records.map(mapToSongRecord);
}

export async function updateSongStatus(
  recordId: string,
  status: AirtableSongRecord['status'],
  extraFields?: Record<string, any>
): Promise<void> {
  const { songsTable } = getConfig();
  await updateRecord(songsTable, recordId, { Status: status, ...extraFields });
}

export async function getSongs(maxRecords?: number): Promise<AirtableSongRecord[]> {
  const { songsTable } = getConfig();
  const records = await listRecords(songsTable, undefined, maxRecords);
  return records.map(mapToSongRecord);
}

function mapToSongRecord(record: AirtableRecord): AirtableSongRecord {
  const f = record.fields;
  return {
    id: record.id,
    title: f.Title || f.Name || f.title || '',
    artist: f.Artist || f.artist || 'Neural Beat',
    audioUrl: extractAttachmentUrl(f.Audio || f.AudioFile || f['Audio File']),
    status: f.Status || 'Trigger',
    genre: f.Genre || f.genre,
    mood: f.Mood || f.mood,
    bpm: f.BPM || f.bpm,
    imageUrl: extractAttachmentUrl(f.Image || f.CoverImage),
    imagePrompt: f.ImagePrompt || f['Image Prompt'],
    videoUrl: f.VideoUrl || f['Video URL'],
    youtubeUrl: f.YouTubeUrl || f['YouTube URL'],
    youtubeVideoId: f.YouTubeVideoId || f['YouTube Video ID'],
    errorMessage: f.ErrorMessage || f.Error,
  };
}

// ---- Brand Video helpers ----

export async function pollForBrandVideoTriggers(): Promise<AirtableBrandVideoRecord[]> {
  const { brandVideosTable } = getConfig();
  const records = await listRecords(brandVideosTable, '{Status} = "Trigger"');
  return records.map(mapToBrandVideoRecord);
}

export async function updateBrandVideoStatus(
  recordId: string,
  status: AirtableBrandVideoRecord['status'],
  extraFields?: Record<string, any>
): Promise<void> {
  const { brandVideosTable } = getConfig();
  await updateRecord(brandVideosTable, recordId, { Status: status, ...extraFields });
}

function mapToBrandVideoRecord(record: AirtableRecord): AirtableBrandVideoRecord {
  const f = record.fields;
  return {
    id: record.id,
    brandId: f.BrandId || f.Brand || f.brand || '',
    title: f.Title || f.Name || '',
    description: f.Description || f.description,
    videoUrl: extractAttachmentUrl(f.Video || f.VideoFile || f['Video File']),
    status: f.Status || 'Trigger',
    youtubeUrl: f.YouTubeUrl || f['YouTube URL'],
    tags: f.Tags ? (Array.isArray(f.Tags) ? f.Tags : f.Tags.split(',').map((t: string) => t.trim())) : undefined,
    channelId: f.ChannelId || f['Channel ID'],
  };
}

// ---- Utility ----

function extractAttachmentUrl(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (Array.isArray(field) && field.length > 0) return field[0].url || '';
  return '';
}

export function isConfigured(): boolean {
  const { apiKey, baseId } = getConfig();
  return !!(apiKey && baseId);
}
