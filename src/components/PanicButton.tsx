import { useState, useEffect } from 'react';
import { panicUnlock, getLockById } from '@/lib/vault';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PanicButtonProps {
  lockId: string;
  onExtended?: () => void;
}

function getCooldownRemaining(panicTime: number | null): number {
  if (!panicTime) return 0;
  const elapsed = Date.now() - panicTime;
  return Math.max(0, 24 * 60 * 60 * 1000 - elapsed);
}

function formatCooldown(ms: number): string {
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((ms % (1000 * 60)) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PanicButton({ lockId, onExtended }: PanicButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [panicTime, setPanicTime] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    getLockById(lockId).then((lock) => {
      if (mounted && lock) setPanicTime(lock.panicUnlockTime);
    });
    return () => { mounted = false; };
  }, [lockId]);

  useEffect(() => {
    const tick = () => setCooldownMs(getCooldownRemaining(panicTime));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [panicTime]);

  const handlePanic = async () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 5000);
      return;
    }

    const result = await panicUnlock(lockId);
    if (result.success) {
      toast.success('Timer extended by 24 hours', {
        description: 'Your impulse has been delayed. Stay strong.',
      });
      onExtended?.();
      const lock = await getLockById(lockId);
      if (lock) setPanicTime(lock.panicUnlockTime);
    } else {
      toast.error(result.message);
    }
    setConfirming(false);
  };

  if (cooldownMs > 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm font-mono p-3 bg-vault-surface rounded-lg vault-border-glow">
        <Clock className="w-4 h-4 text-vault-warning" />
        <span>Panic cooldown: <span className="text-vault-warning">{formatCooldown(cooldownMs)}</span></span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="wait">
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-2"
          >
            <p className="text-sm text-vault-warning font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              This will ADD 24 hours. Are you sure?
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handlePanic}
                className="bg-vault-danger hover:bg-vault-danger/80 text-foreground font-mono text-xs"
                size="sm"
              >
                CONFIRM PANIC
              </Button>
              <Button
                onClick={() => setConfirming(false)}
                variant="outline"
                className="font-mono text-xs border-border hover:bg-vault-surface-hover"
                size="sm"
              >
                CANCEL
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              onClick={handlePanic}
              variant="outline"
              className="w-full border-vault-danger/30 text-vault-danger hover:bg-vault-danger/10 hover:border-vault-danger/50 font-mono"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              REVEAL EARLY
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
