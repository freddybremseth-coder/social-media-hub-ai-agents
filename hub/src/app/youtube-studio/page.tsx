'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Youtube, Play, Eye, ThumbsUp, MessageSquare, Loader2, Sparkles, Film, Scissors, TrendingUp } from 'lucide-react';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  brand: string;
  status: string;
  videoType: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  views?: number;
  likes?: number;
  comments?: number;
  publishedAt?: string;
}

const STRATEGY_TASKS = [
  { id: 'create_script', label: 'Video Script', description: 'Lag komplett videomanus med hooks og CTA' },
  { id: 'optimize_title', label: 'Title Optimization', description: 'Generer 5 klikk-verdige titler' },
  { id: 'generate_description', label: 'SEO Description', description: 'YouTube-beskrivelse med keywords' },
  { id: 'suggest_tags', label: 'Tag Research', description: 'Foreslå 20-30 relevante tags' },
  { id: 'thumbnail_concept', label: 'Thumbnail Concept', description: 'Design-konsept for thumbnail' },
  { id: 'retention_hooks', label: 'Retention Hooks', description: 'Hooks for de første 30 sekundene' },
  { id: 'shorts_strategy', label: 'Shorts Strategy', description: 'YouTube Shorts innholdsplan' },
  { id: 'channel_strategy', label: 'Channel Strategy', description: 'Komplett kanalvekst-strategi' },
];

export default function YouTubeStudioPage() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState('create_script');
  const [topic, setTopic] = useState('');
  const [brand, setBrand] = useState('zenecohomes');
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategyResult, setStrategyResult] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/youtube')
      .then((res) => res.json())
      .then((data) => setVideos(data.videos || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setStrategyResult(null);

    try {
      const res = await fetch('/api/youtube/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskName: selectedTask,
          parameters: { topic, brand, audience: 'YouTube viewers', tone: 'engaging' },
        }),
      });
      const data = await res.json();
      setStrategyResult(data.result || data.error || 'No result');
    } catch {
      setStrategyResult('Failed to generate. Check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-400';
      case 'processing': return 'bg-blue-500/20 text-blue-400';
      case 'scheduled': return 'bg-amber-500/20 text-amber-400';
      case 'draft': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Youtube className="h-8 w-8 text-red-500" />
            YouTube Studio
          </h1>
          <p className="mt-1 text-slate-400">Manage YouTube content, generate strategies, and publish videos</p>
        </div>
      </div>

      <Tabs defaultValue="videos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="videos">
            <Film className="mr-2 h-4 w-4" /> Videos
          </TabsTrigger>
          <TabsTrigger value="shorts">
            <Scissors className="mr-2 h-4 w-4" /> Shorts
          </TabsTrigger>
          <TabsTrigger value="strategy">
            <TrendingUp className="mr-2 h-4 w-4" /> AI Strategy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {videos.filter(v => v.videoType !== 'short').map((video) => (
                <Card key={video.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80 transition-all">
                  <div className="aspect-video bg-slate-700/50 rounded-t-xl flex items-center justify-center relative">
                    {video.thumbnailUrl ? (
                      <div className="w-full h-full bg-gradient-to-br from-red-900/50 to-slate-900/50 rounded-t-xl flex items-center justify-center">
                        <Play className="h-12 w-12 text-white/80" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-900/30 to-slate-800/50 rounded-t-xl flex items-center justify-center">
                        <Youtube className="h-12 w-12 text-red-400/50" />
                      </div>
                    )}
                    <Badge className={`absolute top-2 right-2 ${statusColor(video.status)}`}>
                      {video.status}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white text-sm line-clamp-2">{video.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{video.brand}</p>
                    {video.views !== undefined && (
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {video.views?.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {video.likes?.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {video.comments?.toLocaleString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shorts" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {videos.filter(v => v.videoType === 'short').map((video) => (
              <Card key={video.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80 transition-all">
                <div className="aspect-[9/16] bg-gradient-to-br from-red-900/30 to-slate-800/50 rounded-t-xl flex items-center justify-center">
                  <Play className="h-8 w-8 text-white/60" />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-white text-xs line-clamp-2">{video.title}</h3>
                  <Badge className={`mt-2 text-[10px] ${statusColor(video.status)}`}>{video.status}</Badge>
                </CardContent>
              </Card>
            ))}
            {videos.filter(v => v.videoType === 'short').length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400">
                <Scissors className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No Shorts yet. Use AI Strategy to plan your Shorts content!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Config Panel */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-red-400" />
                  YouTube AI Strategy
                </CardTitle>
                <CardDescription>Use AI to generate YouTube strategies and content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Strategy Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STRATEGY_TASKS.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task.id)}
                        className={`p-2 rounded-lg text-left text-xs transition-all ${
                          selectedTask === task.id
                            ? 'bg-red-500/20 border border-red-500/50 text-white'
                            : 'bg-slate-700/30 border border-slate-700/50 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-medium">{task.label}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{task.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Brand</label>
                  <Select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    options={[
                      { value: 'zenecohomes', label: 'ZenecoHomes' },
                      { value: 'chatgenius', label: 'Chatgenius' },
                      { value: 'donaanna', label: 'Dona Anna' },
                      { value: 'freddybremseth', label: 'Personal Brand' },
                      { value: 'neuralbeat', label: 'Neural Beat' },
                    ]}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Topic / Theme</label>
                  <Textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="E.g., 'How to buy property in Spain in 2026' or 'Behind the beats of Neural Beat'"
                    className="bg-slate-700/30 border-slate-600"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!topic || isGenerating}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Generate with AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Result Panel */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">AI Result</CardTitle>
                <CardDescription>
                  {STRATEGY_TASKS.find(t => t.id === selectedTask)?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-4" />
                    <p className="text-slate-400 text-sm">Nova YouTube Creator is working...</p>
                  </div>
                ) : strategyResult ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-slate-300 bg-slate-900/50 p-4 rounded-lg overflow-auto max-h-[500px]">
                      {strategyResult}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Youtube className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">Select a strategy type and enter a topic to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
