import { NextResponse } from 'next/server';
import { ContentGenerator } from '@/server/services/content-generator';

const contentGenerator = new ContentGenerator();

export async function POST(request: Request) {
  try {
    const { brand, count = 5 } = await request.json();

    if (!brand) {
      return NextResponse.json({ error: 'brand is required' }, { status: 400 });
    }

    const contents = await contentGenerator.generateContentForBrand(brand, count);
    return NextResponse.json(contents, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
