import { updateSongStatus, updateSongFields, getGenreImages } from '@/server/services/integrations/airtable-client';
import { analyzeSong, generateYouTubeSEO } from '@/server/services/integrations/gemini-client';
import { renderVideo, cleanupRender, isAvailable as isFFmpegAvailable } from '@/server/services/integrations/ffmpeg-renderer';
import { uploadVideo, setThumbnail } from '@/server/services/integrations/youtube-client';
import {
  AirtableSongRecord,
  PipelineRun,
  PipelineStep,
} from '@/lib/types';
import { generateId } from '@/lib/utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const STEP_NAMES = [
  'Update Airtable Status to Processing',
  'Download Audio File',
  'Analyze Song with AI',
  'Generate YouTube SEO Metadata',
  'Fetch Genre Images',
  'Render Video with FFmpeg',
  'Upload to YouTube',
  'Update Airtable with Results',
] as const;

function createStep(name: string, _index: number): PipelineStep {
  return {
    name,
    status: 'pending',
    startedAt: undefined,
    completedAt: undefined,
    error: undefined,
  };
}

function markStepRunning(step: PipelineStep): void {
  step.status = 'in_progress';
  step.startedAt = new Date().toISOString();
}

function markStepCompleted(step: PipelineStep): void {
  step.status = 'completed';
  step.completedAt = new Date().toISOString();
}

function markStepFailed(step: PipelineStep, error: string): void {
  step.status = 'failed';
  step.completedAt = new Date().toISOString();
  step.error = error;
}

function markStepSkipped(step: PipelineStep): void {
  step.status = 'skipped';
}

export class NeuralBeatPipeline {
  /** The live PipelineRun, mutated in place so callers can poll progress. */
  public currentRun: PipelineRun | null = null;

  /** Called after each step update — used by SSE streaming to push progress to client. */
  public onProgress?: (run: PipelineRun) => void;

  async execute(songRecord: AirtableSongRecord): Promise<PipelineRun> {
    // Pre-check: verify FFmpeg is available before starting the pipeline
    const ffmpegOk = await isFFmpegAvailable();
    if (!ffmpegOk) {
      console.error('[NeuralBeatPipeline] FFmpeg is not installed! Pipeline cannot render video.');
      // We still start the pipeline but will fail at step 6 with a clear message
    }

    console.log(`[NeuralBeatPipeline] Starting pipeline for "${songRecord.title}" (FFmpeg: ${ffmpegOk ? 'OK' : 'NOT FOUND'})`);

    const steps: PipelineStep[] = STEP_NAMES.map((name, index) =>
      createStep(name, index)
    );

    const pipelineRun: PipelineRun = {
      id: generateId(),
      type: 'neural-beat',
      status: 'running',
      steps,
      input: songRecord,
      output: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      error: null,
    };

    // Expose the run object so callers can poll for real-time step progress
    this.currentRun = pipelineRun;

    // Notify callback after each state change (used by SSE streaming)
    const notify = () => this.onProgress?.(pipelineRun);

    // Wrap mark functions to auto-notify on each state change
    const stepRunning = (s: PipelineStep) => { markStepRunning(s); notify(); };
    const stepCompleted = (s: PipelineStep) => { markStepCompleted(s); notify(); };
    const stepFailed = (s: PipelineStep, err: string) => { markStepFailed(s, err); notify(); };
    const stepSkipped = (s: PipelineStep) => { markStepSkipped(s); notify(); };

    let currentStepIndex = 0;
    let audioUrl: string | null = null;
    let songAnalysis: Awaited<ReturnType<typeof analyzeSong>> | null = null;
    let youtubeMetadata: Awaited<ReturnType<typeof generateYouTubeSEO>> | null = null;
    let localImagePaths: string[] = [];
    let thumbnailBuffer: Buffer | null = null;
    let videoRenderPath: string | null = null;
    let videoBuffer: Buffer | null = null;
    let youtubeUrl: string | null = null;
    let airtableImageUrl: string | null = null;

    try {
      // Step 1: Update Airtable status to "Processing"
      // Graceful: if this fails (e.g. no Status column), log a warning and continue
      currentStepIndex = 0;
      stepRunning(steps[currentStepIndex]);
      try {
        await updateSongStatus(songRecord.id, 'Processing');
        stepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          '[NeuralBeatPipeline] Step 1: Could not update Airtable status (non-fatal, continuing):',
          message
        );
        // Mark as completed with a note rather than crashing the pipeline
        stepCompleted(steps[currentStepIndex]);
        steps[currentStepIndex].result = `Skipped status update: ${message}`;
      }

      // Step 2: Download audio file
      currentStepIndex = 1;
      stepRunning(steps[currentStepIndex]);
      try {
        audioUrl = songRecord.audioUrl || null;
        if (!audioUrl) {
          throw new Error('No audio URL found in song record');
        }
        // Validate the audio URL is accessible
        const response = await fetch(audioUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Audio file not accessible: HTTP ${response.status}`);
        }
        stepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 2 failed: ${message}`);
      }

      // Step 3: Claude analyzes title/metadata -> genre, style, mood
      currentStepIndex = 2;
      stepRunning(steps[currentStepIndex]);
      try {
        songAnalysis = await analyzeSong({
          title: songRecord.title,
          artist: songRecord.artist,
          audioUrl: audioUrl!,
          metadata: songRecord.metadata || undefined,
        });
        stepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 3 failed: ${message}`);
      }

      // Step 4: Gemini generates YouTube SEO metadata
      currentStepIndex = 3;
      stepRunning(steps[currentStepIndex]);
      try {
        youtubeMetadata = await generateYouTubeSEO({
          title: songRecord.title,
          artist: songRecord.artist,
          genre: songAnalysis!.genre,
          style: songAnalysis!.style,
          mood: songAnalysis!.mood,
        });
        stepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 4 failed: ${message}`);
      }

