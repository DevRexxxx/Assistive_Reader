/**
 * Pure TypeScript RFC 8032 Ed25519 Signature Verification + SHA-512
 * Zero external dependencies, zero network, zero DOM, zero Node-specific APIs.
 * Runs identically in Node.js, Browsers, Web Workers, Chrome Extensions, and React Native.
 */

// ─── SHA-512 (RFC 6234) ──────────────────────────────────────────────────────

const K_SHA512 = new BigUint64Array([
  0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbbcn,
  0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
  0xd807aa98a3030242n, 0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
  0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n, 0xc19bf174cf692694n,
  0xe49b69c19ef14ad2n, 0xefbe4786384f25e3n, 0x0fc19dc68b8cd5b5n, 0x240ca1cc77ac9c65n,
  0x2de92c6f592b0275n, 0x4a7484aa6ea6e483n, 0x5cb0a9dcbd41fbd4n, 0x76f988da831153b5n,
  0x983e5152ee66dfabn, 0xa831c66d2db43210n, 0xb00327c898fb213fn, 0xbf597fc7beef0ee4n,
  0xc6e00bf33da88fc2n, 0xd5a79147930aa725n, 0x06ca6351e003826fn, 0x142929670a0e6e70n,
  0x27b70a8546d22ffcn, 0x2e1b21385c26c926n, 0x4d2c6dfc5ac42aedn, 0x53380d139d95b3dfn,
  0x650a73548baf63den, 0x766a0abb3c77b2a8n, 0x81c2c92e47edaee6n, 0x92722c851482353bn,
  0xa2bfe8a14cf10364n, 0xa81a664bbc423001n, 0xc24b8b70d0f89791n, 0xc76c51a30654be30n,
  0xd192e819d6ef5218n, 0xd69906245565a910n, 0xf40e35855771202an, 0x106aa07032bbd1b8n,
  0x19a4c116b8d2d0c8n, 0x1e376c085141ab53n, 0x2748774cdf8eeb99n, 0x34b0bcb5e19b48a8n,
  0x391c0cb3c5c95a63n, 0x4ed8aa4ae3418acbn, 0x5b9cca4f7763e373n, 0x682e6ff3d6b2b8a3n,
  0x748f82ee5defb2fcn, 0x78a5636f43172f60n, 0x84c87814a1f0ab72n, 0x8cc702081a6439ecn,
  0x90befffa23631e28n, 0xa4506cebde82bde9n, 0xbef9a3f7b2c67915n, 0xc67178f2e372532bn,
  0xca273eceea26619cn, 0xd186b8c721c0c207n, 0xeada7dd6cde0eb1en, 0xf57d4f7fee6ed178n,
  0x06f067aa72176fban, 0x0a637dc5a2c898a6n, 0x113f9804bef90daen, 0x1b710b35131c471bn,
  0x28db77f523047d84n, 0x32caab7b40c72493n, 0x3c9ebe0a15c9bebcn, 0x431d67c49c100d4cn,
  0x4cc5d4becb3e42b6n, 0x597f299cfc657e2an, 0x5fcb6fab3ad6faecn, 0x6c44198c4a475817n,
]);

const H0_SHA512 = new BigUint64Array([
  0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
]);

const MASK64 = 0xffffffffffffffffn;

function rotr64(x: bigint, n: bigint): bigint {
  return ((x >> n) | (x << (64n - n))) & MASK64;
}

export function sha512(data: Uint8Array): Uint8Array {
  const bitLen = BigInt(data.length) * 8n;
  // Pad: data + 0x80 + zeros + 16-byte big-endian bit length -> multiple of 128
  const totalLen = Math.ceil((data.length + 17) / 128) * 128;
  const padded = new Uint8Array(totalLen);
  padded.set(data, 0);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setBigUint64(totalLen - 16, bitLen >> 64n, false);
  view.setBigUint64(totalLen - 8, bitLen & MASK64, false);

  const H = new BigUint64Array(H0_SHA512);
  const W = new BigUint64Array(80);

  for (let offset = 0; offset < totalLen; offset += 128) {
    for (let i = 0; i < 16; i++) {
      W[i] = view.getBigUint64(offset + i * 8, false);
    }
    for (let i = 16; i < 80; i++) {
      const s0 = rotr64(W[i - 15], 1n) ^ rotr64(W[i - 15], 8n) ^ (W[i - 15] >> 7n);
      const s1 = rotr64(W[i - 2], 19n) ^ rotr64(W[i - 2], 61n) ^ (W[i - 2] >> 6n);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) & MASK64;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 80; i++) {
      const S1 = rotr64(e, 14n) ^ rotr64(e, 18n) ^ rotr64(e, 41n);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K_SHA512[i] + W[i]) & MASK64;
      const S0 = rotr64(a, 28n) ^ rotr64(a, 34n) ^ rotr64(a, 39n);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) & MASK64;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) & MASK64;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) & MASK64;
    }

    H[0] = (H[0] + a) & MASK64;
    H[1] = (H[1] + b) & MASK64;
    H[2] = (H[2] + c) & MASK64;
    H[3] = (H[3] + d) & MASK64;
    H[4] = (H[4] + e) & MASK64;
    H[5] = (H[5] + f) & MASK64;
    H[6] = (H[6] + g) & MASK64;
    H[7] = (H[7] + h) & MASK64;
  }

  const out = new Uint8Array(64);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) {
    outView.setBigUint64(i * 8, H[i], false);
  }
  return out;
}

// ─── Ed25519 Curve Math (RFC 8032) ───────────────────────────────────────────

const P = 2n ** 255n - 19n;
const L = 2n ** 252n + 27742317777372353535851937790883648493n;

