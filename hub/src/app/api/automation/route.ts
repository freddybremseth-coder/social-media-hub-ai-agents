import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/utils';

const MOCK_PIPELINE_RUNS = [
  {
    id: 'run_nb_001',
    type: 'neural-beat' as const,
    status: 'completed',
    steps: [
      { name: 'fetch-audio', status: 'completed', startedAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3500000).toISOString() },
      { name: 'generate-image', status: 'completed', startedAt: new Date(Date.now() - 3500000).toISOString(), completedAt: new Date(Date.now() - 3200000).toISOString() },
      { name: 'create-video', status: 'completed', startedAt: new Date(Date.now() - 3200000).toISOString(), completedAt: new Date(Date.now() - 2800000).toISOString() },
      { name: 'generate-seo', status: 'completed', startedAt: new Date(Date.now() - 2800000).toISOString(), completedAt: new Date(Date.now() - 2700000).toISOString() },
      { name: 'upload-youtube', status: 'completed', startedAt: new Date(Date.now() - 2700000).toISOString(), completedAt: new Date(Date.now() - 2500000).toISOString() },
    ],
    input: { title: 'Midnight Pulse', artist: 'Neural Beat' },
    output: { youtubeUrl: 'https://youtube.com/watch?v=example1' },
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 2500000).toISOString(),
    error: null,
  },
  {
    id: 'run_nb_002',
    type: 'neural-beat' as const,
    status: 'running',
    steps: [
      { name: 'fetch-audio', status: 'completed', startedAt: new Date(Date.now() - 600000).toISOString(), completedAt: new Date(Date.now() - 500000).toISOString() },
      { name: 'generate-image', status: 'completed', startedAt: new Date(Date.now() - 500000).toISOString(), completedAt: new Date(Date.now() - 200000).toISOString() },
      { name: 'create-video', status: 'in_progress', startedAt: new Date(Date.now() - 200000).toISOString() },
      { name: 'generate-seo', status: 'pending' },
      { name: 'upload-youtube', status: 'pending' },
    ],
    input: { title: 'Solar Drift', artist: 'Neural Beat' },
    output: null,
    startedAt: new Date(Date.now() - 600000).toISOString(),
    completedAt: null,
    error: null,
  },
  {
    id: 'run_bv_001',
    type: 'brand-video' as const,
    status: 'completed',
    steps: [
      { name: 'fetch-video', status: 'completed', startedAt: new Date(Date.now() - 7200000).toISOString(), completedAt: new Date(Date.now() - 7100000).toISOString() },
      { name: 'generate-seo', status: 'completed', startedAt: new Date(Date.now() - 7100000).toISOString(), completedAt: new Date(Date.now() - 7000000).toISOString() },
      { name: 'upload-youtube', status: 'completed', startedAt: new Date(Date.now() - 7000000).toISOString(), completedAt: new Date(Date.now() - 6800000).toISOString() },
    ],
    input: { title: 'ZenecoHomes - Villa Showcase Biar', brandId: 'zenecohomes' },
    output: { youtubeUrl: 'https://youtube.com/watch?v=example3' },
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 6800000).toISOString(),
    error: null,
  },
  {
    id: 'run_bv_002',
    type: 'brand-video' as const,
    status: 'failed',
    steps: [
      { name: 'fetch-video', status: 'completed', startedAt: new Date(Date.now() - 5400000).toISOString(), completedAt: new Date(Date.now() - 5300000).toISOString() },
      { name: 'generate-seo', status: 'completed', startedAt: new Date(Date.now() - 5300000).toISOString(), completedAt: new Date(Date.now() - 5200000).toISOString() },
      { name: 'upload-youtube', status: 'failed', startedAt: new Date(Date.now() - 5200000).toISOString(), error: 'YouTube API quota exceeded' },
    ],
    input: { title: 'Chatgenius - Product Demo', brandId: 'chatgenius' },
    output: null,
    startedAt: new Date(Date.now() - 5400000).toISOString(),
    completedAt: null,
    error: 'YouTube API quota exceeded',
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      runs: MOCK_PIPELINE_RUNS,
      total: MOCK_PIPELINE_RUNS.length,
      source: 'mock',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch pipeline runs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipelineType, recordId } = body;

    if (!pipelineType || !recordId) {
      return NextResponse.json(
        { error: 'pipelineType and recordId are required' },
        { status: 400 }
      );
    }

    if (!['neural-beat', 'brand-video'].includes(pipelineType)) {
      return NextResponse.json(
        { error: 'pipelineType must be "neural-beat" or "brand-video"' },
        { status: 400 }
      );
    }

    // Placeholder: In production this would trigger the actual pipeline
    const run = {
      id: `run_${generateId()}`,
      pipelineType,
      recordId,
      status: 'queued',
      message: `Pipeline "${pipelineType}" queued for record ${recordId}. Automation engine will process this.`,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to trigger pipeline' },
      { status: 500 }
    );
  }
}
