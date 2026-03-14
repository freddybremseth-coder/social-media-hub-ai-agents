import { Router, Request, Response } from 'express';
import { ContentGenerator, ContentBrief } from '../../services/content-generator';
import { db } from '../../database';
import { generatedContent, brands } from '../../database/schema';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const contentGenerator = new ContentGenerator();

// Generate viral content for a brand
router.post('/generate-viral', async (req: Request, res: Response) => {
  try {
    const { brand, platform, goal, audience, tone, keyMessages, constraints } = req.body;
    const userId = req.user?.id;

    const brief: ContentBrief = {
      brand,
      platform,
      goal,
      audience,
      tone,
      keyMessages,
      constraints,
    };

    const generatedData = await contentGenerator.generateViralContent(brief);

    // Save to database
    await db.insert(generatedContent).values({
      id: generatedData.id,
      userId,
      brand: brief.brand,
      platform: brief.platform,
      content: generatedData.content,
      variants: generatedData.variants,
      hashtags: generatedData.hashtags,
      viralityScore: generatedData.viralityScore,
      seoScore: generatedData.seoScore,
      conversionScore: generatedData.conversionScore,
      estimatedReach: generatedData.estimatedReach,
      recommendations: generatedData.recommendations,
      agentsUsed: generatedData.agents,
      status: 'draft',
    });

    res.status(201).json(generatedData);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Generate content for entire brand
router.post('/generate-brand-content/:brandId', async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;
    const { count = 5 } = req.body;
    const userId = req.user?.id;

    // Get brand details
    const brand = await db.query.brands.findFirst({
      where: (brands, { eq }) => eq(brands.id, brandId),
    });

    if (!brand || brand.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const generatedContents = await contentGenerator.generateContentForBrand(brand.name, count);

    // Save all to database
    for (const content of generatedContents) {
      await db.insert(generatedContent).values({
        id: content.id,
        userId,
        brand: brand.name,
        platform: content.brief.platform,
        content: content.content,
        variants: content.variants,
        hashtags: content.hashtags,
        viralityScore: content.viralityScore,
        seoScore: content.seoScore,
        conversionScore: content.conversionScore,
        estimatedReach: content.estimatedReach,
        recommendations: content.recommendations,
        agentsUsed: content.agents,
        status: 'draft',
      });
    }

    res.status(201).json(generatedContents);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get generated content
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { brand, platform, status } = req.query;

    let query = db.query.generatedContent.findMany({
      where: (gc, { eq, and }) => {
        const conditions = [eq(gc.userId, userId)];
        if (brand) conditions.push(eq(gc.brand, brand as string));
        if (platform) conditions.push(eq(gc.platform, platform as string));
        if (status) conditions.push(eq(gc.status, status as string));
        return and(...conditions);
      },
    });

    const contents = await query;
    res.json(contents);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;