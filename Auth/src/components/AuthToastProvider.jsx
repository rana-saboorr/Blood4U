import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';

export default function AuthToastProvider() {
  const theme = useSelector((state) => state.theme.theme);

  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: theme === 'dark' ? '#1e1e1e' : '#fff',
          color: theme === 'dark' ? '#f8f9fa' : '#212529',
          border: '1px solid',
          borderColor: theme === 'dark' ? '#343a40' : '#dee2e6',
        },
      }}
    />
  );
}
