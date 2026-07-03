import CryptoJS from 'crypto-js';
import { supabase } from '@/integrations/supabase/client';

const ENCRYPTION_KEY = 'vault-time-lock-v1-key';

export interface VaultLock {
  id: string;
  label: string;
  encryptedPin: string;
  unlockTime: number;
  panicUnlockTime: number | null;
  createdAt: number;
  status: 'locked' | 'unlocked';
}

interface DbRow {
  id: string;
  label: string;
  encrypted_pin: string;
  unlock_time: string;
  panic_unlock_time: string | null;
  created_at: string;
}

function toLock(row: DbRow): VaultLock {
  return {
    id: row.id,
    label: row.label,
    encryptedPin: row.encrypted_pin,
    unlockTime: new Date(row.unlock_time).getTime(),
    panicUnlockTime: row.panic_unlock_time ? new Date(row.panic_unlock_time).getTime() : null,
    createdAt: new Date(row.created_at).getTime(),
    status: 'locked',
  };
}

export function encryptPin(pin: string): string {
  return CryptoJS.AES.encrypt(pin, ENCRYPTION_KEY).toString();
}

export function decryptPin(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export async function createLock(pin: string, durationDays: number, label: string): Promise<VaultLock> {
  if (durationDays < 30) throw new Error('Minimum lock duration is 30 days');
  if (!pin || pin.length < 4) throw new Error('PIN must be at least 4 digits');

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const unlockTime = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('locks')
    .insert({
      user_id: userData.user.id,
      label,
      encrypted_pin: encryptPin(pin),
      unlock_time: unlockTime,
    })
    .select()
    .single();

  if (error) throw error;
  return toLock(data as DbRow);
}

export async function getLocks(): Promise<VaultLock[]> {
  const { data, error } = await supabase
    .from('locks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as DbRow[]).map(toLock);
}

export async function getLockById(id: string): Promise<VaultLock | null> {
  const { data, error } = await supabase.from('locks').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toLock(data as DbRow) : null;
}

export function getRemainingTime(lock: VaultLock) {
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

export async function panicUnlock(lockId: string): Promise<{ success: boolean; message: string }> {
  const lock = await getLockById(lockId);
  if (!lock) return { success: false, message: 'Lock not found' };

  const now = Date.now();
  if (lock.panicUnlockTime && now - lock.panicUnlockTime < 24 * 60 * 60 * 1000) {
    return { success: false, message: 'Panic unlock can only be used once per 24 hours' };
  }

  const newUnlockTime = new Date(lock.unlockTime + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from('locks')
    .update({
      unlock_time: newUnlockTime,
      panic_unlock_time: new Date(now).toISOString(),
    })
    .eq('id', lockId);

  if (error) return { success: false, message: error.message };
  return { success: true, message: 'Timer extended by 24 hours' };
}

export async function deleteLock(lockId: string): Promise<void> {
  const { error } = await supabase.from('locks').delete().eq('id', lockId);
  if (error) throw error;
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
