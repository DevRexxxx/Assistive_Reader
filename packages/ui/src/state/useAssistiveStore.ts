import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BUILT_IN_PROFILES,
  DEFAULT_GOALS,
  DEFAULT_STREAK,
  buildExportBundle,
  completeCurrentPhase,
  createEmptyDailyStats,
  createInitialPomodoroState,
  evaluateGoalCompletion,
  evaluateStreakWithFreeze,
  evaluateTimer,
  exportStatsToCSV,
  formatISODate,
  getRemainingSeconds,
  hasCapability,
  parseImportedBundle,
  pauseTimer,
  recordModeActivation,
  resetTimer,
  rolloverDayIfNeeded,
  setFocusDuration,
  startOrResumeTimer,
  verifyLicenseKey,
  type BuiltInProfileId,
  type CVDType,
  type CapabilityKey,
  type DailyStats,
  type GoalConfig,
  type LicenseVerificationResult,
  type OverlayColor,
  type PomodoroState,
  type Profile,
  type ProfileContrast,
  type ProfileFontFamily,
  type StreakData,
} from '@assistivereader/core';
import type { ExportAdapter, LicenseAdapter, StorageAdapter, TTSAdapter, TTSVoiceStatus } from '@assistivereader/adapters';
import { SAMPLE_DOCUMENTS, type ReaderDocument } from '../data/sampleDocuments';

export type SyllableDisplayMode = 'off' | 'middot' | 'alternating';
export type ReadingViewMode = 'full' | 'sentenceFocus' | 'chunkCards';

export interface ToolsToggleState {
  darkMode: boolean;
  readerView: boolean;
  toc: boolean;
  ruler: boolean;
  tts: boolean;
  mediaHider: boolean;
}

export interface TypographyUIState {
  enabled: boolean;
  fontFamily: ProfileFontFamily;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  maxLineWidthCh: number;
  contrast: ProfileContrast;
}

export interface ColorVisionUIState {
  cvdFilter: CVDType;
  overlay: OverlayColor;
  saturation: number;
}

export interface PersistedSettings {
  builtInPersonas: Record<BuiltInProfileId, boolean>;
  customProfiles: Profile[];
  activeCustomProfileId: string | null;
  bionicReading: boolean;
  syllableMode: SyllableDisplayMode;
  confusableLetters: boolean;
  confusableChars: string;
  readingMode: ReadingViewMode;
  sentencesPerCard: number;
  tools: ToolsToggleState;
  typography: TypographyUIState;
  colorVision: ColorVisionUIState;
  ttsRate: number;
  ttsSleepMinutes: number;
  ttsVoiceURI: string;
  uiDark: boolean;
}

export const DEFAULT_PERSISTED_SETTINGS: PersistedSettings = {
  builtInPersonas: { adhd: false, dyslexia: false, autism: false },
  customProfiles: [],
  activeCustomProfileId: null,
  bionicReading: false,
  syllableMode: 'off',
  confusableLetters: false,
  confusableChars: 'bdpq',
  readingMode: 'full',
  sentencesPerCard: 2,
  tools: {
    darkMode: false,
    readerView: false,
    toc: false,
    ruler: false,
    tts: false,
    mediaHider: false,
  },
  typography: {
    enabled: false,
    fontFamily: 'inter',
    fontSize: 18,
    lineHeight: 1.8,
    letterSpacing: 0,
    wordSpacing: 0,
    maxLineWidthCh: 68,
    contrast: 'normal',
  },
  colorVision: {
    cvdFilter: 'none',
    overlay: 'none',
    saturation: 100,
  },
  ttsRate: 0.9,
  ttsSleepMinutes: 0,
  ttsVoiceURI: '',
  uiDark: false,
};

const KEYS = {
  SETTINGS: 'ar_v6_settings',
  POMODORO: 'ar_v6_pomodoro',
  TODAY_STATS: 'ar_v6_today_stats',
  WEEKLY_STATS: 'ar_v6_weekly_stats',
  GOALS: 'ar_v6_goals',
  STREAK: 'ar_v6_streak',
  CUSTOM_DOC: 'ar_v6_custom_doc',
} as const;

export interface AssistiveStoreAdapters {
  storage: StorageAdapter;
  tts: TTSAdapter;
  exporter: ExportAdapter;
  license: LicenseAdapter;
}

