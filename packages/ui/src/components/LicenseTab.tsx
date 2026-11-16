import React, { useState } from 'react';
import { CAPABILITY_MAP, type CapabilityKey } from '@assistivereader/core';
import type { AssistiveStore } from '../state/useAssistiveStore';

interface LicenseTabProps {
  store: AssistiveStore;
}

// Pre-signed public demo Pro key (verified offline via Ed25519; tampering fails immediately)
const SIGNED_DEMO_PRO_KEY =
  'AR1.eyJ0aWVyIjoicHJvIiwic2VhdHMiOjEsImlzc3VlZFRvIjoiTG9jYWwgRGVtbyBFdmFsdWF0b3IiLCJleHBpcnkiOiIyMDI5LTEyLTMxIn0.ul6KABy-K23uSuW0nTjjv-BmZ8C_kIxio-cRZc2fds8phmdGiDfmyUT3r2aUm-wO4b3od2GG-n3jdLfOKAPmCg';

export function LicenseTab({ store }: LicenseTabProps) {
  const { licenseKey, licenseResult, activateLicenseKey, clearLicense } = store;
  const [inputKey, setInputKey] = useState(licenseKey);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleVerify = async (keyToTest: string) => {
    const res = await activateLicenseKey(keyToTest);
    if (res.valid) {
      setFeedback({
        ok: true,
        msg: `Verified offline! Unlocked ${res.tier.toUpperCase()} tier (${res.payload?.seats || 1} seat${
          (res.payload?.seats || 1) > 1 ? 's' : ''
        }).`,
      });
    } else {
      setFeedback({
        ok: false,
        msg: res.reason || 'License key invalid. Active tier remains Free.',
      });
    }
  };

  const capabilities = Object.entries(CAPABILITY_MAP) as Array<
    [CapabilityKey, (typeof CAPABILITY_MAP)[CapabilityKey]]
  >;

  return (
    <div className="animate-fade-in space-y-4">
      {/* Current Tier Card */}
      <div className="glass-card rounded-xl p-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active License</div>
            <div className="text-lg font-extrabold text-slate-900 uppercase mt-0.5">
              {licenseResult.tier} Tier
            </div>
            {licenseResult.valid && licenseResult.payload?.issuedTo && (
              <div className="text-xs text-slate-600 mt-0.5">
                Issued to: <strong>{licenseResult.payload.issuedTo}</strong>
                {licenseResult.payload.expiry ? ` · Expires ${licenseResult.payload.expiry}` : ''}
              </div>
            )}
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              licenseResult.valid
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {licenseResult.valid ? 'Ed25519 Verified' : 'Free Forever'}
          </span>
        </div>
      </div>

      {/* Offline Key Entry */}
      <div className="glass-card rounded-xl p-4 border border-slate-200 space-y-2.5">
        <label htmlFor="license-key-input" className="block text-xs font-semibold text-slate-800">
          Offline Signed License Key (No Phone-Home)
        </label>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Keys are verified locally using an embedded Ed25519 public key. Zero network requests are sent.
        </p>
        <textarea
          id="license-key-input"
          rows={3}
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="AR1.<payload>.<signature>"
          className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-[11px] font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleVerify(inputKey)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Verify Offline
          </button>
          {licenseResult.valid && (
            <button
              type="button"
              onClick={async () => {
                await clearLicense();
                setInputKey('');
                setFeedback({ ok: true, msg: 'License cleared. Reverted to Free tier.' });
              }}
              className="py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            >
              Reset to Free
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setInputKey(SIGNED_DEMO_PRO_KEY);
            handleVerify(SIGNED_DEMO_PRO_KEY);
          }}
          className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          ✨ Load & Verify Signed Demo Pro Key
        </button>

        {feedback && (
          <div
            role="status"
            className={`p-2.5 rounded-lg text-xs border ${
              feedback.ok
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {feedback.msg}
          </div>
        )}
      </div>

      {/* Capability Map */}
      <div className="glass-card rounded-xl p-4 border border-slate-200">
        <h3 className="text-xs font-semibold text-slate-800 mb-2.5">Free vs Pro Capability Map</h3>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {capabilities.map(([key, info]) => {
            const isFree = info.minTier === 'free';
            const unlocked = isFree || licenseResult.valid;
            return (
              <div
                key={key}
                className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 text-xs"
              >
                <div className="pr-2">
                  <div className="font-medium text-slate-800">{info.label}</div>
                  <div className="text-[10px] text-slate-500">{info.description}</div>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    unlocked
                      ? isFree
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {unlocked ? (isFree ? 'Free' : 'Unlocked') : 'Pro'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy & Non-Medical Promise */}
      <div className="rounded-xl p-3.5 bg-slate-100 border border-slate-200 text-[11px] text-slate-700 space-y-1.5 leading-relaxed">
        <div className="font-bold text-slate-900">Privacy & Evidence Notice</div>
        <p>
          <strong>Zero AI & Zero Network:</strong> Every feature uses deterministic local rules, bundled fonts, and
          in-app data. Turn off Wi-Fi or inspect DevTools Network—no data leaves your device.
        </p>
        <p>
          <strong>Customizable Support:</strong> AssistiveReader provides customizable reading support options to try;
          it is not a medical device and does not diagnose, treat, or cure any condition.
        </p>
      </div>
    </div>
  );
}
