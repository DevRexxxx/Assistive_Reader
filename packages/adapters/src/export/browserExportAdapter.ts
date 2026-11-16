import { verifyLicenseKey, type LicenseVerificationResult } from '@assistivereader/core';
import type { ExportAdapter, LicenseAdapter, StorageAdapter } from '../types';

export class BrowserExportAdapter implements ExportAdapter {
  downloadTextFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

const LICENSE_STORAGE_KEY = 'ar_offline_license_key';

export class LocalLicenseAdapter implements LicenseAdapter {
  constructor(private readonly storage: StorageAdapter) {}

  async loadKey(): Promise<string> {
    return this.storage.get<string>(LICENSE_STORAGE_KEY, '');
  }

  async saveKey(key: string): Promise<void> {
    await this.storage.set(LICENSE_STORAGE_KEY, key.trim());
  }

  async clearKey(): Promise<void> {
    await this.storage.set(LICENSE_STORAGE_KEY, '');
  }

  verify(key: string): LicenseVerificationResult {
    return verifyLicenseKey(key);
  }
}
