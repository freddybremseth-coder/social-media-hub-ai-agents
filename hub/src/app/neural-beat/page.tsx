'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Music, Loader2, Play, CheckCircle, XCircle, Clock, Zap, Youtube, Radio, Disc3, Waves, PlayCircle, AlertCircle } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  audioUrl?: string;
  genre?: string;
  mood?: string;
  youtubeUrl?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  createdTime?: string;
}

interface PipelineResult {
  id: string;
  status: 'completed' | 'failed';
  steps: { name: string; status: string; error?: string }[];
  output?: any;
  error?: string;
}

type SongStatus = 'ready' | 'processing' | 'done' | 'error' | 'no-audio';

const PIPELINE_STEPS = [
  { name: 'Update Airtable', desc: 'Mark as processing' },
  { name: 'Download Audio', desc: 'Fetch audio file from Airtable' },
  { name: 'AI Song Analysis', desc: 'Claude analyzes genre, mood, style' },
  { name: 'YouTube SEO', desc: 'Claude generates title, description, tags' },
  { name: 'Cover Image', desc: 'Gemini generates album artwork' },
  { name: 'Video Render', desc: 'Creatomate creates music video' },
  { name: 'Render Complete', desc: 'Wait for video processing' },
  { name: 'YouTube Upload', desc: 'Upload video with AI metadata' },
  { name: 'Update Airtable', desc: 'Write back YouTube URL & metadata' },
];

