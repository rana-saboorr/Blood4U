import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { addNotification, createBloodRequest, setEmergencyActive, fetchDashboardData } from '../../features/data/dataSlice';
import { socket } from '../../lib/socket';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { AlertTriangle, Send, X, Siren } from 'lucide-react';

const schema = yup.object().shape({
  bloodGroup: yup.string().required('Blood Group is required').oneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  units: yup.number().typeError('Must be a number').min(1).required('Units required'),
  hospital: yup.string().required('Hospital name is required'),
  city: yup.string().required('City is required'),
  contact: yup.string().required('Contact is required'),
  address: yup.string().required('Address is required'),
});

export default function EmergencyRequest() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { emergencyActive, requests } = useSelector(state => state.data);
  const { user, role } = useSelector(state => state.auth);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const hasActiveRequest = role !== 'admin' && requests.some(r => r.userId === user?._id && ['pending', 'approved'].includes(r.status));

  if (hasActiveRequest && !submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 text-center border border-amber-200 dark:border-amber-900/50 shadow-xl shadow-amber-500/5">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Active Request In Progress</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            System policy allows only <strong>one active blood request</strong> at a time. Your previous request is still active. Please mark it as fulfilled or contact support to proceed.
          </p>
          <Button onClick={() => navigate('/dashboard/requests')} className="w-auto px-8 bg-zinc-900 dark:bg-white dark:text-zinc-900">
            Manage My Requests
          </Button>
        </div>
      </div>
    );
  }
  const onSubmit = async (data) => {
    await dispatch(createBloodRequest({
      ...data,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reason: 'Emergency',
      urgent: true,
    })).unwrap();

    dispatch(setEmergencyActive(true));

    const broadcastData = {
      type: 'emergency',
      title: `🚨 EMERGENCY: ${data.bloodGroup} needed in ${data.city}!`,
      body: `Critical ${data.units} unit(s) of ${data.bloodGroup} blood needed at ${data.hospital}. Please respond immediately.`,
      bloodGroup: data.bloodGroup,
      city: data.city,
      hospital: data.hospital
    };

    dispatch(addNotification(broadcastData));
    
    // Broadcast to all connected users
    if (socket.connected) {
      socket.emit('emergency:sos:broadcast', broadcastData);
    }

    // Save persistent notification to DB
    try {
      await apiRequest('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          ...broadcastData,
          recipients: ['all']
        })
      });
    } catch (e) {
      console.error('Failed to save persistent notification');
    }

    toast.error('🚨 Emergency broadcast sent to all nearby donors!', { duration: 6000 });
    dispatch(fetchDashboardData());
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-red-200 dark:border-red-900/50 shadow-2xl shadow-red-500/10"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Siren className="text-red-600" size={48} />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Emergency Broadcast Sent!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
            Your critical request has been broadcasted to all available donors in the area. Please keep your phone line open.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8 text-center">
            {['Donors Notified', 'Avg. Response Time', 'Est. Blood Banks'].map((label, i) => (
              <div key={i} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                <p className="text-2xl font-bold text-red-600">{['12', '8 min', '3'][i]}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => { setSubmitted(false); dispatch(setEmergencyActive(false)); }} variant="secondary" className="w-auto px-8">
            <X size={18} className="mr-2" /> Close Emergency
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-8 text-white"
      >
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-white/5 rounded-3xl"
        />
        <div className="relative z-10 flex items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
            className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shrink-0"
          >
            <AlertTriangle size={36} />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold">🚨 Emergency Blood Request</h1>
            <p className="text-red-100 mt-1">
              This will instantly broadcast to <strong>all nearby donors</strong> and appears as a priority alert system-wide.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-900 dark:text-white">Blood Group Needed <span className="text-red-500">*</span></label>
              <select {...register('bloodGroup')} className={`w-full px-4 py-3 rounded-xl border outline-none transition-all bg-transparent text-gray-900 dark:text-white dark:bg-zinc-800/50 ${errors.bloodGroup ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'}`}>
                <option className="dark:bg-zinc-800" value="">Select Group</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option className="dark:bg-zinc-800" key={bg} value={bg}>{bg}</option>)}
              </select>
              {errors.bloodGroup && <span className="text-xs text-red-500">{errors.bloodGroup.message}</span>}
            </div>
            <Input label="Units Needed *" type="number" placeholder="2" {...register('units')} error={errors.units?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Hospital Name *" placeholder="Services Hospital" {...register('hospital')} error={errors.hospital?.message} />
            <Input label="City *" placeholder="Rawalpindi" {...register('city')} error={errors.city?.message} />
          </div>

          <Input label="Contact Number *" placeholder="+923001234567" {...register('contact')} error={errors.contact?.message} />
          <Input label="Full Address *" placeholder="Ward 5, Emergency Block" {...register('address')} error={errors.address?.message} />

          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl text-sm text-red-700 dark:text-red-400">
            ⚠️ By submitting this form, you confirm this is a genuine medical emergency. Misuse may result in account suspension.
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-lg py-4 shadow-xl shadow-red-600/30 flex items-center gap-2 justify-center">
            <Send size={20} /> Broadcast Emergency Now
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
