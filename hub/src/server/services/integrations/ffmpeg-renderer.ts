/**
 * FFmpeg-based video renderer for Neural Beat pipeline.
 * Replaces Creatomate API with local FFmpeg rendering — zero API cost.
 *
 * Creates music videos with:
 *   - Multiple images scaled to 1080p
 *   - Varied xfade transitions between images (fade, dissolve, wipe, etc.)
 *   - Audio track overlay (determines video duration)
 *   - Title/subtitle text overlay with fade-in/out (when drawtext is available)
 *   - 1080p MP4 output with H.264 + AAC encoding
 *
 * Render time: ~30-90 seconds for a 3.5-minute video (vs hours with zoompan)
 * Cost: $0
 */

import { spawn } from 'child_process';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

// ─── FFmpeg binary resolution ────────────────────────────────
// Strategy:
// 1. Local dev: use node_modules/ffmpeg-static/ffmpeg (installed via npm)
// 2. Vercel warm: use /tmp/ffmpeg (cached from previous invocation)
// 3. Vercel cold: download ffmpeg to /tmp from GitHub releases (~70 MB, ~5-10s)
// 4. Fallback: system PATH
//
// We do NOT bundle ffmpeg in the serverless function because:
// - The binary is ~43 MB which, combined with other deps, exceeds Vercel's 250 MB limit
// - Instead, we download it on cold start and cache in /tmp (persists across warm invocations)

const FFMPEG_TMP_PATH = path.join(os.tmpdir(), 'ffmpeg');
// ffmpeg-static v5.3.0 uses release tag b6.1.1
const FFMPEG_RELEASE_TAG = 'b6.1.1';
const FFMPEG_DOWNLOAD_URL = `https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-linux-x64`;

let _ffmpegPath: string | null = null;

/**
 * Ensure ffmpeg binary is available. Downloads to /tmp on Vercel cold start.
 * Cached across warm invocations.
 */
