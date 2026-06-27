import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { signinUser } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Input from '../components/Input';
import AuthLayout from '../components/AuthLayout';

const schema = yup.object().shape({
  identifier: yup.string().required('Please enter your email, username, or phone'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export default function Signin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const signedInUser = await dispatch(signinUser(data)).unwrap();
      toast.success(`Welcome back, ${data.identifier}! 🩸`);
      navigate(signedInUser?.role === 'admin' ? '/dashboard/admin' : '/dashboard');
    } catch (error) {
      toast.error(error.message || 'Sign in failed. Please try again.');
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your Blood4U account."
      heroTitle="Connect. Donate. Save Lives."
      heroSubtitle="Every blood donation can save up to 3 lives. Join thousands of heroes making a difference every day."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email, Username or Phone"
          placeholder="e.g. john@example.com"
          autoComplete="username"
          {...register('identifier')}
          error={errors.identifier?.message}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register('password')}
          error={errors.password?.message}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 focus:ring-offset-0" />
            <span className="text-gray-500 dark:text-gray-400">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-red-600 hover:text-red-700 font-medium hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
          Sign In
        </Button>

      </form>

      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Don't have an account?{' '}
        <Link to="/signup" className="text-red-600 font-semibold hover:underline">
          Create one free
        </Link>
      </div>
    </AuthLayout>
  );
}