      // Step 5: Fetch genre-matching images from Airtable (pre-uploaded by user)
      // This replaces Gemini image generation — $0 cost, ~5-10s instead of ~40-60s
      currentStepIndex = 4;
      stepRunning(steps[currentStepIndex]);
      try {
        const imageGenre = songAnalysis!.imageGenre || 'dance';
        console.log(`[NeuralBeatPipeline] Fetching genre images for "${imageGenre}"...`);
        steps[currentStepIndex].result = `Looking for "${imageGenre}" images...`;
        notify();

        const genreImages = await getGenreImages(imageGenre, 20);

        if (genreImages.length === 0) {
          throw new Error(`No images found in Airtable for genre "${imageGenre}" or fallbacks. Please upload images to the "Genre Images" table.`);
        }

        console.log(`[NeuralBeatPipeline] Found ${genreImages.length} images for genre "${imageGenre}"`);
        steps[currentStepIndex].result = `Found ${genreImages.length} images for "${imageGenre}"`;
        notify();

        // Download images to local temp files (parallel for speed)
        const imgTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nb-images-'));
        console.log(`[NeuralBeatPipeline] Downloading ${genreImages.length} images to ${imgTempDir}`);

        const downloadPromises = genreImages.map(async (img, i) => {
          const imgPath = path.join(imgTempDir, `image-${i}.jpg`);
          const response = await fetch(img.imageUrl);
          if (!response.ok) {
            console.warn(`[NeuralBeatPipeline] Failed to download image ${i}: ${response.status}`);
            return null;
          }
          const buffer = Buffer.from(await response.arrayBuffer());
          await fs.writeFile(imgPath, buffer);
          return imgPath;
        });

        const downloadedPaths = await Promise.all(downloadPromises);
        localImagePaths = downloadedPaths.filter((p): p is string => p !== null);

        if (localImagePaths.length === 0) {
          throw new Error('All image downloads failed. Check Airtable image URLs.');
        }

        // Keep first image as buffer for YouTube thumbnail
        try {
          const thumbResponse = await fetch(genreImages[0].imageUrl);
          if (thumbResponse.ok) {
            thumbnailBuffer = Buffer.from(await thumbResponse.arrayBuffer());
          }
        } catch {
          console.warn('[NeuralBeatPipeline] Could not download thumbnail (non-fatal)');
        }

        // Use first image URL for Airtable record (Airtable can link directly)
        airtableImageUrl = genreImages[0].imageUrl;

        console.log(`[NeuralBeatPipeline] ${localImagePaths.length} images ready for rendering`);

        stepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 5 failed: ${message}`);
      }

      // Step 6: FFmpeg renders multi-scene slideshow video (local, $0 cost)
      // Free memory before render — imageSetResult held large base64 strings
      if (global.gc) { try { global.gc(); } catch {} }
      currentStepIndex = 5;
      stepRunning(steps[currentStepIndex]);
      try {
        console.log('[NeuralBeatPipeline] Starting FFmpeg render (local, zero cost)...');
        const renderResult = await renderVideo({
          audioUrl: audioUrl!,
          imagePaths: localImagePaths,
          title: songRecord.title,
          subtitle: songRecord.artist,
          onSegmentProgress: (current, total) => {
            // Update step result with segment progress to keep SSE alive
            steps[currentStepIndex].result = `Encoding segment ${current}/${total}`;
            notify();
          },
        });
        videoRenderPath = renderResult.videoPath;
        videoBuffer = renderResult.videoBuffer;
        console.log(`[NeuralBeatPipeline] Video rendered: ${(renderResult.videoBuffer.length / 1024 / 1024).toFixed(1)} MB`);
        stepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 6 failed: ${message}`);
      }

      // Step 7: Upload video buffer directly to YouTube (no intermediate download)
      currentStepIndex = 6;
      stepRunning(steps[currentStepIndex]);
      try {
        const uploadResult = await uploadVideo(videoBuffer!, {
          title: youtubeMetadata!.title,
          description: youtubeMetadata!.description,
          tags: youtubeMetadata!.tags,
          categoryId: youtubeMetadata!.categoryId,
          privacyStatus: (youtubeMetadata!.privacyStatus as 'public' | 'private' | 'unlisted') || 'public',
        });
        youtubeUrl = uploadResult.youtubeUrl;

        // Try to set custom thumbnail (requires channel verification)
        if (thumbnailBuffer) {
          try {
            await setThumbnail(uploadResult.videoId, thumbnailBuffer);
            console.log('[NeuralBeatPipeline] Custom thumbnail set successfully');
          } catch (e) {
            console.warn('[NeuralBeatPipeline] Could not set custom thumbnail (non-fatal):', e);
          }
        }

        stepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 7 failed: ${message}`);
      }

      // Step 8: Update Airtable with YouTube URL, AI Metadata, and Generated Image
      currentStepIndex = 7;
      stepRunning(steps[currentStepIndex]);
      try {
        await updateSongFields(songRecord.id, {
          youtubeUrl: youtubeUrl!,
          aiMetadata: {
            genre: songAnalysis!.genre,
            style: songAnalysis!.style,
            mood: songAnalysis!.mood,
            bpm: (songAnalysis as any)?.bpm,
            youtubeTitle: youtubeMetadata!.title,
            youtubeDescription: youtubeMetadata!.description,
            tags: youtubeMetadata!.tags,
            renderer: 'ffmpeg',  // Track which renderer was used
            processedAt: new Date().toISOString(),
          },
          ...(airtableImageUrl ? { imageUrl: airtableImageUrl } : {}),
        });
        stepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 8 failed: ${message}`);
      }

      // Pipeline completed successfully
      pipelineRun.status = 'completed';
      pipelineRun.completedAt = new Date().toISOString();
      pipelineRun.output = {
        youtubeUrl,
        songAnalysis,
        youtubeMetadata,
        localImagePaths,
        airtableImageUrl,
      };
      notify();
    } catch (error) {
      // Mark all remaining pending steps as skipped
      for (let i = currentStepIndex + 1; i < steps.length; i++) {
        if (steps[i].status === 'pending') {
          stepSkipped(steps[i]);
        }
      }

      pipelineRun.status = 'failed';
      pipelineRun.completedAt = new Date().toISOString();
      pipelineRun.error = error instanceof Error ? error.message : String(error);
      notify();

      // Try to write error info to Airtable AI Metadata field (graceful)
      try {
        await updateSongFields(songRecord.id, {
          aiMetadata: {
            error: pipelineRun.error,
            failedAt: new Date().toISOString(),
            lastStep: steps[currentStepIndex]?.name,
          },
        });
      } catch (airtableError) {
        console.error(
          '[NeuralBeatPipeline] Failed to update Airtable error metadata:',
          airtableError
        );
      }
    } finally {
      // Clean up temp files (render directory + image directory)
      if (videoRenderPath) {
        try {
          await cleanupRender(videoRenderPath);
        } catch {
          console.warn('[NeuralBeatPipeline] Could not clean up render temp files');
        }
      }
      if (localImagePaths.length > 0) {
        const imgDir = path.dirname(localImagePaths[0]);
        try {
          await fs.rm(imgDir, { recursive: true });
          console.log('[NeuralBeatPipeline] Cleaned up image temp files');
        } catch {
          console.warn('[NeuralBeatPipeline] Could not clean up image temp files');
        }
      }
    }

    return pipelineRun;
  }
}
