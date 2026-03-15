'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, Copy, Check, Home, Bot, Leaf, User, Zap, Music, Youtube } from 'lucide-react';
import { DEFAULT_BRANDS } from '@/lib/config/brands';
import { PLATFORM_LIST } from '@/lib/config/platforms';
import type { GeneratedContent } from '@/lib/types';

const GOALS = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'conversion', label: 'Conversion' },
  { value: 'retention', label: 'Retention' },
];

const brandIcons: Record<string, any> = {
  zenecohomes: Home, chatgenius: Bot, donaanna: Leaf, freddybremseth: User, neuralbeat: Music,
};

const quickCommands = [
  { id: 'property-content', label: 'Property Content', brand: 'zenecohomes', color: 'from-blue-600 to-blue-700', icon: Home },
  { id: 'saas-sales', label: 'SaaS Sales', brand: 'chatgenius', color: 'from-purple-600 to-purple-700', icon: Bot },
  { id: 'personal-brand', label: 'Personal Brand', brand: 'freddybremseth', color: 'from-amber-600 to-amber-700', icon: User },
  { id: 'farm-content', label: 'Farm Content', brand: 'donaanna', color: 'from-green-600 to-green-700', icon: Leaf },
  { id: 'youtube-content', label: 'YouTube Content', brand: 'all', color: 'from-red-600 to-red-700', icon: Youtube },
  { id: 'neural-beat', label: 'Neural Beat', brand: 'neuralbeat', color: 'from-pink-600 to-rose-700', icon: Music },
];

