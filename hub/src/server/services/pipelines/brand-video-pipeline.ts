import { updateBrandVideoStatus } from '@/server/services/integrations/airtable-client';
import { uploadVideoFromUrl } from '@/server/services/integrations/youtube-client';
import { YouTubeAgent } from '@/server/agents/youtube-agent';
import {
  AirtableBrandVideoRecord,
  PipelineRun,
  PipelineStep,
  YouTubeVideoMetadata,
} from '@/lib/types';
import { generateId } from '@/lib/utils';
import { getBrandById } from '@/lib/config/brands';

const STEP_NAMES = [
  'Update Airtable Status to Processing',
  'Generate YouTube Metadata with AI',
  'Upload Video to YouTube',
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

export class BrandVideoPipeline {
  async execute(videoRecord: AirtableBrandVideoRecord): Promise<PipelineRun> {
    const steps: PipelineStep[] = STEP_NAMES.map((name, index) =>
      createStep(name, index)
    );

    const pipelineRun: PipelineRun = {
      id: generateId(),
      type: 'brand-video',
      status: 'running',
      steps,
      input: videoRecord,
      output: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      error: null,
    };

    let currentStepIndex = 0;
    let youtubeMetadata: YouTubeVideoMetadata | null = null;
    let youtubeUrl: string | null = null;

    try {
      // Resolve brand configuration
      const brand = getBrandById(videoRecord.brandId);
      if (!brand) {
        throw new Error(`Brand not found: ${videoRecord.brandId}`);
      }

      // Step 1: Update Airtable status to "Processing"
      currentStepIndex = 0;
      markStepRunning(steps[currentStepIndex]);
      try {
        await updateBrandVideoStatus(videoRecord.id, 'Processing');
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 1 failed: ${message}`);
      }

      // Step 2: YouTubeAgent generates optimized title, description, tags for brand
      currentStepIndex = 1;
      markStepRunning(steps[currentStepIndex]);
      try {
        const youtubeAgent = new YouTubeAgent();
        const seoResult = await youtubeAgent.run({
          task: 'generate_youtube_seo',
          input: {
            title: videoRecord.title,
            description: videoRecord.description,
            brandName: brand.name,
            brandStyle: brand.style,
            brandTone: brand.tone,
            category: videoRecord.category,
            targetAudience: brand.targetAudience,
          },
        });
        youtubeMetadata = seoResult.metadata;
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 2 failed: ${message}`);
      }

      // Step 3: Upload video to YouTube with AI-generated metadata
      currentStepIndex = 2;
      markStepRunning(steps[currentStepIndex]);
      try {
        if (!videoRecord.videoUrl) {
          throw new Error('No video URL found in brand video record');
        }

        const uploadResult = await uploadVideoFromUrl({
          videoUrl: videoRecord.videoUrl,
          title: youtubeMetadata!.title,
          description: youtubeMetadata!.description,
          tags: youtubeMetadata!.tags,
          categoryId: youtubeMetadata!.categoryId,
          privacyStatus: youtubeMetadata!.privacyStatus || 'public',
          thumbnailUrl: videoRecord.thumbnailUrl || undefined,
          channelId: brand.youtubeChannelId,
        });
        youtubeUrl = uploadResult.youtubeUrl;
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 3 failed: ${message}`);
      }

      // Step 4: Update Airtable with YouTube URL + status "Done"
      currentStepIndex = 3;
      markStepRunning(steps[currentStepIndex]);
      try {
        await updateBrandVideoStatus(videoRecord.id, 'Done', {
          youtubeUrl: youtubeUrl!,
          youtubeTitle: youtubeMetadata!.title,
        });
        markStepCompleted(steps[currentStepIndex]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markStepFailed(steps[currentStepIndex], message);
        throw new Error(`Step 4 failed: ${message}`);
      }

      // Pipeline completed successfully
      pipelineRun.status = 'completed';
      pipelineRun.completedAt = new Date().toISOString();
      pipelineRun.output = {
        youtubeUrl,
        youtubeMetadata,
        brand: brand.name,
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

      // Update Airtable status to "Error"
      try {
        await updateBrandVideoStatus(videoRecord.id, 'Error', {
          error: pipelineRun.error,
        });
      } catch (airtableError) {
        console.error(
          '[BrandVideoPipeline] Failed to update Airtable error status:',
          airtableError
        );
      }
    }

    return pipelineRun;
  }
}
