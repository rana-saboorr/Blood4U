import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Input from '../components/Input';
import AuthLayout from '../components/AuthLayout';
import { apiRequest } from '../lib/api';

const schema = yup.object().shape({
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'At least one lowercase letter')
    .matches(/[A-Z]/, 'At least one uppercase letter')
    .matches(/[@$!%*?&]/, 'At least one special character')
    .required('New Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});


export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const resetToken = location.state?.resetToken;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async ({ password }) => {
    try {
      if (!email || !resetToken) {
        toast.error('Reset session expired. Please start forgot password again.');
        navigate('/forgot-password');
        return;
      }

      await apiRequest('/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({
          email,
          resetToken,
          password,
        }),
      });

      toast.success('Password successfully reset! Please sign in.');
      navigate('/signin');
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
    }
  };

  return (
    <AuthLayout 
      title="Reset Password" 
      subtitle="Please enter your new password below."
      heroQuote="The measure of intelligence is the ability to change."
      heroAuthor="Albert Einstein"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <Button type="submit" isLoading={isSubmitting} className="mt-4">
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
}
