'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Music, Loader2, Play, CheckCircle, XCircle, Clock, Zap, Youtube, Radio, Disc3, Waves } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  status: 'Trigger' | 'Processing' | 'Done' | 'Error';
  genre?: string;
  mood?: string;
  youtubeUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  errorMessage?: string;
}

const PIPELINE_STEPS = [
  'Airtable Update',
  'Audio Analysis',
  'Genre Detection',
  'Image Prompt',
  'Image Generation',
  'Video Rendering',
  'YouTube Upload',
  'Finalize',
];

export default function NeuralBeatPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/neural-beat')
      .then((res) => res.json())
      .then((data) => setSongs(data.songs || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleProcess = async (recordId: string) => {
    setProcessingId(recordId);
    try {
      await fetch('/api/neural-beat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId }),
      });
      // Update the local state
      setSongs((prev) =>
        prev.map((s) => (s.id === recordId ? { ...s, status: 'Processing' as const } : s))
      );
    } catch {
      // ignore
    } finally {
      setProcessingId(null);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'Done': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'Processing': return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'Error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'Trigger': return <Clock className="h-4 w-4 text-amber-400" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-green-500/20 text-green-400';
      case 'Processing': return 'bg-blue-500/20 text-blue-400';
      case 'Error': return 'bg-red-500/20 text-red-400';
      case 'Trigger': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const stats = {
    total: songs.length,
    done: songs.filter((s) => s.status === 'Done').length,
    processing: songs.filter((s) => s.status === 'Processing').length,
    pending: songs.filter((s) => s.status === 'Trigger').length,
    errors: songs.filter((s) => s.status === 'Error').length,
  };

  return (
    <div>
      {/* Header with pink gradient */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
            <Music className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Neural Beat</h1>
            <p className="text-slate-400">AI-powered music production pipeline • Airtable → YouTube</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-5">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <Disc3 className="h-5 w-5 mx-auto mb-1 text-pink-400" />
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-slate-400">Total Tracks</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <Youtube className="h-5 w-5 mx-auto mb-1 text-green-400" />
            <div className="text-2xl font-bold text-green-400">{stats.done}</div>
            <div className="text-xs text-slate-400">Published</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <Loader2 className="h-5 w-5 mx-auto mb-1 text-blue-400" />
            <div className="text-2xl font-bold text-blue-400">{stats.processing}</div>
            <div className="text-xs text-slate-400">Processing</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-amber-400" />
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-xs text-slate-400">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <XCircle className="h-5 w-5 mx-auto mb-1 text-red-400" />
            <div className="text-2xl font-bold text-red-400">{stats.errors}</div>
            <div className="text-xs text-slate-400">Errors</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipeline">
            <Waves className="mr-2 h-4 w-4" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="published">
            <Youtube className="mr-2 h-4 w-4" /> Published
          </TabsTrigger>
          <TabsTrigger value="how-it-works">
            <Radio className="mr-2 h-4 w-4" /> How It Works
          </TabsTrigger>
        </TabsList>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            </div>
          ) : songs.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-12 text-center">
                <Music className="h-16 w-16 mx-auto mb-4 text-pink-500/30" />
                <h3 className="text-lg font-semibold text-white mb-2">No tracks found</h3>
                <p className="text-slate-400 text-sm">
                  Add songs to your Airtable base with status &quot;Trigger&quot; to start the pipeline.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {songs.map((song) => (
                <Card key={song.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-600/20 border border-pink-500/20">
                          <Music className="h-6 w-6 text-pink-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{song.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400">{song.artist}</span>
                            {song.genre && (
                              <Badge variant="outline" className="text-[10px] border-pink-500/30 text-pink-300">
                                {song.genre}
                              </Badge>
                            )}
                            {song.mood && (
                              <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                                {song.mood}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {song.status === 'Processing' && (
                          <div className="w-32">
                            <Progress value={50} className="h-1.5" />
                            <p className="text-[10px] text-blue-400 mt-1 text-center">Processing...</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {statusIcon(song.status)}
                          <Badge className={statusBadgeClass(song.status)}>
                            {song.status}
                          </Badge>
                        </div>

                        {song.status === 'Trigger' && (
                          <Button
                            size="sm"
                            onClick={() => handleProcess(song.id)}
                            disabled={processingId === song.id}
                            className="bg-pink-600 hover:bg-pink-700"
                          >
                            {processingId === song.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Zap className="mr-1 h-3 w-3" /> Process
                              </>
                            )}
                          </Button>
                        )}

                        {song.youtubeUrl && (
                          <a
                            href={song.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Youtube className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {song.errorMessage && (
                      <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                        {song.errorMessage}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Published Tab */}
        <TabsContent value="published" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {songs
              .filter((s) => s.status === 'Done')
              .map((song) => (
                <Card key={song.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80 transition-all overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-pink-900/50 to-purple-900/50 flex items-center justify-center relative">
                    <Play className="h-12 w-12 text-white/60" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <Youtube className="h-3 w-3 text-red-400" />
                      <span className="text-[10px] text-red-300">Published</span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white text-sm">{song.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{song.artist}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {song.genre && <Badge className="bg-pink-500/20 text-pink-300 text-[10px]">{song.genre}</Badge>}
                      {song.mood && <Badge className="bg-slate-600/30 text-slate-300 text-[10px]">{song.mood}</Badge>}
                    </div>
                    {song.youtubeUrl && (
                      <a
                        href={song.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 block text-xs text-red-400 hover:text-red-300 underline"
                      >
                        Watch on YouTube →
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* How It Works Tab */}
        <TabsContent value="how-it-works">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Neural Beat Pipeline</CardTitle>
              <CardDescription>Full automated workflow from Airtable to YouTube</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PIPELINE_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 h-px bg-slate-700" />
                    <div className="text-sm text-slate-300 w-40 text-right">{step}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
                <p className="text-sm text-pink-200">
                  <strong>How to use:</strong> Add a song title and audio file in Airtable, set the status to
                  &quot;Trigger&quot;, and the pipeline will automatically analyze the music, generate artwork,
                  create a video, and publish it to YouTube.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
