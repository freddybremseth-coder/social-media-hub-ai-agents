'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MOCK_EVENTS = [
  { id: '1', title: 'LinkedIn: Property spotlight', brand: 'ZenecoHomes', color: '#3b82f6', day: 3, platforms: ['linkedin'] },
  { id: '2', title: 'Twitter: AI insights thread', brand: 'Chatgenius', color: '#8b5cf6', day: 5, platforms: ['twitter'] },
  { id: '3', title: 'Instagram: Olive harvest story', brand: 'Dona Anna', color: '#22c55e', day: 7, platforms: ['instagram'] },
  { id: '4', title: 'LinkedIn: Thought leadership', brand: 'Personal Brand', color: '#f59e0b', day: 10, platforms: ['linkedin'] },
  { id: '5', title: 'Multi-platform: Product launch', brand: 'Chatgenius', color: '#8b5cf6', day: 12, platforms: ['twitter', 'linkedin'] },
  { id: '6', title: 'Instagram: Recipe content', brand: 'Dona Anna', color: '#22c55e', day: 14, platforms: ['instagram', 'facebook'] },
  { id: '7', title: 'TikTok: Behind the scenes', brand: 'Dona Anna', color: '#22c55e', day: 16, platforms: ['tiktok'] },
  { id: '8', title: 'LinkedIn: Market analysis', brand: 'ZenecoHomes', color: '#3b82f6', day: 18, platforms: ['linkedin'] },
  { id: '9', title: 'Instagram: Villa tour', brand: 'ZenecoHomes', color: '#3b82f6', day: 20, platforms: ['instagram'] },
  { id: '10', title: 'Twitter: Weekly tips', brand: 'Personal Brand', color: '#f59e0b', day: 22, platforms: ['twitter'] },
  { id: '11', title: 'Multi: Monthly wrap-up', brand: 'Personal Brand', color: '#f59e0b', day: 28, platforms: ['linkedin', 'twitter', 'instagram'] },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 border border-slate-800/50" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = MOCK_EVENTS.filter(e => e.day === day);
    const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

    days.push(
      <div
        key={day}
        className={`h-32 border border-slate-800/50 p-1.5 transition-colors hover:bg-slate-800/30 ${
          isToday ? 'bg-blue-500/5 border-blue-500/30' : ''
        }`}
      >
        <div className={`mb-1 text-xs font-medium ${isToday ? 'text-blue-400' : 'text-slate-500'}`}>{day}</div>
        <div className="space-y-0.5">
          {dayEvents.map((event) => (
            <div
              key={event.id}
              className="cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-medium text-white truncate transition-opacity hover:opacity-80"
              style={{ backgroundColor: event.color + '40', borderLeft: `2px solid ${event.color}` }}
              title={`${event.brand}: ${event.title}`}
            >
              {event.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Calendar</h1>
          <p className="mt-1 text-slate-400">Plan and schedule your content across all brands</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex gap-4">
        {[
          { label: 'ZenecoHomes', color: '#3b82f6' },
          { label: 'Chatgenius', color: '#8b5cf6' },
          { label: 'Dona Anna', color: '#22c55e' },
          { label: 'Personal Brand', color: '#f59e0b' },
        ].map((brand) => (
          <div key={brand.label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: brand.color }} />
            <span className="text-xs text-slate-400">{brand.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="text-slate-400 hover:text-white">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-white">{monthName}</CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="text-slate-400 hover:text-white">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="border-b border-slate-700/50 pb-2 text-center text-xs font-medium text-slate-500">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0">{days}</div>
        </CardContent>
      </Card>

      {/* Upcoming */}
      <Card className="mt-6 bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Upcoming Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {MOCK_EVENTS.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: event.color }} />
                  <div>
                    <p className="text-sm font-medium text-white">{event.title}</p>
                    <p className="text-xs text-slate-400">{event.brand}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {event.platforms.map(p => (
                    <Badge key={p} variant="outline" className="text-[10px] text-slate-400 border-slate-600">{p}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
