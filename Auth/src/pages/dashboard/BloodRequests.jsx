import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createBloodRequest, donateToRequestApi, fetchDashboardData, deleteRequestApi } from '../../features/data/dataSlice';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Plus, X, Search, CheckCircle, XCircle, Activity, AlertTriangle, Trash2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Any'];

const SelectField = ({ label, error, children, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <select
      className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
        bg-white dark:bg-zinc-800 text-gray-900 dark:text-white
        ${error ? 'border-red-400 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200 dark:border-zinc-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'}`}
      {...props}
    >
      {children}
    </select>
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
);

const schema = yup.object().shape({
  bloodGroup: yup.string().required('Blood Group is required').oneOf(BLOOD_GROUPS),
  units: yup.number().typeError('Must be a number').min(1, 'Minimum 1 unit').required('Quantity is required'),
  date: yup.date()
    .typeError('Invalid date')
    .min(new Date(new Date().setHours(0,0,0,0)), 'Date cannot be in the past')
    .required('Date is required'),
  time: yup.string().required('Time is required'),
  hospitalName: yup.string().required('Hospital name is required'),
  city: yup.string().required('City is required'),
  reason: yup.string().required('Reason is required'),
  mobileNumber: yup.string()
    .required('Contact Number is required')
    .matches(/^\d{11}$/, 'Must be exactly 11 digits, containing only numbers'),
  fullAddress: yup.string().required('Full Address is required'),
});

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  fulfilled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function BloodRequests() {
  const { role, user } = useSelector(state => state.auth);
  const { requests } = useSelector(state => state.data);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const formattedDate = typeof data.date === 'string' ? data.date : data.date.toISOString().split('T')[0];
      await dispatch(createBloodRequest({ ...data, date: formattedDate })).unwrap();
      toast.success('Blood request submitted!');
      reset();
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message || 'Failed to submit request');
    }
  };

  const handleDonateNow = async (requestId) => {
    const didDonate = window.confirm('Did you donate blood? Click OK for Yes, Cancel for No.');
    if (!didDonate) {
      toast('No donation recorded.', { icon: 'ℹ️' });
      return;
    }

    try {
      await dispatch(donateToRequestApi(requestId)).unwrap();
      await dispatch(fetchDashboardData()).unwrap();
      toast.success('Thank you. Donation recorded successfully.');
    } catch (error) {
      toast.error(error.message || 'Failed to record donation.');
    }
  };

  const handleDeleteRequest = async (id) => {
    if (window.confirm('Delete this blood request permanently? This will remove it for all users.')) {
      try {
        await dispatch(deleteRequestApi(id)).unwrap();
        toast.success('Request deleted permanently');
      } catch {
        toast.error('Failed to delete request');
      }
    }
  };

  const filteredRequests = requests.filter(req =>
    req.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.hospitalName || req.hospital || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="text-red-600" size={26} /> Active Blood Requests
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {role === 'admin' ? 'Manage and approve incoming blood requests.' : 'View active requests or submit a new one.'}
          </p>
        </div>
        {['user', 'donor', 'admin'].includes(role) && (
          <Button onClick={() => setIsModalOpen(true)} className="shrink-0 w-auto px-6">
            <Plus size={18} /> New Request
          </Button>
        )}
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel px-4 py-3 rounded-2xl flex items-center gap-3"
      >
        <Search className="text-red-500 shrink-0" size={18} />
        <input
          type="text"
          placeholder="Search by city, hospital, or blood group..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-red-500 transition-colors text-xs">✕</button>
        )}
      </motion.div>

      {/* Request Cards */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center glass-panel rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700">
            <Activity className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" size={40} />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No blood requests found.</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search or create a new request.</p>
          </div>
        ) : (
          filteredRequests.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`clay-card flex flex-col md:flex-row gap-4 p-5 transition-all ${
                req.urgent ? 'ring-2 ring-red-500/30 dark:ring-red-700/40' : 'hover:shadow-lg'
              }`}
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex flex-col justify-center items-center border-2 border-red-200 dark:border-red-900/50">
                    <span className="font-bold text-xl leading-none">{req.bloodGroup}</span>
                    <span className="text-[9px] font-bold uppercase mt-0.5 opacity-60">Group</span>
                  </div>
                  {req.urgent && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center" title="Urgent">
                      <AlertTriangle size={10} className="text-white" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{req.hospital}</h3>
                    {req.urgent && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full uppercase">Urgent</span>}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Need:</span> {req.units} unit{req.units > 1 ? 's' : ''} · {req.reason}</p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Location:</span> {req.address}, {req.city}</p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">When:</span> {req.date} at {req.time}</p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Contact:</span> {req.contact}</p>
                    {req.userId === user?._id && req.matchedDonors?.length > 0 && (
                      <p className="text-red-600 dark:text-red-400 font-bold text-[10px] mt-1 uppercase flex items-center gap-1">
                        <Activity size={12} /> {req.matchedDonors.length} Potential Donors Matched!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3 shrink-0 md:min-w-[150px]">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[req.status] || STATUS_STYLES.pending}`}>
                  {req.status}
                </span>
                
                <div className="flex flex-row md:flex-col lg:flex-row gap-2 w-full md:w-auto">
                  {role === 'donor' && ['pending', 'approved'].includes(req.status) && (
                    <Button variant="outline" className="text-[10px] py-1.5 px-3 flex-1 md:flex-none" onClick={() => handleDonateNow(req.id)}>
                      Donate Now
                    </Button>
                  )}
                  {req.userId !== user?._id && (
                    <Button 
                      variant="outline" 
                      className="text-[10px] py-1.5 px-3 flex-1 md:flex-none border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/10" 
                      onClick={() => navigate(`/dashboard/chat`)}
                    >
                      <MessageSquare size={13} className="mr-1" /> Chat
                    </Button>
                  )}
                </div>
                {role === 'admin' && (
                  <button 
                    onClick={() => handleDeleteRequest(req.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Permanently"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Request Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="glass-panel rounded-2xl w-full max-w-2xl my-4 shadow-2xl border border-white/40 dark:border-zinc-700"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus size={20} className="text-red-600" /> New Blood Request
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField label="Blood Group" error={errors.bloodGroup?.message} {...register('bloodGroup')}>
                    <option value="">Select Group</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </SelectField>
                  <Input label="Units Needed" type="number" placeholder="2" {...register('units')} error={errors.units?.message} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Required Date" type="date" {...register('date')} error={errors.date?.message} />
                  <Input label="Required Time" type="time" {...register('time')} error={errors.time?.message} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Hospital Name" placeholder="City General Hospital" {...register('hospitalName')} error={errors.hospitalName?.message} />
                  <Input label="City" placeholder="Lahore" {...register('city')} error={errors.city?.message} />
                </div>

                <Input label="Reason for Need" placeholder="e.g. Open Heart Surgery" {...register('reason')} error={errors.reason?.message} />
                <Input label="Contact Number" placeholder="+923001234567" {...register('mobileNumber')} error={errors.mobileNumber?.message} />
                <Input label="Full Address" placeholder="Ward 5, Emergency Block" {...register('fullAddress')} error={errors.fullAddress?.message} />

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="w-auto px-6">Cancel</Button>
                  <Button type="submit" className="w-auto px-8">Submit Request</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
