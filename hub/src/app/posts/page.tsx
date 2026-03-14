'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FileText, Clock, CheckCircle, XCircle, Edit, Send } from 'lucide-react';
import Link from 'next/link';

const MOCK_POSTS = [
  { id: '1', content: 'Luxury villa with panoramic Mediterranean views...', brand: 'ZenecoHomes', platforms: ['linkedin', 'instagram'], status: 'published', viralityScore: 85, publishedAt: '2024-03-10T10:00:00Z' },
  { id: '2', content: 'AI is revolutionizing customer service. Here is how Chatgenius...', brand: 'Chatgenius', platforms: ['twitter', 'linkedin'], status: 'scheduled', viralityScore: 72, scheduledAt: '2024-03-15T14:00:00Z' },
  { id: '3', content: 'From our ancient olive groves to your table...', brand: 'Dona Anna', platforms: ['instagram', 'facebook'], status: 'published', viralityScore: 91, publishedAt: '2024-03-08T09:00:00Z' },
  { id: '4', content: 'Running 4 businesses taught me one thing...', brand: 'Personal Brand', platforms: ['linkedin'], status: 'draft', viralityScore: 78 },
  { id: '5', content: 'New eco-development in Costa del Sol...', brand: 'ZenecoHomes', platforms: ['facebook', 'instagram'], status: 'failed', viralityScore: 65 },
  { id: '6', content: 'Our olive harvest this season has been exceptional...', brand: 'Dona Anna', platforms: ['instagram', 'tiktok'], status: 'scheduled', viralityScore: 88, scheduledAt: '2024-03-20T11:00:00Z' },
];

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  draft: { icon: Edit, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  scheduled: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  published: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
};

const brandColors: Record<string, string> = {
  ZenecoHomes: '#3b82f6',
  Chatgenius: '#8b5cf6',
  'Dona Anna': '#22c55e',
  'Personal Brand': '#f59e0b',
};

export default function PostsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = MOCK_POSTS.filter(post => {
    if (statusFilter && post.status !== statusFilter) return false;
    if (searchQuery && !post.content.toLowerCase().includes(searchQuery.toLowerCase()) && !post.brand.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Posts</h1>
          <p className="mt-1 text-slate-400">Manage drafts, scheduled, and published posts</p>
        </div>
        <Link href="/content-studio">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <FileText className="mr-2 h-4 w-4" /> Create New Post
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search posts..."
          className="max-w-sm bg-slate-800/50 text-white border-slate-700"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'published', label: 'Published' },
            { value: 'failed', label: 'Failed' },
          ]}
          className="w-40 bg-slate-800/50 text-white border-slate-700"
        />
      </div>

      {/* Status Summary */}
      <div className="mb-6 flex gap-3">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = MOCK_POSTS.filter(p => p.status === status).length;
          const StatusIcon = config.icon;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                statusFilter === status ? 'bg-slate-700' : 'bg-slate-800/50 hover:bg-slate-800'
              }`}
            >
              <StatusIcon className={`h-4 w-4 ${config.color}`} />
              <span className="text-slate-300">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
              <span className="text-xs text-slate-500">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.map((post) => {
          const StatusIcon = statusConfig[post.status].icon;
          return (
            <Card key={post.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80 transition-all">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: brandColors[post.brand] || '#6b7280' }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-400">{post.brand}</span>
                      <div className="flex gap-1">
                        {post.platforms.map(p => (
                          <Badge key={p} variant="outline" className="text-[10px] text-slate-400 border-slate-600 px-1.5 py-0">{p}</Badge>
                        ))}
                      </div>
                    </div>
                    <p className="truncate text-sm text-white">{post.content}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                  <div className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    post.viralityScore >= 80 ? 'bg-red-500/20 text-red-400' :
                    post.viralityScore >= 60 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {post.viralityScore}%
                  </div>

                  <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${statusConfig[post.status].bg}`}>
                    <StatusIcon className={`h-3 w-3 ${statusConfig[post.status].color}`} />
                    <span className={`text-xs ${statusConfig[post.status].color}`}>{post.status}</span>
                  </div>

                  {post.status === 'draft' && (
                    <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                      <Send className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
