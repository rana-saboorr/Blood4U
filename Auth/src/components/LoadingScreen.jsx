import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

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

    // Show bypass button after 6 seconds of loading
    const bypassTimer = setTimeout(() => {
      setShowBypass(true);
    }, 6000);

    return () => {
      clearInterval(timer);
      clearTimeout(bypassTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="relative">
        {/* Animated Blood Droplet Shell */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 bg-red-600/10 dark:bg-red-500/10 rounded-full blur-2xl"
        />
        
        {/* The Droplet Logo */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="relative">
            <div className="w-12 h-12 bg-red-600 rounded-full rounded-tr-none rotate-45 shadow-lg shadow-red-600/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-white/40 rounded-full -translate-x-1 -translate-y-1" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 text-center flex flex-col items-center">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-black text-gray-900 dark:text-white tracking-tight"
        >
          Blood<span className="text-red-600">4U</span>
        </motion.h2>

        <div className="mt-4 w-48 h-1 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
          <motion.div
            className="absolute top-0 left-0 h-full bg-red-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>

        <motion.p
          className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-[0.2em] flex items-center gap-2"
        >
          <span>Initializing</span>
          <span className="w-12 text-left tabular-nums text-red-600/60 font-black">{Math.floor(progress)}%</span>
        </motion.p>

        {showBypass && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <button 
              onClick={() => window.location.href = '/signin'} 
              className="px-6 py-2 rounded-full border border-gray-200 dark:border-zinc-800 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"
            >
              Connection slow? Continue anyway →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
