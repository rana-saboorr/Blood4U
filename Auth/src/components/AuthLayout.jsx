import { useSelector, useDispatch } from 'react-redux';
import { Moon, Sun } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex justify-center items-center p-4 transition-colors duration-300">
      
      {/* Theme Toggle */}
      <button
        onClick={() => dispatch(toggleTheme())}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-white dark:bg-zinc-800 shadow-md hover:scale-110 transition-transform text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-700"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl shadow-black/10 overflow-hidden flex border border-gray-100 dark:border-zinc-800 transition-colors duration-300">
        
        {/* Left Panel */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-red-600 to-red-800 flex-col justify-between relative overflow-hidden min-h-[560px]">
          
          {/* Decorative blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-red-900/50 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
          </div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }} />

          <div className="relative z-10 p-10 flex flex-col h-full justify-between">
            {/* Logo */}
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Blood4U <span>🩸</span>
              </h2>
              <p className="text-red-200/80 text-sm mt-1 font-medium tracking-wide">Donation & Request Network</p>
            </div>
            
            {/* Content */}
            <div>
              {heroQuote ? (
                <>
                  <div className="w-10 h-1 bg-white/40 rounded mb-6" />
                  <blockquote className="text-2xl font-serif italic text-white leading-relaxed">
                    "{heroQuote}"
                  </blockquote>
                  {heroAuthor && (
                    <p className="mt-5 text-red-200 font-semibold tracking-widest uppercase text-xs">— {heroAuthor}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-10 h-1 bg-white/40 rounded mb-6" />
                  <h1 className="text-3xl font-bold text-white leading-tight">
                    {heroTitle || 'Connect. Donate. Save Lives.'}
                  </h1>
                  <p className="mt-4 text-red-100/80 text-base leading-relaxed">
                    {heroSubtitle || 'Join our community. Every drop you donate is a lifeline for someone in need.'}
                  </p>
                </>
              )}

              {/* Stat badges */}
              <div className="flex gap-3 mt-10 flex-wrap">
                {[['1K+', 'Donors'], ['500+', 'Lives Saved'], ['50+', 'Cities']].map(([num, label]) => (
                  <div key={label} className="px-3 py-1.5 bg-white/15 backdrop-blur rounded-full text-white border border-white/20">
                    <span className="font-bold text-sm">{num}</span>
                    <span className="text-red-200 text-xs ml-1">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-7/12 p-8 sm:p-10 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="md:hidden mb-6 flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900 dark:text-white">Blood4U</span>
            <span>🩸</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{subtitle}</p>}
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
