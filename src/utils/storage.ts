/**
 * Centralized Storage Helpers
 *
 * Uses chrome.storage.local for daily usage data (more space than sync).
 * Provides typed getters/setters for stats, goals, streaks, and timer state.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DailyStats {
  date: string;                          // "2026-05-02"
  focusMinutes: number;
  breakMinutes: number;
  sessionsCompleted: number;
  modesActivated: Record<string, number>;
}

export interface GoalConfig {
  dailyFocusMinutes: number;             // e.g. 120
  dailyPages: number;                    // e.g. 5
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;             // "2026-05-02"
}

export interface TimerState {
  phase: 'focus' | 'shortBreak' | 'longBreak';
  timeRemaining: number;                 // seconds
  isRunning: boolean;
  sessionsCompleted: number;
  focusDuration: number;                 // minutes (configurable)
  shortBreakDuration: number;
  longBreakDuration: number;
}

export interface WeeklyStats {
  days: DailyStats[];
}

// ─── Defaults ────────────────────────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

const DEFAULT_DAILY_STATS: DailyStats = {
  date: getToday(),
  focusMinutes: 0,
  breakMinutes: 0,
  sessionsCompleted: 0,
  modesActivated: {},
};

const DEFAULT_GOALS: GoalConfig = {
  dailyFocusMinutes: 120,
  dailyPages: 5,
};

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: '',
};

const DEFAULT_TIMER: TimerState = {
  phase: 'focus',
  timeRemaining: 25 * 60,
  isRunning: false,
  sessionsCompleted: 0,
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

const KEYS = {
  TODAY_STATS: 'ar_today_stats',
  WEEKLY_STATS: 'ar_weekly_stats',
  GOALS: 'ar_goals',
  STREAK: 'ar_streak',
  TIMER: 'ar_timer',
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getLocal<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get([key]);
  return result[key] ?? fallback;
}

async function setLocal<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// ─── Daily Stats ─────────────────────────────────────────────────────────────

export async function getTodayStats(): Promise<DailyStats> {
  const stats = await getLocal<DailyStats>(KEYS.TODAY_STATS, { ...DEFAULT_DAILY_STATS, date: getToday() });
  // Reset if date changed (new day)
  if (stats.date !== getToday()) {
    // Archive yesterday's stats into weekly before resetting
    await archiveDailyStats(stats);
    const fresh = { ...DEFAULT_DAILY_STATS, date: getToday() };
    await setLocal(KEYS.TODAY_STATS, fresh);
    return fresh;
  }
  return stats;
}

export async function updateTodayStats(partial: Partial<DailyStats>): Promise<DailyStats> {
  const current = await getTodayStats();
  const updated = { ...current, ...partial, date: getToday() };
  await setLocal(KEYS.TODAY_STATS, updated);
  return updated;
}

export async function incrementStat(
  field: 'focusMinutes' | 'breakMinutes' | 'sessionsCompleted',
  amount: number = 1
): Promise<void> {
  const stats = await getTodayStats();
  (stats[field] as number) += amount;
  await setLocal(KEYS.TODAY_STATS, stats);
}

export async function incrementModeActivation(mode: string): Promise<void> {
  const stats = await getTodayStats();
  stats.modesActivated[mode] = (stats.modesActivated[mode] || 0) + 1;
  await setLocal(KEYS.TODAY_STATS, stats);
}

// ─── Weekly Stats ────────────────────────────────────────────────────────────

async function archiveDailyStats(stats: DailyStats): Promise<void> {
  const weekly = await getLocal<DailyStats[]>(KEYS.WEEKLY_STATS, []);
  weekly.push(stats);
  // Keep only last 7 days
  while (weekly.length > 7) weekly.shift();
  await setLocal(KEYS.WEEKLY_STATS, weekly);
}

export async function getWeeklyStats(): Promise<DailyStats[]> {
  const archived = await getLocal<DailyStats[]>(KEYS.WEEKLY_STATS, []);
  const today = await getTodayStats();

  // Combine archived + today, keep last 7
  const all = [...archived.filter(d => d.date !== today.date), today];
  // Sort by date
  all.sort((a, b) => a.date.localeCompare(b.date));
  return all.slice(-7);
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export async function getGoals(): Promise<GoalConfig> {
  return getLocal<GoalConfig>(KEYS.GOALS, DEFAULT_GOALS);
}

export async function setGoals(goals: GoalConfig): Promise<void> {
  await setLocal(KEYS.GOALS, goals);
}

// ─── Streaks ─────────────────────────────────────────────────────────────────

export async function getStreak(): Promise<StreakData> {
  return getLocal<StreakData>(KEYS.STREAK, DEFAULT_STREAK);
}

export async function updateStreak(): Promise<StreakData> {
  const streak = await getStreak();
  const today = getToday();
  const stats = await getTodayStats();
  const goals = await getGoals();

  // Check if today's goals are met
  const goalsMet = stats.focusMinutes >= goals.dailyFocusMinutes;

  if (!goalsMet) return streak;

  if (streak.lastCompletedDate === today) {
    // Already counted today
    return streak;
  }

  // Check if yesterday was completed (for streak continuity)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (streak.lastCompletedDate === yesterdayStr) {
    streak.currentStreak += 1;
  } else if (streak.lastCompletedDate !== today) {
    streak.currentStreak = 1; // Reset streak
  }

  streak.lastCompletedDate = today;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

  await setLocal(KEYS.STREAK, streak);
  return streak;
}

// ─── Timer ───────────────────────────────────────────────────────────────────

export async function getTimerState(): Promise<TimerState> {
  return getLocal<TimerState>(KEYS.TIMER, { ...DEFAULT_TIMER });
}

export async function setTimerState(state: TimerState): Promise<void> {
  await setLocal(KEYS.TIMER, state);
}

export function getDefaultTimer(): TimerState {
  return { ...DEFAULT_TIMER };
}
