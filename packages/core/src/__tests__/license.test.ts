import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyLicenseKey, hasCapability } from '../index';
import { signLicensePayload } from '../../../../scripts/generate-license-key.mjs';

test('valid signed Pro license key verifies offline and unlocks Pro capabilities', () => {
  const key = signLicensePayload({
    tier: 'pro',
    seats: 1,
    issuedTo: 'Unit Test User',
    expiry: '2099-12-31',
  });

  const result = verifyLicenseKey(key, '2026-11-16');
  assert.equal(result.valid, true);
  assert.equal(result.tier, 'pro');
  assert.equal(result.payload?.issuedTo, 'Unit Test User');

  assert.equal(hasCapability('free', 'bionicReading'), true);
  assert.equal(hasCapability('free', 'syllableSplitting'), false);
  assert.equal(hasCapability('pro', 'syllableSplitting'), true);
  assert.equal(hasCapability('pro', 'offlineDictionary'), true);
});

test('tampered license key fails verification and downgrades to free', () => {
  const key = signLicensePayload({
    tier: 'pro',
    seats: 1,
    issuedTo: 'Legit Buyer',
  });

  const parts = key.split('.');
  // Tamper with payload to escalate to education with 500 seats
  const tamperedPayload = Buffer.from(
    JSON.stringify({ tier: 'education', seats: 500, issuedTo: 'Attacker' }),
    'utf8'
  ).toString('base64url');
  const tamperedKey = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

  const result = verifyLicenseKey(tamperedKey, '2026-11-16');
  assert.equal(result.valid, false);
  assert.equal(result.tier, 'free');
});

test('expired license key downgrades gracefully to free', () => {
  const key = signLicensePayload({
    tier: 'family',
    seats: 5,
    expiry: '2025-01-01',
  });

  const result = verifyLicenseKey(key, '2026-11-16');
  assert.equal(result.valid, false);
  assert.equal(result.tier, 'free');
  assert.ok(result.reason?.includes('expired'));
});
