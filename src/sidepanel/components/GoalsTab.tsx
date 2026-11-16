import React, { useCallback, useEffect, useState } from 'react';
import { ProgressRing } from './ProgressRing';
import type { GoalConfig, StreakData, DailyStats } from '../../utils/storage';

// ─── Component ───────────────────────────────────────────────────────────────

const FOCUS_PRESETS = [
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '4h', value: 240 },
];

const SESSION_PRESETS = [
  { label: '2', value: 2 },
  { label: '4', value: 4 },
  { label: '8', value: 8 },
  { label: '12', value: 12 },
];

export function GoalsTab() {
  const [goals, setGoals] = useState<GoalConfig>({ dailyFocusMinutes: 120, dailyPages: 5 });
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastCompletedDate: '' });
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch goals, streak, and today stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [goalsRes, statsRes] = await Promise.all([
          chrome.runtime.sendMessage({ type: 'GET_GOALS' }),
          chrome.runtime.sendMessage({ type: 'GET_STATS' }),
        ]);
        if (goalsRes?.goals) setGoals(goalsRes.goals);
        if (goalsRes?.streak) setStreak(goalsRes.streak);
        if (statsRes?.today) setTodayStats(statsRes.today);
      } catch (err) {
        console.error('[GoalsTab] Error fetching data:', err);
      }
      setLoading(false);
    };
    fetchData();

    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Listen for updates
  useEffect(() => {
    const handler = (message: any) => {
      if (message.type === 'STATS_UPDATED' && message.today) {
        setTodayStats(message.today);
      }
      if (message.type === 'STREAK_UPDATED' && message.streak) {
        setStreak(message.streak);
      }
      if (message.type === 'GOAL_COMPLETED') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const handleSetGoals = useCallback(async (newGoals: Partial<GoalConfig>) => {
    const updated = { ...goals, ...newGoals };
    setGoals(updated);
    await chrome.runtime.sendMessage({ type: 'SET_GOALS', goals: updated });
  }, [goals]);

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const stats = todayStats || {
    date: '',
    focusMinutes: 0,
    breakMinutes: 0,
    sessionsCompleted: 0,
    modesActivated: {},
  };

  const focusProgress = Math.min(stats.focusMinutes / goals.dailyFocusMinutes, 1);
  const sessionsProgress = Math.min(stats.sessionsCompleted / goals.dailyPages, 1);

  const formatDuration = (m: number): string => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h ${r}m` : `${h}h`;
  };

  return (
    <div className="animate-fade-in space-y-5 relative">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="confetti-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 40}%`,
                backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#7c3aed'][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Streak Banner */}
      <div className="glass-card rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className={`text-3xl ${streak.currentStreak > 0 ? 'animate-flame' : ''}`}>
            🔥
          </span>
          <div>
            <div className="text-3xl font-extrabold text-slate-800">
              {streak.currentStreak}
            </div>
            <div className="text-xs text-slate-500">Day Streak</div>
          </div>
        </div>
        {streak.longestStreak > 0 && (
          <div className="text-xs text-slate-400 mt-2">
            Longest: <span className="font-bold text-indigo-500">{streak.longestStreak} days</span>
          </div>
        )}
      </div>

      {/* Progress Rings */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Today's Progress
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Focus Time Goal */}
          <div className="glass-card rounded-xl p-4 flex flex-col items-center">
            <ProgressRing
              progress={focusProgress}
              size={90}
              strokeWidth={8}
              color={focusProgress >= 1 ? '#10b981' : '#4f46e5'}
            >
              <div className="text-center">
                <div className="text-xs font-bold text-slate-700">
                  {Math.round(focusProgress * 100)}%
                </div>
              </div>
            </ProgressRing>
            <div className="text-xs font-semibold text-slate-700 mt-2">Focus Time</div>
            <div className="text-[10px] text-slate-400">
              {formatDuration(stats.focusMinutes)} / {formatDuration(goals.dailyFocusMinutes)}
            </div>
            {focusProgress >= 1 && (
              <div className="text-xs text-emerald-600 font-bold mt-1 animate-bounce-in">✅ Done!</div>
            )}
          </div>

          {/* Sessions Goal */}
          <div className="glass-card rounded-xl p-4 flex flex-col items-center">
            <ProgressRing
              progress={sessionsProgress}
              size={90}
              strokeWidth={8}
              color={sessionsProgress >= 1 ? '#10b981' : '#7c3aed'}
            >
              <div className="text-center">
                <div className="text-xs font-bold text-slate-700">
                  {Math.round(sessionsProgress * 100)}%
                </div>
              </div>
            </ProgressRing>
            <div className="text-xs font-semibold text-slate-700 mt-2">Pomodoros</div>
            <div className="text-[10px] text-slate-400">
              {stats.sessionsCompleted} / {goals.dailyPages}
            </div>
            {sessionsProgress >= 1 && (
              <div className="text-xs text-emerald-600 font-bold mt-1 animate-bounce-in">✅ Done!</div>
            )}
          </div>
        </div>
      </div>

      {/* Set Goals */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Daily Targets
        </h2>

        {/* Focus Time Goal */}
        <div className="glass-card rounded-xl p-4 mb-3">
          <div className="text-xs font-semibold text-slate-700 mb-2">🧠 Focus Time Goal</div>
          <div className="flex gap-2">
            {FOCUS_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleSetGoals({ dailyFocusMinutes: preset.value })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  goals.dailyFocusMinutes === preset.value
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Goal */}
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-700 mb-2">🍅 Daily Pomodoros</div>
          <div className="flex gap-2">
            {SESSION_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleSetGoals({ dailyPages: preset.value })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  goals.dailyPages === preset.value
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
