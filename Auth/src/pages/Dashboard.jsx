import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import { toggleTheme } from '../features/theme/themeSlice';
import { LogOut, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const theme = useSelector((state) => state.theme.theme);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white transition-colors p-8">
      <nav className="flex justify-between items-center mb-12 max-w-6xl mx-auto w-full border-b border-gray-200 dark:border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-[#e63946]">Dashboard.</h1>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => dispatch(toggleTheme())}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
             {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium text-sm"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto w-full text-center py-20 bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-2xl">
        <h2 className="text-4xl font-bold mb-4">Welcome, {user?.identifier || 'User'}! 🎉</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          You've successfully authenticated and reached the protected dashboard route. The theme will persist and Redux state handles your session securely.
        </p>
      </main>
    </div>
  );
}
