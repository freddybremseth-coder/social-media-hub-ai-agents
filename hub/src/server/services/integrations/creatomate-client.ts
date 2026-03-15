const CREATOMATE_BASE_URL = 'https://api.creatomate.com/v1';

function getConfig() {
  return {
    apiKey: process.env.CREATOMATE_API_KEY || '',
  };
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getConfig().apiKey}`,
    'Content-Type': 'application/json',
  };
}

export interface RenderOptions {
  audioUrl: string;
  imageUrl?: string;
  imageBase64?: string;
  title?: string;
  subtitle?: string;
  outputFormat?: 'mp4' | 'gif';
  duration?: number;
}

export interface RenderResult {
  id: string;
  status: 'planned' | 'rendering' | 'succeeded' | 'failed';
  url?: string;
  errorMessage?: string;
}

/**
 * Upload a base64 image to tmpfiles.org and return the direct download URL.
 * Used because Creatomate's API has a payload size limit (~1MB)
 * and Gemini-generated images are typically 1-3MB in base64.
 */
export async function uploadImageToTempHost(
  base64Data: string,
  mimeType: string = 'image/png'
): Promise<string> {
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
  const blob = new Blob([buffer], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, `cover.${ext}`);

  console.log('[Creatomate] Uploading image to temp host, size:', Math.round(buffer.length / 1024), 'KB');

  const res = await fetch('https://tmpfiles.org/api/v1/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Image upload failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  if (data.status !== 'success' || !data.data?.url) {
    throw new Error(`Image upload failed: ${JSON.stringify(data)}`);
  }

  // Convert tmpfiles.org URL to direct download URL
  // e.g., http://tmpfiles.org/12345/cover.png -> http://tmpfiles.org/dl/12345/cover.png
  const directUrl = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
  console.log('[Creatomate] Image uploaded:', directUrl);
  return directUrl;
}

/**
 * Resolve the image source for rendering.
 * If base64 is provided, uploads to temp host to avoid payload size limits.
 * If URL is provided, uses it directly (unless it's a data: URL, which gets uploaded too).
 */
async function resolveImageSource(options: RenderOptions): Promise<string | undefined> {
  if (options.imageBase64) {
    return uploadImageToTempHost(options.imageBase64);
  }

  if (options.imageUrl) {
    // If it's a data URL, extract base64 and upload
    if (options.imageUrl.startsWith('data:')) {
      const match = options.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return uploadImageToTempHost(match[2], match[1]);
      }
    }
    return options.imageUrl;
  }

  return undefined;
}

/**
 * Build a source-based video composition JSON.
 * Creates a music video with: background image + audio + optional text overlays.
 * Uses source-based rendering (no template needed).
 */
function buildMusicVideoSource(
  options: RenderOptions,
  resolvedImageUrl?: string
): Record<string, any> {
  const elements: Record<string, any>[] = [];

  // 1. Background image (full screen with slow zoom effect)
  if (resolvedImageUrl) {
    elements.push({
      type: 'image',
      track: 1,
      source: resolvedImageUrl,
      width: '100%',
      height: '100%',
      fit: 'cover',
      // Slow Ken Burns zoom effect
      x_scale: [
        { time: 0, value: '100%' },
        { time: 'end', value: '110%', easing: 'linear' },
      ],
      y_scale: [
        { time: 0, value: '100%' },
        { time: 'end', value: '110%', easing: 'linear' },
      ],
    });
  }

  // 2. Audio track (determines video duration)
  // Omit duration entirely to use the full audio file length
  const audioElement: Record<string, any> = {
    type: 'audio',
    track: 2,
    source: options.audioUrl,
    audio_fade_out: 3, // 3 second fade out at end
  };
  if (options.duration) {
    audioElement.duration = options.duration;
  }
  elements.push(audioElement);

  // 3. Title text overlay (bottom-center, appears after 1s)
  if (options.title) {
    elements.push({
      type: 'text',
      track: 3,
      text: options.title,
      time: 1,
      duration: 8,
      y: '72%',
      width: '80%',
      height: '15%',
      x_alignment: '50%',
      y_alignment: '50%',
      fill_color: '#ffffff',
      font_size: '5.5 vmin',
      font_weight: '800',
      shadow_color: 'rgba(0,0,0,0.8)',
      shadow_blur: 8,
      shadow_x: 0,
      shadow_y: 2,
      animations: [
        {
          type: 'text-slide',
          duration: 0.8,
          easing: 'quadratic-out',
          direction: 'up',
          split: 'word',
        },
        {
          time: 'end',
          type: 'fade',
          duration: 1,
          reversed: true,
        },
      ],
    });
  }

  // 4. Subtitle text overlay (below title)
  if (options.subtitle) {
    elements.push({
      type: 'text',
      track: 4,
      text: options.subtitle,
      time: 1.5,
      duration: 7,
      y: '82%',
      width: '70%',
      height: '8%',
      x_alignment: '50%',
      y_alignment: '50%',
      fill_color: 'rgba(255,255,255,0.85)',
      font_size: '3.5 vmin',
      font_weight: '500',
      shadow_color: 'rgba(0,0,0,0.6)',
      shadow_blur: 6,
      shadow_x: 0,
      shadow_y: 1,
      animations: [
        {
          type: 'fade',
          duration: 0.6,
          easing: 'quadratic-out',
        },
        {
          time: 'end',
          type: 'fade',
          duration: 1,
          reversed: true,
        },
      ],
    });
  }

  return {
    width: 1920,
    height: 1080,
    output_format: options.outputFormat || 'mp4',
    elements,
  };
}

/**
 * Start a video render using Creatomate API.
 * Uses source-based rendering to create a music video
 * with image background, audio, and text overlays.
 *
 * Images are automatically uploaded to a temp host to avoid
 * Creatomate's API payload size limit.
 */
export async function renderVideo(options: RenderOptions): Promise<RenderResult> {
  const { apiKey } = getConfig();
  if (!apiKey) throw new Error('CREATOMATE_API_KEY is not configured');

  // Resolve image (upload base64/data URLs to temp host)
  const resolvedImageUrl = await resolveImageSource(options);

  const source = buildMusicVideoSource(options, resolvedImageUrl);
  const body: Record<string, any> = { source };

  console.log('[Creatomate] Starting source-based render with', {
    hasImage: !!resolvedImageUrl,
    imageUrl: resolvedImageUrl?.substring(0, 80),
    audioUrl: options.audioUrl?.substring(0, 80) + '...',
    title: options.title,
    subtitle: options.subtitle,
    elementCount: source.elements.length,
  });

  const res = await fetch(`${CREATOMATE_BASE_URL}/renders`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Creatomate render failed: ${res.status} ${error}`);
  }

  const data = await res.json();
  const render = Array.isArray(data) ? data[0] : data;

  return {
    id: render.id,
    status: render.status,
    url: render.url,
    errorMessage: render.error_message,
  };
}

