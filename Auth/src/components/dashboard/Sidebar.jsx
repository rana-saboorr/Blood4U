import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Home, Activity, Heart, Building2, Calendar, 
  Search, MessageSquare, X, Settings, Megaphone,
  Zap, AlertTriangle, BarChart2, User, Trophy, Droplet, LogOut
} from 'lucide-react';
import { signoutUser } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { role, user } = useSelector((state) => state.auth);
  const { chats, bloodBanks } = useSelector((state) => state.data);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const totalUnreadChatCount = (chats || []).reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);

  const handleLogout = async () => {
    try {
      await dispatch(signoutUser()).unwrap();
      toast.success('Logged out successfully');
      navigate('/signin');
    } catch (error) {
      toast.error(error.message || 'Logout failed');
    }
  };

  const myBank = (bloodBanks || []).find(b => b.ownerUserId === user?._id);

  const navLinks = [
    { name: 'Overview', path: '/dashboard', icon: Home, roles: ['user', 'donor', 'bankOwner'], exact: true },
    { name: 'Admin Dashboard', path: '/dashboard/admin', icon: Home, roles: ['admin'], exact: true },
    { name: 'Manage Stock', path: '/dashboard/manage-stock', icon: Droplet, roles: ['bankOwner'] },
    { name: 'Blood Requests', path: '/dashboard/requests', icon: Activity, roles: ['user', 'donor', 'admin'] },
    { name: 'Smart Match', path: '/dashboard/smart-match', icon: Zap, roles: ['user', 'donor', 'admin'] },
    { name: 'Emergency', path: '/dashboard/emergency', icon: AlertTriangle, roles: ['user', 'donor', 'admin'], urgent: true },
    { name: 'Become Donor', path: '/dashboard/become-donor', icon: Heart, roles: ['user'] },
    { name: 'Blood Banks', path: '/dashboard/banks', icon: Building2, roles: ['user', 'donor', 'admin'] },
    { name: 'Register Bank', path: '/dashboard/register-bank', icon: Building2, roles: ['user', 'bankOwner'], hidden: !!myBank },
    { name: 'Events', path: '/dashboard/events', icon: Calendar, roles: ['admin'] },
    { name: 'Upcoming Events', path: '/dashboard/upcoming-events', icon: Calendar, roles: ['user', 'donor', 'bankOwner'] },
    { name: 'Broadcast News', path: '/dashboard/manage-news', icon: Megaphone, roles: ['admin'] },
    { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart2, roles: ['admin'] },
    { name: 'Search Donors', path: '/dashboard/search', icon: Search, roles: ['user', 'donor', 'admin'] },
    { name: 'Chat', path: '/dashboard/chat', icon: MessageSquare, roles: ['user', 'donor', 'admin', 'bankOwner'] },
    { name: 'My Profile', path: '/dashboard/profile', icon: User, roles: ['user', 'donor', 'admin', 'bankOwner'] },
    { name: 'Donation History', path: '/dashboard/history', icon: Trophy, roles: ['donor'] },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings, roles: ['user', 'donor', 'admin', 'bankOwner'] },
  ];

  const filteredLinks = navLinks.filter(link => link.roles.includes(role) && !link.hidden);

  const roleColors = {
    admin: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    donor: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    bankOwner: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
    user: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]',
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={toggleSidebar} aria-hidden="true" />
      )}

      <aside
        className={`fixed lg:sticky top-0 h-screen z-50 w-64 glass-panel border-r border-white/30 dark:border-zinc-800/50 transition-transform duration-300 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        aria-label="Dashboard sidebar"
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200/30 dark:border-zinc-800/50 shrink-0">
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Blood<span className="text-red-600">4</span>U
          </h2>
          <button
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer-interactive"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="mx-4 mt-4 mb-2 px-3 py-2.5 rounded-xl clay-card flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${roleColors[role] || roleColors.user}`} aria-hidden="true" />
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            {role === 'bankOwner' ? 'Bank Owner' : role}
          </span>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          {filteredLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.exact}
              onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer-interactive
                ${link.urgent ? 'text-red-600 dark:text-red-400' : ''}
                ${isActive
                  ? link.urgent
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shadow-sm'
                  : link.urgent
                    ? 'hover:bg-red-50 dark:hover:bg-red-950/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <link.icon size={18} aria-hidden="true" />
              <span className="flex-1">{link.name}</span>
              {link.name === 'Chat' && totalUnreadChatCount > 0 && (
                <motion.span 
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="min-w-5 h-5 px-1 bg-emerald-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                >
                  {totalUnreadChatCount}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200/30 dark:border-zinc-800/50 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer-interactive"
          >
            <LogOut size={18} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
