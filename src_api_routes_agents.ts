import { Router, Request, Response } from 'express';
import { AgentOrchestrator, AgentCommand } from '../../services/agent-orchestrator';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const orchestrator = new AgentOrchestrator();

// Get available agents and their capabilities
router.get('/capabilities', (req: Request, res: Response) => {
  const agents = [
    {
      id: 'marketing',
      name: 'Alex Marketing Pro',
      role: 'Marketing Strategist',
      capabilities: orchestrator.getAgentCapabilities('marketing'),
      description: 'Specializes in market trends, content strategy, and campaign optimization',
    },
    {
      id: 'sales',
      name: 'Jordan Sales Master',
      role: 'Sales & Conversion Specialist',
      capabilities: orchestrator.getAgentCapabilities('sales'),
      description: 'Experts in sales copy, conversion optimization, and persuasion',
    },
    {
      id: 'seo',
      name: 'Sam SEO Expert',
      role: 'SEO & Organic Growth Specialist',
      capabilities: orchestrator.getAgentCapabilities('seo'),
      description: 'Masters of keyword research, technical SEO, and organic growth',
    },
    {
      id: 'business',
      name: 'Morgan Business Strategist',
      role: 'Business Strategy & Growth Specialist',
      capabilities: orchestrator.getAgentCapabilities('business'),
      description: 'Strategic thinkers focused on market positioning and sustainable growth',
    },
  ];

  res.json({ agents });
});

// Execute a single agent command
router.post('/command', async (req: Request, res: Response) => {
  try {
    const { agentType, taskName, parameters, priority = 'medium', deadline } = req.body;
    const userId = req.user?.id;

    if (!agentType || !taskName) {
      return res.status(400).json({ error: 'agentType and taskName are required' });
    }

    const command: AgentCommand = {
      id: uuidv4(),
      userId,
      agentType,
      taskName,
      parameters,
      priority,
      deadline: deadline ? new Date(deadline) : undefined,
      status: 'pending',
      createdAt: new Date(),
    };

    const result = await orchestrator.executeCommand(command);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Execute multiple agent commands
router.post('/multi-command', async (req: Request, res: Response) => {
  try {
    const { commands } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(commands) || commands.length === 0) {
      return res.status(400).json({ error: 'commands array is required' });
    }

    const agentCommands: AgentCommand[] = commands.map((cmd: any) => ({
      id: uuidv4(),
      userId,
      agentType: cmd.agentType,
      taskName: cmd.taskName,
      parameters: cmd.parameters,
      priority: cmd.priority || 'medium',
      deadline: cmd.deadline ? new Date(cmd.deadline) : undefined,
      status: 'pending',
      createdAt: new Date(),
    }));

    const { results, summary, insights } = await orchestrator.executeMultiAgentTask(agentCommands);

    res.json({ results, summary, insights });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get command status
router.get('/command/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const status = orchestrator.getCommandStatus(id);

  if (!status) {
    return res.status(404).json({ error: 'Command not found' });
  }

  res.json(status);
});

export default router;