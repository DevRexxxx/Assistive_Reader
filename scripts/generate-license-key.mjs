#!/usr/bin/env node
/**
 * PRIVATE CLI TOOL — Offline License Key Generator (NOT bundled into apps)
 *
 * Usage:
 *   node scripts/generate-license-key.mjs --tier pro --seats 1 --issuedTo "Local Evaluation"
 */

import crypto from 'node:crypto';

// Private seed matching EMBEDDED_PUBLIC_KEY_HEX in packages/core/src/license/index.ts.
// In production, supply via ASSISTIVE_LICENSE_PRIVATE_SEED env var rather than committing a prod seed.
const DEV_SEED_HEX =
  process.env.ASSISTIVE_LICENSE_PRIVATE_SEED ||
  'a74a234f0744c835b727c009a532c5720ad775f84f5b08f4a847cc473298d819';

function createEd25519PrivateKeyFromSeed(seedHex) {
  const seed = Buffer.from(seedHex, 'hex');
  // PKCS#8 ASN.1 prefix for 32-byte Ed25519 private key
  const pkcs8Prefix = Buffer.from('302e020100300506032b657004220420', 'hex');
  const der = Buffer.concat([pkcs8Prefix, seed]);
  return crypto.createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
}

export function signLicensePayload(payload, seedHex = DEV_SEED_HEX) {
  const privateKey = createEd25519PrivateKeyFromSeed(seedHex);
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signingInput = Buffer.from(`AR1.${payloadB64}`, 'utf8');
  const signature = crypto.sign(null, signingInput, privateKey);
  return `AR1.${payloadB64}.${signature.toString('base64url')}`;
}

// Run as CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const getArg = (flag, fallback) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
  };

  const tier = getArg('--tier', 'pro');
  const seats = Number(getArg('--seats', '1'));
  const issuedTo = getArg('--issuedTo', 'Offline Evaluator');
  const expiry = getArg('--expiry', undefined);

  const payload = { tier, seats, issuedTo, ...(expiry ? { expiry } : {}) };
  const key = signLicensePayload(payload);
  console.log(key);
}
