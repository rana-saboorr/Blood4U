import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import { Menu, Moon, Sun, Bell } from 'lucide-react';
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
    socket.on('data:sync:command', (payload) => {
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
    <div className="h-screen bg-gray-50 dark:bg-zinc-950 flex overflow-hidden transition-colors duration-300">

      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Emergency Banner */}


        {/* Header */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-white/20 hover:backdrop-blur-md rounded-lg transition-all"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize hidden sm:block">
              <span className="text-red-600">Blood4U</span> · {role} Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </button>

              {/* Notifications Panel */}
              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute right-0 top-12 z-50 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
                    >
                      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                        <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={() => dispatch(markAllNotificationsReadApi())} className="text-xs text-red-600 hover:underline font-medium">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {(notifications || []).map(n => {
                          const cfg = NOTIF_ICON[n.type] || NOTIF_ICON.info;
                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                dispatch(markNotificationReadApi(n.id));
                                navigate('/dashboard/requests');
                                setIsNotifOpen(false);
                              }}
                              className={`flex gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 dark:border-zinc-800 last:border-0 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 ${!n.read ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}
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
                              {!n.read && <div className="w-2 h-2 rounded-full bg-red-600 mt-1 shrink-0" />}
                            </div>
                          );
                        })}
                        {(notifications || []).length === 0 && (
                          <div className="py-8 text-center text-gray-400 text-sm">No notifications yet</div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <NavLink to="/dashboard/profile" className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold border-2 border-red-200 dark:border-red-900/50 hover:scale-105 transition-transform">
              {(user?.identifier || 'U').charAt(0).toUpperCase()}
            </NavLink>
          </div>
        </header>

        {/* Dashboard Pages with Transition */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-zinc-950 p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
