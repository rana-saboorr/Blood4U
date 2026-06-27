import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';

export default function AuthToastProvider() {
  const theme = useSelector((state) => state.theme.theme);
  const isDark = theme === 'dark';

  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? 'rgba(24, 24, 27, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          color: isDark ? '#fafafa' : '#1a1a2e',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(220, 38, 38, 0.12)',
          borderRadius: '1rem',
          padding: '12px 16px',
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 24px rgba(15,12,41,0.08)',
        },
        success: {
          iconTheme: { primary: '#dc2626', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#dc2626', secondary: '#fff' },
        },
      }}
    />
  );
}
