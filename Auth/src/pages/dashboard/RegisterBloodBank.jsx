import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { registerBloodBankApi } from '../../features/data/dataSlice';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Building2, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchMe } from '../../features/auth/authSlice';
import { motion } from 'framer-motion';

const schema = yup.object().shape({
  name: yup.string().required('Organization name is required'),
  contact: yup.string()
    .required('Contact number is required')
    .matches(/^0\d{10}$/, 'Must be a valid 11-digit Pakistan phone number (starting with 0)'),
  address: yup.string().required('Street location is required'),
  city: yup.string().required('City is required'),
  license: yup.string().required('Medical license registration number is required'),
});

export default function RegisterBloodBank() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm({
    resolver: yupResolver(schema)
  });

  const handleAutoFillAddress = async () => {
    if (!coords) { toast.error('Location not captured. Please enable GPS.'); return; }
    const id = toast.loading('Detecting address...');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`);
      const data = await res.json();
      toast.dismiss(id);
      if (data.display_name) {
        setValue('address', data.display_name);
        const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb;
        if (cityName) setValue('city', cityName);
        toast.success('Address auto-filled!');
      } else throw new Error();
    } catch {
      toast.dismiss(id);
      setValue('address', `${coords.lat}, ${coords.lng}`);
      toast.success('Address set to GPS coordinates');
    }
  };

  const { bloodBanks } = useSelector(state => state.data);
  const { user } = useSelector(state => state.auth);
  const hasBank = bloodBanks.some(b => (b.ownerUserId === user?._id || b.ownerUserId?._id === user?._id));

  if (hasBank) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center max-w-2xl mx-auto py-24 text-center"
      >
        <div className="w-24 h-24 clay-card rounded-full flex items-center justify-center mb-6">
          <Building2 size={40} className="text-red-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">You already manage a Blood Bank!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed max-w-md">
          System policy allows one blood bank registration per user account. You can manage your existing bank or contact support.
        </p>
        <Button onClick={() => navigate('/dashboard/banks')} className="px-8">View My Bank</Button>
      </motion.div>
    );
  }

  const onSubmit = async (data) => {
    try {
      const submissionData = { 
        ...data, 
        location: coords ? { type: 'Point', coordinates: [coords.lng, coords.lat] } : undefined 
      };
      await dispatch(registerBloodBankApi(submissionData)).unwrap();
      await dispatch(fetchMe()).unwrap();
      toast.success('Registration submitted! Pending Admin approval.');
      reset();
      navigate('/dashboard/banks');
    } catch (error) {
      toast.error(error.message || 'Failed to submit application');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto glass-panel rounded-3xl overflow-hidden"
    >
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <Building2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Register Blood Bank</h1>
            <p className="text-red-100">Attach your organization to the Blood4U network.</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Location Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-4 rounded-2xl flex items-center gap-3 border ${
            coords
              ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30'
              : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            coords ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
          }`}>
            {coords ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          </div>
          <p className={`text-sm font-medium flex-1 ${coords ? 'text-emerald-800 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-400'}`}>
            {coords
              ? '📍 GPS coordinates captured. Auto-fill your address below.'
              : '📍 Enable location access for automatic address detection.'}
          </p>
          {coords && (
            <button
              type="button"
              onClick={handleAutoFillAddress}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shrink-0"
            >
              <MapPin size={12} className="inline mr-1" /> Auto-fill
            </button>
          )}
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Blood Bank / Organization Name" placeholder="Red Crescent Society" {...register('name')} error={errors.name?.message} />
            <Input label="Medical Registration / License No." placeholder="MD-2039X" {...register('license')} error={errors.license?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Primary Phone Number" placeholder="03001234567" {...register('contact')} error={errors.contact?.message} />
            <Input label="City" placeholder="Lahore" {...register('city')} error={errors.city?.message} />
          </div>

          <Input label="Full Street Address" placeholder="123 Main Street, Block A" {...register('address')} error={errors.address?.message} />

          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 text-base py-3.5 mt-2"
          >
            Submit Registration For Review
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
