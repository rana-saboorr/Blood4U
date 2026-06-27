import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Clock, MapPin, Trophy, CalendarDays } from 'lucide-react';
import { apiRequest } from '../../lib/api';

const BADGE_CONFIG = {
  Gold:   { icon: '🥇', label: 'Gold Donor', color: 'from-yellow-400 to-yellow-600', textColor: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', minDonations: 10 },
  Silver: { icon: '🥈', label: 'Silver Donor', color: 'from-gray-400 to-gray-600', textColor: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20', minDonations: 4 },
  Bronze: { icon: '🥉', label: 'Bronze Donor', color: 'from-orange-400 to-orange-600', textColor: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', minDonations: 1 },
};

// Rest period check
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
  const badgeConf = BADGE_CONFIG[badge];
  const next = nextBadge(badge, donor?.donationCount || 0);
  const resting = isResting(donor?.lastDonation);
  const daysSinceDonation = donor?.lastDonation
    ? Math.floor((Date.now() - new Date(donor.lastDonation).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
        <Trophy className="text-yellow-500" size={32} />
        Donation History & Rewards
      </h1>

      {/* Badge + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-2xl border text-center ${badgeConf.bg} col-span-1`}
        >
          <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${badgeConf.color} flex items-center justify-center text-4xl mb-3 shadow-lg`}>
            {badgeConf.icon}
          </div>
          <h3 className={`text-xl font-bold ${badgeConf.textColor}`}>{badgeConf.label}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{donor?.donationCount || 0} total donations</p>
        </motion.div>

        {/* Stats block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="md:col-span-2 grid grid-cols-2 gap-4"
        >
          {[
            { label: 'Total Donations', value: donor?.donationCount || 0, icon: '🩸' },
            { label: 'Lives Impacted', value: (donor?.donationCount || 0) * 3, icon: '💗' },
            { label: 'Rest Status', value: resting ? 'Resting' : 'Ready!', icon: resting ? '😴' : '✅', extra: daysSinceDonation !== null ? `${daysSinceDonation}d since last` : '' },
            { label: 'Next Badge', value: next ? `${next.needed} more to ${next.name}` : 'Max Tier!', icon: '🏆' },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <span className="text-2xl">{s.icon}</span>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              {s.extra && <p className="text-xs text-gray-400 mt-0.5">{s.extra}</p>}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Progress Bar */}
      {next && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex justify-between text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">
            <span>{badge}</span>
            <span>{next.name}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, ((donor?.donationCount || 0) / (badge === 'Bronze' ? 4 : 10)) * 100)}%` }}
              transition={{ delay: 0.5, duration: 1 }}
              className={`h-3 rounded-full bg-gradient-to-r ${badgeConf.color}`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">{next.needed} more donation{next.needed !== 1 ? 's' : ''} to reach {next.name} tier</p>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">📅 Donation Timeline</h2>
        {myDonations.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <p>No donations recorded yet. Visit a blood bank to begin your journey!</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-zinc-800" />
            <div className="space-y-4">
              {[...myDonations].reverse().map((d, i) => (
                <motion.div
                  key={d._id?.toString() || i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 relative"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0 z-10 border-2 border-white dark:border-zinc-900 shadow-sm">
                    🩸
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">{d.hospitalName}</h3>
                      <span className="text-sm text-gray-400">
                        <CalendarDays size={14} className="inline mr-1" />
                        {d.date ? new Date(d.date).toISOString().split('T')[0] : ''}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span><MapPin size={13} className="inline mr-1" />{d.city}</span>
                      <span>{d.quantity} unit{d.quantity > 1 ? 's' : ''} donated</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Badge Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(BADGE_CONFIG).map(([key, conf], i) => (
          <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
            className={`p-5 rounded-2xl text-center border ${badge === key ? 'ring-2 ring-red-400 dark:ring-red-600' : ''} ${conf.bg}`}
          >
            <span className="text-3xl">{conf.icon}</span>
            <h3 className={`font-bold mt-2 ${conf.textColor}`}>{conf.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{conf.minDonations}+ donations{key === 'Gold' ? ' — Lifetime Hero' : ''}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
