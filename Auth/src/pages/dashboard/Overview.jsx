import { Users, Droplet, Building2, Calendar, Activity, Newspaper, TrendingUp, Zap, AlertTriangle, CheckCircle2, MapPin, Package, Clock, MessageSquare, Plus, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Counter from '../../components/Counter';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { 
  updateMyDonorProfileApi, 
  logManualDonationApi, 
  fetchDashboardData,
  fetchMyDonorProfileApi
} from '../../features/data/dataSlice';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

export default function Overview() {
  const dispatch = useDispatch();
  const { role, user } = useSelector(state => state.auth);
  const { 
    news, 
    stats: systemStats, 
    myDonorProfile, 
    requests, 
    bloodBanks,
  } = useSelector(state => state.data);

  const stats = [
    { label: 'Registered Users', value: systemStats.totalUsers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30', link: null },
    { label: 'Active Donors', value: systemStats.activeDonors, icon: Droplet, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', link: '/dashboard/search' },
    { label: 'Total Requests', value: systemStats.totalRequests, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', link: '/dashboard/requests' },
    { label: 'Approved Banks', value: systemStats.totalBanks, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', link: '/dashboard/banks' },
    { label: 'Events Active', value: systemStats.totalEvents, icon: Calendar, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', link: role === 'admin' ? '/dashboard/events' : '/dashboard/upcoming-events' },
  ];

  const roleMessages = {
    admin: {
      title: 'Admin Control Panel',
      body: 'Manage the entire Blood4U network. Approve blood banks, broadcast news, and monitor system health.',
      cta: 'Go to Analytics',
      link: '/dashboard/analytics',
      color: 'from-purple-600 to-purple-700',
    },
    donor: {
      title: 'Thank You, Hero! 🩸',
      body: 'Your generosity saves lives. Check active requests and see if you\'re needed in your city right now.',
      cta: 'View Requests',
      link: '/dashboard/requests',
      color: 'from-red-600 to-red-700',
    },
    user: {
      title: 'Find a Donor Today',
      body: 'Blood4U connects you with verified donors in your city instantly using our Smart Matching engine.',
      cta: 'Smart Match',
      link: '/dashboard/search',
      color: 'from-blue-600 to-blue-700',
    },
    bankOwner: {
      title: 'Manage Your Blood Bank',
      body: 'Keep your stock updated and respond to emergency requests in your city instantly.',
      cta: 'Manage Stock',
      link: '/dashboard/banks',
      color: 'from-purple-600 to-purple-700',
    }
  };



  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [donateForm, setDonateForm] = useState({ location: '', quantity: '1 Bag' });

  useEffect(() => {
    if (role === 'donor') {
      dispatch(fetchMyDonorProfileApi());
    }
  }, [dispatch, role]);

  const handleToggleAvailability = async () => {
    if (!myDonorProfile) return;
    
    // Spec rule: Don't allow toggle to true if resting
    if (myDonorProfile.isResting && !myDonorProfile.available) {
      toast.error('You are currently in recovery mode and cannot toggle availability.');
      return;
    }

    try {
      await dispatch(updateMyDonorProfileApi({ available: !myDonorProfile.available })).unwrap();
      toast.success(myDonorProfile.available ? 'You are now offline.' : 'You are now available for donation!');
    } catch (error) {
      toast.error(error.message || 'Failed to update availability');
    }
  };

  const handleLogDonation = async (e) => {
    e.preventDefault();
    try {
      await dispatch(logManualDonationApi(donateForm)).unwrap();
      toast.success('Donation logged! You are now in recovery mode for 90 days.');
      setIsDonateModalOpen(false);
      dispatch(fetchDashboardData());
    } catch (error) {
      toast.error(error.message || 'Failed to log donation');
    }
  };

  // Bank Owner logic
  const myBank = bloodBanks.find(b => b.ownerUserId === user?._id);
  const bankCity = myBank?.city || user?.city;
  const cityRequests = requests.filter(r =>
    (bankCity && r.city?.toLowerCase() === bankCity.toLowerCase()) || r.urgent
  ).filter(r => r.status === 'approved');

  const rm = roleMessages[role] || roleMessages.user;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-2">Dashboard</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Welcome back, <span className="text-red-600">{user?.identifier || 'User'}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {stats.map((stat) => {
          const card = (
            <motion.div
              variants={item}
              className="p-5 glass-panel rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-3 hover:shadow-lg transition-all cursor-pointer-interactive group spotlight-group"
            >
              <div className={`p-3 rounded-xl shrink-0 ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={22} />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                  <Counter to={stat.value} />
                </h3>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-500 mt-0.5 leading-tight uppercase tracking-wider">{stat.label}</p>
              </div>
            </motion.div>
          );

          return stat.link ? (
            <NavLink key={stat.label} to={stat.link}>{card}</NavLink>
          ) : (
            <div key={stat.label}>{card}</div>
          );
        })}
      </motion.div>

      {/* Special Sections Based on Role */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Donor Controls */}
          {role === 'donor' && myDonorProfile && (
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-6 items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${myDonorProfile.available ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Availability Status</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {myDonorProfile.available 
                    ? "You are currently visible to patients and hospitals. Switch off if you're busy." 
                    : "You are hidden from searches. Switch on to start saving lives today!"}
                </p>
                {myDonorProfile.isResting && (
                  <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Clock size={14} /> Recovery Mode: Active until {myDonorProfile.lastDonation}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <button
                  onClick={handleToggleAvailability}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none 
                    ${myDonorProfile.available ? 'bg-red-600' : 'bg-gray-300 dark:bg-zinc-700'}
                    ${myDonorProfile.isResting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${myDonorProfile.available ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
                <div className="h-10 w-px bg-gray-100 dark:bg-zinc-800 mx-2 hidden md:block" />
                <Button 
                  onClick={() => setIsDonateModalOpen(true)}
                  disabled={myDonorProfile.isResting}
                  className="bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800"
                >
                  Donate Blood Today
                </Button>
              </div>
            </motion.div>
          )}

          {/* Bank Owner Section */}
          {role === 'bankOwner' && (
            <div className="space-y-6">
              {myBank ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center">
                        <Building2 size={28} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{myBank.name}</h2>
                        <p className="text-sm text-gray-500">{myBank.city} · Approved & Active</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <NavLink to={`/dashboard/banks`} className="flex-1 md:flex-none">
                        <Button variant="outline" className="w-full text-xs">Edit Info</Button>
                      </NavLink>
                      <NavLink to={`/dashboard/banks`} className="flex-1 md:flex-none">
                        <Button className="w-full text-xs bg-purple-600">Update Stock</Button>
                      </NavLink>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['A+', 'B+', 'O+', 'AB+'].map(group => (
                      <div key={group} className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{group} Stock</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{myBank.bloodStock[group] || 0} Units</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-200 dark:border-amber-900/30">
                  <h3 className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2">
                    <AlertTriangle size={18} /> Registration Pending
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-1">
                    Your blood bank registration is currently awaiting admin approval. You will be notified once active.
                  </p>
                </div>
              )}

              {/* Local Requests for Bank Owners */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                    <Activity size={20} className="text-red-600" /> {bankCity ? `Requests in ${bankCity} & Emergencies` : 'Active Requests'}
                  </h3>
                  <NavLink to="/dashboard/requests" className="text-xs text-red-600 font-bold hover:underline">View All →</NavLink>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cityRequests.slice(0, 4).map(req => (
                    <div key={req.id} className="relative p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center font-bold text-xs">{req.bloodGroup}</span>
                        {req.urgent && <Zap size={14} className="text-orange-500 fill-orange-500" />}
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{req.hospital}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{req.units} Units needed · {req.date}</p>
                      {req.userId !== user?._id && (
                        <NavLink 
                          to="/dashboard/chat" 
                          className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:scale-110 transition-transform"
                          title="Chat with Requester"
                        >
                          <MessageSquare size={14} />
                        </NavLink>
                      )}
                    </div>
                  ))}
                  {cityRequests.length === 0 && (
                    <div className="col-span-full py-10 text-center text-gray-400 text-sm">No active requests in your city.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Common News Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                <Newspaper size={20} />
              </div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Broadcasts & Announcements</h2>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              {news.map((item) => (
                <div key={item.id} className="px-6 py-5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{item.title}</h3>
                    <span className="text-xs text-gray-400 font-medium">{item.date}</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.content}</p>
                </div>
              ))}
              {news.length === 0 && (
                <div className="py-16 text-center text-gray-400">
                  <Activity size={40} className="mx-auto mb-3 opacity-20" />
                  <p>No new broadcasts today.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Actions Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className={`p-6 bg-gradient-to-br ${rm.color} rounded-[2rem] text-white relative overflow-hidden shadow-xl shadow-red-500/10 min-h-[320px] flex flex-col justify-between`}
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
                {role === 'admin' ? <TrendingUp size={28} /> : role === 'donor' ? <CheckCircle2 size={28} /> : <Zap size={28} />}
              </div>
              <h3 className="text-3xl font-black mb-3 leading-tight">{rm.title}</h3>
              <p className="text-white/80 text-base leading-relaxed">{rm.body}</p>
            </div>
            <NavLink
              to={rm.link}
              className="relative z-10 inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-zinc-900 rounded-2xl text-base font-bold transition-all hover:scale-[1.02] active:scale-95"
            >
              {rm.cta} <TrendingUp size={18} />
            </NavLink>
          </motion.div>

          {/* Side Shortcuts */}
          <div className="grid grid-cols-1 gap-4">
            <NavLink to="/dashboard/chat" className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-4 hover:border-red-200 transition-all group">
              <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Messages</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Contact Donors & Patients</p>
              </div>
            </NavLink>

            {role === 'bankOwner' && (
              <NavLink to="/dashboard/events" className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-4 hover:border-purple-200 transition-all group">
                <div className="w-11 h-11 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Hold Event</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Create a blood drive camp</p>
                </div>
              </NavLink>
            )}
          </div>
          
          {/* Emergency Alert Widget */}
          {role !== 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-3xl"
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-black text-red-900 dark:text-red-400 text-lg">Blood Emergency?</h3>
              <p className="text-red-700/80 dark:text-red-400/70 text-sm mt-2 leading-relaxed mb-6">
                Broadcast an instant SOS alert to all compatible donors in your city.
              </p>
              <NavLink to="/dashboard/emergency">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white shadow-red-600/20">🚨 Launch SOS Alert</Button>
              </NavLink>
            </motion.div>
          )}

        </div>
      </div>

      {/* Donate Today Modal */}
      <AnimatePresence>
        {isDonateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setIsDonateModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 dark:border-zinc-800"
            >
              <div className="bg-red-600 p-8 text-white relative">
                <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
                <button 
                  onClick={() => setIsDonateModalOpen(false)}
                  className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-xl">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-2xl font-black">Logged a Donation?</h2>
                  <p className="text-red-100 text-sm mt-1">Help us track your impact and safety.</p>
                </div>
              </div>

              <form onSubmit={handleLogDonation} className="p-8 space-y-5">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/30 flex gap-3">
                  <Clock className="text-amber-600 shrink-0" size={18} />
                  <p className="text-xs text-amber-800 dark:text-amber-500 font-medium">
                    Logging this will put you in <strong>90-day recovery mode</strong>. You won't be visible to search for 3 months.
                  </p>
                </div>

                <Input 
                  label="Donation Location" 
                  placeholder="e.g. City General Hospital" 
                  value={donateForm.location}
                  onChange={e => setDonateForm(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
                <Input 
                  label="Quantity Donated" 
                  placeholder="e.g. 1 Bag (450ml)" 
                  value={donateForm.quantity}
                  onChange={e => setDonateForm(prev => ({ ...prev, quantity: e.target.value }))}
                  required
                />

                <div className="pt-2">
                  <Button type="submit" className="w-full bg-red-600 py-4 text-base">
                    Confirm & Start Recovery
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
