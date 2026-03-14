import { NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/server/services/agent-orchestrator';
import { generateId } from '@/lib/utils';
import type { AgentCommand } from '@/lib/types';

const orchestrator = new AgentOrchestrator();

export async function GET() {
  return NextResponse.json({ agents: orchestrator.getAgentInfo() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentType, taskName, parameters, priority = 'medium', deadline } = body;

    if (!agentType || !taskName) {
      return NextResponse.json({ error: 'agentType and taskName are required' }, { status: 400 });
    }

    const command: AgentCommand = {
      id: generateId(),
      userId: 'default',
      agentType,
      taskName,
      parameters: parameters || {},
      priority,
      deadline: deadline ? new Date(deadline) : undefined,
      status: 'pending',
      createdAt: new Date(),
    };

    const result = await orchestrator.executeCommand(command);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
