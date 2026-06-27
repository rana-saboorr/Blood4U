import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { fetchDashboardData, registerDonorApi } from '../../features/data/dataSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { HeartPulse, CheckCircle2 } from 'lucide-react';
import { fetchMe } from '../../features/auth/authSlice';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const schema = yup.object().shape({
  fullName: yup.string().required('Full name is required'),
  contact: yup.string()
    .required('Mobile number is required')
    .matches(/^0\d{10}$/, 'Must be a valid 11-digit Pakistan number (starting with 0)'),
  bloodGroup: yup.string().required('Blood Group is required').oneOf(BLOOD_GROUPS),
  city: yup.string().required('City is required'),
  dob: yup.date()
    .typeError('Invalid date')
    .max(new Date(new Date().setFullYear(new Date().getFullYear() - 18)), 'Must be at least 18 years old')
    .required('Date of birth is required'),
  weight: yup.number()
    .typeError('Must be a number')
    .min(50, 'Must be at least 50kg')
    .required('Weight is required'),
  gender: yup.string().required('Gender is required').oneOf(['Male', 'Female', 'Other']),
  paid: yup.string().required(),
  available: yup.string().required(),
});

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

export default function BecomeDonor() {
  const { role } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { paid: 'false', available: 'true', dob: '2008-01-01' }
  });

  if (role === 'donor') {
    return (
      <div className="flex flex-col items-center justify-center max-w-2xl mx-auto py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">You are a confirmed Donor! 🎉</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed">
          Thank you for stepping up to save lives. You can now browse active blood requests and connect with people in need.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => navigate('/dashboard/requests')} className="w-auto px-6">View Requests</Button>
          <Button onClick={() => navigate('/dashboard/history')} variant="secondary" className="w-auto px-6">My Donations</Button>
        </div>
      </div>
    );
  }

  const [coords, setCoords] = useState({ lat: null, lng: null });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Silent fallback if location permission denied
        }
      );
    }
  }, []);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        lat: coords.lat,
        lng: coords.lng,
      };
      await dispatch(registerDonorApi(payload)).unwrap();
      await dispatch(fetchMe()).unwrap();
      await dispatch(fetchDashboardData()).unwrap();
      toast.success('Congratulations! You are now a registered donor. 🩸');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to register as donor');
    }
  };


  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-t-3xl text-white text-center"
      >
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10">
          <HeartPulse size={48} className="mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold">Become a Donor</h1>
          <p className="mt-2 text-red-100/80">Your single drop of blood can save up to 3 lives.</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white dark:bg-zinc-900 p-8 rounded-b-3xl shadow-xl border border-t-0 border-gray-200 dark:border-zinc-800"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" placeholder="John Doe" {...register('fullName')} error={errors.fullName?.message} />
            <Input label="Contact Number" placeholder="+923001234567" {...register('contact')} error={errors.contact?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Blood Group" error={errors.bloodGroup?.message} {...register('bloodGroup')}>
              <option value="">Select Group</option>
              {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </SelectField>
            <Input label="City" placeholder="Lahore" {...register('city')} error={errors.city?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Date of Birth (18+ required)" 
              type="date" 
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              {...register('dob')} 
              error={errors.dob?.message} 
            />
            <Input label="Weight in kg (50kg minimum)" type="number" placeholder="65" {...register('weight')} error={errors.weight?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Gender" error={errors.gender?.message} {...register('gender')}>
              <option value="">Select Gender</option>
              {['Male', 'Female', 'Other'].map(g => <option key={g} value={g}>{g}</option>)}
            </SelectField>
            <SelectField label="Donation Type" {...register('paid')}>
              <option value="false">Volunteer (Free)</option>
              <option value="true">Paid Donor</option>
            </SelectField>
          </div>

          <SelectField label="Are you willing to donate right now?" {...register('available')}>
            <option value="true">✅ Yes, I am currently available</option>
            <option value="false">🔴 No, I'm unavailable right now</option>
          </SelectField>

          <div className="border-t border-gray-100 dark:border-zinc-800 pt-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Optional Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Instagram / Social" placeholder="@username" />
              <Input label="WhatsApp" placeholder="+923001234567" />
            </div>
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full text-base py-3.5 shadow-xl shadow-red-500/20">
            Register as Donor
          </Button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
            By registering, you confirm that your information is legitimate and you agree to undergo medical screening prior to donation.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
