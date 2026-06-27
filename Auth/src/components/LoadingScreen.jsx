import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Droplet } from 'lucide-react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [showBypass, setShowBypass] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) return 100;
        const diff = Math.random() * (oldProgress < 60 ? 15 : 5);
        return Math.min(oldProgress + diff, 100);
      });
    }, 200);

    const bypassTimer = setTimeout(() => setShowBypass(true), 6000);

    return () => {
      clearInterval(timer);
      clearTimeout(bypassTimer);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center hero-mesh transition-theme"
      role="status"
      aria-live="polite"
      aria-label="Loading Blood4U"
    >
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-28 h-28 bg-red-600/15 rounded-full blur-2xl"
        />
        
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-xl shadow-red-600/30 animate-pulse-glow">
            <Droplet size={32} aria-hidden="true" />
          </div>
        </motion.div>
      </div>

      <div className="mt-10 text-center flex flex-col items-center">
        <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Blood<span className="text-red-600">4</span>U
        </h2>

        <div className="mt-5 w-52 h-1.5 glass-panel rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 to-[#d4af37]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut' }}
          />
        </div>

        <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-[0.25em] flex items-center gap-2">
          <span>Loading</span>
          <span className="w-10 text-left tabular-nums text-red-600/70">{Math.floor(progress)}%</span>
        </p>

        {showBypass && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
            <button 
              onClick={() => { window.location.href = '/signin'; }} 
              className="px-6 py-2.5 rounded-xl glass-panel text-xs font-bold text-gray-500 dark:text-gray-400 hover:shadow-md transition-all cursor-pointer-interactive"
            >
              Connection slow? Continue anyway →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