export default function ContentStudio() {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [goal, setGoal] = useState('awareness');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('');
  const [keyMessages, setKeyMessages] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [activeVariant, setActiveVariant] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!selectedBrand || !selectedPlatform || !audience || !tone) return;

    setIsGenerating(true);
    setResult(null);

    try {
      const res = await fetch('/api/content/generate-viral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: DEFAULT_BRANDS.find(b => b.id === selectedBrand)?.name || selectedBrand,
          platform: selectedPlatform,
          goal,
          audience,
          tone,
          keyMessages: keyMessages.split(',').map(m => m.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (res.ok && data && !data.error) {
        setResult(data);
      } else {
        console.error('Generation failed:', data?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickCommand = async (commandId: string) => {
    setIsGenerating(true);
    setResult(null);

    try {
      const res = await fetch('/api/freddy-commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandId }),
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setResult({
          id: data.id,
          brief: { brand: commandId, platform: 'linkedin', goal: 'awareness', audience: '', tone: '' },
          content: data.result,
          variants: [],
          hashtags: [],
          estimatedReach: 5000,
          viralityScore: 75,
          recommendations: [],
          agents: ['Freddy Business Navigator'],
        });
      }
    } catch (error) {
      console.error('Quick command failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyContent = () => {
    if (!result) return;
    const text = activeVariant === 0 ? result.content : result.variants[activeVariant - 1];
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getViralityColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getViralityBg = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Content Studio</h1>
        <p className="mt-1 text-slate-400">AI-powered viral content generation for all your brands</p>
      </div>

      {/* Quick Commands */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">Quick Commands</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickCommands.map((cmd) => (
            <Button
              key={cmd.id}
              onClick={() => handleQuickCommand(cmd.id)}
              disabled={isGenerating}
              className={`h-auto bg-gradient-to-r ${cmd.color} p-4 text-left hover:opacity-90`}
            >
              <div className="flex items-center gap-3">
                <cmd.icon className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">{cmd.label}</p>
                  <p className="text-xs opacity-80">Generate now</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Configuration */}
        <div className="space-y-6">
          {/* Brand Selection */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Brand</CardTitle>
              <CardDescription className="text-slate-400">Select your brand</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_BRANDS.map((brand) => {
                  const Icon = brandIcons[brand.id] || Zap;
                  return (
                    <button
                      key={brand.id}
                      onClick={() => {
                        setSelectedBrand(brand.id);
                        setAudience(brand.targetAudience);
                        setTone(brand.voiceAndTone);
                        setKeyMessages(brand.keyMessages.join(', '));
                      }}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        selectedBrand === brand.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: brand.color + '20' }}>
                        <Icon className="h-4 w-4" style={{ color: brand.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{brand.shortName}</p>
                        <p className="text-[10px] text-slate-400">{brand.industry}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Platform & Goal */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Platform</label>
                <Select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  options={PLATFORM_LIST.map(p => ({ value: p.id, label: p.name }))}
                  placeholder="Select platform"
                  className="bg-slate-900 text-white border-slate-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Goal</label>
                <Select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  options={GOALS}
                  className="bg-slate-900 text-white border-slate-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Target Audience</label>
                <Input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g., Tech professionals, investors..."
                  className="bg-slate-900 text-white border-slate-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Tone</label>
                <Input
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="e.g., professional but witty"
                  className="bg-slate-900 text-white border-slate-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Key Messages (comma-separated)</label>
                <Textarea
                  value={keyMessages}
                  onChange={(e) => setKeyMessages(e.target.value)}
                  placeholder="Innovation, Growth, Impact..."
                  className="bg-slate-900 text-white border-slate-700"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedBrand || !selectedPlatform}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-6 text-lg font-semibold hover:from-blue-500 hover:to-purple-500"
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating with AI Agents...</>
            ) : (
              <><Sparkles className="mr-2 h-5 w-5" /> Generate Viral Content</>
            )}
          </Button>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          {isGenerating && !result && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
                  <Sparkles className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-blue-400" />
                </div>
                <p className="mt-6 text-lg font-medium text-white">AI Agents Working...</p>
                <p className="mt-2 text-sm text-slate-400">Marketing, Sales, SEO & Business agents collaborating</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              {/* Scores */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Virality</p>
                      <p className={`text-3xl font-bold ${getViralityColor(result.viralityScore)}`}>
                        {result.viralityScore}%
                      </p>
                      <Progress value={result.viralityScore} className="mt-2" indicatorClassName={getViralityBg(result.viralityScore)} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">SEO Score</p>
                      <p className="text-3xl font-bold text-blue-400">{result.seoScore || 'N/A'}</p>
                      {result.seoScore && <Progress value={result.seoScore} className="mt-2" indicatorClassName="bg-blue-500" />}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Est. Reach</p>
                      <p className="text-3xl font-bold text-emerald-400">{(result.estimatedReach / 1000).toFixed(1)}K</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Generated Content</CardTitle>
                    <Button variant="ghost" size="sm" onClick={copyContent} className="text-slate-400 hover:text-white">
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveVariant(0)}
                      className={`rounded px-2 py-1 text-xs ${activeVariant === 0 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                    >
                      Original
                    </button>
                    {result.variants.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveVariant(i + 1)}
                        className={`rounded px-2 py-1 text-xs ${activeVariant === i + 1 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                      >
                        Variant {i + 1}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-slate-900/80 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                      {activeVariant === 0 ? result.content : result.variants[activeVariant - 1]}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Hashtags */}
              {result.hashtags.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white">Hashtags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {result.hashtags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-700 text-blue-300 hover:bg-slate-600 cursor-pointer">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Agents Used & Recommendations */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">AI Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-400">Agents Used</p>
                    <div className="flex flex-wrap gap-2">
                      {result.agents.map((agent, i) => (
                        <Badge key={i} className="bg-purple-500/20 text-purple-300 border-0">{agent}</Badge>
                      ))}
                    </div>
                  </div>
                  {result.recommendations.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-400">Recommendations</p>
                      <ul className="space-y-1">
                        {result.recommendations.slice(0, 5).map((rec, i) => (
                          <li key={i} className="text-sm text-slate-300">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!isGenerating && !result && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Sparkles className="h-12 w-12 text-slate-600" />
                <p className="mt-4 text-lg font-medium text-slate-500">Ready to Generate</p>
                <p className="mt-2 text-center text-sm text-slate-600">
                  Select a brand, platform, and configure your content brief<br />
                  or use a Quick Command to get started instantly
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
