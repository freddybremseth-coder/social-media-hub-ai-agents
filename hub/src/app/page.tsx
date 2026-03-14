'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, Eye, Zap, Sparkles, Bot, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  totalPosts: number;
  totalEngagement: number;
  totalReach: number;
  averageViralityScore: number;
  postsThisWeek: number;
  topPlatform: string;
  platformMetrics: any[];
  agentPerformance: any[];
  viralityDistribution: any[];
  recentContent: any[];
  brandPerformance: any[];
}

function StatCard({ title, value, icon: Icon, trend, color }: {
  title: string; value: string | number; icon: any; trend: string; color: string;
}) {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80 transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="mt-1 text-3xl font-bold text-white">{value}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
              <ArrowUpRight className="h-3 w-3" /> {trend}
            </p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          <p className="mt-4 text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-slate-400">Your AI-powered social media command center</p>
        </div>
        <div className="flex gap-3">
          <Link href="/content-studio">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500">
              <Sparkles className="mr-2 h-4 w-4" /> Generate Content
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Posts" value={data.totalPosts} icon={Zap} trend="+12% this week" color="from-blue-500 to-blue-600" />
        <StatCard title="Total Reach" value={`${(data.totalReach / 1000).toFixed(0)}K`} icon={Eye} trend="+28% this month" color="from-purple-500 to-purple-600" />
        <StatCard title="Virality Score" value={`${data.averageViralityScore}%`} icon={TrendingUp} trend="+5% avg" color="from-orange-500 to-red-500" />
        <StatCard title="Engagement" value={`${(data.totalEngagement / 1000).toFixed(1)}K`} icon={Users} trend="+18% this month" color="from-green-500 to-emerald-600" />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Platform Performance */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Platform Performance</CardTitle>
                <CardDescription className="text-slate-400">Reach by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.platformMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="platform" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="reach" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Virality Distribution */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Virality Score Distribution</CardTitle>
                <CardDescription className="text-slate-400">Content performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.viralityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }: any) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.viralityDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Content */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Recent Content</CardTitle>
              <CardDescription className="text-slate-400">Latest AI-generated content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentContent.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-900/50 p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.brand === 'ZenecoHomes' ? '#3b82f6' : item.brand === 'Chatgenius' ? '#8b5cf6' : item.brand === 'Dona Anna' ? '#22c55e' : '#f59e0b' }}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{item.brand}</p>
                        <p className="text-xs text-slate-400">{item.content.slice(0, 60)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-slate-300 border-slate-600">{item.platform}</Badge>
                      <div className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.viralityScore >= 80 ? 'bg-red-500/20 text-red-400' :
                        item.viralityScore >= 60 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.viralityScore}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.agentPerformance.map((agent: any) => (
              <Card key={agent.agent} className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700">
                        <Bot className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{agent.agent}</p>
                        <p className="text-xs text-slate-400">{agent.type}</p>
                      </div>
                    </div>
                    <Badge className={agent.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-0' : 'bg-slate-500/20 text-slate-400 border-0'}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Tasks Done</p>
                      <p className="text-lg font-semibold text-white">{agent.tasksCompleted}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Avg Score</p>
                      <p className="text-lg font-semibold text-white">{agent.avgScore}/10</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Brands Tab */}
        <TabsContent value="brands" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.brandPerformance.map((brand: any) => (
              <Card key={brand.brand} className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: brand.color }} />
                    <h3 className="text-lg font-semibold text-white">{brand.brand}</h3>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Posts</p>
                      <p className="text-xl font-bold text-white">{brand.posts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Reach</p>
                      <p className="text-xl font-bold text-white">{(brand.reach / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Engagement</p>
                      <p className="text-xl font-bold text-white">{(brand.engagement / 1000).toFixed(1)}K</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
