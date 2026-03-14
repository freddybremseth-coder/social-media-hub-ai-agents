'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalEngagement: 0,
    totalReach: 0,
    averageViralityScore: 0,
  });

  const [contentPerformance, setContentPerformance] = useState<any[]>([]);
  const [agentStatus, setAgentStatus] = useState('active');

  useEffect(() => {
    // Fetch dashboard data
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchData();
  }, []);

  const platformMetrics = [
    { platform: 'Twitter', reach: 45000, engagement: 3200, posts: 24 },
    { platform: 'Instagram', reach: 32000, engagement: 5600, posts: 18 },
    { platform: 'LinkedIn', reach: 28000, engagement: 1800, posts: 12 },
    { platform: 'TikTok', reach: 85000, engagement: 12000, posts: 8 },
    { platform: 'Facebook', reach: 38000, engagement: 2400, posts: 15 },
  ];

  const agentPerformance = [
    { agent: 'Marketing', tasksCompleted: 42, avgScore: 8.5, status: 'active' },
    { agent: 'Sales', tasksCompleted: 38, avgScore: 8.2, status: 'active' },
    { agent: 'SEO', tasksCompleted: 35, avgScore: 7.9, status: 'active' },
    { agent: 'Business', tasksCompleted: 31, avgScore: 8.1, status: 'active' },
  ];

  const viralityDistribution = [
    { range: '80-100', count: 12, fill: '#ef4444' },
    { range: '60-79', count: 28, fill: '#f97316' },
    { range: '40-59', count: 35, fill: '#eab308' },
    { range: '0-39', count: 15, fill: '#84cc16' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Social Media Hub Dashboard</h1>
        <p className="text-slate-400">Manage your brands, agents, and viral content</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          icon="📝"
          trend="+12%"
        />
        <StatCard
          title="Total Reach"
          value={`${(stats.totalReach / 1000).toFixed(0)}K`}
          icon="📊"
          trend="+28%"
        />
        <StatCard
          title="Avg Virality Score"
          value={`${stats.averageViralityScore}%`}
          icon="🔥"
          trend="+5%"
        />
        <StatCard
          title="Total Engagement"
          value={`${(stats.totalEngagement / 1000).toFixed(1)}K`}
          icon="💬"
          trend="+18%"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Performance */}
            <Card className="bg-slate-800 border border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Platform Performance</CardTitle>
                <CardDescription className="text-slate-400">Reach by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="platform" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="reach" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Virality Distribution */}
            <Card className="bg-slate-800 border border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Virality Score Distribution</CardTitle>
                <CardDescription className="text-slate-400">Content performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={viralityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, count }) => `${range}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {viralityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      