import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index, real } from 'drizzle-orm/pg-core';

// ---- Core Tables ----

export const accounts = pgTable('accounts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  credentials: jsonb('credentials'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const posts = pgTable('posts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  brandId: varchar('brand_id', { length: 36 }),
  content: text('content').notNull(),
  mediaUrls: text('media_urls').array(),
  platforms: varchar('platforms', { length: 50 }).array().notNull(),
  status: varchar('status', { length: 20 }).default('draft'),
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('posts_user_id_idx').on(table.userId),
  statusIdx: index('posts_status_idx').on(table.status),
  scheduledAtIdx: index('posts_scheduled_at_idx').on(table.scheduledAt),
}));

export const schedules = pgTable('schedules', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  pattern: varchar('pattern', { length: 50 }).notNull(),
  platforms: varchar('platforms', { length: 50 }).array().notNull(),
  contentTemplateId: varchar('content_template_id', { length: 36 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('schedules_user_id_idx').on(table.userId),
}));

export const analytics = pgTable('analytics', {
  id: varchar('id', { length: 36 }).primaryKey(),
  accountId: varchar('account_id', { length: 36 }).notNull(),
  postId: varchar('post_id', { length: 36 }),
  metric: varchar('metric', { length: 50 }).notNull(),
  value: integer('value').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
}, (table) => ({
  accountIdIdx: index('analytics_account_id_idx').on(table.accountId),
  postIdIdx: index('analytics_post_id_idx').on(table.postId),
  timestampIdx: index('analytics_timestamp_idx').on(table.timestamp),
}));

export const automations = pgTable('automations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  trigger: varchar('trigger', { length: 100 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  config: jsonb('config').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('automations_user_id_idx').on(table.userId),
}));

// ---- Agent Tables ----

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

// ---- Content Tables ----

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
  color: varchar('color', { length: 7 }),
  websites: text('websites').array(),
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
  engagementRate: real('engagement_rate').default(0),
  timestamp: timestamp('timestamp').defaultNow(),
}, (table) => ({
  contentIdIdx: index('content_metrics_content_id_idx').on(table.contentId),
  platformIdx: index('content_metrics_platform_idx').on(table.platform),
}));

// ---- YouTube & Pipeline Tables ----

export const youtubeVideos = pgTable('youtube_videos', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  brandId: varchar('brand_id', { length: 36 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  tags: text('tags').array(),
  categoryId: varchar('category_id', { length: 10 }),
  privacyStatus: varchar('privacy_status', { length: 20 }).default('private'),
  youtubeVideoId: varchar('youtube_video_id', { length: 50 }),
  youtubeUrl: text('youtube_url'),
  channelId: varchar('channel_id', { length: 50 }),
  thumbnailUrl: text('thumbnail_url'),
  videoFileUrl: text('video_file_url'),
  airtableRecordId: varchar('airtable_record_id', { length: 50 }),
  videoType: varchar('video_type', { length: 20 }).default('long-form'),
  status: varchar('status', { length: 20 }).default('draft'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  brandIdIdx: index('youtube_videos_brand_id_idx').on(table.brandId),
  statusIdx: index('youtube_videos_status_idx').on(table.status),
}));

export const pipelineRuns = pgTable('pipeline_runs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  pipelineType: varchar('pipeline_type', { length: 50 }).notNull(),
  sourceRecordId: varchar('source_record_id', { length: 50 }),
  sourcePlatform: varchar('source_platform', { length: 50 }).default('airtable'),
  recordTitle: varchar('record_title', { length: 255 }),
  steps: jsonb('steps').notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  result: jsonb('result'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  statusIdx: index('pipeline_runs_status_idx').on(table.status),
  typeIdx: index('pipeline_runs_type_idx').on(table.pipelineType),
}));

export const automationLogs = pgTable('automation_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  pipelineRunId: varchar('pipeline_run_id', { length: 36 }),
  level: varchar('level', { length: 10 }).notNull(),
  message: text('message').notNull(),
  data: jsonb('data'),
  timestamp: timestamp('timestamp').defaultNow(),
}, (table) => ({
  pipelineRunIdIdx: index('automation_logs_pipeline_run_id_idx').on(table.pipelineRunId),
  levelIdx: index('automation_logs_level_idx').on(table.level),
}));

export const calendarEvents = pgTable('calendar_events', {
  id: varchar('id', { length: 36 }).primaryKey(),
  postId: varchar('post_id', { length: 36 }),
  contentId: varchar('content_id', { length: 36 }),
  brandId: varchar('brand_id', { length: 36 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  platforms: varchar('platforms', { length: 50 }).array(),
  scheduledDate: timestamp('scheduled_date').notNull(),
  status: varchar('status', { length: 20 }).default('planned'),
  color: varchar('color', { length: 7 }),
  createdAt: timestamp('created_at').defaultNow(),
});
