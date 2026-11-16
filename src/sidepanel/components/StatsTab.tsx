import React, { useEffect, useState } from 'react';
import type { DailyStats } from '../../utils/storage';

// ─── Component ───────────────────────────────────────────────────────────────

export function StatsTab() {
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
        if (response) {
          setTodayStats(response.today);
          setWeeklyStats(response.weekly || []);
        }
      } catch (err) {
        console.error('[StatsTab] Failed to fetch stats:', err);
      }
      setLoading(false);
    };
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for stat updates from background
  useEffect(() => {
    const handler = (message: any) => {
      if (message.type === 'STATS_UPDATED' && message.today) {
        setTodayStats(message.today);
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const stats = todayStats || {
    date: new Date().toISOString().split('T')[0],
    focusMinutes: 0,
    breakMinutes: 0,
    sessionsCompleted: 0,
    modesActivated: {},
  };

  const maxFocus = Math.max(...weeklyStats.map(d => d.focusMinutes), stats.focusMinutes, 1);
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Today's Summary */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Today's Activity
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Focus Time */}
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">🧠</div>
            <div className="text-2xl font-bold text-indigo-600">{formatDuration(stats.focusMinutes)}</div>
            <div className="text-xs text-slate-500 mt-1">Focus Time</div>
          </div>

          {/* Sessions */}
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">🍅</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.sessionsCompleted}</div>
            <div className="text-xs text-slate-500 mt-1">Pomodoros</div>
          </div>

          {/* Break Time */}
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">☕</div>
            <div className="text-2xl font-bold text-violet-600">{formatDuration(stats.breakMinutes)}</div>
            <div className="text-xs text-slate-500 mt-1">Break Time</div>
          </div>

          {/* Modes Used */}
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">🎨</div>
            <div className="text-2xl font-bold text-amber-600">
              {Object.values(stats.modesActivated).reduce((a, b) => a + b, 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Modes Activated</div>
          </div>
        </div>
      </div>

      {/* 7-Day Chart */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Weekly Focus
        </h2>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-end gap-1.5 justify-between" style={{ height: '120px' }}>
            {(() => {
              // Build a 7-day array ending with today
              const today = new Date();
              const days: { label: string; minutes: number; isToday: boolean }[] = [];
              for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const dayData = weeklyStats.find(s => s.date === dateStr);
                days.push({
                  label: dayLabels[d.getDay()],
                  minutes: dayData?.focusMinutes || (i === 0 ? stats.focusMinutes : 0),
                  isToday: i === 0,
                });
              }

              const chartMax = Math.max(...days.map(d => d.minutes), 1);

              return days.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  {/* Value label */}
                  <span className="text-[10px] text-slate-400 font-medium">
                    {day.minutes > 0 ? formatDuration(day.minutes) : ''}
                  </span>
                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-md stat-bar ${
                      day.isToday
                        ? 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                        : 'bg-gradient-to-t from-slate-300 to-slate-200'
                    }`}
                    style={{
                      height: `${Math.max((day.minutes / chartMax) * 80, 4)}px`,
                      minHeight: '4px',
                    }}
                  />
                  {/* Day label */}
                  <span className={`text-[10px] font-medium ${
                    day.isToday ? 'text-indigo-600 font-bold' : 'text-slate-400'
                  }`}>
                    {day.label}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Mode Breakdown */}
      {Object.keys(stats.modesActivated).length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Mode Usage
          </h2>
          <div className="glass-card rounded-xl p-4 space-y-3">
            {Object.entries(stats.modesActivated).map(([mode, count]) => {
              const labels: Record<string, { name: string; color: string }> = {
                adhd: { name: 'ADHD Focus', color: 'bg-amber-500' },
                dyslexia: { name: 'Dyslexia Read', color: 'bg-emerald-500' },
                autism: { name: 'Autism Calm', color: 'bg-violet-500' },
              };
              const info = labels[mode] || { name: mode, color: 'bg-slate-400' };
              const total = Object.values(stats.modesActivated).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={mode}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{info.name}</span>
                    <span className="text-slate-400">{count}×</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${info.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
