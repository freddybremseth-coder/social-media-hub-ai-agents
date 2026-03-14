import { BaseAgent } from './base-agent';
import type { AgentTask } from '@/lib/types';

export class BusinessAgent extends BaseAgent {
  constructor() {
    super(
      'Morgan Business Strategist',
      'Business Strategy & Growth Specialist',
      ['business-strategy', 'market-analysis', 'growth-hacking', 'competitive-positioning']
    );
  }

  async executeTasks(tasks: AgentTask[]): Promise<AgentTask[]> {
    const results: AgentTask[] = [];

    for (const task of tasks) {
      try {
        task.status = 'in_progress';

        switch (task.name) {
          case 'develop_growth_strategy':
            task.result = await this.developGrowthStrategy(task.parameters);
            break;
          case 'analyze_market':
            task.result = await this.analyzeMarketPosition(task.parameters);
            break;
          case 'create_positioning':
            task.result = await this.createMarketPositioning(task.parameters);
            break;
          case 'identify_partnerships':
            task.result = await this.identifyPartnershipOpportunities(task.parameters);
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
    const prompt = `Perform business analysis on:
${JSON.stringify(data, null, 2)}

Analyze:
1. Revenue and profitability trends
2. Market position
3. Growth opportunities
4. Risk factors
5. Strategic recommendations

Format as JSON.`;

    const response = await this.callAI(prompt);
    return this.parseJSON(response);
  }

  async generateRecommendations(context: any): Promise<string[]> {
    const prompt = `Based on this business context, provide 5 strategic recommendations:
${JSON.stringify(context, null, 2)}

Focus on sustainable growth and market positioning.
Return as a JSON array.`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSON(response);
    return Array.isArray(parsed) ? parsed : [response];
  }

  private async developGrowthStrategy(params: any): Promise<string> {
    const prompt = `Develop a comprehensive growth strategy:
Current revenue: ${params.revenue}
Target revenue: ${params.targetRevenue}
Timeline: ${params.timeline}
Market: ${params.market}
Resources: ${JSON.stringify(params.resources)}

Include:
1. Growth levers (acquisition, retention, monetization)
2. Market expansion opportunities
3. Product/service development
4. Marketing strategies
5. Operational improvements
6. 90-day action plan`;

    return this.callAI(prompt);
  }

  private async analyzeMarketPosition(params: any): Promise<string> {
    const prompt = `Analyze market position:
Business type: ${params.businessType}
Market size: ${params.marketSize}
Current market share: ${params.marketShare}
Key competitors: ${params.competitors?.join(', ')}
Differentiation: ${params.differentiation}

Provide:
1. Competitive landscape analysis
2. Market opportunity assessment
3. Positioning recommendations
4. Threat analysis
5. Strategic advantages`;

    return this.callAI(prompt);
  }

  private async createMarketPositioning(params: any): Promise<string> {
    const prompt = `Create market positioning strategy:
Product/Service: ${params.offering}
Target market: ${params.targetMarket}
Unique value proposition: ${params.usp}
Key competitors: ${params.competitors?.join(', ')}
Brand personality: ${params.brandPersonality}

Develop:
1. Positioning statement
2. Key messaging pillars
3. Target audience segmentation
4. Competitive differentiation
5. Brand personality guidelines`;

    return this.callAI(prompt);
  }

  private async identifyPartnershipOpportunities(params: any): Promise<string> {
    const prompt = `Identify partnership opportunities:
Business: ${params.business}
Target audience: ${params.targetAudience}
Strengths: ${params.strengths?.join(', ')}
Gaps: ${params.gaps?.join(', ')}
Industry: ${params.industry}

Identify:
1. Complementary businesses to partner with
2. Strategic alliance opportunities
3. Co-marketing opportunities
4. Joint venture possibilities
5. Implementation roadmap`;

    return this.callAI(prompt);
  }

  protected getSystemPrompt(): string {
    return `You are ${this.name}, a strategic ${this.role}. You specialize in ${this.expertise.join(', ')}.

Your methodology:
- Strategic thinking with tactical execution
- Data-informed decision making
- Market-driven approach
- Sustainable growth focus
- Stakeholder value creation

Always consider short-term wins and long-term strategy.`;
  }
}
