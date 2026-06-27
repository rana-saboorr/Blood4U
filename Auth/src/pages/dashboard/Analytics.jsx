import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { BarChart2, Users, Droplet, Building2, Calendar, TrendingUp, MapPin } from 'lucide-react';
import Counter from '../../components/Counter';

const levelColor = (pct) => {
  if (pct >= 70) return 'bg-green-500';
  if (pct >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

const levelLabel = (pct) => {
  if (pct >= 70) return 'Good';
  if (pct >= 40) return 'Low';
  return 'Critical';
};

export default function Analytics() {
  const { donors, requests, events, bloodBanks, systemUsers } = useSelector(state => state.data);

  const totalUsers = systemUsers.length + donors.length;
  const activeDonors = donors.filter(d => d.available).length;
  const completedDonations = requests.filter(r => r.status === 'fulfilled' || r.status === 'approved').length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;

  // Aggregate DB-driven blood stock from APPROVED blood banks only.
  const approvedBanks = bloodBanks.filter(b => b.status === 'approved');
  const bloodTypes = ['O+', 'A+', 'B+', 'AB+', 'O-'];
  const cities = Array.from(new Set(approvedBanks.map(b => b.city))).sort();
  const cityTotals = cities.reduce((acc, city) => {
    acc[city] = bloodTypes.reduce((typesAcc, t) => {
      typesAcc[t] = 0;
      return typesAcc;
    }, {});
    return acc;
  }, {});

  approvedBanks.forEach((bank) => {
    if (!cityTotals[bank.city]) return;
    bloodTypes.forEach((t) => {
      cityTotals[bank.city][t] += bank.bloodStock?.[t] || 0;
    });
  });

  const maxByType = bloodTypes.reduce((acc, t) => {
    const maxVal = Math.max(...cities.map((c) => cityTotals[c]?.[t] || 0), 0);
    acc[t] = maxVal;
    return acc;
  }, {});

  // Requests grouped by city
  const cityStats = requests.reduce((acc, r) => {
    acc[r.city] = (acc[r.city] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: 'Total System Users', value: totalUsers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30', change: '+12%', path: '/dashboard/admin' },
    { label: 'Active Donors', value: activeDonors, icon: Droplet, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', change: '+5%', path: '/dashboard/search' },
    { label: 'Pending Requests', value: pendingRequests, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', change: '+2', path: '/dashboard/requests' },
    { label: 'Approved Blood Banks', value: bloodBanks.filter(b => b.status === 'approved').length, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', change: '+1', path: '/dashboard/banks' },
    { label: 'Upcoming Events', value: events.length, icon: Calendar, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', change: '0', path: '/dashboard/upcoming-events' },
    { label: 'Donations Done', value: completedDonations, icon: BarChart2, color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30', change: '+3', path: '/dashboard/admin' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <BarChart2 className="text-red-600" size={32} />
          Analytics Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">System-wide live statistics and city blood inventory.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => stat.path && navigate(stat.path)}
            className={`p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 flex items-center gap-4 ${stat.path ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-95 transition-transform' : ''}`}
          >
            <div className={`p-4 rounded-xl shrink-0 ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.label}</p>
              <div className="flex items-end gap-2 mt-1">
                <h3 className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                  <Counter to={stat.value} />
                </h3>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">{stat.change}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by City */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-red-600" /> Blood Requests by City
          </h2>
          <div className="space-y-3">
            {Object.entries(cityStats).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No requests recorded yet.</p>
            ) : (
              Object.entries(cityStats).map(([city, count], i) => {
                const maxVal = Math.max(...Object.values(cityStats));
                const pct = Math.round((count / maxVal) * 100);
                return (
                  <div key={city}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{city}</span>
                      <span className="text-gray-500">{count} request{count > 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                        className="h-2.5 rounded-full bg-red-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Donor Badge Distribution */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🏆 Donor Badge Distribution</h2>
          <div className="space-y-4">
            {[
              { label: 'Gold Donors', badge: 'Gold', icon: '🥇', color: 'bg-yellow-500' },
              { label: 'Silver Donors', badge: 'Silver', icon: '🥈', color: 'bg-gray-400' },
              { label: 'Bronze Donors', badge: 'Bronze', icon: '🥉', color: 'bg-orange-400' },
            ].map((tier, i) => {
              const count = donors.filter(d => d.badge === tier.badge).length;
              const pct = donors.length ? Math.round((count / donors.length) * 100) : 0;
              return (
                <div key={tier.badge}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">{tier.icon} {tier.label}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                      className={`h-2.5 rounded-full ${tier.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* City Blood Inventory Board */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">🏙️ City-Based Live Blood Availability Board</h2>
          <p className="text-sm text-gray-500 mt-1">Aggregated inventory levels from approved blood banks. Red = Critical. Yellow = Low. Green = Sufficient.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">City</th>
                {bloodTypes.map(bg => (
                  <th key={bg} className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">{bg}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cities.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-center text-gray-500" colSpan={1 + bloodTypes.length}>
                    No approved blood bank inventory available yet.
                  </td>
                </tr>
              ) : (
                cities.map((city, i) => {
                  const row = { city, ...cityTotals[city] };
                  return (
                    <tr
                      key={city}
                      className={`border-t border-gray-100 dark:border-zinc-800 ${i % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-gray-50/50 dark:bg-zinc-800/20'}`}
                    >
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{row.city}</td>
                      {bloodTypes.map((bg) => {
                        const count = row[bg] || 0;
                        const maxVal = maxByType[bg] || 0;
                        const pct = maxVal ? Math.round((count / maxVal) * 100) : 0;
                        return (
                          <td key={bg} className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-full max-w-[60px] bg-gray-100 dark:bg-zinc-700 rounded-full h-2">
                                <div className={`h-2 rounded-full ${levelColor(pct)}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                pct >= 70
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : pct >= 40
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {levelLabel(pct)}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
