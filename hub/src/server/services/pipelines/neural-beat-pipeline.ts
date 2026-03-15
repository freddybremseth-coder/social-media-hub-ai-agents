import { updateSongStatus, updateSongFields } from '@/server/services/integrations/airtable-client';
import { analyzeSong, generateMusicImageSet, generateYouTubeSEO } from '@/server/services/integrations/gemini-client';
import { renderVideo, cleanupRender, isAvailable as isFFmpegAvailable } from '@/server/services/integrations/ffmpeg-renderer';
import { uploadImageToTempHost } from '@/server/services/integrations/creatomate-client';
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
  'Generate 10 Cover Images',
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
      markStepRunning(steps[currentStepIndex]);
      try {
        await updateSongStatus(songRecord.id, 'Processing');
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          '[NeuralBeatPipeline] Step 1: Could not update Airtable status (non-fatal, continuing):',
          message
        );
        // Mark as completed with a note rather than crashing the pipeline
        markStepCompleted(steps[currentStepIndex]);
        steps[currentStepIndex].result = `Skipped status update: ${message}`;
      }

      // Step 2: Download audio file
      currentStepIndex = 1;
      markStepRunning(steps[currentStepIndex]);
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
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 2 failed: ${message}`);
      }

      // Step 3: Claude analyzes title/metadata -> genre, style, mood
      currentStepIndex = 2;
      markStepRunning(steps[currentStepIndex]);
      try {
        songAnalysis = await analyzeSong({
          title: songRecord.title,
          artist: songRecord.artist,
          audioUrl: audioUrl!,
          metadata: songRecord.metadata || undefined,
        });
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 3 failed: ${message}`);
      }

      // Step 4: Gemini generates YouTube SEO metadata
      currentStepIndex = 3;
      markStepRunning(steps[currentStepIndex]);
      try {
        youtubeMetadata = await generateYouTubeSEO({
          title: songRecord.title,
          artist: songRecord.artist,
          genre: songAnalysis!.genre,
          style: songAnalysis!.style,
          mood: songAnalysis!.mood,
        });
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 4 failed: ${message}`);
      }

      // Step 5: Gemini generates cover images — saved locally for FFmpeg
      currentStepIndex = 4;
      markStepRunning(steps[currentStepIndex]);
      try {
        console.log('[NeuralBeatPipeline] Starting image generation with Gemini...');
        const imageSetResult = await generateMusicImageSet({
          title: songRecord.title,
          artist: songRecord.artist,
          genre: songAnalysis!.genre,
          style: songAnalysis!.style,
          mood: songAnalysis!.mood,
          energy: songAnalysis!.energy,
          visualStyle: songAnalysis!.visualStyle,
          count: 8, // 8 images for a good slideshow balance
        });

        // Save images to local temp files (no need to upload to tmpfiles.org!)
        const imgTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nb-images-'));
        console.log(`[NeuralBeatPipeline] Saving ${imageSetResult.images.length} images to ${imgTempDir}`);

        for (let i = 0; i < imageSetResult.images.length; i++) {
          const img = imageSetResult.images[i];
          const ext = img.mimeType.includes('jpeg') || img.mimeType.includes('jpg') ? 'jpg' : 'png';
          const imgPath = path.join(imgTempDir, `image-${i}.${ext}`);
          const buffer = Buffer.from(img.base64, 'base64');
          await fs.writeFile(imgPath, buffer);
          localImagePaths.push(imgPath);
        }

        // Keep first image as buffer for YouTube thumbnail
        thumbnailBuffer = Buffer.from(imageSetResult.images[0].base64, 'base64');

        // Upload first image to tmpfiles.org for Airtable attachment
        try {
          airtableImageUrl = await uploadImageToTempHost(
            imageSetResult.images[0].base64,
            imageSetResult.images[0].mimeType
          );
        } catch (e) {
          console.warn('[NeuralBeatPipeline] Could not upload image for Airtable (non-fatal):', e);
        }

        console.log(`[NeuralBeatPipeline] All ${localImagePaths.length} images saved locally`);
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 5 failed: ${message}`);
      }

      // Step 6: FFmpeg renders multi-scene slideshow video (local, $0 cost)
      currentStepIndex = 5;
      markStepRunning(steps[currentStepIndex]);
      try {
        console.log('[NeuralBeatPipeline] Starting FFmpeg render (local, zero cost)...');
        const renderResult = await renderVideo({
          audioUrl: audioUrl!,
          imagePaths: localImagePaths,
          title: songRecord.title,
          subtitle: songRecord.artist,
        });
        videoRenderPath = renderResult.videoPath;
        videoBuffer = renderResult.videoBuffer;
        console.log(`[NeuralBeatPipeline] Video rendered: ${(renderResult.videoBuffer.length / 1024 / 1024).toFixed(1)} MB`);
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 6 failed: ${message}`);
      }

      // Step 7: Upload video buffer directly to YouTube (no intermediate download)
      currentStepIndex = 6;
      markStepRunning(steps[currentStepIndex]);
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

        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 7 failed: ${message}`);
      }

      // Step 8: Update Airtable with YouTube URL, AI Metadata, and Generated Image
      currentStepIndex = 7;
      markStepRunning(steps[currentStepIndex]);
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
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
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
    } catch (error) {
      // Mark all remaining pending steps as skipped
      for (let i = currentStepIndex + 1; i < steps.length; i++) {
        if (steps[i].status === 'pending') {
          markStepSkipped(steps[i]);
        }
      }

      pipelineRun.status = 'failed';
      pipelineRun.completedAt = new Date().toISOString();
      pipelineRun.error = error instanceof Error ? error.message : String(error);

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
