import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { User, Edit3, ShieldCheck, Heart, Camera, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  city: yup.string().required('City is required'),
  contact: yup.string().required('Contact is required'),
});

const BADGE_CONFIG = {
  Gold:   { icon: '🥇', label: 'Gold Donor', nextLabel: 'Maximum!', color: 'from-yellow-400 to-yellow-600', progress: 100 },
  Silver: { icon: '🥈', label: 'Silver Donor', nextLabel: 'Gold at 10+', color: 'from-gray-400 to-gray-600', progress: 65 },
  Bronze: { icon: '🥉', label: 'Bronze Donor', nextLabel: 'Silver at 4+', color: 'from-orange-400 to-orange-600', progress: 25 },
};

export default function Profile() {
  const { user, role } = useSelector(state => state.auth);
  const { donors, donations } = useSelector(state => state.data);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  // Find current donor record if role is donor
  const donorRecord =
    donors.find((d) => d.userId?.toString() === user?._id?.toString()) || null;

  const badge = donorRecord?.badge || 'Bronze';
  const badgeConfig = BADGE_CONFIG[badge];
  const myDonations = donations.filter(d => d.donorId === donorRecord?.id);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: user?.username || user?.identifier || '',
      city: donorRecord?.city || user?.city || '',
      contact: donorRecord?.contact || user?.phone || '',
    }
  });

  const onSubmit = async (data) => {
    try {
      if (role === 'donor') {
        await apiRequest('/donors/me', {
          method: 'PUT',
          body: JSON.stringify({
            fullName: data.name,
            city: data.city,
            mobile: data.contact,
          }),
        });
      } else {
        // For non-donors, persist fields available on the User model using PATCH
        await apiRequest(`/users/${user._id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            username: data.name,
            phone: data.contact,
            city: data.city,
          }),
        });
      }

      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>

      {/* Avatar + Role Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur border-4 border-white/30 flex items-center justify-center text-4xl font-bold">
              {(user?.identifier || 'U').charAt(0).toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Camera size={14} />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold">{user?.identifier || 'Unknown User'}</h2>
              {role === 'donor' && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-bold border border-white/30">
                  ✓ Verified Donor
                </span>
              )}
            </div>
            <p className="text-red-200 capitalize">{role} · {donorRecord?.city || 'Location not set'}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-red-100">
              <span>🩸 Blood Group: <strong className="text-white">{donorRecord?.bloodGroup || 'Not set'}</strong></span>
              {donorRecord?.paid !== undefined && <span>{donorRecord.paid ? '💰 Paid' : '❤️ Volunteer'}</span>}
              <span>{donorRecord?.available ? '🟢 Available' : '🔴 Resting'}</span>
            </div>
          </div>

          {role !== 'user' && (
            <div className="text-center p-4 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
              <p className="text-3xl">{badgeConfig.icon}</p>
              <p className="text-sm font-bold mt-1">{badgeConfig.label}</p>
              <p className="text-xs text-red-200 mt-1">{donorRecord?.donationCount || 0} Donations</p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User size={20} className="text-red-600" /> Personal Details
            </h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-red-600 hover:underline font-medium">
                <Edit3 size={16} /> Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Name" {...register('name')} error={errors.name?.message} disabled={!editing} />
            <Input label="City" {...register('city')} error={errors.city?.message} disabled={!editing} />
            <Input label="Contact" {...register('contact')} error={errors.contact?.message} disabled={!editing} />
            
            {editing && (
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Save Changes</Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            )}
          </form>

          {/* Role Switcher */}
          {role === 'user' && (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Want to become a blood donor?</p>
              <Button onClick={() => navigate('/dashboard/become-donor')} variant="outline" className="w-full">
                <Heart size={16} className="mr-2 text-red-600" /> Upgrade to Donor
              </Button>
            </div>
          )}

          {/* Verification Section */}
          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-600" /> Verification Status
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Email Verified', done: true },
                { label: 'Phone OTP', done: false },
                { label: 'Donor Medical Badge', done: role === 'donor' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className={`flex items-center gap-1 font-medium ${item.done ? 'text-green-600' : 'text-gray-400 dark:text-zinc-600'}`}>
                    {item.done ? <><CheckCircle2 size={14} /> Verified</> : '— Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Badge Progress */}
        {role !== 'user' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">🏆 Donation Badge Progress</h2>
              <div className={`bg-gradient-to-r ${badgeConfig.color} p-5 rounded-xl text-white mb-4`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{badgeConfig.icon}</span>
                  <div>
                    <h3 className="font-bold text-xl">{badgeConfig.label}</h3>
                    <p className="text-sm opacity-80">{donorRecord?.donationCount || 0} donations logged</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Progress to next tier</span>
                  <span className="font-medium">{badgeConfig.nextLabel}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${badgeConfig.progress}%` }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className={`h-3 rounded-full bg-gradient-to-r ${badgeConfig.color}`}
                  />
                </div>
              </div>
            </div>

            {/* Donation History mini */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📋 Recent Donations</h2>
              {myDonations.length === 0 ? (
                <p className="text-gray-500 text-sm">No donations logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {myDonations.slice(-3).reverse().map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0 font-bold text-sm">
                        🩸
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{d.hospital}</p>
                        <p className="text-xs text-gray-500">{d.city} · {d.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
