import { NextResponse } from 'next/server';
import { ContentGenerator } from '@/server/services/content-generator';
import type { ContentBrief } from '@/lib/types';

const contentGenerator = new ContentGenerator();

export async function POST(request: Request) {
  try {
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
