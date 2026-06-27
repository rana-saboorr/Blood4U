import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Clock, MapPin, Trophy, CalendarDays, Heart } from 'lucide-react';
import { apiRequest } from '../../lib/api';

const BADGE_CONFIG = {
  Gold:   { icon: '🥇', label: 'Gold Donor',   color: 'from-yellow-400 to-amber-500', textColor: 'text-yellow-700 dark:text-amber-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', minDonations: 10 },
  Silver: { icon: '🥈', label: 'Silver Donor', color: 'from-gray-400 to-slate-500',   textColor: 'text-gray-600 dark:text-slate-400',   bg: 'bg-gray-50 dark:bg-gray-900/20',   minDonations: 4 },
  Bronze: { icon: '🥉', label: 'Bronze Donor', color: 'from-orange-400 to-red-500',   textColor: 'text-orange-700 dark:text-red-400',  bg: 'bg-orange-50 dark:bg-orange-900/20', minDonations: 1 },
};

const isResting = (lastDonation) => {
  if (!lastDonation) return false;
  const daysSince = (Date.now() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < 90;
};

const nextBadge = (badge, count) => {
  if (badge === 'Bronze') return { name: 'Silver', needed: 4 - count };
  if (badge === 'Silver') return { name: 'Gold', needed: 10 - count };
  return null;
};

export default function DonationHistory() {
  const { donors } = useSelector(state => state.data);
  const { user } = useSelector(state => state.auth);

  const donor = donors.find(d => d.userId?.toString() === user?._id?.toString()) || donors[0] || null;
  const [myDonations, setMyDonations] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await apiRequest('/requests?status=fulfilled');
        setMyDonations(payload.requests || []);
      } catch {
        setMyDonations([]);
      }
    };

    if (user?._id) load();
  }, [user?._id]);

  const badge = donor?.badge || 'Bronze';
  const badgeConf = BADGE_CONFIG[badge] || BADGE_CONFIG.Bronze;
  const next = nextBadge(badge, donor?.donationCount || 0);
  const resting = isResting(donor?.lastDonation);
  const daysSinceDonation = useMemo(() => {
    if (!donor?.lastDonation) return null;
    return Math.floor((Date.now() - new Date(donor.lastDonation).getTime()) / (1000 * 60 * 60 * 24));
  }, [donor?.lastDonation]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.h1 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3"
      >
        <Trophy className="text-yellow-500" size={32} />
        Donation History & Rewards
      </motion.h1>

      {/* Badge + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="clay-card p-6 text-center flex flex-col justify-center items-center"
        >
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${badgeConf.color} flex items-center justify-center text-4xl mb-4 shadow-lg`}>
            {badgeConf.icon}
          </div>
          <h3 className={`text-xl font-bold ${badgeConf.textColor}`}>{badgeConf.label}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{donor?.donationCount || 0} total donations</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 grid grid-cols-2 gap-4"
        >
          {[
            { label: 'Total Donations', value: donor?.donationCount || 0, icon: '🩸' },
            { label: 'Lives Impacted', value: (donor?.donationCount || 0) * 3, icon: '❤️' },
            { label: 'Rest Status', value: resting ? 'Resting' : 'Ready!', icon: resting ? '💤' : '✅', extra: daysSinceDonation !== null ? `${daysSinceDonation}d since last` : '' },
            { label: 'Next Badge', value: next ? `${next.needed} more to ${next.name}` : 'Max Tier!', icon: '🏆' },
          ].map((s, i) => (
            <div key={i} className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-2xl">{s.icon}</span>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</h4>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
                {s.extra && <p className="text-[10px] text-gray-400 mt-0.5">{s.extra}</p>}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Progress Bar */}
      {next && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-2xl p-5"
        >
          <div className="flex justify-between text-xs mb-2 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span>{badge}</span>
            <span>{next.name}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-3 neo-inset">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, ((donor?.donationCount || 0) / (badge === 'Bronze' ? 4 : 10)) * 100)}%` }}
              transition={{ delay: 0.5, duration: 1.2, type: 'spring' }}
              className={`h-3 rounded-full bg-gradient-to-r ${badgeConf.color}`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">{next.needed} more donation{next.needed !== 1 ? 's' : ''} to reach {next.name} tier</p>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <CalendarDays size={20} className="text-red-500" /> Donation Timeline
        </h2>
        {myDonations.length === 0 ? (
          <div className="py-12 text-center text-gray-400 dark:text-zinc-600 border border-dashed border-gray-200 dark:border-zinc-850 rounded-xl">
            <Heart className="mx-auto mb-3 opacity-40" size={36} />
            <p className="text-sm font-medium">No donations recorded yet.</p>
            <p className="text-xs mt-1">Visit a blood bank to begin your journey!</p>
          </div>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-150 dark:bg-zinc-850" />
            <div className="space-y-4">
              {[...myDonations].reverse().map((d, i) => (
                <motion.div
                  key={d._id?.toString() || i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-4 relative items-start"
                >
                  <div className="absolute -left-[23px] w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center text-xs z-10 border border-white dark:border-zinc-900 shadow-sm font-bold">
                    🩸
                  </div>
                  <div className="flex-1 clay-card p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{d.hospitalName || d.hospital}</h3>
                      <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                        <CalendarDays size={12} />
                        {d.date ? new Date(d.date).toISOString().split('T')[0] : ''}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><MapPin size={12} />{d.city}</span>
                      <span>{d.units || d.quantity} unit{ (d.units || d.quantity) > 1 ? 's' : ''} donated</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Badge List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(BADGE_CONFIG).map(([key, conf], i) => (
          <motion.div 
            key={key} 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.08 * i }}
            className={`p-5 rounded-2xl text-center border relative overflow-hidden flex flex-col justify-center items-center ${
              badge === key 
                ? 'ring-2 ring-red-500/40 dark:ring-red-600/40 bg-white dark:bg-zinc-900 border-red-200 dark:border-red-900' 
                : 'glass-panel'
            }`}
          >
            {badge === key && (
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 text-[10px] font-bold uppercase rounded-full">
                Active
              </div>
            )}
            <span className="text-3xl">{conf.icon}</span>
            <h3 className={`font-bold mt-2 ${conf.textColor}`}>{conf.label}</h3>
            <p className="text-xs text-gray-500 mt-1">{conf.minDonations}+ donations{key === 'Gold' ? ' — Lifetime Hero' : ''}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
