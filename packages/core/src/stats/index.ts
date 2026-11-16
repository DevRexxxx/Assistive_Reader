/**
 * Pure Stats, Goals, Streak (with Freeze-Day Rule) & Export Helpers
 * Pure TypeScript — zero DOM, zero chrome.*, zero network.
 */

export interface DailyStats {
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  breakMinutes: number;
  sessionsCompleted: number;
  modesActivated: Record<string, number>;
}

export interface GoalConfig {
  dailyFocusMinutes: number;
  dailyPages: number; // daily pomodoro session target
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  freezeDaysRemaining: number;
  freezeUsedDates: string[];
}

export const DEFAULT_GOALS: GoalConfig = {
  dailyFocusMinutes: 120,
  dailyPages: 5,
};

export const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: '',
  freezeDaysRemaining: 1,
  freezeUsedDates: [],
};

export function createEmptyDailyStats(date: string): DailyStats {
  return {
    date,
    focusMinutes: 0,
    breakMinutes: 0,
    sessionsCompleted: 0,
    modesActivated: {},
  };
}

export function formatISODate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function addDays(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().split('T')[0];
}

export function rolloverDayIfNeeded(
  todayStats: DailyStats,
  weeklyStats: DailyStats[],
  currentDate: string
): { today: DailyStats; weekly: DailyStats[]; rolledOver: boolean } {
  if (todayStats.date === currentDate) {
    return { today: todayStats, weekly: weeklyStats, rolledOver: false };
  }
  const merged = [...weeklyStats.filter(d => d.date !== todayStats.date), todayStats];
  merged.sort((a, b) => a.date.localeCompare(b.date));
  return {
    today: createEmptyDailyStats(currentDate),
    weekly: merged.slice(-7),
    rolledOver: true,
  };
}

export function recordModeActivation(stats: DailyStats, mode: string): DailyStats {
  return {
    ...stats,
    modesActivated: {
      ...stats.modesActivated,
      [mode]: (stats.modesActivated[mode] || 0) + 1,
    },
  };
}

export function evaluateGoalCompletion(stats: DailyStats, goals: GoalConfig): {
  focusGoalMet: boolean;
  sessionsGoalMet: boolean;
  focusProgress: number;
  sessionsProgress: number;
} {
  const safeFocusTarget = Math.max(1, goals.dailyFocusMinutes);
  const safeSessionTarget = Math.max(1, goals.dailyPages);
  return {
    focusGoalMet: stats.focusMinutes >= safeFocusTarget,
    sessionsGoalMet: stats.sessionsCompleted >= safeSessionTarget,
    focusProgress: Math.min(1, stats.focusMinutes / safeFocusTarget),
    sessionsProgress: Math.min(1, stats.sessionsCompleted / safeSessionTarget),
  };
}

export function evaluateStreakWithFreeze(
  streak: StreakData,
  todayStats: DailyStats,
  goals: GoalConfig
): StreakData {
  const { focusGoalMet } = evaluateGoalCompletion(todayStats, goals);
  if (!focusGoalMet) return streak;

  const today = todayStats.date;
  if (streak.lastCompletedDate === today) {
    return streak;
  }

  const yesterday = addDays(today, -1);
  const twoDaysAgo = addDays(today, -2);

  let nextStreak = 1;
  let freezeRemaining = streak.freezeDaysRemaining;
  const freezeDates = [...streak.freezeUsedDates];

  if (streak.lastCompletedDate === yesterday) {
    nextStreak = streak.currentStreak + 1;
  } else if (
    streak.lastCompletedDate === twoDaysAgo &&
    streak.currentStreak > 0 &&
    freezeRemaining > 0
  ) {
    // Apply 1 freeze day to bridge the missed yesterday
    freezeRemaining -= 1;
    freezeDates.push(yesterday);
    nextStreak = streak.currentStreak + 1;
  }

  return {
    currentStreak: nextStreak,
    longestStreak: Math.max(streak.longestStreak, nextStreak),
    lastCompletedDate: today,
    freezeDaysRemaining: freezeRemaining,
    freezeUsedDates: freezeDates.slice(-14),
  };
}

export function exportStatsToCSV(days: DailyStats[]): string {
  const header = 'date,focusMinutes,breakMinutes,sessionsCompleted,modesActivated';
  const rows = days.map((d) => {
    const modes = Object.entries(d.modesActivated)
      .map(([k, v]) => `${k}:${v}`)
      .join(';');
    return `${d.date},${d.focusMinutes},${d.breakMinutes},${d.sessionsCompleted},"${modes}"`;
  });
  return [header, ...rows].join('\n');
}

export interface ExportBundle {
  version: number;
  exportedAt: string;
  goals: GoalConfig;
  streak: StreakData;
  todayStats: DailyStats;
  weeklyStats: DailyStats[];
  settings: Record<string, unknown>;
}

export function buildExportBundle(params: Omit<ExportBundle, 'version' | 'exportedAt'>): string {
  const bundle: ExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...params,
  };
  return JSON.stringify(bundle, null, 2);
}

export function parseImportedBundle(rawJson: string): { valid: boolean; error?: string; bundle?: ExportBundle } {
  try {
    const parsed = JSON.parse(rawJson) as Partial<ExportBundle>;
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) {
      return { valid: false, error: 'Unsupported or invalid AssistiveReader export format.' };
    }
    if (!parsed.goals || typeof parsed.goals.dailyFocusMinutes !== 'number') {
      return { valid: false, error: 'Missing valid goals configuration.' };
    }
    if (!parsed.settings || typeof parsed.settings !== 'object') {
      return { valid: false, error: 'Missing settings object.' };
    }
    return { valid: true, bundle: parsed as ExportBundle };
  } catch {
    return { valid: false, error: 'File is not valid JSON.' };
  }
}
