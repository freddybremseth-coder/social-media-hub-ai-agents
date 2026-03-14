import { Router, Request, Response } from 'express';
import { db } from '../../database';
import { posts } from '../../database/schema';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create a new post (draft)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { content, mediaUrls, platforms } = req.body;
    const userId = req.user?.id;

    if (!content || !platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'Content and platforms are required' });
    }

    const post = await db.insert(posts).values({
      id: uuidv4(),
      userId,
      content,
      mediaUrls,
      platforms,
      status: 'draft',
    }).returning();

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Schedule a post
router.post('/:id/schedule', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    await db.update(posts)
      .set({
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
      })
      .where(eq(posts.id, id));

    res.json({ success: true, message: 'Post scheduled' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Publish a post immediately
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Trigger immediate publishing
    await db.update(posts)
      .set({
        status: 'scheduled',
        scheduledAt: new Date(),
      })
      .where(eq(posts.id, id));

    res.json({ success: true, message: 'Post published' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get all posts for user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userPosts = await db.query.posts.findMany({
      where: eq(posts.userId, userId),
    });

    res.json(userPosts);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;