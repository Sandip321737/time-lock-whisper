import { useEffect, useState } from 'react';
import { VaultLock, getRemainingTime } from '@/lib/vault';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  lock: VaultLock;
  onUnlocked?: () => void;
}

export function CountdownTimer({ lock, onUnlocked }: CountdownTimerProps) {
  const [time, setTime] = useState(getRemainingTime(lock));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getRemainingTime(lock);
      setTime(remaining);
      if (remaining.total <= 0) {
        onUnlocked?.();
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lock, onUnlocked]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-3 font-mono">
        {[
          { value: time.days, label: 'DAYS' },
          { value: time.hours, label: 'HRS' },
          { value: time.minutes, label: 'MIN' },
          { value: time.seconds, label: 'SEC' },
        ].map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-3">
            <motion.div
              className="flex flex-col items-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="bg-vault-surface vault-border-glow rounded-lg px-4 py-3 min-w-[72px] text-center">
                <span className="text-3xl font-bold text-vault-glow vault-text-glow">
                  {pad(unit.value)}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1.5 tracking-widest">
                {unit.label}
              </span>
            </motion.div>
            {i < 3 && (
              <span className="text-vault-glow text-2xl font-bold opacity-40 mb-5">:</span>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>PROGRESS</span>
          <span>{Math.round(time.progress * 100)}%</span>
        </div>
        <div className="h-2 bg-vault-surface rounded-full overflow-hidden vault-border-glow">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, hsl(160 80% 45%), hsl(160 80% 35%))`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${time.progress * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
