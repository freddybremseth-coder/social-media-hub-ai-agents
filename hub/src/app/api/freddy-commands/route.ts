import { NextResponse } from 'next/server';
import { MultiDomainExpertAgent } from '@/server/agents/multi-domain-expert';
import { generateId } from '@/lib/utils';
import type { AgentTask } from '@/lib/types';

const freddy = new MultiDomainExpertAgent();

const COMMAND_CONFIGS: Record<string, (params: any) => AgentTask> = {
  'property-content': (params) => ({
    id: generateId(),
    name: 'create_content',
    description: 'Create viral property content',
    priority: 'high',
    parameters: {
      business: 'real-estate',
      websites: ['zenecohomes.com', 'pinosoecolife.com', 'soleada.no'],
      task: `Create ${params.platform || 'linkedin'} content about ${params.property || 'Spanish properties'}`,
      platform: params.platform || 'linkedin',
      angle: params.angle || 'luxury lifestyle',
      audience: 'Norwegian investors looking for Spanish properties',
      tone: 'professional yet approachable',
    },
    status: 'pending',
  }),

  'saas-sales': (params) => ({
    id: generateId(),
    name: 'optimize_sales',
    description: 'Optimize SaaS sales strategy',
    priority: 'high',
    parameters: {
      business: 'SaaS',
      websites: ['chatgenius.pro'],
      offering: 'Chatgenius AI Chat Platform',
      currentConversion: params.currentConversion || 3,
      targetConversion: params.targetConversion || 8,
      buyerMotivations: 'Save time, reduce support costs, improve customer satisfaction',
    },
    status: 'pending',
  }),

  'personal-brand': (params) => ({
    id: generateId(),
    name: 'cross_brand_narrative',
    description: 'Build integrated personal brand narrative',
    priority: 'high',
    parameters: {
      business: 'personal-brand',
      websites: ['freddybremseth.com'],
      task: `Create ${params.contentType || 'thought leadership post'} that showcases multi-business expertise`,
      contentType: params.contentType || 'thought leadership post',
      platforms: params.platforms || ['linkedin'],
      narrative: 'Innovator, entrepreneur, sustainability advocate',
    },
    status: 'pending',
  }),

  'farm-content': (params) => ({
    id: generateId(),
    name: 'create_content',
    description: 'Create farm content with agricultural depth',
    priority: 'high',
    parameters: {
      business: 'agriculture',
      websites: ['donaanna.com'],
      task: `Create ${params.platform || 'instagram'} content about ${params.topic || 'olive oil quality'}`,
      platform: params.platform || 'instagram',
      topic: params.topic || 'olive oil quality',
      audience: 'Premium olive oil buyers, sustainability advocates',
      tone: 'authentic, educational, premium',
    },
    status: 'pending',
  }),

  'youtube-content': (params) => ({
    id: generateId(),
    name: params.taskName || 'create_script',
    description: 'Create YouTube content with SEO optimization',
    priority: 'high',
    parameters: {
      business: 'youtube',
      task: `Create YouTube ${params.contentType || 'video script'} about ${params.topic || 'business insights'}`,
      topic: params.topic || 'business insights',
      brand: params.brand || 'Freddy Bremseth',
      audience: params.audience || 'Norwegian entrepreneurs and investors',
      platform: 'youtube',
      duration: params.duration || '8-12 minutter',
      tone: params.tone || 'engasjerende og informativ',
    },
    status: 'pending',
  }),

  'neural-beat': (params) => ({
    id: generateId(),
    name: 'generate_youtube_seo',
    description: 'Generate YouTube SEO metadata for Neural Beat track',
    priority: 'high',
    parameters: {
      business: 'music',
      task: `Generate YouTube SEO and content strategy for "${params.title || 'New Track'}"`,
      title: params.title || 'New Track',
      artist: params.artist || 'Neural Beat',
      genre: params.genre || 'Synthwave',
      mood: params.mood || 'energetic',
      brand: 'Neural Beat',
      platform: 'youtube',
    },
    status: 'pending',
  }),
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { command, ...params } = body;

    if (!command || !COMMAND_CONFIGS[command]) {
      return NextResponse.json(
        { error: `Invalid command. Available: ${Object.keys(COMMAND_CONFIGS).join(', ')}` },
        { status: 400 }
      );
    }

    const task = COMMAND_CONFIGS[command](params);
    const [result] = await freddy.executeTasks([task]);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
