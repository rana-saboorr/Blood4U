import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateBloodBankStatus } from '../../features/data/dataSlice';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Phone, Building2, CheckCircle, XCircle, MessageSquare, Droplets, Clock } from 'lucide-react';
import Button from '../../components/Button';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  approved:  { label: 'Approved',  cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  rejected:  { label: 'Rejected',  cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  suspended: { label: 'Suspended', cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
};

export default function BloodBanks() {
  const { role } = useSelector(state => state.auth);
  const { bloodBanks } = useSelector(state => state.data);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const visibleBanks = role === 'admin'
    ? bloodBanks
    : bloodBanks.filter(b => b.status === 'approved');

  const filteredBanks = visibleBanks.filter(bank =>
    bank.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatus = (id, status) => {
    dispatch(updateBloodBankStatus({ id, status }));
    toast.success(`Blood Bank marked as ${status}`);
  };

  const handleMessage = (bank) => {
    navigate('/dashboard/chat', { state: { selectedDonor: { ...bank, isBank: true } } });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="text-red-600" size={26} />
            Blood Banks Directory
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {role === 'admin'
              ? 'Manage and review blood bank registrations.'
              : 'Discover and contact accredited local blood banks.'}
          </p>
        </div>
        <div className="text-sm text-gray-400 dark:text-gray-500 glass-panel rounded-xl px-4 py-2">
          {filteredBanks.length} bank{filteredBanks.length !== 1 ? 's' : ''} found
        </div>
      </motion.div>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-2xl p-4 flex items-center gap-3"
      >
        <Search className="text-red-500 shrink-0" size={20} />
        <input
          type="text"
          placeholder="Search blood banks by name or city..."
          className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        )}
      </motion.div>

      {/* Grid */}
      {filteredBanks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-full p-12 text-center glass-panel rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700"
        >
          <Building2 size={48} className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No matching blood banks found.</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Try a different search term.</p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredBanks.map(bank => {
            const statusCfg = STATUS_CONFIG[bank.status] || STATUS_CONFIG.pending;
            return (
              <motion.div
                key={bank.id || bank._id}
                variants={item}
                whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                className="clay-card flex flex-col p-6 relative overflow-hidden group spotlight-group"
              >
                {/* Status badge */}
                {role === 'admin' && (
                  <span className={`absolute top-4 right-4 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${statusCfg.cls}`}>
                    {statusCfg.label}
                  </span>
                )}

                {/* Icon */}
                <div className="w-13 h-13 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-4 w-12 h-12">
                  <Building2 size={24} />
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-1">{bank.name}</h3>

                <div className="space-y-2 mb-5 text-gray-500 dark:text-gray-400 flex-1">
                  <p className="flex items-start gap-2 text-sm">
                    <MapPin size={15} className="shrink-0 mt-0.5 text-red-500" />
                    <span className="line-clamp-2">{bank.location}, {bank.city}</span>
                  </p>
                  {bank.contact && (
                    <p className="flex items-center gap-2 text-sm">
                      <Phone size={15} className="shrink-0 text-red-500" />
                      <span>{bank.contact}</span>
                    </p>
                  )}
                  {bank.inventory && (
                    <p className="flex items-center gap-2 text-sm">
                      <Droplets size={15} className="shrink-0 text-red-500" />
                      <span>{Object.values(bank.inventory || {}).reduce((a, b) => a + (b || 0), 0)} total units</span>
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                  {role === 'admin' && bank.status === 'pending' ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStatus(bank.id || bank._id, 'approved')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-2 text-sm"
                      >
                        <CheckCircle size={15} className="mr-1.5" /> Approve
                      </Button>
                      <Button
                        onClick={() => handleStatus(bank.id || bank._id, 'rejected')}
                        variant="secondary"
                        className="px-3 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 py-2"
                      >
                        <XCircle size={15} />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleMessage(bank)}
                      className="w-full flex items-center justify-center gap-2"
                      variant="outline"
                    >
                      <MessageSquare size={16} /> Contact Bank
                    </Button>
                  )}
                </div>

                {/* Hover accent */}
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-red-600 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
