import { forwardRef, useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({ label, type = 'text', error, className = '', id, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = id || generatedId;
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={`w-full px-4 py-3.5 rounded-2xl border outline-none transition-all text-sm neo-inset
            ${error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/30 dark:bg-red-900/10'
              : 'border-gray-200/80 dark:border-zinc-700/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/15 glass-panel'
            }
            text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500
            disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer-interactive"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <span id={errorId} role="alert" className="mt-2 text-xs text-red-500 flex items-center gap-1 font-medium">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
