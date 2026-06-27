import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import AuthLayout from '../components/AuthLayout';
import { apiRequest } from '../lib/api';
import { useDispatch } from 'react-redux';
import { fetchMe } from '../features/auth/authSlice';

export default function OtpVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const mode = location.state?.mode || 'signup';
  const signupPayload = location.state?.signupPayload;

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e, index) => {
    const { value } = e.target;
    // Only allow numbers
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Focus previous input on BS if current is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await apiRequest('/auth/signup/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ email, otp: otpValue }),
        });
        await dispatch(fetchMe()).unwrap();
        toast.success('Signup verified and account created!');
        navigate('/dashboard');
      } else {
        const payload = await apiRequest('/auth/forgot-password/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ email, otp: otpValue }),
        });
        toast.success('OTP verified. Set your new password.');
        navigate('/reset-password', {
          state: {
            email,
            resetToken: payload.resetToken,
          },
        });
      }
    } catch (error) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      if (mode === 'signup') {
        await apiRequest('/auth/signup/send-otp', {
          method: 'POST',
          body: JSON.stringify(signupPayload),
        });
      } else {
        await apiRequest('/auth/forgot-password/send-otp', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
      }

      setTimer(50);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success('New OTP sent!');
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP');
    }
  };

  return (
    <AuthLayout 
      title="Verify Your Account" 
      subtitle={`We've sent a 6-digit code to ${email || 'your email'}.`}
      heroQuote="Patience and time do more than strength or passion."
      heroAuthor="Jean de La Fontaine"
    >
      <form onSubmit={onSubmit} className="space-y-8 mt-4">
        
        <div className="flex justify-between gap-2 sm:gap-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-10 h-12 sm:w-14 sm:h-16 text-center text-xl font-bold rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946] outline-none transition-all"
            />
          ))}
        </div>

        <Button type="submit" isLoading={isSubmitting}>
          Verify
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {timer > 0 ? (
          <p>Resend code in <span className="font-semibold text-gray-900 dark:text-white">{timer}s</span></p>
        ) : (
          <p>
            Didn't receive the code?{' '}
            <button 
              onClick={handleResend}
              className="text-[#e63946] font-medium hover:underline focus:outline-none"
            >
              Resend now
            </button>
          </p>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <button 
          onClick={() => navigate(-1)} 
          className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          &larr; Back
        </button>
      </div>

    </AuthLayout>
  );
}