export function useAssistiveStore(adapters: AssistiveStoreAdapters) {
  const { storage, tts, exporter, license } = adapters;

  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<PersistedSettings>(DEFAULT_PERSISTED_SETTINGS);
  const [pomodoro, setPomodoro] = useState<PomodoroState>(() => createInitialPomodoroState());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [todayStats, setTodayStats] = useState<DailyStats>(() => createEmptyDailyStats(formatISODate()));
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [goals, setGoalsState] = useState<GoalConfig>(DEFAULT_GOALS);
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);
  const [goalJustCompleted, setGoalJustCompleted] = useState(false);

  const [licenseKey, setLicenseKey] = useState('');
  const [licenseResult, setLicenseResult] = useState<LicenseVerificationResult>({ valid: false, tier: 'free' });

  const [documents, setDocuments] = useState<ReaderDocument[]>(SAMPLE_DOCUMENTS);
  const [activeDocId, setActiveDocId] = useState<string>(SAMPLE_DOCUMENTS[0].id);

  // TTS runtime state
  const [voiceStatus, setVoiceStatus] = useState<TTSVoiceStatus>(() => tts.getVoiceStatus());
  const [ttsActiveCharIndex, setTtsActiveCharIndex] = useState<number>(-1);
  const [ttsActiveSentenceIndex, setTtsActiveSentenceIndex] = useState<number>(-1);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      const today = formatISODate();
      const [
        savedSettings,
        savedPomodoro,
        savedToday,
        savedWeekly,
        savedGoals,
        savedStreak,
        savedKey,
        savedCustomDoc,
      ] = await Promise.all([
        storage.get<Partial<PersistedSettings>>(KEYS.SETTINGS, {}),
        storage.get<PomodoroState>(KEYS.POMODORO, createInitialPomodoroState()),
        storage.get<DailyStats>(KEYS.TODAY_STATS, createEmptyDailyStats(today)),
        storage.get<DailyStats[]>(KEYS.WEEKLY_STATS, []),
        storage.get<GoalConfig>(KEYS.GOALS, DEFAULT_GOALS),
        storage.get<StreakData>(KEYS.STREAK, DEFAULT_STREAK),
        license.loadKey(),
        storage.get<ReaderDocument | null>(KEYS.CUSTOM_DOC, null),
      ]);

      if (!mounted) return;

      const mergedSettings: PersistedSettings = {
        ...DEFAULT_PERSISTED_SETTINGS,
        ...savedSettings,
        builtInPersonas: { ...DEFAULT_PERSISTED_SETTINGS.builtInPersonas, ...savedSettings.builtInPersonas },
        tools: { ...DEFAULT_PERSISTED_SETTINGS.tools, ...savedSettings.tools, tts: false }, // never auto-start audio on reload
        typography: { ...DEFAULT_PERSISTED_SETTINGS.typography, ...savedSettings.typography },
        colorVision: { ...DEFAULT_PERSISTED_SETTINGS.colorVision, ...savedSettings.colorVision },
      };

      const rolled = rolloverDayIfNeeded(savedToday, savedWeekly, today);
      if (rolled.rolledOver) {
        await Promise.all([
          storage.set(KEYS.TODAY_STATS, rolled.today),
          storage.set(KEYS.WEEKLY_STATS, rolled.weekly),
        ]);
      }

      setSettings(mergedSettings);
      setPomodoro(savedPomodoro);
      setRemainingSeconds(getRemainingSeconds(savedPomodoro, Date.now()));
      setTodayStats(rolled.today);
      setWeeklyStats(rolled.weekly);
      setGoalsState(savedGoals);
      setStreak({ ...DEFAULT_STREAK, ...savedStreak });

      if (savedKey) {
        setLicenseKey(savedKey);
        setLicenseResult(verifyLicenseKey(savedKey, today));
      }

      if (savedCustomDoc) {
        setDocuments([...SAMPLE_DOCUMENTS, savedCustomDoc]);
      }

      if (mergedSettings.uiDark) {
        document.documentElement.classList.add('ar-ui-dark');
      }

      setVoiceStatus(tts.getVoiceStatus(mergedSettings.ttsVoiceURI));
      setReady(true);
    }

    hydrate();
    const unsubVoices = tts.onVoicesChanged(() => {
      setVoiceStatus((prev) => tts.getVoiceStatus(settings.ttsVoiceURI || prev.selectedVoice?.voiceURI));
    });

    return () => {
      mounted = false;
      unsubVoices();
    };
  }, []);

  // Persist settings updates
  const updateSettings = useCallback(
    (updater: (prev: PersistedSettings) => PersistedSettings) => {
      setSettings((prev) => {
        const next = updater(prev);
        storage.set(KEYS.SETTINGS, next);
        return next;
      });
    },
    [storage]
  );

  // Sync UI dark mode class
  useEffect(() => {
    if (!ready) return;
    if (settings.uiDark) {
      document.documentElement.classList.add('ar-ui-dark');
    } else {
      document.documentElement.classList.remove('ar-ui-dark');
    }
  }, [settings.uiDark, ready]);

  // Refresh voice status when preferred voice changes
  useEffect(() => {
    setVoiceStatus(tts.getVoiceStatus(settings.ttsVoiceURI));
  }, [settings.ttsVoiceURI, tts]);

  // Complete phase accounting (stats + goals + streak)
  const handleCompletedPhase = useCallback(
    (completedPhase: PomodoroState['phase'], minutesCompleted: number) => {
      const todayISO = formatISODate();
      setTodayStats((prevStats) => {
        const rolled = rolloverDayIfNeeded(prevStats, weeklyStats, todayISO);
        const base = rolled.today;
        const updated: DailyStats =
          completedPhase === 'focus'
            ? {
                ...base,
                focusMinutes: base.focusMinutes + minutesCompleted,
                sessionsCompleted: base.sessionsCompleted + 1,
              }
            : {
                ...base,
                breakMinutes: base.breakMinutes + minutesCompleted,
              };

        storage.set(KEYS.TODAY_STATS, updated);
        if (rolled.rolledOver) {
          setWeeklyStats(rolled.weekly);
          storage.set(KEYS.WEEKLY_STATS, rolled.weekly);
        }

        const goalEval = evaluateGoalCompletion(updated, goals);
        if (completedPhase === 'focus' && goalEval.focusGoalMet) {
          setGoalJustCompleted(true);
          setTimeout(() => setGoalJustCompleted(false), 2500);
          setStreak((prevStreak) => {
            const nextStreak = evaluateStreakWithFreeze(prevStreak, updated, goals);
            storage.set(KEYS.STREAK, nextStreak);
            return nextStreak;
          });
        }
        return updated;
      });
    },
    [goals, storage, weeklyStats]
  );

  // Derive Pomodoro countdown every 250ms from targetEndTimestamp (drift-free)
  useEffect(() => {
    if (!ready) return;
    const syncTick = () => {
      const now = Date.now();
      setRemainingSeconds(getRemainingSeconds(pomodoro, now));
      if (pomodoro.status === 'running') {
        const evalRes = evaluateTimer(pomodoro, now);
        if (evalRes.completedPhase) {
          setPomodoro(evalRes.nextState);
          storage.set(KEYS.POMODORO, evalRes.nextState);
          setRemainingSeconds(getRemainingSeconds(evalRes.nextState, now));
          handleCompletedPhase(evalRes.completedPhase, evalRes.minutesCompleted);
        }
      }
    };

    syncTick();
    if (pomodoro.status !== 'running') return;
    const id = setInterval(syncTick, 250);
    return () => clearInterval(id);
  }, [pomodoro, ready, storage, handleCompletedPhase]);

  // Actions: Profiles & Modes
  const toggleBuiltInPersona = useCallback(
    (id: BuiltInProfileId) => {
      const activating = !settings.builtInPersonas[id];
      updateSettings((prev) => ({
        ...prev,
        activeCustomProfileId: activating ? null : prev.activeCustomProfileId,
        builtInPersonas: { ...prev.builtInPersonas, [id]: activating },
      }));
      if (activating) {
        setTodayStats((prev) => {
          const next = recordModeActivation(prev, id);
          storage.set(KEYS.TODAY_STATS, next);
          return next;
        });
      }
    },
    [settings.builtInPersonas, storage, updateSettings]
  );

  const selectCustomProfile = useCallback(
    (profileId: string | null) => {
      updateSettings((prev) => ({
        ...prev,
        activeCustomProfileId: profileId,
        builtInPersonas: profileId ? { adhd: false, dyslexia: false, autism: false } : prev.builtInPersonas,
      }));
      if (profileId) {
        setTodayStats((prev) => {
          const next = recordModeActivation(prev, 'custom');
          storage.set(KEYS.TODAY_STATS, next);
          return next;
        });
      }
    },
    [storage, updateSettings]
  );

  const saveCustomProfile = useCallback(
    (profile: Profile) => {
      updateSettings((prev) => ({
        ...prev,
        customProfiles: [...prev.customProfiles.filter((p) => p.id !== profile.id), profile],
        activeCustomProfileId: profile.id,
        builtInPersonas: { adhd: false, dyslexia: false, autism: false },
      }));
    },
    [updateSettings]
  );

  const deleteCustomProfile = useCallback(
    (profileId: string) => {
      updateSettings((prev) => ({
        ...prev,
        customProfiles: prev.customProfiles.filter((p) => p.id !== profileId),
        activeCustomProfileId: prev.activeCustomProfileId === profileId ? null : prev.activeCustomProfileId,
      }));
    },
    [updateSettings]
  );

  // Actions: Tools
  const toggleTool = useCallback(
    (toolKey: keyof ToolsToggleState) => {
      updateSettings((prev) => {
        const nextVal = !prev.tools[toolKey];
        const nextTools = { ...prev.tools, [toolKey]: nextVal };
        if (nextVal && toolKey === 'tts' && prev.tools.readerView) {
          nextTools.readerView = false;
        }
        if (nextVal && toolKey === 'readerView' && prev.tools.tts) {
          nextTools.tts = false;
          tts.stop();
        }
        if (!nextVal && toolKey === 'tts') {
          tts.stop();
          setTtsActiveCharIndex(-1);
          setTtsActiveSentenceIndex(-1);
        }
        return { ...prev, tools: nextTools };
      });
    },
    [tts, updateSettings]
  );

  const startReadingAloud = useCallback(
    (fullText: string, sentences: string[]) => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }

      updateSettings((prev) => ({
        ...prev,
        tools: { ...prev.tools, tts: true, readerView: false },
      }));

      tts.speak(fullText, sentences, {
        rate: settings.ttsRate,
        voiceURI: settings.ttsVoiceURI || undefined,
        onWordBoundary: (idx) => setTtsActiveCharIndex(idx),
        onSentenceChange: (sIdx) => setTtsActiveSentenceIndex(sIdx),
        onEnd: () => {
          setTtsActiveCharIndex(-1);
          setTtsActiveSentenceIndex(-1);
          updateSettings((prev) => ({ ...prev, tools: { ...prev.tools, tts: false } }));
        },
        onError: () => {
          setTtsActiveCharIndex(-1);
          setTtsActiveSentenceIndex(-1);
          updateSettings((prev) => ({ ...prev, tools: { ...prev.tools, tts: false } }));
        },
      });

      if (settings.ttsSleepMinutes > 0) {
        sleepTimerRef.current = setTimeout(() => {
          tts.stop();
          setTtsActiveCharIndex(-1);
          setTtsActiveSentenceIndex(-1);
          updateSettings((prev) => ({ ...prev, tools: { ...prev.tools, tts: false } }));
        }, settings.ttsSleepMinutes * 60 * 1000);
      }
    },
    [settings.ttsRate, settings.ttsSleepMinutes, settings.ttsVoiceURI, tts, updateSettings]
  );

  const stopReadingAloud = useCallback(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    tts.stop();
    setTtsActiveCharIndex(-1);
    setTtsActiveSentenceIndex(-1);
    updateSettings((prev) => ({ ...prev, tools: { ...prev.tools, tts: false } }));
  }, [tts, updateSettings]);

  // Actions: Pomodoro
  const startTimerAction = useCallback(() => {
    setPomodoro((prev) => {
      const next = startOrResumeTimer(prev, Date.now());
      storage.set(KEYS.POMODORO, next);
      return next;
    });
  }, [storage]);

  const pauseTimerAction = useCallback(() => {
    setPomodoro((prev) => {
      const next = pauseTimer(prev, Date.now());
      storage.set(KEYS.POMODORO, next);
      return next;
    });
  }, [storage]);

  const resetTimerAction = useCallback(() => {
    setPomodoro((prev) => {
      const next = resetTimer(prev);
      storage.set(KEYS.POMODORO, next);
      return next;
    });
  }, [storage]);

  const skipTimerPhaseAction = useCallback(() => {
    setPomodoro((prev) => {
      const res = completeCurrentPhase(prev);
      storage.set(KEYS.POMODORO, res.nextState);
      if (res.completedPhase) {
        handleCompletedPhase(res.completedPhase, res.minutesCompleted);
      }
      return res.nextState;
    });
  }, [handleCompletedPhase, storage]);

  const setTimerDurationAction = useCallback(
    (minutes: number) => {
      setPomodoro((prev) => {
        const next = setFocusDuration(prev, minutes);
        storage.set(KEYS.POMODORO, next);
        return next;
      });
    },
    [storage]
  );

  // Actions: Goals
  const updateGoals = useCallback(
    (partial: Partial<GoalConfig>) => {
      setGoalsState((prev) => {
        const next = { ...prev, ...partial };
        storage.set(KEYS.GOALS, next);
        return next;
      });
    },
    [storage]
  );

  // Actions: License
  const activateLicenseKey = useCallback(
    async (rawKey: string): Promise<LicenseVerificationResult> => {
      const res = verifyLicenseKey(rawKey, formatISODate());
      setLicenseKey(rawKey.trim());
      setLicenseResult(res);
      if (res.valid) {
        await license.saveKey(rawKey.trim());
      }
      return res;
    },
    [license]
  );

  const clearLicense = useCallback(async () => {
    await license.clearKey();
    setLicenseKey('');
    setLicenseResult({ valid: false, tier: 'free' });
  }, [license]);

  const canUse = useCallback(
    (capability: CapabilityKey): boolean => hasCapability(licenseResult.tier, capability),
    [licenseResult.tier]
  );

  // Actions: Export / Import
  const exportJSON = useCallback(() => {
    const json = buildExportBundle({
      goals,
      streak,
      todayStats,
      weeklyStats,
      settings: settings as unknown as Record<string, unknown>,
    });
    exporter.downloadTextFile(`assistivereader-backup-${formatISODate()}.json`, json, 'application/json');
  }, [exporter, goals, settings, streak, todayStats, weeklyStats]);

  const exportCSV = useCallback(() => {
    const allDays = [...weeklyStats.filter((d) => d.date !== todayStats.date), todayStats].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const csv = exportStatsToCSV(allDays);
    exporter.downloadTextFile(`assistivereader-stats-${formatISODate()}.csv`, csv, 'text/csv');
  }, [exporter, todayStats, weeklyStats]);

  const importJSON = useCallback(
    (rawJson: string): { ok: boolean; message: string } => {
      const res = parseImportedBundle(rawJson);
      if (!res.valid || !res.bundle) {
        return { ok: false, message: res.error || 'Import failed.' };
      }
      setGoalsState(res.bundle.goals);
      storage.set(KEYS.GOALS, res.bundle.goals);

      if (res.bundle.streak) {
        setStreak({ ...DEFAULT_STREAK, ...res.bundle.streak });
        storage.set(KEYS.STREAK, res.bundle.streak);
      }

      const importedSettings = res.bundle.settings as Partial<PersistedSettings>;
      updateSettings((prev) => ({
        ...prev,
        ...importedSettings,
        tools: { ...prev.tools, ...(importedSettings.tools || {}), tts: false },
      }));
      return { ok: true, message: 'Settings and goals imported locally.' };
    },
    [storage, updateSettings]
  );

  // Actions: Documents
  const activeDocument = useMemo(
    () => documents.find((d) => d.id === activeDocId) || documents[0],
    [activeDocId, documents]
  );

  const addCustomDocument = useCallback(
    (doc: ReaderDocument) => {
      setDocuments([...SAMPLE_DOCUMENTS, doc]);
      setActiveDocId(doc.id);
      storage.set(KEYS.CUSTOM_DOC, doc);
    },
    [storage]
  );

  // Compute resolved active profile (for reader styling)
  const resolvedProfile: Profile | null = useMemo(() => {
    if (settings.activeCustomProfileId) {
      return settings.customProfiles.find((p) => p.id === settings.activeCustomProfileId) || null;
    }
    if (settings.builtInPersonas.dyslexia) return BUILT_IN_PROFILES.dyslexia;
    if (settings.builtInPersonas.autism) return BUILT_IN_PROFILES.autism;
    if (settings.builtInPersonas.adhd) return BUILT_IN_PROFILES.adhd;
    return null;
  }, [settings.activeCustomProfileId, settings.builtInPersonas, settings.customProfiles]);

  return {
    ready,
    settings,
    updateSettings,
    resolvedProfile,
    pomodoro,
    remainingSeconds,
    todayStats,
    weeklyStats,
    goals,
    streak,
    goalJustCompleted,
    licenseKey,
    licenseResult,
    canUse,
    activateLicenseKey,
    clearLicense,
    documents,
    activeDocument,
    setActiveDocId,
    addCustomDocument,
    voiceStatus,
    ttsActiveCharIndex,
    ttsActiveSentenceIndex,
    toggleBuiltInPersona,
    selectCustomProfile,
    saveCustomProfile,
    deleteCustomProfile,
    toggleTool,
    startReadingAloud,
    stopReadingAloud,
    startTimerAction,
    pauseTimerAction,
    resetTimerAction,
    skipTimerPhaseAction,
    setTimerDurationAction,
    updateGoals,
    exportJSON,
    exportCSV,
    importJSON,
  };
}

export type AssistiveStore = ReturnType<typeof useAssistiveStore>;
