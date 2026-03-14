'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Sparkles, Building2, Bot, BarChart3,
  FileText, CalendarDays, Zap, Youtube, Music, Workflow
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/content-studio', label: 'Content Studio', icon: Sparkles },
  { href: '/youtube-studio', label: 'YouTube Studio', icon: Youtube },
  { href: '/neural-beat', label: 'Neural Beat', icon: Music },
  { href: '/brands', label: 'Brands', icon: Building2 },
  { href: '/agents', label: 'AI Agents', icon: Bot },
  { href: '/automation', label: 'Automation', icon: Workflow },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/posts', label: 'Posts', icon: FileText },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-700/50 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Social Media Hub</h1>
            <p className="text-[10px] text-slate-400">AI-Powered Content Engine</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-slate-700/50 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className={cn('h-4 w-4', isActive && 'text-blue-400')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Brand Colors Footer */}
        <div className="border-t border-slate-700/50 p-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">Brands</p>
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" title="ZenecoHomes" />
            <div className="h-3 w-3 rounded-full bg-purple-500" title="Chatgenius" />
            <div className="h-3 w-3 rounded-full bg-green-500" title="Dona Anna" />
            <div className="h-3 w-3 rounded-full bg-amber-500" title="Freddy Bremseth" />
            <div className="h-3 w-3 rounded-full bg-pink-500" title="Neural Beat" />
          </div>
        </div>
      </div>
    </aside>
  );
}
