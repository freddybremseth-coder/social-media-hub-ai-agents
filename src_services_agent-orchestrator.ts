import { AgentTask } from './agents/base-agent';
import { MarketingAgent } from './agents/marketing-agent';
import { SalesAgent } from './agents/sales-agent';
import { SEOAgent } from './agents/seo-agent';
import { BusinessAgent } from './agents/business-agent';
import { db } from '../database';

export interface AgentCommand {
  id: string;
  userId: string;
  agentType: 'marketing' | 'sales' | 'seo' | 'business';
  taskName: string;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  deadline?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class AgentOrchestrator {
  private marketingAgent: MarketingAgent;
  private salesAgent: SalesAgent;
  private seoAgent: SEOAgent;
  private businessAgent: BusinessAgent;
  private commandQueue: Map<string, AgentCommand> = new Map();

  constructor() {
    this.marketingAgent = new MarketingAgent();
    this.salesAgent = new SalesAgent();
    this.seoAgent = new SEOAgent();
    this.businessAgent = new BusinessAgent();
  }

  async executeCommand(command: AgentCommand): Promise<AgentCommand> {
    command.status = 'in_progress';
    this.commandQueue.set(command.id, command);

    try {
      const agent = this.getAgent(command.agentType);

      const task: AgentTask = {
        id: command.id,
        name: command.taskName,
        description: `Task: ${command.taskName}`,
        priority: command.priority,
        deadline: command.deadline,
        parameters: command.parameters,
        status: 'in_progress',
      };

      const [resultTask] = await agent.executeTasks([task]);
      command.result = resultTask.result;
      command.status = 'completed';
      command.completedAt = new Date();
    } catch (error) {
      command.status = 'failed';
      command.result = error instanceof Error ? error.message : 'Unknown error';
      command.completedAt = new Date();
    }

    this.commandQueue.set(command.id, command);
    return command;
  }

  async executeMultiAgentTask(
    commands: AgentCommand[]
  ): Promise<{
    results: AgentCommand[];
    summary: string;
    insights: any;
  }> {
    const results: AgentCommand[] = [];

    // Sort by priority
    const sorted = commands.sort((a, b) => {
      const priority: Record<string, number> = {
        high: 3,
        medium: 2,
        low: 1,
      };
      return priority[b.priority] - priority[a.priority];
    });

    for (const command of sorted) {
      const result = await this.executeCommand(command);
      results.push(result);
    }

    // Generate summary
    const summary = this.generateExecutionSummary(results);
    const insights = this.synthesizeInsights(results);

    return { results, summary, insights };
  }

  private getAgent(agentType: string) {
    switch (agentType) {
      case 'marketing':
        return this.marketingAgent;
      case 'sales':
        return this.salesAgent;
      case 'seo':
        return this.seoAgent;
      case 'business':
        return this.businessAgent;
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }

  private generateExecutionSummary(results: AgentCommand[]): string {
    const completed = results.filter((r) => r.status === 'completed').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return `Executed ${results.length} tasks. Completed: ${completed}, Failed: ${failed}`;
  }

  private synthesizeInsights(results: AgentCommand[]): any {
    // Combine insights from all agents
    const insights: any = {
      marketing: null,
      sales: null,
      seo: null,
      business: null,
    };

    results.forEach((result) => {
      if (result.status === 'completed' && result.result) {
        insights[result.agentType] = result.result;
      }
    });

    return insights;
  }

  getCommandStatus(commandId: string): AgentCommand | undefined {
    return this.commandQueue.get(commandId);
  }

  getAgentCapabilities(agentType: string): string[] {
    switch (agentType) {
      case 'marketing':
        return [
          'analyze_market_trends',
          'create_campaign_strategy',
          'optimize_content_mix',
          'identify_opportunities',
        ];
      case 'sales':
        return [
          'create_sales_copy',
          'optimize_funnel',
          'analyze_conversion',
          'create_urgency',
        ];
      case 'seo':
        return [
          'keyword_research',
          'optimize_for_seo',
          'analyze_competition',
          'create_link_strategy',
        ];
      case 'business':
        return [
          'develop_growth_strategy',
          'analyze_market',
          'create_positioning',
          'identify_partnerships',
        ];
      default:
        return [];
    }
  }
}