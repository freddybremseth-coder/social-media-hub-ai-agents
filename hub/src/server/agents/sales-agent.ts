import { BaseAgent } from './base-agent';
import { NORWEGIAN_CONTENT_RULES, CLEAN_OUTPUT_RULES } from '@/lib/text-utils';
import type { AgentTask } from '@/lib/types';

export class SalesAgent extends BaseAgent {
  constructor() {
    super(
      'Jordan Sales Master',
      'Sales & Conversion Specialist',
      ['conversion-optimization', 'sales-psychology', 'funnel-analysis', 'persuasion-copywriting']
    );
  }

  async executeTasks(tasks: AgentTask[]): Promise<AgentTask[]> {
    const results: AgentTask[] = [];

    for (const task of tasks) {
      try {
        task.status = 'in_progress';

        switch (task.name) {
          case 'create_sales_copy':
            task.result = await this.createSalesCopy(task.parameters);
            break;
          case 'optimize_funnel':
            task.result = await this.optimizeSalesFunnel(task.parameters);
            break;
          case 'analyze_conversion':
            task.result = await this.analyzeConversionMetrics(task.parameters);
            break;
          case 'create_urgency':
            task.result = await this.createUrgencyStrategy(task.parameters);
            break;
        }

        task.status = 'completed';
      } catch (error) {
        task.status = 'failed';
        task.result = error instanceof Error ? error.message : 'Unknown error';
      }

      results.push(task);
    }

    return results;
  }

  async analyzeData(data: any): Promise<any> {
    const prompt = `Analyze this sales data for conversion opportunities:
${JSON.stringify(data, null, 2)}

Provide:
1. Current conversion rate analysis
2. Bottleneck identification
3. Improvement opportunities
4. A/B testing recommendations

Format as JSON.`;

    const response = await this.callAI(prompt);
    return this.parseJSON(response);
  }

  async generateRecommendations(context: any): Promise<string[]> {
    const prompt = `Based on this sales context, provide 5 high-impact conversion recommendations:
${JSON.stringify(context, null, 2)}

Return as a JSON array of strings with specific, implementable actions.`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSON(response);
    return Array.isArray(parsed) ? parsed : [response];
  }

  private async createSalesCopy(params: any): Promise<string> {
    const prompt = `Create compelling sales copy for:
Product: ${params.product}
Price: ${params.price}
Target audience: ${params.targetAudience}
Unique selling proposition: ${params.usp}
Platform: ${params.platform}
Format: ${params.format}

Requirements:
- Attention-grabbing headline
- Compelling value proposition
- Social proof elements
- Clear call-to-action
- Power words and psychological triggers`;

    return this.callAI(prompt);
  }

  private async optimizeSalesFunnel(params: any): Promise<string> {
    const prompt = `Optimize this sales funnel:
Current funnel stages: ${JSON.stringify(params.funnelStages)}
Conversion rates: ${JSON.stringify(params.conversionRates)}
Drop-off points: ${params.dropOffPoints?.join(', ')}
Customer pain points: ${params.painPoints?.join(', ')}

Provide:
1. Funnel stage optimization
2. Drop-off recovery strategies
3. Touchpoint improvements
4. Messaging changes
5. Implementation timeline`;

    return this.callAI(prompt);
  }

  private async analyzeConversionMetrics(params: any): Promise<string> {
    const prompt = `Analyze these conversion metrics:
${JSON.stringify(params.metrics, null, 2)}

Identify:
1. Performance trends
2. Underperforming segments
3. High-performing segments
4. Optimization opportunities
5. Quick wins`;

    return this.callAI(prompt);
  }

  private async createUrgencyStrategy(params: any): Promise<string> {
    const prompt = `Create an urgency-driving strategy for:
Product: ${params.product}
Audience: ${params.audience}
Current conversion: ${params.currentConversion}%
Goal: ${params.goal}%

Suggest:
1. Scarcity tactics (ethical)
2. Time-limited offers
3. FOMO-inducing messaging
4. Social proof strategies
5. Deadline-based CTAs`;

    return this.callAI(prompt);
  }

  protected getSystemPrompt(): string {
    return `You are ${this.name}, an expert ${this.role}. You specialize in ${this.expertise.join(', ')}.

Your philosophy:
- Ethical persuasion based on genuine value
- Deep understanding of human psychology
- Data-backed copywriting techniques
- Continuous testing and optimization
- Customer-centric approach

Always create strategies that benefit both the business and customer.

${NORWEGIAN_CONTENT_RULES}

${CLEAN_OUTPUT_RULES}`;
  }
}