function mod(a: bigint, m: bigint = P): bigint {
  const res = a % m;
  return res >= 0n ? res : res + m;
}

function powMod(base: bigint, exp: bigint, m: bigint): bigint {
  let result = 1n;
  let b = mod(base, m);
  let e = exp;
  while (e > 0n) {
    if ((e & 1n) === 1n) result = (result * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return result;
}

function invMod(a: bigint): bigint {
  return powMod(a, P - 2n, P);
}

// d = -121665 / 121666 mod p
const D = mod(-121665n * invMod(121666n));
// sqrt(-1) mod p = 2^((p-1)/4) mod p
const SQRT_M1 = powMod(2n, (P - 1n) / 4n, P);

// Base point B
const BY = mod(4n * invMod(5n));
const BX = 15112221349535400772501151409588531511454012693041857206046113283949847762202n;

interface ExtPoint {
  X: bigint;
  Y: bigint;
  Z: bigint;
  T: bigint;
}

const ZERO_POINT: ExtPoint = { X: 0n, Y: 1n, Z: 1n, T: 0n };
const BASE_POINT: ExtPoint = { X: BX, Y: BY, Z: 1n, T: mod(BX * BY) };

function pointAdd(p1: ExtPoint, p2: ExtPoint): ExtPoint {
  const A = mod((p1.Y - p1.X) * (p2.Y - p2.X));
  const B = mod((p1.Y + p1.X) * (p2.Y + p2.X));
  const C = mod(2n * p1.T * p2.T * D);
  const D2 = mod(2n * p1.Z * p2.Z);
  const E = mod(B - A);
  const F = mod(D2 - C);
  const G = mod(D2 + C);
  const H = mod(B + A);
  return {
    X: mod(E * F),
    Y: mod(G * H),
    Z: mod(F * G),
    T: mod(E * H),
  };
}

function scalarMult(point: ExtPoint, scalar: bigint): ExtPoint {
  let acc = ZERO_POINT;
  let cur = point;
  let k = scalar;
  while (k > 0n) {
    if ((k & 1n) === 1n) acc = pointAdd(acc, cur);
    cur = pointAdd(cur, cur);
    k >>= 1n;
  }
  return acc;
}

function pointsEqual(p1: ExtPoint, p2: ExtPoint): boolean {
  const x1 = mod(p1.X * p2.Z);
  const x2 = mod(p2.X * p1.Z);
  const y1 = mod(p1.Y * p2.Z);
  const y2 = mod(p2.Y * p1.Z);
  return x1 === x2 && y1 === y2;
}

function bytesToBigIntLE(bytes: Uint8Array): bigint {
  let acc = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    acc = (acc << 8n) | BigInt(bytes[i]);
  }
  return acc;
}

function decodePoint(bytes: Uint8Array): ExtPoint | null {
  if (bytes.length !== 32) return null;
  const copy = new Uint8Array(bytes);
  const sign = (copy[31] >> 7) & 1;
  copy[31] &= 0x7f;
  const y = bytesToBigIntLE(copy);
  if (y >= P) return null;

  const y2 = mod(y * y);
  const u = mod(y2 - 1n);
  const v = mod(D * y2 + 1n);
  const v3 = mod(v * v * v);
  const v7 = mod(v3 * v3 * v);
  // x = u * v^3 * (u * v^7)^((p - 5) / 8) mod p
  let x = mod(u * v3 * powMod(mod(u * v7), (P - 5n) / 8n, P));

  const vx2 = mod(v * x * x);
  if (vx2 !== u) {
    if (vx2 === mod(-u)) {
      x = mod(x * SQRT_M1);
    } else {
      return null;
    }
  }

  if (x === 0n && sign === 1) return null;
  if (Number(x & 1n) !== sign) {
    x = mod(P - x);
  }

  return { X: x, Y: y, Z: 1n, T: mod(x * y) };
}

export function verifyEd25519(
  publicKey: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array
): boolean {
  if (publicKey.length !== 32 || signature.length !== 64) return false;

  const A = decodePoint(publicKey);
  if (!A) return false;

  const Rbytes = signature.slice(0, 32);
  const R = decodePoint(Rbytes);
  if (!R) return false;

  const S = bytesToBigIntLE(signature.slice(32, 64));
  if (S >= L) return false;

  const input = new Uint8Array(32 + 32 + message.length);
  input.set(Rbytes, 0);
  input.set(publicKey, 32);
  input.set(message, 64);

  const h = mod(bytesToBigIntLE(sha512(input)), L);

  const lhs = scalarMult(BASE_POINT, S);
  const rhs = pointAdd(R, scalarMult(A, h));

  return pointsEqual(lhs, rhs);
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase();
  if (clean.length % 2 !== 0 || !/^[0-9a-f]*$/.test(clean)) {
    throw new Error('Invalid hex string');
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function base64UrlToBytes(b64u: string): Uint8Array {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const full = b64 + pad;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];
  for (let i = 0; i < full.length; i += 4) {
    const c0 = chars.indexOf(full[i]);
    const c1 = chars.indexOf(full[i + 1]);
    const c2 = full[i + 2] === '=' ? -1 : chars.indexOf(full[i + 2]);
    const c3 = full[i + 3] === '=' ? -1 : chars.indexOf(full[i + 3]);
    if (c0 < 0 || c1 < 0) throw new Error('Invalid base64url');
    bytes.push((c0 << 2) | (c1 >> 4));
    if (c2 >= 0) bytes.push(((c1 & 0x0f) << 4) | (c2 >> 2));
    if (c3 >= 0) bytes.push(((c2 & 0x03) << 6) | c3);
  }
  return new Uint8Array(bytes);
}
