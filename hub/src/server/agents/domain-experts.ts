/**
 * HYBRID APPROACH - Domene-Spesifikke Agent Personas
 * Basert paa dine 4 forretninger, ikke separate mennesker
 */

export interface DomainExpertise {
  businessDomain: string;
  expertRole: string;
  keyResponsibilities: string[];
  apiIntegrations: string[];
  skillParameters: Record<string, any>;
}

// SPARANVENDELSE - En Marketing Agent med 4 Business-Moduler
export const DOMAIN_EXPERT_MODULES: Record<string, DomainExpertise> = {
  // MODUL 1: EIENDOM ESPANA
  realestate: {
    businessDomain: 'Real Estate (Spain)',
    expertRole: 'Spanish Real Estate Marketing Specialist',
    keyResponsibilities: [
      'Spanish market trends & SEO keywords',
      'Property copywriting (luxury positioning)',
      'Local regulation knowledge',
      'Visual content strategy for properties',
      'Multi-language content (ES/NO/EN)',
    ],
    apiIntegrations: [
      'PropertyAPI (Spanish listings)',
      'LocalSEO (Spain-specific)',
      'TranslationAPI',
      'ImageOptimization',
    ],
    skillParameters: {
      luxury_positioning: true,
      language_pairs: ['es-no', 'es-en'],
      local_markets: ['Malaga', 'Costa del Sol', 'Valencia'],
      property_types: ['apartments', 'villas', 'developments'],
      buyer_segments: ['Norwegian investors', 'EU retirees', 'Spain locals'],
    },
  },

  // MODUL 2: SAAS - CHATGENIUS
  saas: {
    businessDomain: 'SaaS / AI Tools',
    expertRole: 'SaaS Growth & Product Marketing Specialist',
    keyResponsibilities: [
      'Product positioning & feature clarity',
      'B2B buyer journey mapping',
      'Technical SEO for SaaS',
      'Conversion optimization (trials -> paid)',
      'API documentation marketing',
      'Code integration examples & tutorials',
    ],
    apiIntegrations: [
      'ChatGeniusAPI (internal)',
      'ProductAnalytics',
      'TechStackDatabase',
      'CodeExampleGenerator',
      'GitHubIntegration',
    ],
    skillParameters: {
      target_users: ['AI/ML engineers', 'startups', 'enterprises'],
      pricing_strategy: 'freemium',
      use_cases: ['customer service', 'lead generation', 'content creation'],
      competitor_analysis: true,
      technical_depth: 'high',
    },
  },

  // MODUL 3: OLIVENFARM
  agriculture: {
    businessDomain: 'Premium Olive Oil & Agriculture',
    expertRole: 'Premium Food & Sustainability Marketing Specialist',
    keyResponsibilities: [
      'Farm-to-table storytelling',
      'Sustainability & organic certifications',
      'Premium product positioning',
      'Food photography & styling tips',
      'Recipe content & culinary partnerships',
      'Agricultural insights (soil, harvest, varieties)',
    ],
    apiIntegrations: [
      'SustainabilityDatabase',
      'RecipeAPI',
      'FoodPhotographyGuides',
      'SupplyChainAPI',
      'CertificationValidator',
    ],
    skillParameters: {
      product_focus: 'premium olive oil, table olives',
      certifications: ['organic', 'DOP', 'fair-trade'],
      sustainability_messaging: true,
      target_markets: ['Scandinavia', 'EU', 'premium retailers'],
      storytelling_focus: 'heritage & family',
    },
  },

  // MODUL 4: PERSONAL BRAND
  personalBrand: {
    businessDomain: 'Personal Authority & Thought Leadership',
    expertRole: 'Executive Brand & Authority Builder',
    keyResponsibilities: [
      'Cross-business narrative building',
      'Thought leadership content',
      'LinkedIn authority positioning',
      'Speaking opportunity sourcing',
      'Collaboration & partnership outreach',
      'Media relations & press coverage',
      'Community building',
    ],
    apiIntegrations: [
      'LinkedInAPI',
      'MediumAPI',
      'PodcastDatabase',
      'SpeakerNetwork',
      'JournalistDatabase',
    ],
    skillParameters: {
      narrative_thread: 'entrepreneur, innovator, sustainability advocate',
      content_pillars: [
        'real estate transformation',
        'AI & automation',
        'sustainable agriculture',
        'personal growth',
      ],
      audience_segments: ['entrepreneurs', 'investors', 'thought leaders'],
      platform_priority: ['LinkedIn', 'Medium', 'Newsletter', 'Podcast'],
    },
  },
  // MODUL 5: MUSIKK / NEURAL BEAT
  music: {
    businessDomain: 'Music Production & Distribution',
    expertRole: 'Music & Audio Content Marketing Specialist',
    keyResponsibilities: [
      'Music release strategy & scheduling',
      'YouTube music video optimization',
      'Playlist pitching & curation strategy',
      'Audio-visual content creation',
      'Genre-specific audience targeting',
      'Music metadata & tagging optimization',
    ],
    apiIntegrations: [
      'YouTubeDataAPI',
      'AirtableAPI',
      'CreatomateAPI',
      'GeminiImageAPI',
    ],
    skillParameters: {
      genres: ['EDM', 'house', 'techno', 'ambient', 'synthwave', 'drum-and-bass'],
      content_types: ['music video', 'lyric video', 'visualizer', 'behind-the-scenes'],
      distribution_channels: ['YouTube', 'TikTok', 'Instagram Reels'],
      release_strategy: 'single-driven with video support',
      audience_segments: ['EDM fans', 'playlist curators', 'music producers', 'festival goers'],
      visual_style: 'neon, cyberpunk, abstract, futuristic',
    },
  },
};
