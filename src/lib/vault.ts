import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'vault-time-lock-v1-key'; // In production, use server-side key
const STORAGE_KEY = 'vault_locks';

export interface VaultLock {
  id: string;
  label: string;
  encryptedPin: string;
  unlockTime: number; // timestamp ms
  panicUnlockTime: number | null;
  createdAt: number;
  status: 'locked' | 'unlocked';
}

export function encryptPin(pin: string): string {
  return CryptoJS.AES.encrypt(pin, ENCRYPTION_KEY).toString();
}

export function decryptPin(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function createLock(pin: string, durationDays: number, label: string): VaultLock {
  if (durationDays < 30) throw new Error('Minimum lock duration is 30 days');
  if (!pin || pin.length < 4) throw new Error('PIN must be at least 4 digits');

  const now = Date.now();
  const lock: VaultLock = {
    id: crypto.randomUUID(),
    label,
    encryptedPin: encryptPin(pin),
    unlockTime: now + durationDays * 24 * 60 * 60 * 1000,
    panicUnlockTime: null,
    createdAt: now,
    status: 'locked',
  };

  const locks = getLocks();
  locks.push(lock);
  saveLocks(locks);
  return lock;
}

export function getLocks(): VaultLock[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocks(locks: VaultLock[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locks));
}

export function getLockById(id: string): VaultLock | undefined {
  return getLocks().find(l => l.id === id);
}

export function getRemainingTime(lock: VaultLock): { days: number; hours: number; minutes: number; seconds: number; total: number; progress: number } {
  const now = Date.now();
  const total = Math.max(0, lock.unlockTime - now);
  const elapsed = now - lock.createdAt;
  const fullDuration = lock.unlockTime - lock.createdAt;
  const progress = Math.min(1, elapsed / fullDuration);

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((total % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, total, progress };
}

export function panicUnlock(lockId: string): { success: boolean; message: string } {
  const locks = getLocks();
  const lock = locks.find(l => l.id === lockId);
  if (!lock) return { success: false, message: 'Lock not found' };

  const now = Date.now();
  if (lock.panicUnlockTime && (now - lock.panicUnlockTime) < 24 * 60 * 60 * 1000) {
    return { success: false, message: 'Panic unlock can only be used once per 24 hours' };
  }

  lock.unlockTime += 24 * 60 * 60 * 1000;
  lock.panicUnlockTime = now;
  saveLocks(locks);
  return { success: true, message: 'Timer extended by 24 hours' };
}

export function revealPin(lockId: string): { success: boolean; pin?: string; message: string } {
  const lock = getLockById(lockId);
  if (!lock) return { success: false, message: 'Lock not found' };

  const now = Date.now();
  if (now < lock.unlockTime) {
    return { success: false, message: 'Lock is still active' };
  }

  return { success: true, pin: decryptPin(lock.encryptedPin), message: 'PIN revealed' };
}

export function generateFakeSequence(length: number = 7): Array<{ type: 'digit' | 'backspace'; value?: string }> {
  const sequence: Array<{ type: 'digit' | 'backspace'; value?: string }> = [];
  const digits = '0123456789';
  let displayCount = 0;

  for (let i = 0; i < length + Math.floor(Math.random() * 3); i++) {
    const isBackspace = Math.random() > 0.65 && displayCount > 0;
    if (isBackspace) {
      sequence.push({ type: 'backspace' });
      displayCount--;
    } else {
      const digit = digits[Math.floor(Math.random() * digits.length)];
      sequence.push({ type: 'digit', value: digit });
      displayCount++;
    }
  }

  return sequence;
}

export function deleteLock(lockId: string) {
  const locks = getLocks().filter(l => l.id !== lockId);
  saveLocks(locks);
}
