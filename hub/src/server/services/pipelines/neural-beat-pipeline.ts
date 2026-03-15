import { updateSongStatus, updateSongFields } from '@/server/services/integrations/airtable-client';
import { analyzeSong, generateMusicCoverImage, generateYouTubeSEO } from '@/server/services/integrations/gemini-client';
import { renderAndWait } from '@/server/services/integrations/creatomate-client';
import { uploadVideoFromUrl } from '@/server/services/integrations/youtube-client';
import {
  AirtableSongRecord,
  PipelineRun,
  PipelineStep,
} from '@/lib/types';
import { generateId } from '@/lib/utils';

const STEP_NAMES = [
  'Update Airtable Status to Processing',
  'Download Audio File',
  'Analyze Song with AI',
  'Generate Image Prompt & YouTube SEO',
  'Generate Cover Image',
  'Render Video with Creatomate',
  'Wait for Render Completion',
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
  async execute(songRecord: AirtableSongRecord): Promise<PipelineRun> {
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

    let currentStepIndex = 0;
    let audioUrl: string | null = null;
    let songAnalysis: Awaited<ReturnType<typeof analyzeSong>> | null = null;
    let youtubeMetadata: Awaited<ReturnType<typeof generateYouTubeSEO>> | null = null;
    let imageUrl: string | null = null;
    let videoRenderUrl: string | null = null;
    let youtubeUrl: string | null = null;

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
        audioUrl = songRecord.audioUrl;
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

      // Step 5: Gemini generates cover image
      currentStepIndex = 4;
      markStepRunning(steps[currentStepIndex]);
      try {
        const imageResult = await generateMusicCoverImage({
          title: songRecord.title,
          artist: songRecord.artist,
          genre: songAnalysis!.genre,
          style: songAnalysis!.style,
          mood: songAnalysis!.mood,
          imagePrompt: youtubeMetadata!.imagePrompt,
        });
        imageUrl = imageResult.imageUrl;
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 5 failed: ${message}`);
      }

      // Step 6: Creatomate renders video (audio + image with audio reactivity)
      currentStepIndex = 5;
      markStepRunning(steps[currentStepIndex]);
      try {
        const renderResult = await renderAndWait({
          templateId: process.env.CREATOMATE_TEMPLATE_ID || 'f87fa856-4169-4ce8-8204-e066eabd1c60',
          audioUrl: audioUrl!,
          imageUrl: imageUrl!,
          title: songRecord.title,
          subtitle: songRecord.artist,
        });
        videoRenderUrl = renderResult.url || null;
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 6 failed: ${message}`);
      }

      // Step 7: Wait for render completion (handled within renderAndWait, mark complete)
      currentStepIndex = 6;
      markStepRunning(steps[currentStepIndex]);
      try {
        if (!videoRenderUrl) {
          throw new Error('No video render URL returned from Creatomate');
        }
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 7 failed: ${message}`);
      }

      // Step 8: YouTube uploads video with AI-generated metadata
      currentStepIndex = 7;
      markStepRunning(steps[currentStepIndex]);
      try {
        const uploadResult = await uploadVideoFromUrl({
          videoUrl: videoRenderUrl!,
          title: youtubeMetadata!.title,
          description: youtubeMetadata!.description,
          tags: youtubeMetadata!.tags,
          categoryId: youtubeMetadata!.categoryId,
          privacyStatus: youtubeMetadata!.privacyStatus || 'public',
          thumbnailUrl: imageUrl!,
        });
        youtubeUrl = uploadResult.youtubeUrl;
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 8 failed: ${message}`);
      }

      // Step 9: Update Airtable with YouTube URL, AI Metadata, and Generated Image
      // Uses updateSongFields which maps to the correct Airtable column names:
      //   youtubeUrl  -> "YouTube URL"
      //   aiMetadata  -> "AI Metadata" (JSON stringified)
      //   imageUrl    -> "Generated Image" (attachment array)
      currentStepIndex = 8;
      markStepRunning(steps[currentStepIndex]);
      try {
        await updateSongFields(songRecord.id, {
          youtubeUrl: youtubeUrl!,
          aiMetadata: {
            genre: songAnalysis!.genre,
            style: songAnalysis!.style,
            mood: songAnalysis!.mood,
            bpm: songAnalysis!.bpm,
            youtubeTitle: youtubeMetadata!.title,
            youtubeDescription: youtubeMetadata!.description,
            tags: youtubeMetadata!.tags,
            processedAt: new Date().toISOString(),
          },
          ...(imageUrl ? { imageUrl } : {}),
        });
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 9 failed: ${message}`);
      }

      // Pipeline completed successfully
      pipelineRun.status = 'completed';
      pipelineRun.completedAt = new Date().toISOString();
      pipelineRun.output = {
        youtubeUrl,
        songAnalysis,
        youtubeMetadata,
        imageUrl,
        videoRenderUrl,
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
    }

    return pipelineRun;
  }
}
