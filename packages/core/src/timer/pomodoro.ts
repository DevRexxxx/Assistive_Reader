/**
 * Timestamp-Driven Pomodoro State Machine
 * Pure TypeScript — zero DOM, zero setInterval, zero chrome.*, zero network.
 *
 * Stores targetEndTimestamp while running and derives remaining seconds from
 * (targetEndTimestamp - nowMs), avoiding timer drift across suspended tabs or workers.
 */

export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';
export type PomodoroStatus = 'idle' | 'running' | 'paused';

export interface PomodoroState {
  phase: PomodoroPhase;
  status: PomodoroStatus;
  targetEndTimestamp: number | null;
  pausedRemainingSeconds: number | null;
  sessionsCompleted: number;
  focusDurationMin: number;
  shortBreakDurationMin: number;
  longBreakDurationMin: number;
}

export function createInitialPomodoroState(
  focusDurationMin: number = 25,
  shortBreakDurationMin: number = 5,
  longBreakDurationMin: number = 15
): PomodoroState {
  return {
    phase: 'focus',
    status: 'idle',
    targetEndTimestamp: null,
    pausedRemainingSeconds: null,
    sessionsCompleted: 0,
    focusDurationMin,
    shortBreakDurationMin,
    longBreakDurationMin,
  };
}

export function getPhaseDurationSeconds(state: PomodoroState, phase: PomodoroPhase = state.phase): number {
  if (phase === 'focus') return state.focusDurationMin * 60;
  if (phase === 'shortBreak') return state.shortBreakDurationMin * 60;
  return state.longBreakDurationMin * 60;
}

export function getRemainingSeconds(state: PomodoroState, nowMs: number): number {
  if (state.status === 'running' && state.targetEndTimestamp !== null) {
    const diffMs = state.targetEndTimestamp - nowMs;
    return Math.max(0, Math.ceil(diffMs / 1000));
  }
  if (state.status === 'paused' && state.pausedRemainingSeconds !== null) {
    return Math.max(0, state.pausedRemainingSeconds);
  }
  return getPhaseDurationSeconds(state);
}

export function startOrResumeTimer(state: PomodoroState, nowMs: number): PomodoroState {
  if (state.status === 'running') return state;
  const remaining =
    state.status === 'paused' && state.pausedRemainingSeconds !== null
      ? Math.max(1, state.pausedRemainingSeconds)
      : getPhaseDurationSeconds(state);

  return {
    ...state,
    status: 'running',
    targetEndTimestamp: nowMs + remaining * 1000,
    pausedRemainingSeconds: null,
  };
}

export function pauseTimer(state: PomodoroState, nowMs: number): PomodoroState {
  if (state.status !== 'running') return state;
  const remaining = getRemainingSeconds(state, nowMs);
  return {
    ...state,
    status: 'paused',
    targetEndTimestamp: null,
    pausedRemainingSeconds: remaining,
  };
}

export function resetTimer(state: PomodoroState): PomodoroState {
  return {
    ...state,
    phase: 'focus',
    status: 'idle',
    targetEndTimestamp: null,
    pausedRemainingSeconds: null,
  };
}

export function setFocusDuration(state: PomodoroState, minutes: number): PomodoroState {
  const safeMin = Math.max(1, Math.min(120, Math.round(minutes)));
  if (state.status === 'running') {
    return { ...state, focusDurationMin: safeMin };
  }
  return {
    ...state,
    focusDurationMin: safeMin,
    pausedRemainingSeconds: state.phase === 'focus' ? null : state.pausedRemainingSeconds,
  };
}

export interface PhaseTransitionResult {
  nextState: PomodoroState;
  completedPhase: PomodoroPhase | null;
  minutesCompleted: number;
}

export function completeCurrentPhase(state: PomodoroState): PhaseTransitionResult {
  const completedPhase = state.phase;

  if (completedPhase === 'focus') {
    const nextSessions = state.sessionsCompleted + 1;
    const nextPhase: PomodoroPhase = nextSessions % 4 === 0 ? 'longBreak' : 'shortBreak';
    return {
      completedPhase: 'focus',
      minutesCompleted: state.focusDurationMin,
      nextState: {
        ...state,
        phase: nextPhase,
        status: 'idle',
        targetEndTimestamp: null,
        pausedRemainingSeconds: null,
        sessionsCompleted: nextSessions,
      },
    };
  }

  const breakMins =
    completedPhase === 'shortBreak' ? state.shortBreakDurationMin : state.longBreakDurationMin;

  return {
    completedPhase,
    minutesCompleted: breakMins,
    nextState: {
      ...state,
      phase: 'focus',
      status: 'idle',
      targetEndTimestamp: null,
      pausedRemainingSeconds: null,
    },
  };
}

export function evaluateTimer(state: PomodoroState, nowMs: number): PhaseTransitionResult {
  if (state.status !== 'running' || state.targetEndTimestamp === null) {
    return { nextState: state, completedPhase: null, minutesCompleted: 0 };
  }
  if (nowMs < state.targetEndTimestamp) {
    return { nextState: state, completedPhase: null, minutesCompleted: 0 };
  }
  return completeCurrentPhase(state);
}
