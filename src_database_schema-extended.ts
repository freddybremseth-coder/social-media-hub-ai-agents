import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';

export const agents = pgTable('agents', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  expertise: text('expertise').array(),
  systemPrompt: text('system_prompt'),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const agentCommands = pgTable('agent_commands', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  agentId: varchar('agent_id', { length: 36 }).notNull(),
  taskName: varchar('task_name', { length: 255 }).notNull(),
  parameters: jsonb('parameters'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  deadline: timestamp('deadline'),
  status: varchar('status', { length: 20 }).default('pending'),
  result: text('result'),
  createdAt: timestamp('created_at').defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  userIdIdx: index('agent_commands_user_id_idx').on(table.userId),
  statusIdx: index('agent_commands_status_idx').on(table.status),
}));

export const generatedContent = pgTable('generated_content', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  brand: varchar('brand', { length: 255 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  content: text('content').notNull(),
  variants: text('variants').array(),
  hashtags: text('hashtags').array(),
  viralityScore: integer('virality_score'),
  seoScore: integer('seo_score'),
  conversionScore: integer('conversion_score'),
  estimatedReach: integer('estimated_reach'),
  recommendations: text('recommendations').array(),
  agentsUsed: text('agents_used').array(),
  status: varchar('status', { length: 20 }).default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('generated_content_user_id_idx').on(table.userId),
  brandIdx: index('generated_content_brand_idx').on(table.brand),
  statusIdx: index('generated_content_status_idx').on(table.status),
}));

export const brands = pgTable('brands', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  industry: varchar('industry', { length: 100 }),
  targetAudience: varchar('target_audience', { length: 255 }),
  voiceAndTone: varchar('voice_and_tone', { length: 255 }),
  keyMessages: text('key_messages').array(),
  competitors: text('competitors').array(),
  contentThemes: text('content_themes').array(),
  brandGuidelines: jsonb('brand_guidelines'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('brands_user_id_idx').on(table.userId),
}));

export const contentMetrics = pgTable('content_metrics', {
  id: varchar('id', { length: 36 }).primaryKey(),
  contentId: varchar('content_id', { length: 36 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  views: integer('views').default(0),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  clicks: integer('clicks').default(0),
  conversions: integer('conversions').default(0),
  engagementRate: integer('engagement_rate').default(0),
  timestamp: timestamp('timestamp').defaultNow(),
}, (table) => ({
  contentIdIdx: index('content_metrics_content_id_idx').on(table.contentId),
  platformIdx: index('content_metrics_platform_idx').on(table.platform),
}));