import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { registerBloodBankApi } from '../../features/data/dataSlice';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchMe } from '../../features/auth/authSlice';

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
        () => console.log('Location access denied')
      );
    }
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm({
    resolver: yupResolver(schema)
  });

  const handleAutoFillAddress = async () => {
    if (!coords) {
      toast.error('Location not captured. Please enable GPS.');
      return;
    }
    const loadingToast = toast.loading('Detecting address...');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`);
      const data = await res.json();
      toast.dismiss(loadingToast);
      if (data.display_name) {
        setValue('address', data.display_name);
        const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb;
        if (cityName) setValue('city', cityName);
        toast.success('Address auto-filled!');
      } else {
        throw new Error();
      }
    } catch {
      toast.dismiss(loadingToast);
      setValue('address', `${coords.lat}, ${coords.lng}`);
      toast.success('Address set to GPS coordinates');
    }
  };



  const { role } = useSelector(state => state.auth);
  const { bloodBanks } = useSelector(state => state.data);
  const { user } = useSelector(state => state.auth);

  const hasBank = bloodBanks.some(b => (b.ownerUserId === user?._id || b.ownerUserId?._id === user?._id));

  if (hasBank) {
    return (
      <div className="flex flex-col items-center justify-center max-w-2xl mx-auto py-20 text-center">
        <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mb-6">
          <Building2 size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">You already manage a Blood Bank!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed">
          System policy allows one blood bank registration per user account. You can manage your existing bank or contact support for help.
        </p>
        <Button onClick={() => navigate('/dashboard/banks')} className="w-auto px-6 bg-purple-600">View My Bank</Button>
      </div>
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
    <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
      
      <div className="bg-purple-600 p-8 text-white relative">
        <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
        <div className="relative z-10 flex items-center gap-4 mb-2">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <Building2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Register Blood Bank</h1>
            <p className="text-purple-100">Attach your organization to the Blood4U network.</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {coords ? (
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            ) : (
              <span className="flex h-2 w-2 rounded-full bg-yellow-500"></span>
            )}
          </div>
          <p className="text-sm text-yellow-800 dark:text-yellow-400 font-medium flex-1">
            <strong>{coords ? '📍 Location Captured:' : '📍 Location Pending:'}</strong>{' '}
            {coords 
              ? 'Your GPS coordinates are ready. You can now auto-fill your address below.' 
              : 'Please allow location access to enable automatic address detection.'}
          </p>
          {coords && (
            <button 
              type="button"
              onClick={handleAutoFillAddress}
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Auto-fill Address
            </button>
          )}
        </div>



        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Blood Bank / Organization Name" placeholder="Red Cross NY" {...register('name')} error={errors.name?.message} />
            <Input label="Medical Registration / License No." placeholder="MD-2039X" {...register('license')} error={errors.license?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Primary Phone Number" placeholder="+1234567890" {...register('contact')} error={errors.contact?.message} />
            <Input label="City" placeholder="New York" {...register('city')} error={errors.city?.message} />
          </div>

          <Input label="Full Street Location" placeholder="400 Broad Street, Suite 5B" {...register('address')} error={errors.address?.message} />

          <Button type="submit" isLoading={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 text-lg py-4 mt-4">
            Submit Registration For Review
          </Button>
        </form>
      </div>

    </div>
  );
}
