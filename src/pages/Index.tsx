import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLocks, deleteLock, getRemainingTime, decryptPin, VaultLock } from '@/lib/vault';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, Shield, Trash2, ChevronRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Index() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [locks, setLocks] = useState<VaultLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<VaultLock | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [deleting, setDeleting] = useState(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // tick every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setLocks((l) => [...l]), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteLock(id);
      await refresh();
      toast.success('Lock deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="scanline absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-12">
        <div className="flex justify-between items-start mb-8">
          <div className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
            {user?.email}
          </div>
          <button
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-foreground p-2"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-12"
        >
          <motion.div
            className="w-20 h-20 rounded-2xl bg-vault-glow/10 vault-border-glow vault-glow mx-auto flex items-center justify-center"
            animate={{ boxShadow: ['0 0 30px -5px hsl(160 80% 45% / 0.3)', '0 0 50px -5px hsl(160 80% 45% / 0.5)', '0 0 30px -5px hsl(160 80% 45% / 0.3)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Shield className="w-10 h-10 text-vault-glow" />
          </motion.div>
          <h1 className="text-3xl font-bold vault-text-glow">PIN Vault</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Lock your secrets behind time. Stored safely on the server.
          </p>
        </motion.div>

        <Button
          onClick={() => navigate('/create')}
          className="w-full bg-vault-glow hover:bg-vault-glow/90 text-primary-foreground font-mono font-bold tracking-wider h-12 mb-8"
        >
          <Plus className="w-5 h-5 mr-2" />
          CREATE NEW LOCK
        </Button>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm font-mono">Loading vault...</div>
        ) : locks.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-mono text-muted-foreground tracking-wider">
              ACTIVE LOCKS ({locks.length})
            </p>
            <AnimatePresence>
              {locks.map((lock, i) => {
                const time = getRemainingTime(lock);
                const isUnlocked = time.total <= 0;

                return (
                  <motion.div
                    key={lock.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/lock/${lock.id}`)}
                    className="bg-card vault-border-glow rounded-xl p-4 cursor-pointer hover:bg-vault-surface-hover transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isUnlocked ? 'bg-vault-glow/10' : 'bg-vault-surface'
                      }`}>
                        <Lock className={`w-5 h-5 ${isUnlocked ? 'text-vault-glow' : 'text-muted-foreground'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{lock.label}</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {isUnlocked
                            ? 'READY TO REVEAL'
                            : `${time.days}d ${time.hours}h ${time.minutes}m remaining`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => handleDelete(lock.id, e)}
                          className="p-2 text-muted-foreground hover:text-vault-danger transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    {!isUnlocked && (
                      <div className="mt-3 h-1 bg-vault-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-vault-glow/60 rounded-full transition-all"
                          style={{ width: `${time.progress * 100}%` }}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-12 text-muted-foreground"
          >
            <Lock className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No locks yet. Create your first one.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
