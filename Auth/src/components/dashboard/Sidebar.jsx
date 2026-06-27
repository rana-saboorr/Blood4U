import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Home, Activity, Heart, Building2, Calendar, 
  Search, MessageSquare, X, Settings, Megaphone,
  Zap, AlertTriangle, BarChart2, User, Trophy, Droplet
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
    { name: '🚨 Emergency', path: '/dashboard/emergency', icon: AlertTriangle, roles: ['user', 'donor', 'admin'], urgent: true },
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

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside className={`fixed lg:sticky top-0 h-screen z-50 w-64 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-zinc-800/50 transition-transform duration-300 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Blood4U <span className="text-red-600">🩸</span>
          </h2>
          <button className="lg:hidden text-gray-500 hover:text-gray-900 dark:hover:text-white" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        {/* Role badge */}
        <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-xl bg-gray-100/50 dark:bg-zinc-800/30 backdrop-blur-sm flex items-center gap-2 border border-gray-200/20 dark:border-zinc-700/20">
          <div className={`w-2 h-2 rounded-full ${role === 'admin' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : role === 'donor' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : role === 'bankOwner' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            {role === 'bankOwner' ? 'Owner' : role.toUpperCase()}
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          {filteredLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.exact}
              onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${link.urgent ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : ''}
                ${isActive && !link.urgent ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' : ''}
                ${!isActive && !link.urgent ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white' : ''}
              `}
            >
              <link.icon size={18} />
              <span className="flex-1">{link.name}</span>
              {link.name === 'Chat' && totalUnreadChatCount > 0 && (
                <motion.span 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-5 h-5 bg-green-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                >
                  {totalUnreadChatCount}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200 dark:border-zinc-800 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
