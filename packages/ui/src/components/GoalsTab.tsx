import React from 'react';
import { evaluateGoalCompletion } from '@assistivereader/core';
import type { AssistiveStore } from '../state/useAssistiveStore';
import { ProgressRing } from './ProgressRing';

interface GoalsTabProps {
  store: AssistiveStore;
}

const FOCUS_PRESETS = [
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '4h', value: 240 },
];

const SESSION_PRESETS = [2, 4, 8, 12];

export function GoalsTab({ store }: GoalsTabProps) {
  const { goals, streak, todayStats, goalJustCompleted, updateGoals } = store;

  const { focusProgress, sessionsProgress, focusGoalMet, sessionsGoalMet } = evaluateGoalCompletion(
    todayStats,
    goals
  );

  const formatDuration = (m: number): string => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h ${r}m` : `${h}h`;
  };

  return (
    <div className="animate-fade-in space-y-5 relative">
      {goalJustCompleted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="confetti-particle"
              style={{
                left: `${(i * 19) % 95}%`,
                top: `${(i * 11) % 35}%`,
                backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#7c3aed'][i % 5],
                animationDelay: `${(i % 5) * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Streak Banner */}
      <div className="glass-card rounded-xl p-4 text-center border border-slate-200">
        <div className="flex items-center justify-center gap-3">
          <span className={`text-3xl ${streak.currentStreak > 0 ? 'animate-flame' : ''}`} aria-hidden="true">
            🔥
          </span>
          <div>
            <div className="text-3xl font-extrabold text-slate-800">{streak.currentStreak}</div>
            <div className="text-xs text-slate-600">Day Streak</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-2.5 text-xs text-slate-500">
          {streak.longestStreak > 0 && (
            <span>
              Longest: <strong className="text-indigo-700">{streak.longestStreak}d</strong>
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-medium">
            ❄️ {streak.freezeDaysRemaining} Freeze Day{streak.freezeDaysRemaining === 1 ? '' : 's'} left
          </span>
        </div>
      </div>

      {/* Progress Rings */}
      <section aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          Today’s Progress
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-3.5 flex flex-col items-center border border-slate-200">
            <ProgressRing
              progress={focusProgress}
              size={88}
              strokeWidth={8}
              color={focusGoalMet ? '#10b981' : '#4f46e5'}
              label="Focus time goal progress"
            >
              <span className="text-xs font-bold text-slate-700">{Math.round(focusProgress * 100)}%</span>
            </ProgressRing>
            <div className="text-xs font-semibold text-slate-800 mt-2">Focus Time</div>
            <div className="text-[11px] text-slate-500">
              {formatDuration(todayStats.focusMinutes)} / {formatDuration(goals.dailyFocusMinutes)}
            </div>
            {focusGoalMet && <div className="text-xs text-emerald-700 font-bold mt-1">✅ Done!</div>}
          </div>

          <div className="glass-card rounded-xl p-3.5 flex flex-col items-center border border-slate-200">
            <ProgressRing
              progress={sessionsProgress}
              size={88}
              strokeWidth={8}
              color={sessionsGoalMet ? '#10b981' : '#7c3aed'}
              label="Pomodoro session goal progress"
            >
              <span className="text-xs font-bold text-slate-700">{Math.round(sessionsProgress * 100)}%</span>
            </ProgressRing>
            <div className="text-xs font-semibold text-slate-800 mt-2">Pomodoros</div>
            <div className="text-[11px] text-slate-500">
              {todayStats.sessionsCompleted} / {goals.dailyPages}
            </div>
            {sessionsGoalMet && <div className="text-xs text-emerald-700 font-bold mt-1">✅ Done!</div>}
          </div>
        </div>
      </section>

      {/* Targets */}
      <section aria-labelledby="targets-heading" className="space-y-2.5">
        <h2 id="targets-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Daily Targets
        </h2>

        <div className="glass-card rounded-xl p-3.5 border border-slate-200">
          <div className="text-xs font-semibold text-slate-800 mb-2">🧠 Focus Time Goal</div>
          <div className="flex gap-2">
            {FOCUS_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                aria-pressed={goals.dailyFocusMinutes === preset.value}
                onClick={() => updateGoals({ dailyFocusMinutes: preset.value })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  goals.dailyFocusMinutes === preset.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-slate-200">
          <div className="text-xs font-semibold text-slate-800 mb-2">🍅 Daily Pomodoros</div>
          <div className="flex gap-2">
            {SESSION_PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={goals.dailyPages === value}
                onClick={() => updateGoals({ dailyPages: value })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  goals.dailyPages === value
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
