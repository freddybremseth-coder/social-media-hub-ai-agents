import { MarketingAgent } from '../agents/marketing-agent';
import { SalesAgent } from '../agents/sales-agent';
import { SEOAgent } from '../agents/seo-agent';
import { BusinessAgent } from '../agents/business-agent';
import { MultiDomainExpertAgent } from '../agents/multi-domain-expert';
import { YouTubeAgent } from '../agents/youtube-agent';
import type { AgentTask, AgentCommand } from '@/lib/types';

export class AgentOrchestrator {
  private marketingAgent: MarketingAgent;
  private salesAgent: SalesAgent;
  private seoAgent: SEOAgent;
  private businessAgent: BusinessAgent;
  private multiDomainAgent: MultiDomainExpertAgent;
  private youtubeAgent: YouTubeAgent;
  private commandQueue: Map<string, AgentCommand> = new Map();

  constructor() {
    this.marketingAgent = new MarketingAgent();
    this.salesAgent = new SalesAgent();
    this.seoAgent = new SEOAgent();
    this.businessAgent = new BusinessAgent();
    this.multiDomainAgent = new MultiDomainExpertAgent();
    this.youtubeAgent = new YouTubeAgent();
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

    const sorted = commands.sort((a, b) => {
      const priority: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (priority[b.priority] || 0) - (priority[a.priority] || 0);
    });

    for (const command of sorted) {
      const result = await this.executeCommand(command);
      results.push(result);
    }

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
      case 'multi-domain':
        return this.multiDomainAgent;
      case 'youtube':
        return this.youtubeAgent;
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
    const insights: any = {
      marketing: null,
      sales: null,
      seo: null,
      business: null,
      'multi-domain': null,
      youtube: null,
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
        return ['analyze_market_trends', 'create_campaign_strategy', 'optimize_content_mix', 'identify_opportunities'];
      case 'sales':
        return ['create_sales_copy', 'optimize_funnel', 'analyze_conversion', 'create_urgency'];
      case 'seo':
        return ['keyword_research', 'optimize_for_seo', 'analyze_competition', 'create_link_strategy'];
      case 'business':
        return ['develop_growth_strategy', 'analyze_market', 'create_positioning', 'identify_partnerships'];
      case 'multi-domain':
        return ['create_content', 'analyze_market', 'optimize_sales', 'seo_strategy', 'cross_brand_narrative'];
      case 'youtube':
        return ['create_script', 'optimize_title', 'generate_description', 'suggest_tags', 'thumbnail_concept', 'retention_hooks', 'shorts_strategy', 'channel_strategy'];
      default:
        return [];
    }
  }

  getAgentInfo() {
    return [
      {
        id: 'marketing',
        name: 'Alex Marketing Pro',
        role: 'Marketing Strategist',
        capabilities: this.getAgentCapabilities('marketing'),
        description: 'Specializes in market trends, content strategy, and campaign optimization',
        color: '#3b82f6',
      },
      {
        id: 'sales',
        name: 'Jordan Sales Master',
        role: 'Sales & Conversion Specialist',
        capabilities: this.getAgentCapabilities('sales'),
        description: 'Expert in sales copy, conversion optimization, and persuasion',
        color: '#ef4444',
      },
      {
        id: 'seo',
        name: 'Sam SEO Expert',
        role: 'SEO & Organic Growth Specialist',
        capabilities: this.getAgentCapabilities('seo'),
        description: 'Master of keyword research, technical SEO, and organic growth',
        color: '#22c55e',
      },
      {
        id: 'business',
        name: 'Morgan Business Strategist',
        role: 'Business Strategy & Growth Specialist',
        capabilities: this.getAgentCapabilities('business'),
        description: 'Strategic thinker focused on market positioning and sustainable growth',
        color: '#f59e0b',
      },
      {
        id: 'multi-domain',
        name: 'Freddy Business Navigator',
        role: 'Integrated Multi-Domain Business Expert',
        capabilities: this.getAgentCapabilities('multi-domain'),
        description: 'Context-aware expert across real estate, SaaS, agriculture, and personal branding',
        color: '#8b5cf6',
      },
      {
        id: 'youtube',
        name: 'Nova YouTube Creator',
        role: 'YouTube Content & Growth Specialist',
        capabilities: this.getAgentCapabilities('youtube'),
        description: 'Expert in YouTube SEO, scriptwriting, thumbnail strategy, and Shorts optimization',
        color: '#ef4444',
      },
    ];
  }
}
