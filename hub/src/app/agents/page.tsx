'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Play, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  description: string;
  color: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [taskParams, setTaskParams] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => setAgents(data.agents || []))
      .catch(console.error);
  }, []);

  const handleExecute = async () => {
    if (!selectedAgent || !selectedTask) return;

    setIsExecuting(true);
    setResult(null);

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: selectedAgent,
          taskName: selectedTask,
          parameters: taskParams ? JSON.parse(taskParams) : {},
          priority: 'high',
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (_error) {
      setResult({ status: 'failed', result: 'Failed to execute command' });
    } finally {
      setIsExecuting(false);
    }
  };

  const currentAgent = agents.find(a => a.id === selectedAgent);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">AI Agents</h1>
        <p className="mt-1 text-slate-400">Monitor, command, and orchestrate your AI agent team</p>
      </div>

      {/* Agent Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className={`cursor-pointer bg-slate-800/50 border-slate-700/50 transition-all hover:bg-slate-800/80 ${
              selectedAgent === agent.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => {
              setSelectedAgent(agent.id);
              setSelectedTask('');
              setResult(null);
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: agent.color + '20' }}>
                  <Bot className="h-5 w-5" style={{ color: agent.color }} />
                </div>
                <div>
                  <p className="font-semibold text-white">{agent.name}</p>
                  <p className="text-xs text-slate-400">{agent.role}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-400">{agent.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {agent.capabilities.map((cap) => (
                  <Badge key={cap} variant="secondary" className="bg-slate-700/50 text-xs text-slate-300">
                    {cap.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Command Panel */}
      {selectedAgent && currentAgent && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Command {currentAgent.name}</CardTitle>
              <CardDescription className="text-slate-400">Select a task and provide parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Task</label>
                <Select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  options={currentAgent.capabilities.map(c => ({ value: c, label: c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }))}
                  placeholder="Select task..."
                  className="bg-slate-900 text-white border-slate-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Parameters (JSON)</label>
                <Textarea
                  value={taskParams}
                  onChange={(e) => setTaskParams(e.target.value)}
                  placeholder='{"industry": "real estate", "region": "Spain"}'
                  className="bg-slate-900 text-white border-slate-700 font-mono text-xs"
                  rows={4}
                />
              </div>
              <Button
                onClick={handleExecute}
                disabled={isExecuting || !selectedTask}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
              >
                {isExecuting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Executing...</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" /> Execute Task</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Result</CardTitle>
            </CardHeader>
            <CardContent>
              {isExecuting && (
                <div className="flex flex-col items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  <p className="mt-3 text-sm text-slate-400">Agent processing...</p>
                </div>
              )}
              {result && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {result.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                    <Badge className={result.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-0' : 'bg-red-500/20 text-red-400 border-0'}>
                      {result.status}
                    </Badge>
                  </div>
                  <div className="max-h-96 overflow-y-auto rounded-lg bg-slate-900/80 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-slate-300">
                      {typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {!isExecuting && !result && (
                <div className="flex flex-col items-center py-12 text-slate-500">
                  <Bot className="h-10 w-10" />
                  <p className="mt-3 text-sm">Select a task and execute to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
