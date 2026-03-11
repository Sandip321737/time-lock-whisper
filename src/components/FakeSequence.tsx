import { useEffect, useState, useCallback } from 'react';
import { generateFakeSequence } from '@/lib/vault';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete } from 'lucide-react';

export function FakeSequence() {
  const [sequence, setSequence] = useState(generateFakeSequence());
  const [currentStep, setCurrentStep] = useState(-1);
  const [displayDots, setDisplayDots] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSequence = useCallback(() => {
    const newSeq = generateFakeSequence();
    setSequence(newSeq);
    setCurrentStep(-1);
    setDisplayDots([]);
    setIsPlaying(true);

    newSeq.forEach((step, i) => {
      setTimeout(() => {
        setCurrentStep(i);
        setDisplayDots(prev => {
          if (step.type === 'backspace') {
            return prev.slice(0, -1);
          }
          return [...prev, '•'];
        });
      }, (i + 1) * 400);
    });

    setTimeout(() => {
      setIsPlaying(false);
      setCurrentStep(-1);
      setDisplayDots([]);
    }, (newSeq.length + 1) * 400 + 800);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlaying) playSequence();
    }, 5000);
    playSequence();
    return () => clearInterval(interval);
  }, [playSequence, isPlaying]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <div className="w-2 h-2 rounded-full bg-vault-glow animate-pulse" />
        <span>DECOY SEQUENCE ACTIVE</span>
      </div>

      {/* Display dots */}
      <div className="bg-vault-surface vault-border-glow rounded-lg p-4 min-h-[48px] flex items-center font-mono">
        <AnimatePresence mode="popLayout">
          {displayDots.map((dot, i) => (
            <motion.span
              key={`${i}-${dot}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-2xl text-vault-glow mx-0.5"
            >
              {dot}
            </motion.span>
          ))}
        </AnimatePresence>
        <motion.span
          className="w-0.5 h-6 bg-vault-glow ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      </div>

      {/* Sequence log */}
      <div className="flex flex-wrap gap-1.5">
        {sequence.map((step, i) => (
          <motion.div
            key={i}
            className={`px-2 py-1 rounded text-xs font-mono transition-all ${
              i === currentStep
                ? 'bg-vault-glow/20 text-vault-glow vault-border-glow'
                : i < currentStep
                ? 'bg-vault-surface text-muted-foreground'
                : 'bg-vault-surface/50 text-muted-foreground/40'
            }`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {step.type === 'backspace' ? (
              <Delete className="w-3 h-3" />
            ) : (
              step.value
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
