import { NextResponse } from 'next/server';

export async function GET() {
  // In production, these would come from the database
  const stats = {
    totalPosts: 77,
    totalEngagement: 25000,
    totalReach: 228000,
    averageViralityScore: 68,
    postsThisWeek: 12,
    topPlatform: 'TikTok',
    platformMetrics: [
      { platform: 'Twitter/X', reach: 45000, engagement: 3200, posts: 24, color: '#1DA1F2' },
      { platform: 'Instagram', reach: 32000, engagement: 5600, posts: 18, color: '#E4405F' },
      { platform: 'LinkedIn', reach: 28000, engagement: 1800, posts: 12, color: '#0A66C2' },
      { platform: 'TikTok', reach: 85000, engagement: 12000, posts: 8, color: '#000000' },
      { platform: 'Facebook', reach: 38000, engagement: 2400, posts: 15, color: '#1877F2' },
      { platform: 'YouTube', reach: 120000, engagement: 18000, posts: 6, color: '#FF0000' },
    ],
    agentPerformance: [
      { agent: 'Alex Marketing Pro', type: 'marketing', tasksCompleted: 42, avgScore: 8.5, status: 'active' },
      { agent: 'Jordan Sales Master', type: 'sales', tasksCompleted: 38, avgScore: 8.2, status: 'active' },
      { agent: 'Sam SEO Expert', type: 'seo', tasksCompleted: 35, avgScore: 7.9, status: 'active' },
      { agent: 'Morgan Business Strategist', type: 'business', tasksCompleted: 31, avgScore: 8.1, status: 'active' },
      { agent: 'Freddy Business Navigator', type: 'multi-domain', tasksCompleted: 28, avgScore: 9.1, status: 'active' },
      { agent: 'Nova YouTube Creator', type: 'youtube', tasksCompleted: 24, avgScore: 8.7, status: 'active' },
    ],
    viralityDistribution: [
      { range: '80-100', count: 12, fill: '#ef4444' },
      { range: '60-79', count: 28, fill: '#f97316' },
      { range: '40-59', count: 35, fill: '#eab308' },
      { range: '0-39', count: 15, fill: '#84cc16' },
    ],
    recentContent: [
      { id: '1', brand: 'ZenecoHomes', platform: 'linkedin', viralityScore: 85, content: 'Luxury villa with panoramic Mediterranean views...', createdAt: new Date().toISOString() },
      { id: '2', brand: 'Chatgenius', platform: 'twitter', viralityScore: 72, content: 'AI is revolutionizing customer service...', createdAt: new Date().toISOString() },
      { id: '3', brand: 'Dona Anna', platform: 'instagram', viralityScore: 91, content: 'From our ancient olive groves to your table...', createdAt: new Date().toISOString() },
      { id: '4', brand: 'Personal Brand', platform: 'linkedin', viralityScore: 78, content: 'Running 4 businesses taught me one thing...', createdAt: new Date().toISOString() },
      { id: '5', brand: 'Neural Beat', platform: 'youtube', viralityScore: 82, content: 'Midnight Pulse - Official Visualizer. AI-generated synthwave...', createdAt: new Date().toISOString() },
      { id: '6', brand: 'Neural Beat', platform: 'youtube', viralityScore: 68, content: 'Solar Drift - Ambient electronic journey through AI landscapes...', createdAt: new Date().toISOString() },
    ],
    brandPerformance: [
      { brand: 'ZenecoHomes', posts: 22, reach: 68000, engagement: 4200, color: '#3b82f6' },
      { brand: 'Chatgenius', posts: 20, reach: 52000, engagement: 3800, color: '#8b5cf6' },
      { brand: 'Dona Anna', posts: 18, reach: 58000, engagement: 9200, color: '#22c55e' },
      { brand: 'Personal Brand', posts: 17, reach: 50000, engagement: 7800, color: '#f59e0b' },
      { brand: 'Neural Beat', posts: 12, reach: 42000, engagement: 6500, color: '#ec4899' },
    ],
  };

  return NextResponse.json(stats);
}