export default function NeuralBeatPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, PipelineResult>>({});
  const [processingAll, setProcessingAll] = useState(false);

  const fetchSongs = () => {
    fetch('/api/neural-beat')
      .then((res) => res.json())
      .then((data) => setSongs(data.songs || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchSongs(); }, []);

  const getSongStatus = (song: Song): SongStatus => {
    if (processingIds.has(song.id)) return 'processing';
    if (results[song.id]?.status === 'failed') return 'error';
    if (song.youtubeUrl) return 'done';
    if (!song.audioUrl) return 'no-audio';
    return 'ready';
  };

  const handleProcess = async (recordId: string) => {
    setProcessingIds((prev) => new Set(prev).add(recordId));
    setResults((prev) => { const n = { ...prev }; delete n[recordId]; return n; });

    try {
      const res = await fetch('/api/neural-beat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId }),
      });
      const data = await res.json();

      if (res.ok) {
        setResults((prev) => ({ ...prev, [recordId]: data }));
        // Refresh songs to get updated data from Airtable
        if (data.status === 'completed') {
          setTimeout(fetchSongs, 1000);
        }
      } else {
        setResults((prev) => ({
          ...prev,
          [recordId]: { id: '', status: 'failed', steps: [], error: data.error || 'Unknown error' },
        }));
      }
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [recordId]: { id: '', status: 'failed', steps: [], error: 'Network error' },
      }));
    } finally {
      setProcessingIds((prev) => {
        const n = new Set(prev);
        n.delete(recordId);
        return n;
      });
    }
  };

  const handleProcessAll = async () => {
    const readySongs = songs.filter((s) => getSongStatus(s) === 'ready');
    if (readySongs.length === 0) return;
    setProcessingAll(true);
    for (const song of readySongs) {
      await handleProcess(song.id);
    }
    setProcessingAll(false);
  };

  const statusIcon = (status: SongStatus) => {
    switch (status) {
      case 'done': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'no-audio': return <AlertCircle className="h-4 w-4 text-slate-500" />;
      case 'ready': return <PlayCircle className="h-4 w-4 text-pink-400" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const statusLabel = (status: SongStatus) => {
    switch (status) {
      case 'done': return 'Published';
      case 'processing': return 'Processing...';
      case 'error': return 'Error';
      case 'no-audio': return 'No Audio';
      case 'ready': return 'Ready';
      default: return 'Unknown';
    }
  };

  const statusBadgeClass = (status: SongStatus) => {
    switch (status) {
      case 'done': return 'bg-green-500/20 text-green-400';
      case 'processing': return 'bg-blue-500/20 text-blue-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      case 'no-audio': return 'bg-slate-500/20 text-slate-500';
      case 'ready': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const readySongs = songs.filter((s) => getSongStatus(s) === 'ready');
  const stats = {
    total: songs.length,
    done: songs.filter((s) => s.youtubeUrl).length,
    processing: processingIds.size,
    ready: readySongs.length,
    errors: Object.values(results).filter((r) => r.status === 'failed').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
              <Music className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Neural Beat</h1>
              <p className="text-slate-400">AI-powered music production pipeline • Airtable → YouTube</p>
            </div>
          </div>
          {readySongs.length > 0 && (
            <Button
              onClick={handleProcessAll}
              disabled={processingAll || processingIds.size > 0}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500"
            >
              {processingAll ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <><Zap className="mr-2 h-4 w-4" /> Process All ({readySongs.length})</>
              )}
            </Button>
          )}
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
            <Loader2 className={`h-5 w-5 mx-auto mb-1 text-blue-400 ${stats.processing > 0 ? 'animate-spin' : ''}`} />
            <div className="text-2xl font-bold text-blue-400">{stats.processing}</div>
            <div className="text-xs text-slate-400">Processing</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <PlayCircle className="h-5 w-5 mx-auto mb-1 text-pink-400" />
            <div className="text-2xl font-bold text-pink-400">{stats.ready}</div>
            <div className="text-xs text-slate-400">Ready</div>
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
                  Add songs to your Airtable &quot;Make.com Songs&quot; table to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {songs.map((song) => {
                const status = getSongStatus(song);
                const result = results[song.id];
                return (
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
                              {song.audioUrl && (
                                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-300">
                                  Audio ✓
                                </Badge>
                              )}
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
                          {status === 'processing' && (
                            <div className="w-32">
                              <Progress value={50} className="h-1.5" />
                              <p className="text-[10px] text-blue-400 mt-1 text-center">Running pipeline...</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {statusIcon(status)}
                            <Badge className={statusBadgeClass(status)}>
                              {statusLabel(status)}
                            </Badge>
                          </div>

                          {status === 'ready' && (
                            <Button
                              size="sm"
                              onClick={() => handleProcess(song.id)}
                              disabled={processingIds.size > 0}
                              className="bg-pink-600 hover:bg-pink-700"
                            >
                              <Zap className="mr-1 h-3 w-3" /> Process
                            </Button>
                          )}

                          {status === 'error' && (
                            <Button
                              size="sm"
                              onClick={() => handleProcess(song.id)}
                              disabled={processingIds.size > 0}
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              <Zap className="mr-1 h-3 w-3" /> Retry
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

                      {/* Pipeline result details */}
                      {result && (
                        <div className={`mt-3 p-3 rounded-lg border ${
                          result.status === 'completed'
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                        }`}>
                          {result.status === 'completed' ? (
                            <div className="flex items-center gap-2 text-sm text-green-400">
                              <CheckCircle className="h-4 w-4" />
                              Pipeline completed! Video uploaded to YouTube.
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2 text-sm text-red-400">
                                <XCircle className="h-4 w-4" />
                                {result.error}
                              </div>
                              {result.steps && result.steps.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {result.steps.map((step, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                      {step.status === 'completed' ? (
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                      ) : step.status === 'failed' ? (
                                        <XCircle className="h-3 w-3 text-red-500" />
                                      ) : (
                                        <Clock className="h-3 w-3 text-slate-500" />
                                      )}
                                      <span className={step.status === 'failed' ? 'text-red-300' : 'text-slate-400'}>
                                        {step.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Published Tab */}
        <TabsContent value="published" className="space-y-4">
          {songs.filter((s) => s.youtubeUrl).length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-12 text-center">
                <Youtube className="h-16 w-16 mx-auto mb-4 text-red-500/20" />
                <h3 className="text-lg font-semibold text-white mb-2">No published videos yet</h3>
                <p className="text-slate-400 text-sm">
                  Process songs from the Pipeline tab to publish them to YouTube.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {songs
                .filter((s) => s.youtubeUrl)
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
          )}
        </TabsContent>

        {/* How It Works Tab */}
        <TabsContent value="how-it-works">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Neural Beat Pipeline — 9 Steps</CardTitle>
              <CardDescription>Full automated workflow from Airtable to YouTube</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PIPELINE_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{step.name}</p>
                      <p className="text-xs text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
                <p className="text-sm text-pink-200">
                  <strong>How to use:</strong> Add songs with audio files in your Airtable &quot;Make.com Songs&quot; table.
                  Then click <strong>Process</strong> on any track — or <strong>Process All</strong> to run the full pipeline
                  on every song. The AI will analyze, create artwork, render a video, and upload to YouTube automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
