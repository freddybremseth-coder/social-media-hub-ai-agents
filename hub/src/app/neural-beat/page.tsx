'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Music, Loader2, Play, CheckCircle, XCircle, Clock, Zap, Youtube, Radio, Disc3, Waves, PlayCircle, AlertCircle, Trash2 } from 'lucide-react';

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

interface PipelineStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  error?: string;
}

interface PipelineStatus {
  id: string;
  recordId: string;
  status: 'running' | 'completed' | 'failed';
  steps: PipelineStep[];
  output?: any;
  error?: string;
}

type SongStatus = 'ready' | 'processing' | 'done' | 'error' | 'no-audio';

const PIPELINE_STEPS = [
  { name: 'Update Airtable', desc: 'Mark as processing' },
  { name: 'Download Audio', desc: 'Fetch audio file from Airtable' },
  { name: 'AI Song Analysis', desc: 'Gemini analyzes genre, mood, style' },
  { name: 'YouTube SEO', desc: 'Gemini generates title, description, tags' },
  { name: 'Cover Image', desc: 'Gemini generates album artwork' },
  { name: 'Video Render', desc: 'Creatomate creates music video' },
  { name: 'Render Complete', desc: 'Wait for video processing' },
  { name: 'YouTube Upload', desc: 'Upload video with AI metadata' },
  { name: 'Update Airtable', desc: 'Write back YouTube URL & metadata' },
];

