/**
 * Background Service Worker — v3
 *
 * Central message router between:
 *   - Side Panel (React UI)
 *   - Content Script (DOM manipulation)
 *
 * Manages:
 *   - Pomodoro timer via setInterval
 *   - Daily usage stats tracking
 *   - Goal & streak management
 */

import {
  getTodayStats,
  incrementStat,
  incrementModeActivation,
  getWeeklyStats,
  getGoals,
  setGoals as setGoalsStorage,
  getStreak,
  updateStreak,
  getTimerState,
  setTimerState,
  getDefaultTimer,
  type TimerState,
  type GoalConfig,
} from '../utils/storage';

// ─── Side Panel Setup ────────────────────────────────────────────────────────

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error: Error) => console.error('[AssistiveReader] sidePanel error:', error));

// ─── Pomodoro Timer ──────────────────────────────────────────────────────────

let timerInterval: ReturnType<typeof setInterval> | null = null;

async function startTimerAlarm() {
  const state = await getTimerState();
  state.isRunning = true;
  await setTimerState(state);

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(async () => {
    await tickTimer();
  }, 1000);
}

async function stopTimerAlarm() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  const state = await getTimerState();
  state.isRunning = false;
  await setTimerState(state);
}

async function tickTimer() {
  const state = await getTimerState();
  if (!state.isRunning) {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    return;
  }

  state.timeRemaining -= 1;

  if (state.timeRemaining <= 0) {
    await handlePhaseComplete(state);
    return;
  }

  await setTimerState(state);

  chrome.runtime.sendMessage({
    type: 'TIMER_TICK',
    timeRemaining: state.timeRemaining,
    phase: state.phase,
    isRunning: state.isRunning,
    sessionsCompleted: state.sessionsCompleted,
  }).catch(() => { });
}

async function handlePhaseComplete(state: TimerState) {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  let newPhase: TimerState['phase'];
  let newTime: number;

  if (state.phase === 'focus') {
    await incrementStat('focusMinutes', state.focusDuration);
    state.sessionsCompleted += 1;
    await incrementStat('sessionsCompleted');

    const streak = await updateStreak();
    chrome.runtime.sendMessage({ type: 'STREAK_UPDATED', streak }).catch(() => { });

    const todayStats = await getTodayStats();
    const goals = await getGoals();
    if (todayStats.focusMinutes >= goals.dailyFocusMinutes) {
      chrome.runtime.sendMessage({ type: 'GOAL_COMPLETED' }).catch(() => { });
    }

    if (state.sessionsCompleted % 4 === 0) {
      newPhase = 'longBreak';
      newTime = state.longBreakDuration * 60;
    } else {
      newPhase = 'shortBreak';
      newTime = state.shortBreakDuration * 60;
    }
  } else {
    if (state.phase === 'shortBreak') {
      await incrementStat('breakMinutes', state.shortBreakDuration);
    } else {
      await incrementStat('breakMinutes', state.longBreakDuration);
    }
    newPhase = 'focus';
    newTime = state.focusDuration * 60;
  }

  state.phase = newPhase;
  state.timeRemaining = newTime;
  state.isRunning = false;
  await setTimerState(state);

  try {
    chrome.notifications.create('phase-complete', {
      type: 'basic',
      iconUrl: 'src/assets/icon-128.png',
      title: 'AssistiveReader Timer',
      message: newPhase === 'focus'
        ? '☕ Break over! Time to focus.'
        : state.phase === 'longBreak'
          ? '🌴 Great work! Take a long break.'
          : '🍅 Pomodoro complete! Take a short break.',
    });
  } catch { /* notifications may not be available */ }

  chrome.runtime.sendMessage({
    type: 'TIMER_PHASE_COMPLETE',
    newPhase,
    timeRemaining: newTime,
    sessionsCompleted: state.sessionsCompleted,
  }).catch(() => { });

  const today = await getTodayStats();
  chrome.runtime.sendMessage({ type: 'STATS_UPDATED', today }).catch(() => { });
}

// ─── Message Router ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: any, _sender, sendResponse: (response?: any) => void) => {
    const handleAsync = async () => {
      switch (message.type) {
        // ── Persona & Bionic → forward to content script ──
        case 'APPLY_PERSONA':
        case 'REMOVE_PERSONA':
        case 'APPLY_BIONIC':
        case 'REMOVE_BIONIC': {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            await chrome.tabs.sendMessage(tab.id, message);
          }
          sendResponse({ success: true });
          break;
        }

        // ── Open Side Panel ──
        case 'OPEN_SIDE_PANEL': {
          if (_sender.tab?.windowId) {
            chrome.sidePanel.open({ windowId: _sender.tab.windowId })
              .then(() => sendResponse({ success: true }))
              .catch(err => {
                console.error('[AssistiveReader] sidePanel.open failed:', err);
                sendResponse({ success: false });
              });
            return; // Exit early to avoid sending the response twice, as we handle it async
          } else {
            sendResponse({ success: false });
          }
          break;
        }

        // ── Track mode activation ──
        case 'INCREMENT_STAT': {
          if (message.field === 'modeActivation' && message.mode) {
            await incrementModeActivation(message.mode);
            const today = await getTodayStats();
            chrome.runtime.sendMessage({ type: 'STATS_UPDATED', today }).catch(() => { });
          }
          sendResponse({ success: true });
          break;
        }

        // ── Timer Controls ──
        case 'TIMER_START': {
          await startTimerAlarm();
          sendResponse({ success: true });
          break;
        }
        case 'TIMER_PAUSE': {
          await stopTimerAlarm();
          sendResponse({ success: true });
          break;
        }
        case 'TIMER_RESET': {
          await stopTimerAlarm();
          const defaults = getDefaultTimer();
          const current = await getTimerState();
          defaults.focusDuration = current.focusDuration;
          defaults.timeRemaining = current.focusDuration * 60;
          await setTimerState(defaults);
          sendResponse({ success: true });
          break;
        }
        case 'TIMER_SKIP': {
          await stopTimerAlarm();
          const state = await getTimerState();
          await handlePhaseComplete(state);
          sendResponse({ success: true });
          break;
        }
        case 'TIMER_SET_DURATION': {
          const state = await getTimerState();
          state.focusDuration = message.duration;
          if (!state.isRunning && state.phase === 'focus') {
            state.timeRemaining = message.duration * 60;
          }
          await setTimerState(state);
          sendResponse({ success: true });
          break;
        }
        case 'GET_TIMER_STATE': {
          const state = await getTimerState();
          sendResponse({ state });
          break;
        }

        // ── Stats ──
        case 'GET_STATS': {
          const today = await getTodayStats();
          const weekly = await getWeeklyStats();
          sendResponse({ today, weekly });
          break;
        }

        // ── Goals ──
        case 'GET_GOALS': {
          const goals = await getGoals();
          const streak = await getStreak();
          sendResponse({ goals, streak });
          break;
        }
        case 'SET_GOALS': {
          await setGoalsStorage(message.goals as GoalConfig);
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    };

    handleAsync();
    return true;
  }
);
