import React, { useCallback, useEffect, useState } from 'react';
import { ProgressRing } from './ProgressRing';

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = 'focus' | 'shortBreak' | 'longBreak';

interface TimerDisplayState {
  phase: Phase;
  timeRemaining: number;
  isRunning: boolean;
  sessionsCompleted: number;
  focusDuration: number;
}

const PHASE_CONFIG: Record<Phase, { label: string; color: string; emoji: string; ringColor: string }> = {
  focus:      { label: 'FOCUS',       color: 'text-indigo-600', emoji: '🧠', ringColor: '#4f46e5' },
  shortBreak: { label: 'SHORT BREAK', color: 'text-emerald-600', emoji: '☕', ringColor: '#10b981' },
  longBreak:  { label: 'LONG BREAK',  color: 'text-amber-600',  emoji: '🌴', ringColor: '#f59e0b' },
};

const DURATION_PRESETS = [
  { label: '15', value: 15 },
  { label: '25', value: 25 },
  { label: '45', value: 45 },
  { label: '60', value: 60 },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function TimerTab() {
  const [phase, setPhase] = useState<Phase>('focus');
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [focusDuration, setFocusDuration] = useState(25);
  const [initialized, setInitialized] = useState(false);

  // Load timer state
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_TIMER_STATE' }, (response) => {
      if (response?.state) {
        const s = response.state;
        setPhase(s.phase);
        setTimeRemaining(s.timeRemaining);
        setIsRunning(s.isRunning);
        setSessionsCompleted(s.sessionsCompleted);
        setFocusDuration(s.focusDuration);
      }
      setInitialized(true);
    });
  }, []);

  // Listen for timer ticks from background
  useEffect(() => {
    const handler = (message: any) => {
      if (message.type === 'TIMER_TICK') {
        setTimeRemaining(message.timeRemaining);
        setPhase(message.phase);
        setIsRunning(message.isRunning);
        setSessionsCompleted(message.sessionsCompleted);
      }
      if (message.type === 'TIMER_PHASE_COMPLETE') {
        setPhase(message.newPhase);
        setTimeRemaining(message.timeRemaining);
        setSessionsCompleted(message.sessionsCompleted);
        setIsRunning(false);
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTotalSeconds = (): number => {
    if (phase === 'focus') return focusDuration * 60;
    if (phase === 'shortBreak') return 5 * 60;
    return 15 * 60;
  };

  const progress = 1 - (timeRemaining / getTotalSeconds());
  const config = PHASE_CONFIG[phase];

  const handleStart = useCallback(() => {
    setIsRunning(true);
    chrome.runtime.sendMessage({ type: 'TIMER_START' });
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    chrome.runtime.sendMessage({ type: 'TIMER_PAUSE' });
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(focusDuration * 60);
    setPhase('focus');
    chrome.runtime.sendMessage({ type: 'TIMER_RESET' });
  }, [focusDuration]);

  const handleSkip = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'TIMER_SKIP' });
  }, []);

  const handleDurationChange = useCallback((minutes: number) => {
    setFocusDuration(minutes);
    if (!isRunning && phase === 'focus') {
      setTimeRemaining(minutes * 60);
    }
    chrome.runtime.sendMessage({ type: 'TIMER_SET_DURATION', duration: minutes });
  }, [isRunning, phase]);

  return (
    <div className="animate-fade-in flex flex-col items-center">
      {/* Phase Label */}
      <div className={`flex items-center gap-2 mb-6 ${config.color}`}>
        <span className="text-2xl">{config.emoji}</span>
        <span className="text-xs font-bold uppercase tracking-widest">{config.label}</span>
      </div>

      {/* Circular Timer */}
      <div className="mb-6">
        <ProgressRing
          progress={progress}
          size={180}
          strokeWidth={10}
          color={config.ringColor}
          trackColor="#e2e8f0"
        >
          <div className="text-center">
            <div className="text-4xl font-bold tracking-tight text-slate-800 font-mono">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {phase === 'focus' ? 'Stay focused' : 'Take a breath'}
            </div>
          </div>
        </ProgressRing>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleReset}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all shadow-sm hover:shadow"
          title="Reset"
        >
          ↺
        </button>

        {isRunning ? (
          <button
            onClick={handlePause}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 flex items-center justify-center text-white text-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
            title="Pause"
          >
            ⏸
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 flex items-center justify-center text-white text-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
            title="Start"
          >
            ▶
          </button>
        )}

        <button
          onClick={handleSkip}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all shadow-sm hover:shadow"
          title="Skip"
        >
          ⏭
        </button>
      </div>

      {/* Session Dots */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-slate-400 mr-1">Sessions:</span>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
              i <= sessionsCompleted
                ? 'bg-indigo-600 shadow-sm shadow-indigo-300 scale-110'
                : 'bg-slate-200'
            }`}
          />
        ))}
        {sessionsCompleted >= 4 && (
          <span className="text-xs text-indigo-600 font-bold ml-1">🎉 Set complete!</span>
        )}
      </div>

      {/* Duration Presets */}
      <div className="w-full">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
          Focus Duration
        </h3>
        <div className="flex gap-2 justify-center">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleDurationChange(preset.value)}
              disabled={isRunning}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                focusDuration === preset.value
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {preset.label}m
            </button>
          ))}
        </div>
      </div>

      {/* Focus Tips */}
      <div className="mt-6 w-full glass-card rounded-xl p-4">
        <div className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">💡 Tip:</span>{' '}
          {phase === 'focus'
            ? 'Close unnecessary tabs and silence notifications for deep focus.'
            : 'Stand up, stretch, or look at something 20 feet away for 20 seconds.'}
        </div>
      </div>
    </div>
  );
}
