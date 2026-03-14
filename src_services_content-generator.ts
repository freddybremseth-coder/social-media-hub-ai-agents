import { MarketingAgent } from './agents/marketing-agent';
import { SalesAgent } from './agents/sales-agent';
import { SEOAgent } from './agents/seo-agent';
import { BusinessAgent } from './agents/business-agent';

export interface ContentBrief {
  brand: string;
  platform: string;
  goal: 'awareness' | 'engagement' | 'conversion' | 'retention';
  audience: string;
  tone: string;
  keyMessages?: string[];
  constraints?: {
    maxLength?: number;
    includeHashtags?: boolean;
    includeEmojis?: boolean;
    includeLinks?: boolean;
  };
}

export interface GeneratedContent {
  id: string;
  brief: ContentBrief;
  content: string;
  variants: string[];
  hashtags: string[];
  estimatedReach: number;
  viralityScore: number;
  seoScore?: number;
  conversionScore?: number;
  recommendations: string[];
  agents: string[]; // Which agents contributed
}

export class ContentGenerator {
  private marketingAgent: MarketingAgent;
  private salesAgent: SalesAgent;
  private seoAgent: SEOAgent;
  private businessAgent: BusinessAgent;

  constructor() {
    this.marketingAgent = new MarketingAgent();
    this.salesAgent = new SalesAgent();
    this.seoAgent = new SEOAgent();
    this.businessAgent = new BusinessAgent();
  }

  async generateViralContent(brief: ContentBrief): Promise<GeneratedContent> {
    const contentId = `content_${Date.now()}`;
    const agents: string[] = [];

    // Step 1: Marketing Agent analyzes trends and creates strategy
    const marketingAnalysis = await this.marketingAgent.analyzeData({
      platform: brief.platform,
      audience: brief.audience,
      goal: brief.goal,
    });

    agents.push('Marketing Agent');

    // Step 2: Sales Agent creates persuasive copy (if conversion goal)
    let salesCopy = '';
    if (brief.goal === 'conversion') {
      salesCopy = await this.salesAgent.callAI(
        `Create viral, conversion-focused copy for ${brief.platform}:
        Brand: ${brief.brand}
        Audience: ${brief.audience}
        Key messages: ${brief.keyMessages?.join(', ')}
        Tone: ${brief.tone}`,
        {}
      );
      agents.push('Sales Agent');
    }

    // Step 3: Generate content with AI orchestration
    const generatedContent = await this.generateContentWithAI(brief, {
      marketingInsights: marketingAnalysis,
      salesCopy,
    });

    // Step 4: SEO optimization if relevant
    let seoOptimized = generatedContent;
    let seoScore = 0;
    if (brief.platform === 'linkedin' || brief.platform === 'twitter') {
      const seoAnalysis = await this.seoAgent.analyzeData({
        content: generatedContent,
        platform: brief.platform,
      });
      seoScore = seoAnalysis?.score || 0;
      agents.push('SEO Agent');
    }

    // Step 5: Business validation
    const businessValidation = await this.businessAgent.analyzeData({
      content: generatedContent,
      brand: brief.brand,
      goal: brief.goal,
    });

    agents.push('Business Agent');

    // Step 6: Calculate virality score
    const viralityScore = await this.calculateViralityScore(
      generatedContent,
      brief,
      marketingAnalysis
    );

    // Step 7: Generate variants
    const variants = await this.generateVariants(generatedContent, brief, 3);

    // Step 8: Get recommendations
    const recommendations = await this.marketingAgent.generateRecommendations({
      content: generatedContent,
      platform: brief.platform,
      goal: brief.goal,
    });

    return {
      id: contentId,
      brief,
      content: generatedContent,
      variants,
      hashtags: await this.generateHashtags(generatedContent, brief),
      estimatedReach: this.estimateReach(brief.audience, brief.platform),
      viralityScore,
      seoScore,
      conversionScore: brief.goal === 'conversion' ? await this.calculateConversionScore(
        generatedContent,
        brief
      ) : undefined,
      recommendations,
      agents,
    };
  }

