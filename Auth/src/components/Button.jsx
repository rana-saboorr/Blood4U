import { motion } from 'framer-motion';

export default function Button({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  isLoading = false, 
  className = '',
  disabled,
  ...props 
}) {
  const base = 'inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed border-0 active:scale-[0.98] cursor-pointer-interactive';
  
  const variants = {
    primary: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/25 focus-visible:ring-red-500',
    secondary: 'glass-panel hover:shadow-md text-gray-900 dark:text-white focus-visible:ring-red-500/50',
    outline: 'bg-transparent border-2 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 focus-visible:ring-red-500 shadow-none',
    ghost: 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white shadow-none',
  };

  return (
    <motion.button
      whileHover={disabled || isLoading ? {} : { y: -1 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
      type={type}
      disabled={disabled || isLoading}
      className={`${base} whitespace-nowrap flex-row ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
}
