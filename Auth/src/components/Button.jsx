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
  const base = "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border-0 shadow-lg active:scale-[0.98]";
  
  const variants = {
    primary: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-red-500/20 focus-visible:ring-red-500",
    secondary: "bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-900 dark:text-white border border-gray-100 dark:border-zinc-700 shadow-gray-200/20 dark:shadow-black/20",
    outline: "bg-transparent border-2 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 focus-visible:ring-red-500",
    ghost: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white shadow-none",
  };

  return (
    <motion.button
      whileHover={disabled || isLoading ? {} : { y: -1, scale: 1.01 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
      type={type}
      disabled={disabled || isLoading}
      className={`${base} whitespace-nowrap flex-row ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 shrink-0 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </motion.button>

  );
}
