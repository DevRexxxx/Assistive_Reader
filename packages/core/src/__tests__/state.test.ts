import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILT_IN_PROFILES,
  validateProfile,
  buildCalibratedProfile,
  buildCssFilterStrings,
  clampSaturation,
  createInitialPomodoroState,
  startOrResumeTimer,
  pauseTimer,
  resetTimer,
  getRemainingSeconds,
  evaluateTimer,
  completeCurrentPhase,
  DEFAULT_GOALS,
  DEFAULT_STREAK,
  createEmptyDailyStats,
  rolloverDayIfNeeded,
  evaluateStreakWithFreeze,
  exportStatsToCSV,
  buildExportBundle,
  parseImportedBundle,
} from '../index';

test('built-in profiles pass strict schema validation', () => {
  for (const key of ['adhd', 'dyslexia', 'autism'] as const) {
    const res = validateProfile(BUILT_IN_PROFILES[key]);
    assert.equal(res.valid, true, `Profile ${key} errors: ${res.errors.join(', ')}`);
  }

  const invalid = validateProfile({ id: '', fontScale: 99 });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length > 0);
});

test('calibration wizard deterministically maps choices to a valid custom profile', () => {
  const custom = buildCalibratedProfile(
    {
      fontPreference: 'opendyslexic',
      spacingPreference: 'airy',
      surfacePreference: 'cream',
      lineWidthPreference: 'narrow',
    },
    'Study Comfort'
  );
  assert.equal(validateProfile(custom).valid, true);
  assert.equal(custom.fontFamily, 'opendyslexic');
  assert.equal(custom.maxLineWidthCh, 50);
  assert.equal(custom.overlay, 'yellow');
});

test('color filter helpers clamp saturation and compose filters cleanly', () => {
  assert.equal(clampSaturation(-10), 0);
  assert.equal(clampSaturation(250), 200);
  const filters = buildCssFilterStrings({ darkMode: true, cvd: 'deuteranopia', saturation: 80 });
  assert.ok(filters.surfaceFilter.includes('invert(0.92)'));
  assert.ok(filters.surfaceFilter.includes('url(#ar-cvd-deuteranopia)'));
  assert.ok(filters.surfaceFilter.includes('saturate(0.8)'));
});

test('timestamp-based Pomodoro state machine derives remaining time without drift', () => {
  const t0 = 1_700_000_000_000;
  let state = createInitialPomodoroState(25, 5, 15);
  assert.equal(getRemainingSeconds(state, t0), 1500);

  state = startOrResumeTimer(state, t0);
  assert.equal(state.status, 'running');
  assert.equal(getRemainingSeconds(state, t0 + 10_000), 1490);

  // Pause after 50 seconds
  state = pauseTimer(state, t0 + 50_000);
  assert.equal(state.status, 'paused');
  assert.equal(getRemainingSeconds(state, t0 + 500_000), 1450);

  // Resume and complete
  state = startOrResumeTimer(state, t0 + 500_000);
  const evalEarly = evaluateTimer(state, t0 + 500_000 + 100_000);
  assert.equal(evalEarly.completedPhase, null);

  const evalDone = evaluateTimer(state, t0 + 500_000 + 1_450_000);
  assert.equal(evalDone.completedPhase, 'focus');
  assert.equal(evalDone.nextState.phase, 'shortBreak');
  assert.equal(evalDone.nextState.sessionsCompleted, 1);

  // 4th completed focus session triggers longBreak
  let s4 = { ...evalDone.nextState, phase: 'focus' as const, sessionsCompleted: 3 };
  const res4 = completeCurrentPhase(s4);
  assert.equal(res4.nextState.phase, 'longBreak');
  assert.equal(res4.nextState.sessionsCompleted, 4);

  const reset = resetTimer(res4.nextState);
  assert.equal(reset.phase, 'focus');
  assert.equal(reset.status, 'idle');
});

test('stats rollover, freeze-day streak rule, and export/import roundtrip', () => {
  const yesterday = createEmptyDailyStats('2026-11-15');
  yesterday.focusMinutes = 120;
  const rollover = rolloverDayIfNeeded(yesterday, [], '2026-11-16');
  assert.equal(rollover.rolledOver, true);
  assert.equal(rollover.today.date, '2026-11-16');
  assert.equal(rollover.weekly.length, 1);

  // Streak with 1 freeze day bridges a 1-day gap
  const streakBefore = {
    ...DEFAULT_STREAK,
    currentStreak: 3,
    longestStreak: 3,
    lastCompletedDate: '2026-11-14',
    freezeDaysRemaining: 1,
  };
  const todayDone = { ...createEmptyDailyStats('2026-11-16'), focusMinutes: 120 };
  const streakAfter = evaluateStreakWithFreeze(streakBefore, todayDone, DEFAULT_GOALS);
  assert.equal(streakAfter.currentStreak, 4);
  assert.equal(streakAfter.freezeDaysRemaining, 0);
  assert.deepEqual(streakAfter.freezeUsedDates, ['2026-11-15']);

  const csv = exportStatsToCSV([yesterday, todayDone]);
  assert.ok(csv.includes('date,focusMinutes,breakMinutes,sessionsCompleted,modesActivated'));
  assert.ok(csv.includes('2026-11-16,120,0,0'));

  const json = buildExportBundle({
    goals: DEFAULT_GOALS,
    streak: streakAfter,
    todayStats: todayDone,
    weeklyStats: [yesterday],
    settings: { bionicReading: true },
  });
  const parsed = parseImportedBundle(json);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.bundle?.settings.bionicReading, true);
});
