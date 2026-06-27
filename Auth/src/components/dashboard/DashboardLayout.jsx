import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import BackToTop from '../layout/BackToTop';
import { Menu, Moon, Sun, Bell, Droplet } from 'lucide-react';
import { toggleTheme } from '../../features/theme/themeSlice';
import { fetchDashboardData, markAllNotificationsReadApi, markNotificationReadApi, addNotification, setEmergencyActive } from '../../features/data/dataSlice';
import { socket } from '../../lib/socket';

const NOTIF_ICON = {
  emergency: { icon: '🚨', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  event:     { icon: '📅', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  info:      { icon: 'ℹ️', color: 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400' },
};

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { theme } = useSelector(state => state.theme);
  const { role, user } = useSelector(state => state.auth);
  const { notifications, emergencyActive } = useSelector(state => state.data);

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  useEffect(() => {
    dispatch(fetchDashboardData());

    socket.connect();
    socket.on('data:sync:command', () => {
      dispatch(fetchDashboardData());
    });

    socket.on('emergency:sos:notified', (payload) => {
      dispatch(addNotification(payload));
      dispatch(setEmergencyActive(true));
      toast.error(`🚨 EMERGENCY: ${payload.bloodGroup} needed in ${payload.city}!`, { duration: 6000 });
      dispatch(fetchDashboardData());
    });

    return () => {
      socket.off('data:sync:command');
      socket.off('emergency:sos:notified');
      socket.disconnect();
    };
  }, [dispatch]);

  return (
    <div className="h-screen hero-mesh flex overflow-hidden transition-theme">

      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {emergencyActive && (
          <div className="bg-red-600 text-white text-center text-xs sm:text-sm font-bold py-2 px-4 shrink-0 animate-pulse" role="alert">
            🚨 Active emergency alert in your network — check Blood Requests immediately
          </div>
        )}

        <header className="h-16 glass-panel border-b border-white/30 dark:border-zinc-800/50 flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer-interactive"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/20">
                <Droplet size={16} aria-hidden="true" />
              </span>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                <span className="text-red-600">Blood4U</span>
                <span className="text-gray-400 dark:text-zinc-600 mx-2">·</span>
                {role} Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer-interactive"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer-interactive"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={isNotifOpen}
              >
                <Bell size={20} aria-hidden="true" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} aria-hidden="true" />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      role="dialog"
                      aria-label="Notifications panel"
                      className="absolute right-0 top-12 z-50 w-80 glass-panel rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100/50 dark:border-zinc-800/50">
                        <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={() => dispatch(markAllNotificationsReadApi())} className="text-xs text-red-600 hover:underline font-medium cursor-pointer-interactive">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {(notifications || []).map(n => {
                          const cfg = NOTIF_ICON[n.type] || NOTIF_ICON.info;
                          return (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => {
                                dispatch(markNotificationReadApi(n.id));
                                navigate('/dashboard/requests');
                                setIsNotifOpen(false);
                              }}
                              className={`w-full text-left flex gap-3 px-4 py-3 border-b border-gray-50/50 dark:border-zinc-800/50 last:border-0 transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer-interactive ${!n.read ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}
                            >
                              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${cfg.color}`}>
                                {cfg.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${!n.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.body}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                              </div>
                              {!n.read && <div className="w-2 h-2 rounded-full bg-red-600 mt-1 shrink-0" aria-hidden="true" />}
                            </button>
                          );
                        })}
                        {(notifications || []).length === 0 && (
                          <p className="py-10 text-center text-gray-400 text-sm" role="status">No notifications yet</p>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <NavLink
              to="/dashboard/profile"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold hover:scale-105 transition-transform shadow-md shadow-red-600/20 cursor-pointer-interactive"
              aria-label="View profile"
            >
              {(user?.identifier || 'U').charAt(0).toUpperCase()}
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BackToTop />
    </div>
  );
}
