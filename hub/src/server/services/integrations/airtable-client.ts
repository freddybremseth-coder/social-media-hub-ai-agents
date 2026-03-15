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

// ---- Airtable "Make.com Songs" column name mapping ----
// Maps internal field keys to actual Airtable column names in the "Make.com Songs" table.
const SONG_FIELD_MAP = {
  trackName: 'Track Name',
  audioFile: 'Audio File',
  youtubeUrl: 'YouTube URL',
  aiMetadata: 'AI Metadata',
  generatedImage: 'Generated Image',
  lastModifiedTime: 'Last Modified Time',
  created: 'Created',
} as const;

// ---- Song-specific helpers ----

export async function getSongs(maxRecords?: number): Promise<AirtableSongRecord[]> {
  const { songsTable } = getConfig();
  const records = await listRecords(songsTable, undefined, maxRecords);
  return records.map(mapToSongRecord);
}

export async function getSongsWithoutYouTube(): Promise<AirtableSongRecord[]> {
  const { songsTable } = getConfig();
  const records = await listRecords(
    songsTable,
    `{${SONG_FIELD_MAP.youtubeUrl}} = ''`
  );
  return records.map(mapToSongRecord);
}

export async function updateSongStatus(
  recordId: string,
  _status: AirtableSongRecord['status'],
  extraFields?: Record<string, any>
): Promise<void> {
  const { songsTable } = getConfig();
  // The "Make.com Songs" table has no Status column.
  // Translate any known internal keys to proper Airtable column names.
  const airtableFields: Record<string, any> = {};
  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      if (key === 'youtubeUrl') {
        airtableFields[SONG_FIELD_MAP.youtubeUrl] = value;
      } else if (key === 'metadata' || key === 'aiMetadata') {
        airtableFields[SONG_FIELD_MAP.aiMetadata] =
          typeof value === 'string' ? value : JSON.stringify(value);
      } else if (key === 'imageUrl' || key === 'generatedImage') {
        // Airtable attachment fields expect an array of { url } objects
        airtableFields[SONG_FIELD_MAP.generatedImage] = [{ url: value }];
      } else {
        // Pass through any other fields as-is
        airtableFields[key] = value;
      }
    }
  }
  if (Object.keys(airtableFields).length > 0) {
    await updateRecord(songsTable, recordId, airtableFields);
  }
}

/**
 * Update arbitrary fields on a song record, translating internal keys
 * to the correct Airtable column names for the "Make.com Songs" table.
 */
export async function updateSongFields(
  recordId: string,
  fields: Record<string, any>
): Promise<void> {
  const { songsTable } = getConfig();
  const airtableFields: Record<string, any> = {};

  for (const [key, value] of Object.entries(fields)) {
    switch (key) {
      case 'youtubeUrl':
        airtableFields[SONG_FIELD_MAP.youtubeUrl] = value;
        break;
      case 'aiMetadata':
      case 'metadata':
        airtableFields[SONG_FIELD_MAP.aiMetadata] =
          typeof value === 'string' ? value : JSON.stringify(value);
        break;
      case 'imageUrl':
      case 'generatedImage':
        // Airtable attachment fields expect an array of { url } objects
        airtableFields[SONG_FIELD_MAP.generatedImage] = [{ url: value }];
        break;
      case 'title':
      case 'trackName':
        airtableFields[SONG_FIELD_MAP.trackName] = value;
        break;
      default:
        // Pass unknown keys through as-is (in case user adds custom columns)
        airtableFields[key] = value;
        break;
    }
  }

  if (Object.keys(airtableFields).length > 0) {
    await updateRecord(songsTable, recordId, airtableFields);
  }
}

function mapToSongRecord(record: AirtableRecord): AirtableSongRecord {
  const f = record.fields;

  // Parse AI Metadata back from JSON string if present
  let metadata: Record<string, any> | undefined;
  const rawMeta = f[SONG_FIELD_MAP.aiMetadata];
  if (rawMeta) {
    if (typeof rawMeta === 'string') {
      try {
        metadata = JSON.parse(rawMeta);
      } catch {
        metadata = { raw: rawMeta };
      }
    } else {
      metadata = rawMeta;
    }
  }

  return {
    id: record.id,
    title: f[SONG_FIELD_MAP.trackName] || '',
    artist: 'Neural Beat',
    audioUrl: extractAttachmentUrl(f[SONG_FIELD_MAP.audioFile]),
    status: undefined, // No Status column in this table
    genre: metadata?.genre,
    mood: metadata?.mood,
    bpm: metadata?.bpm,
    imageUrl: extractAttachmentUrl(f[SONG_FIELD_MAP.generatedImage]),
    youtubeUrl: f[SONG_FIELD_MAP.youtubeUrl] || undefined,
    metadata,
    lastModifiedTime: f[SONG_FIELD_MAP.lastModifiedTime],
    createdTime: f[SONG_FIELD_MAP.created] || record.createdTime,
  };
}

/**
 * Clear YouTube URL, AI Metadata, and Generated Image from a song record,
 * effectively resetting it to "ready" state for re-processing.
 */
export async function clearSongFields(recordId: string): Promise<void> {
  const { songsTable } = getConfig();
  await updateRecord(songsTable, recordId, {
    [SONG_FIELD_MAP.youtubeUrl]: '',
    [SONG_FIELD_MAP.aiMetadata]: '',
    // Clear attachment by setting to empty array
    [SONG_FIELD_MAP.generatedImage]: [],
  });
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
