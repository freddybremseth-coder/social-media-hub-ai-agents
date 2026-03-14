/**
 * COMMAND INTERFACE - Direkte instruksjon til dine agenter
 * Designet spesielt for deg
 */

import { Router } from 'express';
import { MultiDomainExpertAgent } from '../../services/agents/multi-domain-expert';

const router = Router();
const freddy = new MultiDomainExpertAgent();

// Eksempel: Du vil lage innhold for eiendom
router.post('/create-property-content', async (req, res) => {
  const { property, platform, angle } = req.body;

  const task = {
    id: `content_${Date.now()}`,
    name: 'create_content',
    description: 'Create viral property content',
    priority: 'high' as const,
    parameters: {
      business: 'real-estate',
      websites: ['zenecohomes.com', 'pinosoecolife.com', 'soleada.no'],
      task: `Create ${platform} content about ${property}`,
      platform,
      angle, // f.eks. "luxury lifestyle", "investment opportunity", "family home"
      audience: 'Norwegian investors looking for Spanish properties',
      tone: 'professional yet approachable',
    },
    status: 'pending' as const,
  };

  const [result] = await freddy.executeTasks([task]);
  res.json(result);
});

// Eksempel: Du vil optimisere Chatgenius salg
router.post('/optimize-saas-sales', async (req, res) => {
  const { currentConversion, targetConversion } = req.body;

  const task = {
    id: `sales_${Date.now()}`,
    name: 'optimize_sales',
    description: 'Optimize SaaS sales strategy',
    priority: 'high' as const,
    parameters: {
      business: 'SaaS',
      websites: ['chatgenius.pro'],
      offering: 'Chatgenius AI Chat Platform',
      currentConversion,
      targetConversion,
      buyerMotivations: 'Save time, reduce support costs, improve customer satisfaction',
    },
    status: 'pending' as const,
  };

  const [result] = await freddy.executeTasks([task]);
  res.json(result);
});

// Eksempel: Bygge din personlige brand
router.post('/build-personal-brand', async (req, res) => {
  const { contentType, platforms } = req.body;

  const task = {
    id: `brand_${Date.now()}`,
    name: 'cross_brand_narrative',
    description: 'Build integrated personal brand narrative',
    priority: 'high' as const,
    parameters: {
      business: 'personal-brand',
      websites: ['freddybremseth.com'],
      task: `Create ${contentType} that showcases my multi-business expertise`,
      contentType,
      platforms,
      narrative: 'Innovator, entrepreneur, sustainability advocate',
    },
    status: 'pending' as const,
  };

  const [result] = await freddy.executeTasks([task]);
  res.json(result);
});

// Olivenfarm content
router.post('/create-farm-content', async (req, res) => {
  const { topic, platform } = req.body;

  const task = {
    id: `farm_${Date.now()}`,
    name: 'create_content',
    description: 'Create farm content with agricultural depth',
    priority: 'high' as const,
    parameters: {
      business: 'agriculture',
      websites: ['donaanna.com'],
      task: `Create ${platform} content about ${topic}`,
      platform,
      topic,
      audience: 'Premium olive oil buyers, sustainability advocates',
      tone: 'authentic, educational, premium',
    },
    status: 'pending' as const,
  };

  const [result] = await freddy.executeTasks([task]);
  res.json(result);
});

export default router;