  private async generateContentWithAI(
    brief: ContentBrief,
    context: any
  ): Promise<string> {
    const prompt = `Create viral ${brief.platform} content for ${brief.brand}.

Specifications:
- Platform: ${brief.platform}
- Goal: ${brief.goal}
- Target Audience: ${brief.audience}
- Tone: ${brief.tone}
- Key Messages: ${brief.keyMessages?.join(', ')}
- Max Length: ${brief.constraints?.maxLength || 'standard'}

Guidelines:
1. Hook the audience in the first sentence
2. Make it shareable and engaging
3. Include power words and emotional triggers
4. Add call-to-action
5. Optimize for the platform's algorithm
${brief.goal === 'conversion' ? '6. Drive conversions without being pushy' : ''}

Marketing Insights: ${JSON.stringify(context.marketingInsights)}

Generate the content. Make it viral-worthy!`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a world-class content creator specializing in viral social media content. You understand platform algorithms, audience psychology, and viral mechanics. Create content that gets shared, liked, and commented on.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async generateVariants(
    originalContent: string,
    brief: ContentBrief,
    count: number
  ): Promise<string[]> {
    const variants: string[] = [];

    const prompt = `Create ${count} different variations of this ${brief.platform} post:

Original: ${originalContent}

Requirements:
- Different angle/hook for each variant
- Same key message but different approach
- Maintain ${brief.tone} tone
- Keep platform ${brief.platform} best practices

Generate only the content, one variant per line.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are expert at creating multiple variations of content that each have different appeal angles but maintain the same core message.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
    return lines.slice(0, count);
  }

  private async generateHashtags(content: string, brief: ContentBrief): Promise<string[]> {
    const prompt = `Generate 10-15 relevant hashtags for this ${brief.platform} content:
"${content}"

Audience: ${brief.audience}
Goal: ${brief.goal}

Return ONLY hashtags separated by spaces.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const hashtags = data.choices[0].message.content.match(/#\w+/g) || [];
    return hashtags.slice(0, 15);
  }

  private async calculateViralityScore(
    content: string,
    brief: ContentBrief,
    analysis: any
  ): Promise<number> {
    // Simplified scoring - in production, this would be more sophisticated
    let score = 50; // Base score

    // Check for engagement hooks
    if (
      content.toLowerCase().includes('?') ||
      content.toLowerCase().includes('what') ||
      content.toLowerCase().includes('how')
    ) {
      score += 10; // Question engagement
    }

    if (
      content.toLowerCase().includes('🔥') ||
      content.toLowerCase().includes('😂') ||
      content.toLowerCase().includes('💡')
    ) {
      score += 15; // Emotional triggers
    }

    if (content.length > 280 && brief.platform === 'twitter') {
      score -= 5; // Too long for Twitter
    }

    if (content.length < 50 && brief.platform !== 'twitter') {
      score -= 10; // Too short
    }

    // Platform-specific adjustments
    if (brief.platform === 'tiktok') {
      score += 15; // TikTok algorithm favors engaging short content
    }

    return Math.min(100, Math.max(0, score));
  }

  private async calculateConversionScore(
    content: string,
    brief: ContentBrief
  ): Promise<number> {
    let score = 50;

    // Check for CTA
    if (
      content.toLowerCase().includes('click') ||
      content.toLowerCase().includes('link') ||
      content.toLowerCase().includes('buy') ||
      content.toLowerCase().includes('sign up')
    ) {
      score += 20;
    }

    // Check for value proposition
    if (
      content.toLowerCase().includes('save') ||
      content.toLowerCase().includes('free') ||
      content.toLowerCase().includes('exclusive')
    ) {
      score += 15;
    }

    // Check for urgency
    if (
      content.toLowerCase().includes('now') ||
      content.toLowerCase().includes('today') ||
      content.toLowerCase().includes('limited')
    ) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  private estimateReach(audience: string, platform: string): number {
    // Simplified estimation
    const baseReach: Record<string, number> = {
      twitter: 5000,
      instagram: 3000,
      facebook: 7000,
      linkedin: 2000,
      tiktok: 15000,
    };

    const reach = baseReach[platform] || 5000;

    // Adjust based on audience size estimation
    if (audience.includes('enterprise') || audience.includes('corporate')) {
      return reach * 0.5;
    }
    if (audience.includes('startup') || audience.includes('growth')) {
      return reach * 1.5;
    }

    return reach;
  }

  async generateContentForBrand(
    brand: string,
    contentCount: number = 5
  ): Promise<GeneratedContent[]> {
    const contents: GeneratedContent[] = [];

    const briefs: ContentBrief[] = [
      {
        brand,
        platform: 'twitter',
        goal: 'awareness',
        audience: 'Tech professionals',
        tone: 'professional but witty',
        keyMessages: ['Innovation', 'Growth', 'Impact'],
      },
      {
        brand,
        platform: 'instagram',
        goal: 'engagement',
        audience: 'Young professionals',
        tone: 'casual and relatable',
        keyMessages: ['Lifestyle', 'Success', 'Community'],
      },
      {
        brand,
        platform: 'linkedin',
        goal: 'awareness',
        audience: 'Corporate decision makers',
        tone: 'professional and insightful',
        keyMessages: ['Expertise', 'Authority', 'Results'],
      },
      {
        brand,
        platform: 'tiktok',
        goal: 'engagement',
        audience: 'Gen Z and millennials',
        tone: 'fun and entertaining',
        keyMessages: ['Trend', 'Entertainment', 'Value'],
      },
      {
        brand,
        platform: 'facebook',
        goal: 'conversion',
        audience: 'General audience',
        tone: 'friendly and compelling',
        keyMessages: ['Benefit', 'Solution', 'Action'],
      },
    ];

    for (const brief of briefs.slice(0, contentCount)) {
      const content = await this.generateViralContent(brief);
      contents.push(content);
    }

    return contents;
  }
}