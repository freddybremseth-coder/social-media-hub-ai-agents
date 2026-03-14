import { NeuralBeatPipeline } from '@/server/services/pipelines/neural-beat-pipeline';
import { BrandVideoPipeline } from '@/server/services/pipelines/brand-video-pipeline';
import {
  AirtableSongRecord,
  AirtableBrandVideoRecord,
  PipelineRun,
} from '@/lib/types';

export class PipelineOrchestrator {
  private pipelineRuns: PipelineRun[] = [];
  private neuralBeatPipeline: NeuralBeatPipeline;
  private brandVideoPipeline: BrandVideoPipeline;

  constructor() {
    this.neuralBeatPipeline = new NeuralBeatPipeline();
    this.brandVideoPipeline = new BrandVideoPipeline();
  }

  /**
   * Execute the Neural Beat pipeline for a song record.
   * The pipeline runs asynchronously and the run is tracked in memory.
   */
  async runNeuralBeatPipeline(
    songRecord: AirtableSongRecord
  ): Promise<PipelineRun> {
    console.log(
      `[PipelineOrchestrator] Starting Neural Beat pipeline for song: ${songRecord.title}`
    );

    const run = await this.neuralBeatPipeline.execute(songRecord);
    this.pipelineRuns.push(run);

    console.log(
      `[PipelineOrchestrator] Neural Beat pipeline ${run.id} finished with status: ${run.status}`
    );

    return run;
  }

  /**
   * Execute the Brand Video pipeline for a video record.
   * The pipeline runs asynchronously and the run is tracked in memory.
   */
  async runBrandVideoPipeline(
    videoRecord: AirtableBrandVideoRecord
  ): Promise<PipelineRun> {
    console.log(
      `[PipelineOrchestrator] Starting Brand Video pipeline for video: ${videoRecord.title}`
    );

    const run = await this.brandVideoPipeline.execute(videoRecord);
    this.pipelineRuns.push(run);

    console.log(
      `[PipelineOrchestrator] Brand Video pipeline ${run.id} finished with status: ${run.status}`
    );

    return run;
  }

  /**
   * Get the status of a specific pipeline run by ID.
   */
  getPipelineStatus(id: string): PipelineRun | undefined {
    return this.pipelineRuns.find((run) => run.id === id);
  }

  /**
   * Get the most recent pipeline runs, sorted newest first.
   * @param limit Maximum number of runs to return (default: 20)
   */
  getRecentRuns(limit: number = 20): PipelineRun[] {
    return [...this.pipelineRuns]
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )
      .slice(0, limit);
  }

  /**
   * Get aggregate statistics across all tracked pipeline runs.
   */
  getStats(): {
    total: number;
    running: number;
    completed: number;
    failed: number;
  } {
    const total = this.pipelineRuns.length;
    const running = this.pipelineRuns.filter(
      (run) => run.status === 'running'
    ).length;
    const completed = this.pipelineRuns.filter(
      (run) => run.status === 'completed'
    ).length;
    const failed = this.pipelineRuns.filter(
      (run) => run.status === 'failed'
    ).length;

    return { total, running, completed, failed };
  }
}

// Singleton instance for use across the application
let orchestratorInstance: PipelineOrchestrator | null = null;

export function getPipelineOrchestrator(): PipelineOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new PipelineOrchestrator();
  }
  return orchestratorInstance;
}