async function ensureFFmpeg(): Promise<string> {
  // Return cached path if already resolved
  if (_ffmpegPath) return _ffmpegPath;

  // Priority 1: Environment variable override
  if (process.env.FFMPEG_PATH) {
    _ffmpegPath = process.env.FFMPEG_PATH;
    return _ffmpegPath;
  }

  // Priority 2: Local node_modules binary (development)
  const localPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
  if (fsSync.existsSync(localPath)) {
    try { fsSync.chmodSync(localPath, 0o755); } catch {}
    console.log(`[FFmpeg] Using local binary: ${localPath}`);
    _ffmpegPath = localPath;
    return _ffmpegPath;
  }

  // Priority 3: Cached in /tmp (Vercel warm invocation)
  if (fsSync.existsSync(FFMPEG_TMP_PATH)) {
    console.log(`[FFmpeg] Using cached /tmp binary`);
    _ffmpegPath = FFMPEG_TMP_PATH;
    return _ffmpegPath;
  }

  // Priority 4: Download to /tmp (Vercel cold start)
  console.log(`[FFmpeg] Downloading binary to /tmp from GitHub releases...`);
  const startTime = Date.now();
  const response = await fetch(FFMPEG_DOWNLOAD_URL, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Failed to download ffmpeg: ${response.status} ${response.statusText} from ${FFMPEG_DOWNLOAD_URL}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fsSync.writeFileSync(FFMPEG_TMP_PATH, buffer);
  fsSync.chmodSync(FFMPEG_TMP_PATH, 0o755);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[FFmpeg] Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB in ${elapsed}s`);
  _ffmpegPath = FFMPEG_TMP_PATH;
  return _ffmpegPath;
}

// Synchronous path for functions that already ensured ffmpeg
function getFFmpegPath(): string {
  if (!_ffmpegPath) throw new Error('FFmpeg not initialized — call ensureFFmpeg() first');
  return _ffmpegPath;
}

// ─── Constants ──────────────────────────────────────────────

const FPS = 30;
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;
const FADE_DURATION = 1.5; // crossfade overlap in seconds

// Fonts for text overlay (tried in order, first found is used)
const FONT_PATHS = [
  '/System/Library/Fonts/Supplemental/Arial Bold.ttf',       // macOS
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',    // Ubuntu/Debian
  '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',      // Other Linux
  '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',                 // Arch Linux
];

// Varied transition effects for visual interest (cycled through images)
const XFADE_TRANSITIONS = [
  'fade',           // Classic fade
  'dissolve',       // Dissolve (noise-based)
  'smoothleft',     // Smooth slide left
  'circleopen',     // Circle reveal
  'wiperight',      // Wipe right
  'fadeblack',       // Fade through black
  'smoothup',       // Smooth slide up
  'smoothright',    // Smooth slide right
  'wipedown',       // Wipe down
];

// ─── Types ──────────────────────────────────────────────────

export interface FFmpegRenderOptions {
  /** URL to the audio file (MP3/WAV/etc.) */
  audioUrl: string;
  /** Local file paths to images for the slideshow */
  imagePaths: string[];
  /** Song title (displayed as overlay for first 8 seconds) */
  title?: string;
  /** Artist name / subtitle */
  subtitle?: string;
  /** Known audio duration in seconds (skips duration detection if provided) */
  duration?: number;
}

export interface FFmpegRenderResult {
  /** Path to the rendered MP4 file */
  videoPath: string;
  /** Video file as a Buffer (ready for YouTube upload) */
  videoBuffer: Buffer;
  /** Actual video duration in seconds */
  durationSeconds: number;
}

// ─── Utilities ──────────────────────────────────────────────

/**
 * Get audio duration using ffmpeg (no ffprobe needed).
 * Runs `ffmpeg -i <file>` which outputs format info to stderr,
 * then parses the "Duration: HH:MM:SS.cs" line.
 */
async function getAudioDuration(audioPath: string): Promise<number> {
  // ffmpeg -i <file> exits with code 1 (no output specified), but stderr has the info
  let stderr = '';
  try {
    await execFileAsync(getFFmpegPath(), ['-i', audioPath, '-hide_banner', '-f', 'null', '-']);
  } catch (err: any) {
    stderr = err.stderr || '';
  }

  // Parse "Duration: 00:03:30.12" from stderr
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
  if (match) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]);
    const centiseconds = parseInt(match[4]);
    return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
  }

  throw new Error(`Could not determine audio duration from ${audioPath} (ffmpeg stderr: ${stderr.substring(0, 200)})`);
}

/**
 * Download a URL to a local file.
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  console.log(`[FFmpeg] Downloading: ${url.substring(0, 80)}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destPath, buffer);
  console.log(`[FFmpeg] Downloaded: ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);
}

/**
 * Find a font file that exists on this system.
 */
async function findFontPath(): Promise<string | null> {
  for (const fontPath of FONT_PATHS) {
    try {
      await fs.access(fontPath);
      return fontPath;
    } catch {
      // Try next font
    }
  }
  return null;
}

/**
 * Check if FFmpeg has the drawtext filter available.
 * (Requires FFmpeg built with libfreetype)
 */
async function hasDrawtextFilter(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(getFFmpegPath(), ['-filters']);
    return stdout.includes('drawtext');
  } catch {
    return false;
  }
}

/**
 * Escape text for FFmpeg drawtext filter.
 */
function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, '\\\\\\\\')
    .replace(/'/g, "'\\\\\\''")
    .replace(/:/g, '\\\\:')
    .replace(/;/g, '\\\\;')
    .replace(/%/g, '%%');
}

// ─── Filter Graph Builder ───────────────────────────────────

/**
 * Build the FFmpeg filter_complex string for a multi-image slideshow.
 *
 * The filter graph:
 *   1. Scale each image to exactly 1920x1080 (cover + crop)
 *   2. Chain images with varied xfade transitions (fade, dissolve, wipe, circle, etc.)
 *   3. Optionally add title/subtitle text overlay (if drawtext available)
 *
 * This approach renders in ~30-90 seconds for a 3.5-minute video.
 */
function buildFilterGraph(
  imageCount: number,
  segmentDuration: number,
  options: { title?: string; subtitle?: string; fontPath?: string | null; hasDrawtext?: boolean }
): { filterGraph: string; finalLabel: string } {
  const filters: string[] = [];

  // ── Step 1: Scale each image to 1920x1080 ──
  for (let i = 0; i < imageCount; i++) {
    filters.push(
      `[${i}:v]scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:force_original_aspect_ratio=increase,` +
      `crop=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT},setsar=1[v${i}]`
    );
  }

  // ── Step 2: Chain xfade transitions ──
  let finalLabel: string;
  if (imageCount === 1) {
    finalLabel = 'v0';
  } else {
    let prevLabel = 'v0';
    for (let i = 1; i < imageCount; i++) {
      // Each xfade reduces total duration by FADE_DURATION
      // offset = accumulated video duration minus accumulated fades
      const offset = i * segmentDuration - i * FADE_DURATION;
      const outLabel = i < imageCount - 1 ? `xf${i}` : 'vout';
      const transition = XFADE_TRANSITIONS[(i - 1) % XFADE_TRANSITIONS.length];
      filters.push(
        `[${prevLabel}][v${i}]xfade=transition=${transition}:duration=${FADE_DURATION}:offset=${offset.toFixed(2)}[${outLabel}]`
      );
      prevLabel = outLabel;
    }
    finalLabel = 'vout';
  }

  // ── Step 3: Text overlays (optional, requires drawtext filter + font) ──
  if (options.title && options.fontPath && options.hasDrawtext) {
    const escapedTitle = escapeDrawtext(options.title);
    filters.push(
      `[${finalLabel}]drawtext=` +
      `text='${escapedTitle}':` +
      `fontfile='${options.fontPath}':` +
      `fontsize=60:fontcolor=white:` +
      `borderw=3:bordercolor=black:` +
      `x=(w-text_w)/2:y=h*0.72:` +
      `enable='between(t\\,1\\,9)':` +
      `alpha='if(lt(t\\,2)\\,t-1\\,if(gt(t\\,8)\\,9-t\\,1))'[titled]`
    );
    finalLabel = 'titled';

    if (options.subtitle) {
      const escapedSubtitle = escapeDrawtext(options.subtitle);
      filters.push(
        `[${finalLabel}]drawtext=` +
        `text='${escapedSubtitle}':` +
        `fontfile='${options.fontPath}':` +
        `fontsize=40:fontcolor=white@0.85:` +
        `borderw=2:bordercolor=black@0.6:` +
        `x=(w-text_w)/2:y=h*0.82:` +
        `enable='between(t\\,1.5\\,8.5)':` +
        `alpha='if(lt(t\\,2.5)\\,t-1.5\\,if(gt(t\\,7.5)\\,8.5-t\\,1))'[subtitled]`
      );
      finalLabel = 'subtitled';
    }
  }

  return {
    filterGraph: filters.join(';\n'),
    finalLabel,
  };
}

// ─── Main Render Function ───────────────────────────────────

/**
 * Render a music video using FFmpeg.
 *
 * Creates a slideshow with varied xfade transitions, audio overlay,
 * and optional text overlays. Returns the video as both a file path and buffer.
 *
 * Cost: $0 (runs locally using FFmpeg)
 * Typical render time: 30-90 seconds for a 3.5-minute 1080p video
 */
export async function renderVideo(options: FFmpegRenderOptions): Promise<FFmpegRenderResult> {
  const imageCount = options.imagePaths.length;
  if (imageCount === 0) {
    throw new Error('At least one image is required');
  }

  // Ensure ffmpeg binary is available (downloads on Vercel cold start)
  await ensureFFmpeg();

  // Create temp directory for working files
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'neural-beat-'));
  console.log(`[FFmpeg] Working directory: ${tempDir}`);

  try {
    // ── Download audio ──
    const audioPath = path.join(tempDir, 'audio.mp3');
    await downloadFile(options.audioUrl, audioPath);

    // ── Get audio duration ──
    const audioDuration = options.duration || await getAudioDuration(audioPath);
    console.log(`[FFmpeg] Audio duration: ${audioDuration.toFixed(1)}s`);

    // ── Calculate segment timing ──
    // Total video = N * segmentDuration - (N-1) * fadeDuration = audioDuration
    // => segmentDuration = (audioDuration + (N-1) * fadeDuration) / N
    const segmentDuration = imageCount > 1
      ? (audioDuration + (imageCount - 1) * FADE_DURATION) / imageCount
      : audioDuration;
    console.log(`[FFmpeg] ${imageCount} images × ${segmentDuration.toFixed(1)}s segments`);

    // ── Check text overlay support ──
    const canDrawtext = await hasDrawtextFilter();
    const fontPath = canDrawtext ? await findFontPath() : null;
    if (options.title && !canDrawtext) {
      console.warn('[FFmpeg] drawtext filter not available — text overlay skipped (title is in YouTube metadata)');
    }

    // ── Build filter graph ──
    const { filterGraph, finalLabel } = buildFilterGraph(
      imageCount,
      segmentDuration,
      { title: options.title, subtitle: options.subtitle, fontPath, hasDrawtext: canDrawtext },
    );

    // Write filter graph to file (avoids shell escaping issues)
    const filterPath = path.join(tempDir, 'filter.txt');
    await fs.writeFile(filterPath, filterGraph, 'utf-8');
    console.log('[FFmpeg] Filter graph written');

    // ── Build FFmpeg command ──
    const outputPath = path.join(tempDir, 'output.mp4');
    const args: string[] = [];

    // Image inputs — each looped for segmentDuration
    for (const imgPath of options.imagePaths) {
      args.push(
        '-loop', '1',
        '-t', segmentDuration.toFixed(2),
        '-framerate', String(FPS),
        '-i', imgPath,
      );
    }

    // Audio input (last)
    args.push('-i', audioPath);

    // Filter complex from file
    // FFmpeg 8+: -/filter_complex <file>
    // FFmpeg 5-7: -filter_complex_script <file>
    // Detect version to use the right syntax
    let useNewSyntax = false;
    try {
      const { stdout: versionOut } = await execFileAsync(getFFmpegPath(), ['-version']);
      const versionMatch = versionOut.match(/ffmpeg version (\d+)/);
      if (versionMatch && parseInt(versionMatch[1]) >= 8) {
        useNewSyntax = true;
      }
    } catch {}
    args.push(useNewSyntax ? '-/filter_complex' : '-filter_complex_script', filterPath);

    // Map video + audio
    const audioInputIndex = imageCount;
    args.push('-map', `[${finalLabel}]`, '-map', `${audioInputIndex}:a`);

    // Encoding
    args.push(
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-pix_fmt', 'yuv420p',
      '-shortest',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    );

    // ── Execute ──
    console.log('[FFmpeg] Starting render...');
    const startTime = Date.now();

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(getFFmpegPath(), args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stderr = '';
      let lastProgressLog = 0;

      proc.stderr?.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        stderr += text;

        // Log progress every 15 seconds
        const now = Date.now();
        if (now - lastProgressLog > 15000) {
          const timeMatch = text.match(/time=(\d+:\d+:\d+\.\d+)/);
          if (timeMatch) {
            console.log(`[FFmpeg] Progress: ${timeMatch[1]}`);
          }
          lastProgressLog = now;
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          const errorLines = stderr.split('\n').filter(l => l.trim()).slice(-8).join('\n');
          console.error('[FFmpeg] Error output:', stderr.slice(-2000));
          reject(new Error(`FFmpeg exited with code ${code}:\n${errorLines}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`FFmpeg process error: ${err.message}`));
      });
    });

    const renderTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[FFmpeg] ✅ Render complete in ${renderTime}s`);

    // ── Read output ──
    const videoBuffer = await fs.readFile(outputPath);
    const sizeMB = (videoBuffer.length / 1024 / 1024).toFixed(1);
    console.log(`[FFmpeg] Output: ${sizeMB} MB`);

    return {
      videoPath: outputPath,
      videoBuffer,
      durationSeconds: audioDuration,
    };
  } catch (error) {
    // Clean up on failure
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {}
    throw error;
  }
}

// ─── Cleanup ────────────────────────────────────────────────

/**
 * Clean up temporary render files after upload is complete.
 */
export async function cleanupRender(videoPath: string): Promise<void> {
  const tempDir = path.dirname(videoPath);
  if (tempDir.includes('neural-beat-')) {
    try {
      await fs.rm(tempDir, { recursive: true });
      console.log('[FFmpeg] Cleaned up temp directory');
    } catch {
      console.warn('[FFmpeg] Could not clean up temp directory:', tempDir);
    }
  }
}

// ─── Health Check ───────────────────────────────────────────

/**
 * Check if FFmpeg is available on this system.
 * Attempts to download if not available (Vercel cold start).
 */
export async function isAvailable(): Promise<boolean> {
  try {
    const ffmpegPath = await ensureFFmpeg();
    const { stdout } = await execFileAsync(ffmpegPath, ['-version']);
    console.log(`[FFmpeg] Available: ${stdout.split('\n')[0]}`);
    return true;
  } catch (err) {
    console.error('[FFmpeg] isAvailable check failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Check if FFmpeg is configured and available.
 * Returns true optimistically — actual availability is checked by isAvailable().
 * On Vercel, ffmpeg is downloaded at runtime so it's always "configured".
 */
export function isConfigured(): boolean {
  // Always return true — ffmpeg will be downloaded at runtime if needed
  return true;
}
