import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLock } from '@/lib/vault';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function CreateLock() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [duration, setDuration] = useState(30);
  const [label, setLabel] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    if (duration < 30) {
      toast.error('Minimum lock duration is 30 days');
      return;
    }
    if (!label.trim()) {
      toast.error('Please add a label');
      return;
    }

    setCreating(true);
    try {
      const lock = createLock(pin, duration, label.trim());
      toast.success('Lock created successfully');
      setTimeout(() => navigate(`/lock/${lock.id}`), 500);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create lock');
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="scanline absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-vault-glow/10 vault-border-glow flex items-center justify-center">
                <Shield className="w-5 h-5 text-vault-glow" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Create New Lock</h1>
                <p className="text-sm text-muted-foreground">Your PIN will be encrypted and time-locked</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Label */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-muted-foreground tracking-wider">LOCK LABEL</label>
              <Input
                placeholder="e.g. Screen Time PIN"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={50}
                className="bg-vault-surface border-border focus:border-vault-glow/50 font-mono"
              />
            </div>

            {/* PIN */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-muted-foreground tracking-wider">PIN CODE</label>
              <div className="relative">
                <Input
                  type={showPin ? 'text' : 'password'}
                  placeholder="Enter PIN (min 4 digits)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  maxLength={12}
                  className="bg-vault-surface border-border focus:border-vault-glow/50 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm PIN */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-muted-foreground tracking-wider">CONFIRM PIN</label>
              <Input
                type="password"
                placeholder="Re-enter PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                maxLength={12}
                className="bg-vault-surface border-border focus:border-vault-glow/50 font-mono"
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-muted-foreground tracking-wider">
                LOCK DURATION — {duration} DAYS
              </label>
              <Input
                type="number"
                min={30}
                max={365}
                value={duration}
                onChange={(e) => setDuration(Math.max(30, parseInt(e.target.value) || 30))}
                className="bg-vault-surface border-border focus:border-vault-glow/50 font-mono"
              />
              <p className="text-xs text-muted-foreground">Minimum 30 days. Short locks defeat the purpose.</p>
            </div>

            {/* Warning */}
            <motion.div
              className="bg-vault-danger/5 border border-vault-danger/20 rounded-lg p-4 space-y-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm font-semibold text-vault-danger flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Warning
              </p>
              <p className="text-xs text-muted-foreground">
                Once locked, your PIN cannot be accessed until the timer expires.
                Panic unlock will ADD 24 hours, not reveal the PIN early.
              </p>
            </motion.div>

            <Button
              onClick={handleCreate}
              disabled={creating || pin.length < 4 || pin !== confirmPin || !label.trim()}
              className="w-full bg-vault-glow hover:bg-vault-glow/90 text-primary-foreground font-mono font-bold tracking-wider h-12"
            >
              {creating ? 'ENCRYPTING...' : 'CREATE LOCK'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
