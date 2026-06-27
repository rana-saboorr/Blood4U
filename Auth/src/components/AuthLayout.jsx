import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Moon, Sun, Droplet } from 'lucide-react';
import { toggleTheme } from '../features/theme/themeSlice';

export default function AuthLayout({ 
  children, 
  title, 
  subtitle,
  heroTitle,
  heroSubtitle,
  heroQuote,
  heroAuthor
}) {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.theme);

  return (
    <div className="min-h-screen hero-mesh flex justify-center items-center p-4 sm:p-6 transition-theme">
      <Link
        to="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl glass-panel text-sm font-bold text-gray-800 dark:text-white hover:shadow-md transition-shadow"
        aria-label="Back to Blood4U home"
      >
        <Droplet size={16} className="text-red-600" aria-hidden="true" />
        Blood4U
      </Link>

      <button
        onClick={() => dispatch(toggleTheme())}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-xl glass-panel hover:shadow-md transition-all text-gray-700 dark:text-gray-200 cursor-pointer-interactive"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl glass-panel rounded-[2rem] shadow-2xl shadow-black/5 dark:shadow-black/30 overflow-hidden flex border border-white/40 dark:border-zinc-700/50"
      >
        {/* Left Panel — liquid glass hero */}
        <div className="hidden md:flex md:w-[42%] relative overflow-hidden min-h-[580px]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#991b1b] to-[#dc2626]" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle, rgba(212,175,55,0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#d4af37]/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-500/30 rounded-full blur-3xl" />

          <div className="relative z-10 p-10 flex flex-col h-full justify-between text-white">
            <div>
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                Blood4U
                <span className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center" aria-hidden="true">🩸</span>
              </h2>
              <p className="text-red-200/80 text-sm mt-1 font-medium tracking-wide">Donation & Request Network</p>
            </div>
            
            <div>
              {heroQuote ? (
                <>
                  <div className="w-12 h-1 bg-[#d4af37]/60 rounded mb-6" />
                  <blockquote className="text-2xl font-display italic leading-relaxed">
                    &ldquo;{heroQuote}&rdquo;
                  </blockquote>
                  {heroAuthor && (
                    <p className="mt-5 text-red-200 font-semibold tracking-widest uppercase text-xs">— {heroAuthor}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-12 h-1 bg-[#d4af37]/60 rounded mb-6" />
                  <h1 className="font-display text-3xl font-bold leading-tight">
                    {heroTitle || 'Connect. Donate. Save Lives.'}
                  </h1>
                  <p className="mt-4 text-red-100/85 text-base leading-relaxed">
                    {heroSubtitle || 'Join our community. Every drop you donate is a lifeline for someone in need.'}
                  </p>
                </>
              )}

              <div className="flex gap-3 mt-10 flex-wrap">
                {[['1K+', 'Donors'], ['500+', 'Lives Saved'], ['50+', 'Cities']].map(([num, label]) => (
                  <div key={label} className="px-3 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                    <span className="font-bold text-sm text-[#d4af37]">{num}</span>
                    <span className="text-red-100 text-xs ml-1.5">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-[58%] p-8 sm:p-10 lg:p-12 flex flex-col justify-center bg-white/50 dark:bg-zinc-950/50">
          <div className="md:hidden mb-6 flex items-center gap-2">
            <span className="font-display text-xl font-bold text-gray-900 dark:text-white">Blood4U</span>
            <span aria-hidden="true">🩸</span>
          </div>

          <header className="mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">{subtitle}</p>}
          </header>
          
          {children}
        </div>
      </motion.div>
    </div>
  );
}
