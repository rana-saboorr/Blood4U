import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'blood4u_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'essential');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          role="dialog"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-desc"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[100] glass-panel rounded-2xl p-5 shadow-2xl border border-white/20 dark:border-zinc-700/50"
        >
          <div className="flex gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Cookie size={20} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="cookie-title" className="font-bold text-gray-900 dark:text-white text-sm">
                Cookie preferences
              </h2>
              <p id="cookie-desc" className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                We use essential cookies for authentication (JWT in httpOnly cookies) and session security.
                See our{' '}
                <Link to="/privacy" className="text-red-600 hover:underline font-medium">
                  Privacy Policy
                </Link>.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={accept}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer-interactive"
                >
                  Accept all
                </button>
                <button
                  onClick={decline}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer-interactive"
                >
                  Essential only
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
