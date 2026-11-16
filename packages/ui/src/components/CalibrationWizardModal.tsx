import React, { useEffect } from 'react';
import type { Profile } from '@assistivereader/core';
import { CalibrationWizard } from './CalibrationWizard';

interface CalibrationWizardModalProps {
  open: boolean;
  onClose: () => void;
  onSaveProfile: (profile: Profile) => void;
}

export function CalibrationWizardModal({ open, onClose, onSaveProfile }: CalibrationWizardModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calibration-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6">
        <CalibrationWizard
          onCancel={onClose}
          onSaveProfile={(profile) => {
            onSaveProfile(profile);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
