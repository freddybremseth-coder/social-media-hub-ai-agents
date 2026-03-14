import { NextRequest, NextResponse } from 'next/server';
import { YouTubeAgent } from '@/server/agents/youtube-agent';
import { generateId } from '@/lib/utils';
import type { AgentTask } from '@/lib/types';

const youtubeAgent = new YouTubeAgent();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskName, parameters } = body;

    if (!taskName) {
      return NextResponse.json(
        { error: 'taskName is required' },
        { status: 400 }
      );
    }

    const task: AgentTask = {
      id: generateId(),
      name: taskName,
      description: `YouTube agent task: ${taskName}`,
      priority: 'high',
      parameters: parameters || {},
      status: 'pending',
    };

    const [result] = await youtubeAgent.executeTasks([task]);

    return NextResponse.json({
      task: result,
      agent: 'Nova YouTube Creator',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'YouTube agent task failed' },
      { status: 500 }
    );
  }
}
