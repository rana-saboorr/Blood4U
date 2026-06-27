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
  contact: yup.string().email('Enter a valid email').required('Email is required'),
});

export default function ForgotPassword() {
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await apiRequest('/auth/forgot-password/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: data.contact }),
      });

      toast.success('Reset OTP sent to your email (valid for 50 seconds).');
      navigate('/verify-otp', { 
        state: { 
          email: data.contact,
          mode: 'forgot'
        } 
      });
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    }
  };

  return (
    <AuthLayout 
      title="Forgot Password" 
      subtitle="Enter your email to receive a reset OTP."
      heroQuote="Sometimes we just need a little reset."
      heroAuthor="Anonymous"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          placeholder="Enter your email"
          {...register('contact')}
          error={errors.contact?.message}
        />

        <Button type="submit" isLoading={isSubmitting} className="mt-4">
          Send Reset Code
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Remember your password?{' '}
        <Link to="/signin" className="text-[#e63946] font-medium hover:underline">
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
