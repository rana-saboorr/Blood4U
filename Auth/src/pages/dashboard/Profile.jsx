import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { User, Edit3, ShieldCheck, Heart, Camera, CheckCircle2, Trophy, Droplet, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  city: yup.string().required('City is required'),
  contact: yup.string().required('Contact is required'),
});

const BADGE_CONFIG = {
  Gold:   { icon: '🥇', label: 'Gold Donor',   nextLabel: 'Maximum!',    color: 'from-yellow-400 to-amber-500', progress: 100 },
  Silver: { icon: '🥈', label: 'Silver Donor', nextLabel: 'Gold at 10+', color: 'from-gray-400 to-slate-500',   progress: 65 },
  Bronze: { icon: '🥉', label: 'Bronze Donor', nextLabel: 'Silver at 4+', color: 'from-orange-400 to-red-500',  progress: 25 },
};

export default function Profile() {
  const { user, role } = useSelector(state => state.auth);
  const { donors, donations } = useSelector(state => state.data);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const donorRecord = donors.find((d) => d.userId?.toString() === user?._id?.toString()) || null;
  const badge = donorRecord?.badge || 'Bronze';
  const badgeConfig = BADGE_CONFIG[badge] || BADGE_CONFIG.Bronze;
  const myDonations = (donations || []).filter(d => d.donorId === donorRecord?.id);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name:    user?.username || user?.identifier || '',
      city:    donorRecord?.city || user?.city || '',
      contact: donorRecord?.mobile || donorRecord?.contact || user?.phone || '',
    }
  });

  const onSubmit = async (data) => {
    try {
      if (role === 'donor') {
        await apiRequest('/donors/me', {
          method: 'PUT',
          body: JSON.stringify({ fullName: data.name, city: data.city, mobile: data.contact }),
        });
      } else {
        await apiRequest(`/users/${user._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ username: data.name, phone: data.contact, city: data.city }),
        });
      }
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile.');
    }
  };

  const displayName = user?.username || user?.identifier || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-gray-900 dark:text-white"
      >
        My Profile
      </motion.h1>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur border-4 border-white/30 flex items-center justify-center text-3xl font-bold shadow-xl">
              {initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Camera size={14} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold truncate">{displayName}</h2>
              {role === 'donor' && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold border border-white/30 shrink-0">
                  ✓ Verified Donor
                </span>
              )}
              {role === 'admin' && (
                <span className="px-3 py-1 bg-amber-400/30 backdrop-blur rounded-full text-xs font-bold border border-amber-300/30 shrink-0">
                  🛡 Admin
                </span>
              )}
            </div>
            <p className="text-red-200 capitalize text-sm">{role}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-red-100">
              {donorRecord?.bloodGroup && (
                <span className="flex items-center gap-1"><Droplet size={14} /> {donorRecord.bloodGroup}</span>
              )}
              {(donorRecord?.city || user?.city) && (
                <span className="flex items-center gap-1"><MapPin size={14} /> {donorRecord?.city || user?.city}</span>
              )}
              {donorRecord && (
                <span className={`flex items-center gap-1 ${donorRecord.available ? 'text-emerald-300' : 'text-red-300'}`}>
                  {donorRecord.available ? '🟢 Available' : '🔴 Resting'}
                </span>
              )}
            </div>
          </div>

          {role !== 'user' && (
            <div className="text-center p-4 bg-white/10 backdrop-blur rounded-2xl border border-white/20 shrink-0">
              <p className="text-4xl">{badgeConfig.icon}</p>
              <p className="text-sm font-bold mt-1">{badgeConfig.label}</p>
              <p className="text-xs text-red-200 mt-0.5">{donorRecord?.donationCount || 0} Donations</p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl p-6"
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User size={20} className="text-red-600" /> Personal Details
            </h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 dark:hover:text-red-400 font-medium transition-colors"
              >
                <Edit3 size={15} /> Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Name" {...register('name')} error={errors.name?.message} disabled={!editing} />
            <Input label="City" {...register('city')} error={errors.city?.message} disabled={!editing} />
            <Input label="Contact" {...register('contact')} error={errors.contact?.message} disabled={!editing} />

            <AnimatePresence>
              {editing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-3 pt-2 overflow-hidden"
                >
                  <Button type="submit" isLoading={isSubmitting} className="flex-1">Save Changes</Button>
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => { setEditing(false); reset(); }}>
                    Cancel
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Become Donor CTA */}
          {role === 'user' && (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Want to become a blood donor?</p>
              <Button onClick={() => navigate('/dashboard/become-donor')} variant="outline" className="w-full">
                <Heart size={16} className="mr-2 text-red-600" /> Upgrade to Donor
              </Button>
            </div>
          )}

          {/* Verification */}
          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" /> Verification Status
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Email Verified',       done: true },
                { label: 'Phone OTP',            done: false },
                { label: 'Donor Medical Badge',  done: role === 'donor' },
              ].map((v, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{v.label}</span>
                  <span className={`flex items-center gap-1 font-semibold text-xs ${v.done ? 'text-emerald-600' : 'text-gray-400 dark:text-zinc-600'}`}>
                    {v.done ? <><CheckCircle2 size={13} /> Verified</> : '— Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Badge + Donations */}
        {role !== 'user' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            {/* Badge Progress */}
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" /> Donation Badge Progress
              </h2>
              <div className={`bg-gradient-to-r ${badgeConfig.color} p-5 rounded-2xl text-white mb-4`}>
                <div className="flex items-center gap-3">
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
                  <span className="font-medium text-gray-900 dark:text-white">{badgeConfig.nextLabel}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-3 neo-inset">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${badgeConfig.progress}%` }}
                    transition={{ delay: 0.6, duration: 1.2, type: 'spring' }}
                    className={`h-3 rounded-full bg-gradient-to-r ${badgeConfig.color} shadow-sm`}
                  />
                </div>
              </div>
            </div>

            {/* Recent Donations mini */}
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📋 Recent Donations</h2>
              {myDonations.length === 0 ? (
                <div className="text-center py-6 text-gray-400 dark:text-zinc-600">
                  <Droplet size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No donations logged yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myDonations.slice(-3).reverse().map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/80 dark:bg-zinc-800/50 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0 text-sm">
                        🩸
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{d.hospital}</p>
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
