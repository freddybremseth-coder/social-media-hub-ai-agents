'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Eye, Users, Zap } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  const engagementOverTime = [
    { month: 'Jan', twitter: 1200, instagram: 2400, linkedin: 800, tiktok: 3200, facebook: 1600 },
    { month: 'Feb', twitter: 1800, instagram: 2800, linkedin: 1200, tiktok: 5400, facebook: 2000 },
    { month: 'Mar', twitter: 2400, instagram: 3600, linkedin: 1400, tiktok: 7200, facebook: 2200 },
    { month: 'Apr', twitter: 3200, instagram: 5600, linkedin: 1800, tiktok: 12000, facebook: 2400 },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-slate-400">Track performance across all platforms and brands</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Reach', value: `${(data.totalReach / 1000).toFixed(0)}K`, icon: Eye, color: 'text-blue-400' },
          { label: 'Engagement', value: `${(data.totalEngagement / 1000).toFixed(1)}K`, icon: Users, color: 'text-purple-400' },
          { label: 'Avg Virality', value: `${data.averageViralityScore}%`, icon: TrendingUp, color: 'text-orange-400' },
          { label: 'Posts', value: data.totalPosts, icon: Zap, color: 'text-emerald-400' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="flex items-center gap-4 p-6">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="platforms" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Reach by Platform</CardTitle>
                <CardDescription className="text-slate-400">Total reach across all platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data.platformMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="platform" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                    <Bar dataKey="reach" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="engagement" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Posts by Platform</CardTitle>
                <CardDescription className="text-slate-400">Content distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.platformMetrics.map((p: any) => (
                    <div key={p.platform}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm text-slate-300">{p.platform}</span>
                        <span className="text-sm font-medium text-white">{p.posts} posts</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-700">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(p.posts / Math.max(...data.platformMetrics.map((x: any) => x.posts))) * 100}%`,
                            backgroundColor: p.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Engagement Over Time</CardTitle>
              <CardDescription className="text-slate-400">Monthly engagement trends by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={engagementOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="twitter" stroke="#1DA1F2" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="instagram" stroke="#E4405F" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="linkedin" stroke="#0A66C2" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="tiktok" stroke="#ffffff" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="facebook" stroke="#1877F2" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Brand Performance Comparison</CardTitle>
              <CardDescription className="text-slate-400">How each brand is performing</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.brandPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="brand" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="reach" fill="#3b82f6" name="Reach" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="engagement" fill="#22c55e" name="Engagement" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
