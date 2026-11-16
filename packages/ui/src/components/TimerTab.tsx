import React from 'react';
import { getPhaseDurationSeconds, type PomodoroPhase } from '@assistivereader/core';
import type { AssistiveStore } from '../state/useAssistiveStore';
import { ProgressRing } from './ProgressRing';

interface TimerTabProps {
  store: AssistiveStore;
}

const PHASE_CONFIG: Record<PomodoroPhase, { label: string; color: string; emoji: string; ringColor: string }> = {
  focus:      { label: 'FOCUS',       color: 'text-indigo-700', emoji: '🧠', ringColor: '#4f46e5' },
  shortBreak: { label: 'SHORT BREAK', color: 'text-emerald-700', emoji: '☕', ringColor: '#10b981' },
  longBreak:  { label: 'LONG BREAK',  color: 'text-amber-700',  emoji: '🌴', ringColor: '#f59e0b' },
};

const DURATION_PRESETS = [15, 25, 45, 60];

export function TimerTab({ store }: TimerTabProps) {
  const {
    pomodoro,
    remainingSeconds,
    startTimerAction,
    pauseTimerAction,
    resetTimerAction,
    skipTimerPhaseAction,
    setTimerDurationAction,
  } = store;

  const isRunning = pomodoro.status === 'running';
  const totalSeconds = getPhaseDurationSeconds(pomodoro);
  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0;
  const config = PHASE_CONFIG[pomodoro.phase];

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="animate-fade-in flex flex-col items-center">
      <div className={`flex items-center gap-2 mb-5 ${config.color}`}>
        <span className="text-2xl" aria-hidden="true">{config.emoji}</span>
        <span className="text-xs font-bold uppercase tracking-widest">{config.label}</span>
      </div>

      <div className="mb-5">
        <ProgressRing
          progress={progress}
          size={180}
          strokeWidth={10}
          color={config.ringColor}
          trackColor="#e2e8f0"
          label={`${config.label} timer progress`}
        >
          <div className="text-center">
            <div className="text-4xl font-bold tracking-tight text-slate-800 font-mono" aria-live="off">
              {formatTime(remainingSeconds)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {pomodoro.phase === 'focus' ? 'Stay focused' : 'Take a breath'}
            </div>
          </div>
        </ProgressRing>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={resetTimerAction}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all shadow-sm"
          aria-label="Reset timer"
          title="Reset"
        >
          ↺
        </button>

        {isRunning ? (
          <button
            type="button"
            onClick={pauseTimerAction}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 flex items-center justify-center text-white text-xl shadow-lg transition-all active:scale-95"
            aria-label="Pause timer"
            title="Pause"
          >
            ⏸
          </button>
        ) : (
          <button
            type="button"
            onClick={startTimerAction}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 flex items-center justify-center text-white text-xl shadow-lg transition-all active:scale-95"
            aria-label="Start timer"
            title="Start"
          >
            ▶
          </button>
        )}

        <button
          type="button"
          onClick={skipTimerPhaseAction}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all shadow-sm"
          aria-label="Complete and skip to next phase"
          title="Complete & Skip Phase"
        >
          ⏭
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs text-slate-500 mr-1">Sessions:</span>
        {[1, 2, 3, 4].map((i) => {
          const filled = i <= (pomodoro.sessionsCompleted % 4 || (pomodoro.sessionsCompleted > 0 && pomodoro.sessionsCompleted % 4 === 0 ? 4 : 0));
          return (
            <div
              key={i}
              aria-hidden="true"
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                filled ? 'bg-indigo-600 shadow-sm shadow-indigo-300 scale-110' : 'bg-slate-200'
              }`}
            />
          );
        })}
        <span className="text-xs font-semibold text-slate-700 ml-1">
          ({pomodoro.sessionsCompleted} total)
        </span>
      </div>

      <div className="w-full">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
          Focus Duration
        </h3>
        <div className="flex gap-2 justify-center">
          {DURATION_PRESETS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => setTimerDurationAction(minutes)}
              disabled={isRunning}
              aria-pressed={pomodoro.focusDurationMin === minutes}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                pomodoro.focusDurationMin === minutes
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {minutes}m
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 w-full glass-card rounded-xl p-3.5 border border-slate-200">
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-800">Timestamp Accuracy:</span> Remaining time is computed from
          your target completion timestamp—background tab throttling will never cause timer drift.
        </div>
      </div>
    </div>
  );
}
