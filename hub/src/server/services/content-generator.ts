import { MarketingAgent } from '../agents/marketing-agent';
import { SalesAgent } from '../agents/sales-agent';
import { SEOAgent } from '../agents/seo-agent';
import { BusinessAgent } from '../agents/business-agent';
import { createMessage } from '@/lib/ai/anthropic-client';
import { stripMarkdownFormatting, NORWEGIAN_CONTENT_RULES, CLEAN_OUTPUT_RULES } from '@/lib/text-utils';
import type { ContentBrief, GeneratedContent } from '@/lib/types';

export type { ContentBrief, GeneratedContent };

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
        Tone: ${brief.tone}`
      );
      agents.push('Sales Agent');
    }

    // Step 3: Generate content with AI orchestration
    const generatedContent = await this.generateContentWithAI(brief, {
      marketingInsights: marketingAnalysis,
      salesCopy,
    });

    // Step 4: SEO optimization if relevant
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
    await this.businessAgent.analyzeData({
      content: generatedContent,
      brand: brief.brand,
      goal: brief.goal,
    });
    agents.push('Business Agent');

    // Step 6: Calculate virality score
    const viralityScore = this.calculateViralityScore(generatedContent, brief);

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
      conversionScore: brief.goal === 'conversion'
        ? this.calculateConversionScore(generatedContent)
        : undefined,
      recommendations,
      agents,
    };
  }

  private async generateContentWithAI(
    brief: ContentBrief,
    context: any
  ): Promise<string> {
    const systemPrompt = `You are a world-class content creator specializing in viral social media content. You understand platform algorithms, audience psychology, and viral mechanics. Create content that gets shared, liked, and commented on.

${NORWEGIAN_CONTENT_RULES}

${CLEAN_OUTPUT_RULES}`;

    const userPrompt = `Lag viralt ${brief.platform}-innhold for ${brief.brand}.

Spesifikasjoner:
- Plattform: ${brief.platform}
- Maal: ${brief.goal}
- Maalgruppe: ${brief.audience}
- Tone: ${brief.tone}
- Noekkelmeldinger: ${brief.keyMessages?.join(', ')}
- Maks lengde: ${brief.constraints?.maxLength || 'standard for plattformen'}

Retningslinjer:
1. Fang oppmerksomheten i foerste setning (hook)
2. Gjoer det delbart og engasjerende
3. Bruk sterke ord og emosjonelle triggere
4. Legg til en tydelig call-to-action
5. Optimaliser for plattformens algoritme
${brief.goal === 'conversion' ? '6. Driv konverteringer uten aa vaere pushy' : ''}

Marketing-innsikt: ${JSON.stringify(context.marketingInsights)}

Generer innholdet. Skriv paa norsk med ren tekst — ingen markdown-formatering!`;

    const raw = await createMessage(systemPrompt, userPrompt, {
      temperature: 0.8,
      maxTokens: 1500,
    });
    return stripMarkdownFormatting(raw);
  }

  private async generateVariants(
    originalContent: string,
    brief: ContentBrief,
    count: number
  ): Promise<string[]> {
    const systemPrompt = `You are expert at creating multiple variations of content that each have different appeal angles but maintain the same core message.

${NORWEGIAN_CONTENT_RULES}

${CLEAN_OUTPUT_RULES}`;

    const userPrompt = `Lag ${count} forskjellige varianter av dette ${brief.platform}-innlegget:

Original: ${originalContent}

Krav:
- Forskjellig vinkel/hook for hver variant
- Samme kjernemelding men ulik tilnaerming
- Behold ${brief.tone} tone
- Foelg ${brief.platform} best practices
- Skriv paa norsk med ren tekst — ingen markdown

Generer KUN innholdet, en variant per seksjon separert med ---`;

    const response = await createMessage(systemPrompt, userPrompt, {
      temperature: 0.9,
      maxTokens: 2000,
    });

    const lines = response.split('---')
      .map((line: string) => stripMarkdownFormatting(line.trim()))
      .filter((line: string) => line.length > 0);
    return lines.slice(0, count);
  }

  private async generateHashtags(content: string, brief: ContentBrief): Promise<string[]> {
    const userPrompt = `Generate 10-15 relevant hashtags for this ${brief.platform} content:
"${content.slice(0, 500)}"

Audience: ${brief.audience}
Goal: ${brief.goal}

Return ONLY hashtags separated by spaces.`;

    const response = await createMessage(
      'You generate relevant, trending hashtags for social media content.',
      userPrompt,
      { temperature: 0.7, maxTokens: 500 }
    );

    const hashtags = response.match(/#\w+/g) || [];
    return hashtags.slice(0, 15);
  }

  private calculateViralityScore(content: string, brief: ContentBrief): number {
    let score = 50;

    if (content.includes('?') || content.toLowerCase().includes('what') || content.toLowerCase().includes('how')) {
      score += 10;
    }

    if (/[^\x00-\x7F]/.test(content)) {
      score += 15; // Emojis/emotional triggers
    }

    if (content.length > 280 && brief.platform === 'twitter') {
      score -= 5;
    }

    if (content.length < 50 && brief.platform !== 'twitter') {
      score -= 10;
    }

    if (brief.platform === 'tiktok') {
      score += 15;
    }

    if (brief.platform === 'linkedin') {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateConversionScore(content: string): number {
    let score = 50;
    const lower = content.toLowerCase();

    if (lower.includes('click') || lower.includes('link') || lower.includes('buy') || lower.includes('sign up')) {
      score += 20;
    }

    if (lower.includes('save') || lower.includes('free') || lower.includes('exclusive')) {
      score += 15;
    }

    if (lower.includes('now') || lower.includes('today') || lower.includes('limited')) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  private estimateReach(audience: string, platform: string): number {
    const baseReach: Record<string, number> = {
      twitter: 5000,
      instagram: 3000,
      facebook: 7000,
      linkedin: 2000,
      tiktok: 15000,
    };

    const reach = baseReach[platform] || 5000;

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
