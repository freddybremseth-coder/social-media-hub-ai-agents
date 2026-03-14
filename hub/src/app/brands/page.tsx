'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, Bot, Leaf, User, ExternalLink, Globe, Music } from 'lucide-react';
import { DEFAULT_BRANDS } from '@/lib/config/brands';

const brandIcons: Record<string, any> = {
  zenecohomes: Home, chatgenius: Bot, donaanna: Leaf, freddybremseth: User, neuralbeat: Music,
};

export default function BrandsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Brand Manager</h1>
        <p className="mt-1 text-slate-400">Configure and manage your 5 business brands</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {DEFAULT_BRANDS.map((brand) => {
          const Icon = brandIcons[brand.id] || Globe;
          return (
            <Card key={brand.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: brand.color + '20' }}
                    >
                      <Icon className="h-6 w-6" style={{ color: brand.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-white">{brand.name}</CardTitle>
                      <CardDescription className="text-slate-400">{brand.industry}</CardDescription>
                    </div>
                  </div>
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: brand.color }} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">{brand.description}</p>

                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">Target Audience</p>
                  <p className="text-sm text-slate-300">{brand.targetAudience}</p>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">Voice & Tone</p>
                  <p className="text-sm text-slate-300">{brand.voiceAndTone}</p>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">Key Messages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brand.keyMessages.map((msg, i) => (
                      <Badge key={i} variant="secondary" className="bg-slate-700/50 text-slate-300">{msg}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">Content Themes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brand.contentThemes.map((theme, i) => (
                      <Badge key={i} className="border-0 text-white" style={{ backgroundColor: brand.color + '40' }}>{theme}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">Websites</p>
                  <div className="flex flex-wrap gap-2">
                    {brand.websites.map((site, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs text-blue-400">
                        <ExternalLink className="h-3 w-3" /> {site}
                      </span>
                    ))}
                  </div>
                </div>

                <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                  Edit Brand Guidelines
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
