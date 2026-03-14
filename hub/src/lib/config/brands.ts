export interface BrandConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  industry: string;
  color: string;
  websites: string[];
  targetAudience: string;
  voiceAndTone: string;
  style?: string;
  tone?: string;
  keyMessages: string[];
  contentThemes: string[];
  competitors: string[];
  icon: string;
  youtubeChannelId?: string;
}

export const DEFAULT_BRANDS: BrandConfig[] = [
  {
    id: 'zenecohomes',
    name: 'ZenecoHomes / Soleada / PinoEcoLife',
    shortName: 'ZenecoHomes',
    description: 'Premium Spanish properties for Norwegian and international buyers',
    industry: 'Real Estate (Spain)',
    color: '#3b82f6',
    websites: ['zenecohomes.com', 'pinosoecolife.com', 'soleada.no'],
    targetAudience: 'Norwegian investors, EU retirees, Spain locals',
    voiceAndTone: 'Professional yet approachable, luxury positioning',
    keyMessages: ['Premium living in Spain', 'Smart investment', 'Sustainable eco-homes'],
    contentThemes: ['Spanish lifestyle', 'Property investment', 'Eco-living', 'Market insights'],
    competitors: [],
    icon: 'Home',
  },
  {
    id: 'chatgenius',
    name: 'Chatgenius.pro',
    shortName: 'Chatgenius',
    description: 'AI-powered chat platform for businesses',
    industry: 'SaaS / AI Tools',
    color: '#8b5cf6',
    websites: ['chatgenius.pro'],
    targetAudience: 'AI/ML engineers, startups, enterprises',
    voiceAndTone: 'Technical yet accessible, innovative, results-driven',
    keyMessages: ['AI-powered customer service', 'Reduce support costs', 'Scale conversations'],
    contentThemes: ['AI innovation', 'Customer success', 'Product updates', 'Use cases'],
    competitors: [],
    icon: 'Bot',
  },
  {
    id: 'donaanna',
    name: 'Dona Anna',
    shortName: 'Dona Anna',
    description: 'Premium olive oil and sustainable agriculture from Spain',
    industry: 'Premium Olive Oil & Agriculture',
    color: '#22c55e',
    websites: ['donaanna.com'],
    targetAudience: 'Premium food buyers, sustainability advocates, Scandinavian market',
    voiceAndTone: 'Authentic, educational, premium, farm-to-table storytelling',
    keyMessages: ['Heritage & quality', 'Sustainable farming', 'Premium olive oil', 'Farm-to-table'],
    contentThemes: ['Sustainability', 'Recipes', 'Harvest stories', 'Quality process'],
    competitors: [],
    icon: 'Leaf',
  },
  {
    id: 'freddybremseth',
    name: 'Freddy Bremseth',
    shortName: 'Personal Brand',
    description: 'Multi-business entrepreneur, innovator, and thought leader',
    industry: 'Personal Authority & Thought Leadership',
    color: '#f59e0b',
    websites: ['freddybremseth.com'],
    targetAudience: 'Entrepreneurs, investors, thought leaders',
    voiceAndTone: 'Authoritative, inspiring, practical, visionary',
    keyMessages: ['Innovation across industries', 'Practical entrepreneurship', 'Technology meets sustainability'],
    contentThemes: ['Real estate transformation', 'AI & automation', 'Sustainable agriculture', 'Personal growth'],
    competitors: [],
    icon: 'User',
  },
  {
    id: 'neuralbeat',
    name: 'Neural Beat',
    shortName: 'Neural Beat',
    description: 'AI-driven EDM and electronic music production and distribution',
    industry: 'Music Production & Distribution',
    color: '#ec4899',
    websites: ['neuralbeat.io'],
    targetAudience: 'Music lovers, playlist curators, EDM fans, electronic music producers',
    voiceAndTone: 'Energetic, creative, futuristic, community-driven',
    keyMessages: ['AI-powered music', 'Electronic beats', 'Next-gen sound', 'Feel the frequency'],
    contentThemes: ['Music releases', 'Behind the beats', 'Genre exploration', 'Live sessions', 'Producer tips'],
    competitors: [],
    icon: 'Music',
  },
];

export function getBrandById(id: string): BrandConfig | undefined {
  return DEFAULT_BRANDS.find((b) => b.id === id);
}

export function getBrandColor(id: string): string {
  return getBrandById(id)?.color || '#6b7280';
}