/**
 * Check the status of a render.
 */
export async function getRenderStatus(renderId: string): Promise<RenderResult> {
  const res = await fetch(`${CREATOMATE_BASE_URL}/renders/${renderId}`, {
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`Creatomate getRenderStatus failed: ${res.status}`);
  }

  const render = await res.json();
  return {
    id: render.id,
    status: render.status,
    url: render.url,
    errorMessage: render.error_message,
  };
}

/**
 * Poll for render completion with timeout.
 * Returns the final render result with video URL.
 */
export async function waitForRender(
  renderId: string,
  options?: {
    pollIntervalMs?: number;
    maxWaitMs?: number;
  }
): Promise<RenderResult> {
  const pollInterval = options?.pollIntervalMs || 5000;
  const maxWait = options?.maxWaitMs || 300000; // 5 minutes default
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const result = await getRenderStatus(renderId);

    if (result.status === 'succeeded') {
      return result;
    }

    if (result.status === 'failed') {
      throw new Error(`Creatomate render failed: ${result.errorMessage || 'Unknown error'}`);
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Creatomate render timed out after ${maxWait / 1000}s`);
}

/**
 * Render a video and wait for completion in one call.
 */
export async function renderAndWait(options: RenderOptions): Promise<RenderResult> {
  const render = await renderVideo(options);
  return waitForRender(render.id);
}

export function isConfigured(): boolean {
  const { apiKey } = getConfig();
  return !!apiKey;
}
