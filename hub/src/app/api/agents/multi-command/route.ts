import { NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/server/services/agent-orchestrator';
import { generateId } from '@/lib/utils';
import type { AgentCommand } from '@/lib/types';

const orchestrator = new AgentOrchestrator();

export async function POST(request: Request) {
  try {
    const { commands } = await request.json();

    if (!Array.isArray(commands) || commands.length === 0) {
      return NextResponse.json({ error: 'commands array is required' }, { status: 400 });
    }

    const agentCommands: AgentCommand[] = commands.map((cmd: any) => ({
      id: generateId(),
      userId: 'default',
      agentType: cmd.agentType,
      taskName: cmd.taskName,
      parameters: cmd.parameters || {},
      priority: cmd.priority || 'medium',
      deadline: cmd.deadline ? new Date(cmd.deadline) : undefined,
      status: 'pending' as const,
      createdAt: new Date(),
    }));

    const result = await orchestrator.executeMultiAgentTask(agentCommands);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
