import { NextResponse } from 'next/server';
import { ContentGenerator } from '@/server/services/content-generator';
import type { ContentBrief } from '@/lib/types';

const contentGenerator = new ContentGenerator();

export async function POST(request: Request) {
  try {
    // Check Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured. Set it in .env.local to enable content generation.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { brand, platform, goal, audience, tone, keyMessages, constraints } = body;

    if (!brand || !platform || !goal || !audience || !tone) {
      return NextResponse.json(
        { error: 'brand, platform, goal, audience, and tone are required' },
        { status: 400 }
      );
    }

    const brief: ContentBrief = {
      brand,
      platform,
      goal,
      audience,
      tone,
      keyMessages,
      constraints,
    };

    const generated = await contentGenerator.generateViralContent(brief);
    return NextResponse.json(generated, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Content Studio] Generation failed:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
