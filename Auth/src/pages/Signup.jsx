import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiRequest } from '../lib/api';
import Button from '../components/Button';
import Input from '../components/Input';
import AuthLayout from '../components/AuthLayout';

const schema = yup.object().shape({
  username: yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
  email: yup.string().email('Must be a valid email').required('Email is required'),
  phone: yup.string()
    .required('Phone number is required')
    .matches(/^0\d{10}$/, 'Must be a valid 11-digit Pakistan phone number (starting with 0)'),
  role: yup.string()
    .oneOf(['user', 'bankOwner'], 'Please select a valid role')
    .required('Role selection is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'At least one lowercase letter')
    .matches(/[A-Z]/, 'At least one uppercase letter')
    .matches(/[@$!%*?&]/, 'At least one special character')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords do not match')
    .required('Please confirm your password'),
});


export default function Signup() {
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const signupPayload = {
        username: data.username,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: data.role,
      };

      await apiRequest('/auth/signup/send-otp', {
        method: 'POST',
        body: JSON.stringify(signupPayload),
      });

      toast.success('OTP sent to your email. Please verify within 50 seconds.');
      navigate('/verify-otp', {
        state: {
          email: data.email,
          mode: 'signup',
          signupPayload,
        },
      });
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    }
  };

  return (
    <AuthLayout
      title="Create an Account"
      subtitle="Join the Blood4U network and save lives."
      heroQuote="The gift of blood is the gift of life. There is no substitute for it."
      heroAuthor="WHO"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Username"
            placeholder="username"
            {...register('username')}
            error={errors.username?.message}
          />
          <Input
            label="Email"
            placeholder="user@example.com"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <Input
            label="Phone Number (Pakistan)"
            placeholder="03XXXXXXXXX"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-zinc-300 ml-1">Account Type</label>
            <select 
              {...register('role')}
              className="w-full h-11 px-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all dark:text-white"
            >
              <option value="user">Normal User</option>
              <option value="bankOwner">Blood Bank Owner</option>
            </select>
            {errors.role && <span className="text-[10px] text-red-500 ml-1">{errors.role.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </div>

        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
          By creating an account, you agree to our{' '}
          <span className="text-red-600 cursor-pointer hover:underline">Terms</span>{' '}
          and{' '}
          <span className="text-red-600 cursor-pointer hover:underline">Privacy Policy</span>.
        </p>

        <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/signin" className="text-red-600 font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
