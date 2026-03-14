'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Workflow, Loader2, CheckCircle, XCircle, Clock, Play, Music, Film,
  RefreshCcw, AlertTriangle, Info, Search
} from 'lucide-react';

interface PipelineRun {
  id: string;
  type: 'neural-beat' | 'brand-video';
  status: string;
  steps: Array<{
    name: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    error?: string;
  }>;
  input: any;
  output: any;
  startedAt: string;
  completedAt?: string | null;
  error?: string | null;
}

interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source?: string;
  timestamp: string;
  data?: any;
}

export default function AutomationPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/automation')
      .then((res) => res.json())
      .then((data) => setRuns(data.runs || []))
      .catch(() => {})
      .finally(() => setIsLoadingRuns(false));

    fetch('/api/automation/logs')
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .catch(() => {})
      .finally(() => setIsLoadingLogs(false));
  }, []);

  const handlePoll = async () => {
    setIsPolling(true);
    try {
      const res = await fetch('/api/automation/poll', { method: 'POST' });
      const data = await res.json();
      // Refresh runs after polling
      const runsRes = await fetch('/api/automation');
      const runsData = await runsRes.json();
      setRuns(runsData.runs || []);
      return data;
    } catch {
      // ignore
    } finally {
      setIsPolling(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': case 'succeeded': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'running': case 'in_progress': return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'succeeded': return 'bg-green-500/20 text-green-400';
      case 'running': case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const logLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-3.5 w-3.5 text-red-400" />;
      case 'warn': return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />;
      default: return <Info className="h-3.5 w-3.5 text-blue-400" />;
    }
  };

  const logLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'border-red-500/20 bg-red-500/5';
      case 'warn': return 'border-amber-500/20 bg-amber-500/5';
      default: return 'border-slate-700/50 bg-slate-800/30';
    }
  };

  const pipelineStats = {
    total: runs.length,
    running: runs.filter((r) => r.status === 'running').length,
    completed: runs.filter((r) => r.status === 'completed').length,
    failed: runs.filter((r) => r.status === 'failed').length,
  };

  const filteredLogs = logFilter === 'all' ? logs : logs.filter((l) => l.level === logFilter);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Workflow className="h-8 w-8 text-purple-400" />
            Automation Hub
          </h1>
          <p className="mt-1 text-slate-400">Monitor and manage automation pipelines</p>
        </div>
        <Button
          onClick={handlePoll}
          disabled={isPolling}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isPolling ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Polling...</>
          ) : (
            <><RefreshCcw className="mr-2 h-4 w-4" /> Poll Airtable</>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{pipelineStats.total}</div>
            <div className="text-xs text-slate-400">Total Runs</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{pipelineStats.running}</div>
            <div className="text-xs text-slate-400">Running</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{pipelineStats.completed}</div>
            <div className="text-xs text-slate-400">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{pipelineStats.failed}</div>
            <div className="text-xs text-slate-400">Failed</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipelines" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipelines"><Workflow className="mr-2 h-4 w-4" /> Pipelines</TabsTrigger>
          <TabsTrigger value="runs"><Play className="mr-2 h-4 w-4" /> Recent Runs</TabsTrigger>
          <TabsTrigger value="logs"><Search className="mr-2 h-4 w-4" /> Logs</TabsTrigger>
        </TabsList>

        {/* Pipelines Tab */}
        <TabsContent value="pipelines" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="bg-slate-800/50 border-slate-700/50 border-l-4 border-l-pink-500">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Music className="h-5 w-5 text-pink-400" />
                  Neural Beat Pipeline
                </CardTitle>
                <CardDescription>
                  Airtable → Audio Analysis → Image Generation → Video Rendering → YouTube
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2"><span className="text-pink-400">1.</span> Song trigger from Airtable</div>
                  <div className="flex items-center gap-2"><span className="text-pink-400">2.</span> Claude AI analyzes genre & mood</div>
                  <div className="flex items-center gap-2"><span className="text-pink-400">3.</span> Gemini generates cover art</div>
                  <div className="flex items-center gap-2"><span className="text-pink-400">4.</span> Creatomate renders music video</div>
                  <div className="flex items-center gap-2"><span className="text-pink-400">5.</span> Auto-publish to YouTube</div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  <span>Polling every 5 minutes</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Film className="h-5 w-5 text-blue-400" />
                  Brand Video Pipeline
                </CardTitle>
                <CardDescription>
                  Airtable → AI Metadata → YouTube Upload
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2"><span className="text-blue-400">1.</span> Video trigger from Airtable</div>
                  <div className="flex items-center gap-2"><span className="text-blue-400">2.</span> YouTube Agent generates SEO metadata</div>
                  <div className="flex items-center gap-2"><span className="text-blue-400">3.</span> Auto-upload to YouTube with optimized title/tags</div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  <span>Polling every 5 minutes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          {isLoadingRuns ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <Card key={run.id} className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {run.type === 'neural-beat' ? (
                          <Music className="h-5 w-5 text-pink-400" />
                        ) : (
                          <Film className="h-5 w-5 text-blue-400" />
                        )}
                        <div>
                          <h3 className="font-semibold text-white text-sm">
                            {run.input?.title || run.id}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {run.type === 'neural-beat' ? 'Neural Beat' : 'Brand Video'} •{' '}
                            {new Date(run.startedAt).toLocaleString('no-NO')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusIcon(run.status)}
                        <Badge className={statusColor(run.status)}>{run.status}</Badge>
                      </div>
                    </div>

                    {/* Steps Progress */}
                    <div className="flex items-center gap-1">
                      {run.steps.map((step, i) => (
                        <div key={i} className="flex-1 group relative">
                          <div
                            className={`h-1.5 rounded-full ${
                              step.status === 'completed'
                                ? 'bg-green-500'
                                : step.status === 'in_progress'
                                ? 'bg-blue-500 animate-pulse'
                                : step.status === 'failed'
                                ? 'bg-red-500'
                                : 'bg-slate-700'
                            }`}
                          />
                          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-700 rounded text-[10px] text-white whitespace-nowrap z-10">
                            {step.name}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                      <span>{run.steps[0]?.name}</span>
                      <span>{run.steps[run.steps.length - 1]?.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            {['all', 'info', 'warn', 'error'].map((level) => (
              <Button
                key={level}
                variant={logFilter === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLogFilter(level)}
                className={logFilter === level ? 'bg-slate-600' : ''}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>

          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${logLevelColor(log.level)}`}
                >
                  {logLevelIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">{log.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {log.source && (
                        <span className="text-[10px] text-slate-500">{log.source}</span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString('no-NO')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
