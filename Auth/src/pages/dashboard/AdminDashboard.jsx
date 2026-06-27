import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Building2, Calendar, CheckCircle, XCircle, 
  Trash2, Shield, User as UserIcon, Building, MapPin, MessageSquare,
  Activity
} from 'lucide-react';
import { 
  deleteUserApi, updateBankStatusApi, updateEventStatusApi, 
  deleteRequestApi, deleteBankApi 
} from '../../features/data/dataSlice';
import toast from 'react-hot-toast';
import Button from '../../components/Button';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role } = useSelector((state) => state.auth);
  const { systemUsers, bloodBanks, events, requests } = useSelector((state) => state.data);

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const pendingBanks = (bloodBanks || []).filter(b => b.status === 'pending');
  const pendingEvents = (events || []).filter(e => e.status === 'pending');

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action is permanent.')) {
      try {
        await dispatch(deleteUserApi(id)).unwrap();
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error(error.message || 'Failed to delete user');
      }
    }
  };

  const handleBankStatus = async (id, status) => {
    try {
      await dispatch(updateBankStatusApi({ id, status })).unwrap();
      toast.success(`Blood bank ${status} successfully`);
    } catch (error) {
      toast.error(error.message || 'Failed to update bank status');
    }
  };

  const handleEventStatus = async (id, status) => {
    try {
      await dispatch(updateEventStatusApi({ id, status })).unwrap();
      toast.success(`Event ${status} successfully`);
    } catch (error) {
      toast.error(error.message || 'Failed to update event status');
    }
  };

  const handleDeleteRequest = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this blood request?')) {
      try {
        await dispatch(deleteRequestApi(id)).unwrap();
        toast.success('Request deleted successfully');
      } catch (error) {
        toast.error(error.message || 'Failed to delete request');
      }
    }
  };

  const handleDeleteBank = async (id) => {
    if (window.confirm('Are you sure you want to permanently remove this blood bank?')) {
      try {
        await dispatch(deleteBankApi(id)).unwrap();
        toast.success('Blood bank removed successfully');
      } catch (error) {
        toast.error(error.message || 'Failed to remove bank');
      }
    }
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Shield className="text-red-600" size={32} />
          System Administration
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
          Complete control over the Blood4U ecosystem. Manage registered users, verify medical licenses for blood banks, and approve community events.
        </p>
      </div>

      {/* Users Management - Horizontal Slider/List */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            Registered System Users ({(systemUsers || []).length})
          </h2>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
          {(systemUsers || []).map((user) => (
            <motion.div
              key={user.id}
              whileHover={{ y: -4 }}
              className="min-w-[280px] bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-gray-500">
                  <UserIcon size={24} />
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => navigate('/dashboard/chat', { state: { selectedDonor: { id: user.id, name: user.identifier, userId: user.id, role: user.role } } })}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Message User"
                  >
                    <MessageSquare size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white truncate">{user.identifier}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                  user.role === 'donor' ? 'bg-red-100 text-red-600' :
                  user.role === 'bankOwner' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {user.role}
                </span>
              </div>
            </motion.div>
          ))}
          {(systemUsers || []).length === 0 && (
            <div className="w-full py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-3xl">
              No registered users found in database.
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Blood Bank Approvals */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 size={20} className="text-purple-500" />
            Pending Bank Approvals ({pendingBanks.length})
          </h2>
          <div className="space-y-4">
            {pendingBanks.map(bank => (
              <div key={bank.id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{bank.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><MapPin size={14} /> {bank.city}</span>
                      <span className="text-gray-300 dark:text-zinc-700">|</span>
                      <span>License: <span className="text-gray-700 dark:text-zinc-300 font-medium">{bank.license || 'N/A'}</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-50 dark:border-zinc-800">
                  <Button 
                    onClick={() => handleBankStatus(bank.id, 'approved')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs py-2"
                  >
                    <CheckCircle size={14} className="mr-1.5" /> Approve
                  </Button>
                  <Button 
                    onClick={() => handleBankStatus(bank.id, 'rejected')}
                    variant="outline"
                    className="flex-1 text-xs py-2 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle size={14} className="mr-1.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
            {pendingBanks.length === 0 && (
              <div className="py-20 text-center bg-gray-50/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
                 <Building size={32} className="mx-auto text-gray-300 mb-3" />
                 <p className="text-sm text-gray-400">All blood banks have been processed.</p>
              </div>
            )}
          </div>
        </section>

        {/* Event Approvals */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} className="text-amber-500" />
            Pending Event Requests ({pendingEvents.length})
          </h2>
          <div className="space-y-4">
            {pendingEvents.map(event => (
              <div key={event.id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{event.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{event.city} • {event.date} at {event.time}</p>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-50 dark:border-zinc-800">
                  <Button 
                    onClick={() => handleEventStatus(event.id, 'approved')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs py-2"
                  >
                    <CheckCircle size={14} className="mr-1.5" /> Approve
                  </Button>
                  <Button 
                    onClick={() => handleEventStatus(event.id, 'rejected')}
                    variant="outline"
                    className="flex-1 text-xs py-2 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle size={14} className="mr-1.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
            {pendingEvents.length === 0 && (
              <div className="py-20 text-center bg-gray-50/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
                 <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
                 <p className="text-sm text-gray-400">No pending event requests.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Global Records Management */}
      <section className="mt-12 space-y-8">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white border-l-4 border-red-600 pl-4">
          Global System Records Management
        </h2>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Blood Requests List */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2 text-red-600"><Activity size={20} /> Active Blood Requests</span>
              <span className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-full text-gray-500">{requests.length} Total</span>
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {requests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{req.hospital}</p>
                    <p className="text-xs text-gray-500">{req.bloodGroup} Needed · {req.city}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteRequest(req.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {requests.length === 0 && <p className="text-center py-8 text-gray-400 text-sm italic">No active blood requests.</p>}
            </div>
          </div>

          {/* Blood Banks List */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2 text-purple-600"><Building size={20} /> Registered Blood Banks</span>
              <span className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-full text-gray-500">{bloodBanks.length} Total</span>
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {bloodBanks.map(bank => (
                <div key={bank.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{bank.name}</p>
                    <p className="text-xs text-gray-500">{bank.city} · Status: <span className={bank.status === 'approved' ? 'text-green-600' : 'text-amber-600'}>{bank.status}</span></p>
                  </div>
                  <button 
                    onClick={() => handleDeleteBank(bank.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {bloodBanks.length === 0 && <p className="text-center py-8 text-gray-400 text-sm italic">No blood banks registered.</p>}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
