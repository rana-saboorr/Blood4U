import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Building2, Calendar, CheckCircle, XCircle, 
  Trash2, Shield, User as UserIcon, Building, MapPin, MessageSquare,
  Activity, Clock
} from 'lucide-react';
import { 
  deleteUserApi, updateBankStatusApi, updateEventStatusApi, 
  deleteRequestApi, deleteBankApi 
} from '../../features/data/dataSlice';
import toast from 'react-hot-toast';
import Button from '../../components/Button';

const ROLE_BADGE = {
  admin:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  donor:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  bankOwner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  user:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } } };

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role } = useSelector((state) => state.auth);
  const { systemUsers, bloodBanks, events, requests } = useSelector((state) => state.data);

  if (role !== 'admin') return <Navigate to="/dashboard" replace />;

  const pendingBanks  = (bloodBanks || []).filter(b => b.status === 'pending');
  const pendingEvents = (events   || []).filter(e => e.status === 'pending');

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try { await dispatch(deleteUserApi(id)).unwrap(); toast.success('User deleted'); }
    catch (e) { toast.error(e.message || 'Failed'); }
  };

  const handleBankStatus = async (id, status) => {
    try { await dispatch(updateBankStatusApi({ id, status })).unwrap(); toast.success(`Bank ${status}`); }
    catch (e) { toast.error(e.message || 'Failed'); }
  };

  const handleEventStatus = async (id, status) => {
    try { await dispatch(updateEventStatusApi({ id, status })).unwrap(); toast.success(`Event ${status}`); }
    catch (e) { toast.error(e.message || 'Failed'); }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Delete this blood request permanently?')) return;
    try { await dispatch(deleteRequestApi(id)).unwrap(); toast.success('Request deleted'); }
    catch (e) { toast.error(e.message || 'Failed'); }
  };

  const handleDeleteBank = async (id) => {
    if (!window.confirm('Permanently remove this blood bank?')) return;
    try { await dispatch(deleteBankApi(id)).unwrap(); toast.success('Blood bank removed'); }
    catch (e) { toast.error(e.message || 'Failed'); }
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-56 h-56 bg-red-500/5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 relative">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
            <Shield className="text-red-600" size={22} />
          </div>
          System Administration
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl relative">
          Complete control over the Blood4U ecosystem — manage users, verify medical licenses, and approve community events.
        </p>
        <div className="flex flex-wrap gap-4 mt-5 relative">
          {[
            { label: 'Users',         val: (systemUsers||[]).length, icon: Users,     color: 'text-blue-600'  },
            { label: 'Blood Banks',   val: (bloodBanks ||[]).length, icon: Building2, color: 'text-purple-600'},
            { label: 'Requests',      val: (requests   ||[]).length, icon: Activity,  color: 'text-red-600'   },
            { label: 'Pending',       val: pendingBanks.length + pendingEvents.length, icon: Clock, color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="clay-card px-5 py-3 flex items-center gap-3">
              <s.icon size={18} className={s.color} />
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{s.val}</p>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Users Slider */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            Registered Users
            <span className="ml-1 text-sm font-normal text-gray-400">({(systemUsers||[]).length})</span>
          </h2>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex gap-4 overflow-x-auto pb-3 px-1 scrollbar-hide"
        >
          {(systemUsers||[]).map(user => (
            <motion.div
              key={user.id}
              variants={item}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
              className="min-w-[260px] clay-card p-5 shrink-0"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-gray-500">
                  <UserIcon size={20} />
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => navigate('/dashboard/chat', { state: { selectedDonor: { id: user.id, name: user.identifier, userId: user.id, role: user.role } } })}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="Message User"
                  >
                    <MessageSquare size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete User"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm">{user.identifier}</h3>
              <span className={`mt-1 inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role] || ROLE_BADGE.user}`}>
                {user.role}
              </span>
            </motion.div>
          ))}
          {(systemUsers||[]).length === 0 && (
            <div className="w-full py-10 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl">
              No registered users found.
            </div>
          )}
        </motion.div>
      </section>

      {/* Approvals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bank Approvals */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 size={20} className="text-purple-500" />
            Pending Bank Approvals
            {pendingBanks.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold rounded-full">
                {pendingBanks.length}
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {pendingBanks.map(bank => (
              <motion.div
                key={bank.id || bank._id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-5 rounded-2xl space-y-3"
              >
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">{bank.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin size={13} /> {bank.city}</span>
                    <span className="text-gray-300 dark:text-zinc-700">|</span>
                    <span>License: <span className="font-medium text-gray-700 dark:text-zinc-300">{bank.license || 'N/A'}</span></span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <Button onClick={() => handleBankStatus(bank.id || bank._id, 'approved')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs py-2">
                    <CheckCircle size={14} className="mr-1.5" /> Approve
                  </Button>
                  <Button onClick={() => handleBankStatus(bank.id || bank._id, 'rejected')} variant="outline" className="flex-1 text-xs py-2 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <XCircle size={14} className="mr-1.5" /> Reject
                  </Button>
                </div>
              </motion.div>
            ))}
            {pendingBanks.length === 0 && (
              <div className="py-16 text-center glass-panel rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                <Building size={32} className="mx-auto text-gray-300 dark:text-zinc-700 mb-2" />
                <p className="text-sm text-gray-400">All blood banks processed.</p>
              </div>
            )}
          </div>
        </section>

        {/* Event Approvals */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} className="text-amber-500" />
            Pending Event Requests
            {pendingEvents.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold rounded-full">
                {pendingEvents.length}
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {pendingEvents.map(event => (
              <motion.div
                key={event.id || event._id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-5 rounded-2xl space-y-3"
              >
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">{event.name || event.eventName}</h3>
                  <p className="text-sm text-gray-500 mt-1">{event.city} • {event.date} {event.time ? `at ${event.time}` : ''}</p>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <Button onClick={() => handleEventStatus(event.id || event._id, 'approved')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs py-2">
                    <CheckCircle size={14} className="mr-1.5" /> Approve
                  </Button>
                  <Button onClick={() => handleEventStatus(event.id || event._id, 'rejected')} variant="outline" className="flex-1 text-xs py-2 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <XCircle size={14} className="mr-1.5" /> Reject
                  </Button>
                </div>
              </motion.div>
            ))}
            {pendingEvents.length === 0 && (
              <div className="py-16 text-center glass-panel rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                <Calendar size={32} className="mx-auto text-gray-300 dark:text-zinc-700 mb-2" />
                <p className="text-sm text-gray-400">No pending event requests.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Global Records */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white border-l-4 border-red-600 pl-4">
          Global System Records
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Requests */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-base font-bold mb-5 flex items-center justify-between">
              <span className="flex items-center gap-2 text-red-600"><Activity size={18} /> Active Blood Requests</span>
              <span className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-full text-gray-500">{requests.length} Total</span>
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {requests.map(req => (
                <div key={req.id || req._id} className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-zinc-800/50 rounded-xl group">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">{req.hospital || req.hospitalName}</p>
                    <p className="text-xs text-gray-500">{req.bloodGroup} Needed · {req.city}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteRequest(req.id || req._id)}
                    className="ml-3 p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {requests.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No active blood requests.</p>}
            </div>
          </div>

          {/* Banks */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-base font-bold mb-5 flex items-center justify-between">
              <span className="flex items-center gap-2 text-purple-600"><Building size={18} /> Registered Blood Banks</span>
              <span className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-full text-gray-500">{bloodBanks.length} Total</span>
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {bloodBanks.map(bank => (
                <div key={bank.id || bank._id} className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-zinc-800/50 rounded-xl group">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">{bank.name}</p>
                    <p className="text-xs text-gray-500">
                      {bank.city} · Status: <span className={bank.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'}>{bank.status}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBank(bank.id || bank._id)}
                    className="ml-3 p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {bloodBanks.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No blood banks registered.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
