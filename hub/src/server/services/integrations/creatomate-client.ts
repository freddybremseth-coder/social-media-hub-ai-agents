const CREATOMATE_BASE_URL = 'https://api.creatomate.com/v1';

function getConfig() {
  return {
    apiKey: process.env.CREATOMATE_API_KEY || '',
    templateId: process.env.CREATOMATE_TEMPLATE_ID || '',
  };
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getConfig().apiKey}`,
    'Content-Type': 'application/json',
  };
}

export interface RenderOptions {
  templateId?: string;
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
 * Start a video render using Creatomate API.
 * Combines audio + image into a video with optional audio reactivity.
 */
export async function renderVideo(options: RenderOptions): Promise<RenderResult> {
  const { apiKey, templateId } = getConfig();
  if (!apiKey) throw new Error('CREATOMATE_API_KEY is not configured');

  const modifications: Record<string, any> = {};

  if (options.audioUrl) {
    modifications['Audio'] = options.audioUrl;
  }
  if (options.imageUrl) {
    modifications['Image'] = options.imageUrl;
  }
  if (options.imageBase64) {
    modifications['Image'] = `data:image/png;base64,${options.imageBase64}`;
  }
  if (options.title) {
    modifications['Title'] = options.title;
  }
  if (options.subtitle) {
    modifications['Subtitle'] = options.subtitle;
  }

  const body: Record<string, any> = {
    template_id: options.templateId || templateId,
    modifications,
  };

  if (options.outputFormat) {
    body.output_format = options.outputFormat;
  }

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
  const { apiKey, templateId } = getConfig();
  return !!(apiKey && templateId);
}
