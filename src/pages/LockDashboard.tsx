import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLockById, getRemainingTime, decryptPin, VaultLock } from '@/lib/vault';
import { CountdownTimer } from '@/components/CountdownTimer';
import { FakeSequence } from '@/components/FakeSequence';
import { PanicButton } from '@/components/PanicButton';
import { motion } from 'framer-motion';
import { Lock, Unlock, ArrowLeft, Copy, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LockDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lock, setLock] = useState<VaultLock | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refreshLock = useCallback(async () => {
    if (!id) return;
    const l = await getLockById(id);
    if (!l) {
      navigate('/');
      return;
    }
    setLock(l);
    const remaining = getRemainingTime(l);
    if (remaining.total <= 0) setIsUnlocked(true);
  }, [id, navigate]);

  useEffect(() => {
    refreshLock();
  }, [refreshLock]);

  const handleReveal = () => {
    if (!lock) return;
    const pin = decryptPin(lock.encryptedPin);
    setRevealedPin(pin);
  };

  const handleCopy = () => {
    if (!revealedPin) return;
    navigator.clipboard.writeText(revealedPin);
    setCopied(true);
    toast.success('PIN copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!lock) return null;

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
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center vault-border-glow ${
              isUnlocked ? 'bg-vault-glow/10' : 'bg-vault-surface'
            }`}>
              {isUnlocked ? (
                <Unlock className="w-6 h-6 text-vault-glow" />
              ) : (
                <Lock className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{lock.label}</h1>
              <p className="text-xs font-mono text-muted-foreground">
                {isUnlocked ? 'UNLOCKED' : 'LOCKED'} • ID: {lock.id.slice(0, 8)}
              </p>
            </div>
          </div>

          {isUnlocked ? (
            /* Unlock Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="bg-vault-glow/5 vault-border-glow rounded-xl p-6 text-center space-y-4 vault-glow">
                <Shield className="w-12 h-12 text-vault-glow mx-auto" />
                <div>
                  <p className="text-sm text-muted-foreground font-mono">LOCK COMPLETED</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(lock.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {revealedPin ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="bg-vault-surface rounded-lg p-4 vault-border-glow">
                      <p className="text-xs text-muted-foreground font-mono mb-1">YOUR PIN</p>
                      <p className="text-4xl font-bold font-mono text-vault-glow vault-text-glow tracking-[0.3em]">
                        {revealedPin}
                      </p>
                    </div>
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      className="font-mono text-xs border-vault-glow/30 text-vault-glow hover:bg-vault-glow/10"
                    >
                      {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copied ? 'COPIED' : 'COPY PIN'}
                    </Button>
                  </motion.div>
                ) : (
                  <Button
                    onClick={handleReveal}
                    className="bg-vault-glow hover:bg-vault-glow/90 text-primary-foreground font-mono font-bold"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    REVEAL PIN
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            /* Locked Screen */
            <div className="space-y-8">
              <CountdownTimer lock={lock} onUnlocked={() => setIsUnlocked(true)} />
              
              <div className="border-t border-border pt-6">
                <FakeSequence />
              </div>

              <div className="border-t border-border pt-6">
                <PanicButton lockId={lock.id} onExtended={refreshLock} />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
