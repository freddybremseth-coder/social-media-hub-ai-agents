import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerator } from '@/server/services/content-generator';
import { postContent, getTodaysPlatform, postForAllBrands } from '@/server/services/social-poster';
import { DEFAULT_BRANDS, getBrandById } from '@/lib/config/brands';

const contentGenerator = new ContentGenerator();

/**
 * POST /api/content/auto-post
 *
 * Modes:
 * 1. Single: { brandId, platform } → generate + post for one brand
 * 2. Auto:   { auto: true }        → generate + post for ALL brands on today's rotating platform
 * 3. DryRun: { auto: true, dryRun: true } → generate content for all brands without posting
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, platform, auto, dryRun } = body;

    // Auto mode: post for all brands on today's platform
    if (auto) {
      const todaysPlatform = platform || getTodaysPlatform();
      console.log(`[AutoPost] Auto-posting for all brands on ${todaysPlatform} (dryRun: ${!!dryRun})`);

      if (dryRun) {
        // Dry run: generate content but don't post
        const results = [];
        for (const brand of DEFAULT_BRANDS) {
          try {
            const generated = await contentGenerator.generateViralContent({
              brand: brand.name,
              platform: todaysPlatform,
              goal: 'engagement',
              audience: brand.targetAudience,
              tone: brand.voiceAndTone,
              keyMessages: brand.keyMessages,
            });
            results.push({
              brandId: brand.id,
              brandName: brand.shortName,
              platform: todaysPlatform,
              content: generated.content,
              hashtags: generated.hashtags,
              viralityScore: generated.viralityScore,
              status: 'generated',
            });
          } catch (err) {
            results.push({
              brandId: brand.id,
              brandName: brand.shortName,
              platform: todaysPlatform,
              status: 'error',
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }

        return NextResponse.json({
          mode: 'dry-run',
          platform: todaysPlatform,
          results,
          total: results.length,
        });
      }

      // Real posting
      const results = await postForAllBrands(todaysPlatform, async (brand, plt) => {
        const generated = await contentGenerator.generateViralContent({
          brand: brand.name,
          platform: plt,
          goal: 'engagement',
          audience: brand.targetAudience,
          tone: brand.voiceAndTone,
          keyMessages: brand.keyMessages,
        });
        return {
          content: generated.content,
          hashtags: generated.hashtags,
        };
      });

      const successful = results.filter((r) => r.success).length;
      return NextResponse.json({
        mode: 'auto',
        platform: todaysPlatform,
        results,
        total: results.length,
        successful,
        failed: results.length - successful,
      });
    }

    // Single mode: post for one brand
    if (!brandId || !platform) {
      return NextResponse.json(
        { error: 'brandId and platform are required (or use { auto: true })' },
        { status: 400 }
      );
    }

    const brand = getBrandById(brandId);
    if (!brand) {
      return NextResponse.json(
        { error: `Brand not found: ${brandId}` },
        { status: 404 }
      );
    }

    // Generate content
    const generated = await contentGenerator.generateViralContent({
      brand: brand.name,
      platform,
      goal: 'engagement',
      audience: brand.targetAudience,
      tone: brand.voiceAndTone,
      keyMessages: brand.keyMessages,
    });

    // Post it
    const result = await postContent({
      brandId: brand.id,
      platform,
      content: generated.content,
      hashtags: generated.hashtags,
      link: brand.websites[0] ? `https://${brand.websites[0]}` : undefined,
    });

    return NextResponse.json({
      mode: 'single',
      generation: {
        content: generated.content,
        hashtags: generated.hashtags,
        viralityScore: generated.viralityScore,
      },
      posting: result,
    });
  } catch (error) {
    console.error('[AutoPost] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Auto-post failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/auto-post
 * Returns today's platform and posting configuration.
 */
export async function GET() {
  const todaysPlatform = getTodaysPlatform();
  const brands = DEFAULT_BRANDS.map((b) => ({
    id: b.id,
    name: b.shortName,
    industry: b.industry,
  }));

  return NextResponse.json({
    todaysPlatform,
    brands,
    schedule: {
      description: 'Daily rotation: Instagram → Facebook → LinkedIn',
      rotation: ['instagram', 'facebook', 'linkedin'],
    },
  });
}