export default function NeuralBeatPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Map<string, string>>(new Map()); // recordId -> pipelineId
  const [pipelineStatuses, setPipelineStatuses] = useState<Record<string, PipelineStatus>>({});
  const [processingAll, setProcessingAll] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const pollIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const fetchSongs = useCallback(() => {
    fetch('/api/neural-beat')
      .then((res) => res.json())
      .then((data) => setSongs(data.songs || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  // Cleanup poll intervals on unmount
  useEffect(() => {
    return () => {
      pollIntervals.current.forEach((interval) => clearInterval(interval));
    };
  }, []);

  const pollPipelineStatus = useCallback((pipelineId: string, recordId: string) => {
    // Poll every 3 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/neural-beat?statusId=${pipelineId}`);

        // If pipeline not found (404), stop polling — server likely restarted
        if (res.status === 404) {
          clearInterval(interval);
          pollIntervals.current.delete(pipelineId);
          setProcessingIds((prev) => {
            const next = new Map(prev);
            next.delete(recordId);
            return next;
          });
          setPipelineStatuses((prev) => ({
            ...prev,
            [recordId]: {
              id: pipelineId,
              recordId,
              status: 'failed',
              steps: [],
              output: null,
              error: 'Pipeline lost — server restarted. Please try again.',
              startedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
            },
          }));
          return;
        }

        if (!res.ok) return;
        const data: PipelineStatus = await res.json();

        setPipelineStatuses((prev) => ({ ...prev, [recordId]: data }));

        // Stop polling when done
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          pollIntervals.current.delete(pipelineId);
          setProcessingIds((prev) => {
            const next = new Map(prev);
            next.delete(recordId);
            return next;
          });
          // Refresh songs after completion
          if (data.status === 'completed') {
            setTimeout(fetchSongs, 2000);
          }
        }
      } catch {
        // ignore transient poll errors (network blips)
      }
    }, 3000);

    pollIntervals.current.set(pipelineId, interval);
  }, [fetchSongs]);

  const handleProcess = async (recordId: string) => {
    // Mark as processing
    setProcessingIds((prev) => new Map(prev).set(recordId, ''));
    setPipelineStatuses((prev) => {
      const next = { ...prev };
      delete next[recordId];
      return next;
    });

    try {
      const res = await fetch('/api/neural-beat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId }),
      });
      const data = await res.json();

      if (res.ok && data.id) {
        // Store the pipeline ID and start polling
        setProcessingIds((prev) => new Map(prev).set(recordId, data.id));
        setPipelineStatuses((prev) => ({
          ...prev,
          [recordId]: { id: data.id, recordId, status: 'running', steps: [] },
        }));
        pollPipelineStatus(data.id, recordId);
      } else {
        // Immediate error
        setPipelineStatuses((prev) => ({
          ...prev,
          [recordId]: {
            id: '', recordId, status: 'failed', steps: [],
            error: data.error || 'Failed to start pipeline',
          },
        }));
        setProcessingIds((prev) => {
          const next = new Map(prev);
          next.delete(recordId);
          return next;
        });
      }
    } catch (err) {
      setPipelineStatuses((prev) => ({
        ...prev,
        [recordId]: {
          id: '', recordId, status: 'failed', steps: [],
          error: 'Network error starting pipeline',
        },
      }));
      setProcessingIds((prev) => {
        const next = new Map(prev);
        next.delete(recordId);
        return next;
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

  const handleDelete = async (recordId: string, youtubeUrl: string) => {
    setDeletingIds((prev) => new Set(prev).add(recordId));
    setDeleteConfirm(null);
    try {
      const res = await fetch('/api/neural-beat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, youtubeUrl }),
      });
      if (res.ok) {
        // Clear any previous pipeline results and refresh
        setPipelineStatuses((prev) => {
          const next = { ...prev };
          delete next[recordId];
          return next;
        });
        setTimeout(fetchSongs, 1000);
      } else {
        const data = await res.json();
        alert(`Delete failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      alert('Network error deleting video');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  };

  const getSongStatus = (song: Song): SongStatus => {
    if (processingIds.has(song.id)) return 'processing';
    if (pipelineStatuses[song.id]?.status === 'failed') return 'error';
    if (song.youtubeUrl) return 'done';
    if (!song.audioUrl) return 'no-audio';
    return 'ready';
  };

  const getStepProgress = (recordId: string): { completed: number; total: number; currentStep: string } => {
    const status = pipelineStatuses[recordId];
    if (!status?.steps?.length) return { completed: 0, total: 9, currentStep: 'Starting...' };
    const completed = status.steps.filter((s) => s.status === 'completed').length;
    const current = status.steps.find((s) => s.status === 'in_progress');
    return {
      completed,
      total: status.steps.length || 9,
      currentStep: current?.name || (completed === status.steps.length ? 'Complete!' : 'Starting...'),
    };
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
    errors: Object.values(pipelineStatuses).filter((r) => r.status === 'failed').length,
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
              <p className="text-slate-400">AI-powered music production pipeline &bull; Airtable &rarr; YouTube</p>
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
                const pipelineStatus = pipelineStatuses[song.id];
                const stepProgress = getStepProgress(song.id);
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
                                  Audio &#10003;
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
                            <div className="w-44">
                              <Progress value={(stepProgress.completed / stepProgress.total) * 100} className="h-1.5" />
                              <p className="text-[10px] text-blue-400 mt-1 text-center truncate">
                                Step {stepProgress.completed + 1}/{stepProgress.total}: {stepProgress.currentStep}
                              </p>
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
                            <>
                              <a
                                href={song.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-400 hover:text-red-300"
                              >
                                <Youtube className="h-4 w-4" />
                              </a>
                              {deleteConfirm === song.id ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleDelete(song.id, song.youtubeUrl!)}
                                    disabled={deletingIds.has(song.id)}
                                    className="bg-red-600 hover:bg-red-700 h-6 px-2 text-[10px]"
                                  >
                                    {deletingIds.has(song.id) ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      'Confirm'
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeleteConfirm(null)}
                                    className="h-6 px-2 text-[10px] text-slate-400"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteConfirm(song.id)}
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                  title="Delete from YouTube"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Live pipeline step progress */}
                      {status === 'processing' && pipelineStatus?.steps && pipelineStatus.steps.length > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <div className="grid grid-cols-3 gap-1.5 md:grid-cols-9">
                            {pipelineStatus.steps.map((step, i) => (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  step.status === 'completed' ? 'bg-green-500 text-white' :
                                  step.status === 'in_progress' ? 'bg-blue-500 text-white animate-pulse' :
                                  step.status === 'failed' ? 'bg-red-500 text-white' :
                                  'bg-slate-700 text-slate-400'
                                }`}>
                                  {step.status === 'completed' ? '\u2713' :
                                   step.status === 'in_progress' ? '\u25CF' :
                                   step.status === 'failed' ? '\u2717' :
                                   i + 1}
                                </div>
                                <span className="text-[8px] text-slate-500 text-center leading-tight">
                                  {PIPELINE_STEPS[i]?.name || step.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Completed/Failed result details */}
                      {pipelineStatus && pipelineStatus.status !== 'running' && (
                        <div className={`mt-3 p-3 rounded-lg border ${
                          pipelineStatus.status === 'completed'
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                        }`}>
                          {pipelineStatus.status === 'completed' ? (
                            <div className="flex items-center gap-2 text-sm text-green-400">
                              <CheckCircle className="h-4 w-4" />
                              Pipeline completed! Video uploaded to YouTube.
                              {pipelineStatus.output?.youtubeUrl && (
                                <a
                                  href={pipelineStatus.output.youtubeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:text-green-300 ml-2"
                                >
                                  Watch &rarr;
                                </a>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2 text-sm text-red-400">
                                <XCircle className="h-4 w-4" />
                                {pipelineStatus.error}
                              </div>
                              {pipelineStatus.steps && pipelineStatus.steps.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {pipelineStatus.steps.map((step, i) => (
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
                      <div className="flex items-center justify-between mt-3">
                        {song.youtubeUrl && (
                          <a
                            href={song.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-red-400 hover:text-red-300 underline"
                          >
                            Watch on YouTube &rarr;
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (deleteConfirm === song.id) {
                              handleDelete(song.id, song.youtubeUrl!);
                            } else {
                              setDeleteConfirm(song.id);
                            }
                          }}
                          disabled={deletingIds.has(song.id)}
                          className={`h-7 px-2 text-[10px] ${
                            deleteConfirm === song.id
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'
                          }`}
                        >
                          {deletingIds.has(song.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : deleteConfirm === song.id ? (
                            'Confirm Delete'
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
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
              <CardTitle className="text-white">Neural Beat Pipeline &mdash; 9 Steps</CardTitle>
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
                  Then click <strong>Process</strong> on any track &mdash; or <strong>Process All</strong> to run the full pipeline
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
