import { LicenseData, LicensePayload, LicenseType } from '../types';

// App offline secret key used for signing & verification
const APP_SIGNING_SECRET = 'YIGA_LEARNING_PLATFORM_KEY_2026_RSA_SHA256_SECRET'; 

/**
 * Generate or retrieve stable Device ID
 */
export function getOrCreateDeviceId(): string {
  const STORAGE_KEY = 'yiga_device_id';  // 原來是 'oktp_device_id'
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    const randomHex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1).toUpperCase();
    deviceId = `DEV-${randomHex()}${randomHex()}-${randomHex()}-${randomHex()}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Simple hash algorithm for generating signatures offline
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const positiveHash = Math.abs(hash).toString(16).toUpperCase();
  return positiveHash.padStart(8, '0');
}

/**
 * Generate digital signature for payload
 */
export function signPayload(payload: LicensePayload): string {
  const canonicalString = `${payload.licenseId}|${payload.deviceId}|${payload.licenseType}|${payload.issuedAt}|${payload.expiresAt}|${payload.version}|${APP_SIGNING_SECRET}`;
  const sigPart1 = simpleHash(canonicalString);
  const sigPart2 = simpleHash(canonicalString.split('').reverse().join(''));
  return `SIG-${sigPart1}-${sigPart2}`;
}

/**
 * Create a full License Key string from parameters (Admin tool)
 */
export function generateLicenseKey(
  deviceId: string,
  licenseType: LicenseType,
  durationMonths: number,
  holderName?: string
): { key: string; payload: LicensePayload } {
  const now = new Date();
  const issuedAt = now.toISOString();
  
  // VIP = No Expiry (e.g., 100 years from now)
  const expiry = new Date(now);
  if (licenseType === 'VIP') {
    expiry.setFullYear(expiry.getFullYear() + 100);
  } else {
    expiry.setMonth(expiry.getMonth() + durationMonths);
  }
  const expiresAt = expiry.toISOString();

  const licenseId = `LIC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const payload: LicensePayload = {
    licenseId,
    deviceId,
    licenseType,
    issuedAt,
    expiresAt,
    version: 1,
    holderName: holderName || (licenseType === 'ADMIN' ? 'Administrator' : 'Standard Learner'),
  };

  const payloadBase64 = btoa(JSON.stringify(payload));
  const signature = signPayload(payload);
  const key = `${payloadBase64}.${signature}`;

  return { key, payload };
}

/**
 * Hardcoded Master Keys for Admin & User activation
 */
export const HARDCODED_MASTER_KEYS = {
  ADMIN: 'YIGA-ZYADMIN-MASTER-2026-KEY',
  USER: 'YIGA-ZYUSER-MASTER-2026-KEY',
};

/**
 * Verify license key offline
 */
export function verifyLicenseKey(
  keyString: string,
  currentDeviceId: string,
  clockWatermark: number
): { isValid: boolean; payload?: LicensePayload; errorReason?: string; isExpired?: boolean; isInGracePeriod?: boolean; daysRemaining?: number } {
  if (!keyString) {
    return { isValid: false, errorReason: 'Invalid License Key format' };
  }

  const trimmedKey = keyString.trim();

  // Check Hardcoded Master Admin Key
  if (trimmedKey === HARDCODED_MASTER_KEYS.ADMIN) {
    const masterAdminPayload: LicensePayload = {
      licenseId: 'LIC-YIGA-ADMIN-MASTER-2026',
      deviceId: currentDeviceId,
      licenseType: 'ADMIN',
      issuedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2099-12-31T23:59:59.000Z',
      version: 1,
      holderName: 'Master Administrator (YiGa)',
    };
    return {
      isValid: true,
      isExpired: false,
      isInGracePeriod: false,
      daysRemaining: 26800,
      payload: masterAdminPayload,
    };
  }

  // Check Hardcoded Master User Key
  if (trimmedKey === HARDCODED_MASTER_KEYS.USER) {
    const masterUserPayload: LicensePayload = {
      licenseId: 'LIC-YIGA-USER-MASTER-2026',
      deviceId: currentDeviceId,
      licenseType: 'USER',
      issuedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2099-12-31T23:59:59.000Z',
      version: 1,
      holderName: 'YiGa Learner Account',
    };
    return {
      isValid: true,
      isExpired: false,
      isInGracePeriod: false,
      daysRemaining: 26800,
      payload: masterUserPayload,
    };
  }

  if (!trimmedKey.includes('.')) {
    return { isValid: false, errorReason: 'Invalid License Key format' };
  }

  const parts = keyString.trim().split('.');
  if (parts.length !== 2) {
    return { isValid: false, errorReason: 'Malformed License Key' };
  }

  const [payloadBase64, signature] = parts;

  let payload: LicensePayload;
  try {
    const decoded = atob(payloadBase64);
    payload = JSON.parse(decoded);
  } catch (e) {
    return { isValid: false, errorReason: 'Cannot decode License payload' };
  }

  // 1. Verify Digital Signature
  const expectedSignature = signPayload(payload);
  if (signature !== expectedSignature) {
    return { isValid: false, errorReason: 'Digital signature validation failed (Tampered License Key)' };
  }

  // 2. Verify Device ID binding
  if (payload.deviceId !== currentDeviceId) {
    return {
      isValid: false,
      errorReason: `Device ID mismatch. Key is bound to ${payload.deviceId}, but current device is ${currentDeviceId}`,
    };
  }

  // 3. Verify System Clock Anti-Tamper Watermark
  const nowMs = Date.now();
  if (nowMs < clockWatermark - 300000) { // 5 mins leeway
    return {
      isValid: false,
      errorReason: 'System clock tampering detected! Device time is set prior to previous app usage timestamp.',
    };
  }

  // 4. Verify Expiry & Grace Period
  const expiresMs = new Date(payload.expiresAt).getTime();
  const diffMs = expiresMs - nowMs;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const GRACE_PERIOD_DAYS = 7;
  const graceExpiresMs = expiresMs + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

  const isExpired = nowMs > expiresMs;
  const isInGracePeriod = isExpired && nowMs <= graceExpiresMs;

  if (isExpired && !isInGracePeriod) {
    return {
      isValid: false,
      isExpired: true,
      isInGracePeriod: false,
      daysRemaining,
      payload,
      errorReason: `License expired on ${new Date(payload.expiresAt).toLocaleDateString()} and 7-day grace period has passed.`,
    };
  }

  return {
    isValid: true,
    isExpired,
    isInGracePeriod,
    daysRemaining,
    payload,
  };
}

/**
 * Format license data helper
 */
export function buildLicenseData(
  keyString: string,
  currentDeviceId: string,
  clockWatermark: number
): LicenseData | null {
  const result = verifyLicenseKey(keyString, currentDeviceId, clockWatermark);
  if (!result.payload) return null;

  return {
    key: keyString,
    payload: result.payload,
    activatedAt: new Date().toISOString(),
    isValid: result.isValid,
    isExpired: result.isExpired || false,
    isInGracePeriod: result.isInGracePeriod || false,
    daysRemaining: result.daysRemaining || 0,
  };
}
