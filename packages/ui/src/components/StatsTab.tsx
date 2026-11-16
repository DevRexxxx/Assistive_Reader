import React, { useRef, useState } from 'react';
import { addDays, formatISODate } from '@assistivereader/core';
import type { AssistiveStore } from '../state/useAssistiveStore';

interface StatsTabProps {
  store: AssistiveStore;
  onOpenLicense: () => void;
}

export function StatsTab({ store, onOpenLicense }: StatsTabProps) {
  const { todayStats, weeklyStats, exportCSV, exportJSON, importJSON, canUse } = store;
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canExport = canUse('statsExportAndImport');

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const todayISO = formatISODate();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartDays = Array.from({ length: 7 }, (_, idx) => {
    const iso = addDays(todayISO, -(6 - idx));
    const dt = new Date(`${iso}T00:00:00Z`);
    const found = iso === todayStats.date ? todayStats : weeklyStats.find((w) => w.date === iso);
    return {
      iso,
      label: dayNames[dt.getUTCDay()],
      minutes: found?.focusMinutes || 0,
      isToday: idx === 6,
    };
  });

  const chartMax = Math.max(...chartDays.map((d) => d.minutes), 1);
  const totalModesCount = Object.values(todayStats.modesActivated).reduce((a, b) => a + b, 0);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = importJSON(text);
      setImportStatus({ ok: res.ok, msg: res.message });
    } catch {
      setImportStatus({ ok: false, msg: 'Could not read selected file.' });
    }
    e.target.value = '';
  };

  return (
    <div className="animate-fade-in space-y-5">
      <section aria-labelledby="today-activity-heading">
        <h2 id="today-activity-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          Today’s Activity (Local Only)
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="glass-card rounded-xl p-3.5 text-center border border-slate-200">
            <div className="text-xl mb-0.5" aria-hidden="true">🧠</div>
            <div className="text-xl font-bold text-indigo-700">{formatDuration(todayStats.focusMinutes)}</div>
            <div className="text-xs text-slate-600 mt-0.5">Focus Time</div>
          </div>
          <div className="glass-card rounded-xl p-3.5 text-center border border-slate-200">
            <div className="text-xl mb-0.5" aria-hidden="true">🍅</div>
            <div className="text-xl font-bold text-emerald-700">{todayStats.sessionsCompleted}</div>
            <div className="text-xs text-slate-600 mt-0.5">Pomodoros</div>
          </div>
          <div className="glass-card rounded-xl p-3.5 text-center border border-slate-200">
            <div className="text-xl mb-0.5" aria-hidden="true">☕</div>
            <div className="text-xl font-bold text-violet-700">{formatDuration(todayStats.breakMinutes)}</div>
            <div className="text-xs text-slate-600 mt-0.5">Break Time</div>
          </div>
          <div className="glass-card rounded-xl p-3.5 text-center border border-slate-200">
            <div className="text-xl mb-0.5" aria-hidden="true">🎨</div>
            <div className="text-xl font-bold text-amber-700">{totalModesCount}</div>
            <div className="text-xs text-slate-600 mt-0.5">Modes Used</div>
          </div>
        </div>
      </section>

      <section aria-labelledby="weekly-focus-heading">
        <h2 id="weekly-focus-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          Weekly Focus
        </h2>
        <div className="glass-card rounded-xl p-4 border border-slate-200">
          <div className="flex items-end gap-1.5 justify-between" style={{ height: '120px' }}>
            {chartDays.map((day) => (
              <div key={day.iso} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[10px] text-slate-500 font-medium">
                  {day.minutes > 0 ? formatDuration(day.minutes) : ''}
                </span>
                <div
                  className={`w-full rounded-t-md stat-bar ${
                    day.isToday
                      ? 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                      : 'bg-gradient-to-t from-slate-300 to-slate-200'
                  }`}
                  style={{
                    height: `${Math.max((day.minutes / chartMax) * 80, 4)}px`,
                    minHeight: '4px',
                  }}
                />
                <span className={`text-[10px] font-medium ${day.isToday ? 'text-indigo-700 font-bold' : 'text-slate-500'}`}>
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {Object.keys(todayStats.modesActivated).length > 0 && (
        <section aria-labelledby="mode-usage-heading">
          <h2 id="mode-usage-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Mode Usage Today
          </h2>
          <div className="glass-card rounded-xl p-4 border border-slate-200 space-y-2.5">
            {Object.entries(todayStats.modesActivated).map(([mode, count]) => {
              const pct = totalModesCount > 0 ? (count / totalModesCount) * 100 : 0;
              return (
                <div key={mode}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 capitalize">{mode}</span>
                    <span className="text-slate-500">{count}×</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Local Export & Import */}
      <section aria-labelledby="export-heading" className="glass-card rounded-xl p-4 border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 id="export-heading" className="text-xs font-semibold text-slate-800">
            Local Backup & Export
          </h2>
          {!canExport && (
            <button
              type="button"
              onClick={onOpenLicense}
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800"
            >
              Pro
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          Save your settings, profiles, and stats locally as JSON or CSV files. Nothing is sent online.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={canExport ? exportJSON : onOpenLicense}
            className="py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={canExport ? exportCSV : onOpenLicense}
            className="py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            Export CSV
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFile}
          className="hidden"
          aria-label="Import AssistiveReader JSON settings file"
        />
        <button
          type="button"
          onClick={() => (canExport ? fileInputRef.current?.click() : onOpenLicense())}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Import Backup JSON File
        </button>

        {importStatus && (
          <div
            role="status"
            className={`text-xs p-2 rounded-lg ${
              importStatus.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {importStatus.msg}
          </div>
        )}
      </section>
    </div>
  );
}
