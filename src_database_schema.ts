import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';

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
  content: text('content').notNull(),
  mediaUrls: text('media_urls').array(),
  platforms: varchar('platforms', { length: 50 }).array().notNull(),
  status: varchar('status', { length: 20 }).default('draft'), // draft, scheduled, published, failed
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
  pattern: varchar('pattern', { length: 50 }).notNull(), // cron format
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
  metric: varchar('metric', { length: 50 }).notNull(), // likes, comments, shares, impressions, reach
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
  trigger: varchar('trigger', { length: 100 }).notNull(), // webhook, schedule, keyword
  action: varchar('action', { length: 100 }).notNull(), // repost, like, comment, follow
  config: jsonb('config').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('automations_user_id_idx').on(table.userId),
}));