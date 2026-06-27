import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, Save, AlertCircle, CheckCircle2, Building2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { updateBloodStockApi } from '../../features/data/dataSlice';
import toast from 'react-hot-toast';
import Button from '../../components/Button';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, scale: 0.92, y: 16 }, show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };

function StockLevel({ units }) {
  if (units === 0) return <span className="text-xs font-semibold text-red-500 flex items-center gap-1"><TrendingDown size={12} /> Critical</span>;
  if (units < 10) return <span className="text-xs font-semibold text-amber-500 flex items-center gap-1"><Minus size={12} /> Low</span>;
  return <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1"><TrendingUp size={12} /> Good</span>;
}

export default function ManageBloodStock() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { bloodBanks } = useSelector(state => state.data);

  const registeredBank = bloodBanks.find(
    (b) => b.ownerUserId?.toString() === user?._id?.toString() || b.ownerUserId === user?.id
  );

  const [stock, setStock] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (registeredBank?.bloodStock) {
      setStock(registeredBank.bloodStock);
    }
  }, [registeredBank]);

  if (!registeredBank) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-24 h-24 clay-card rounded-full flex items-center justify-center mb-6">
          <Building2 size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Blood Bank Found</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          You haven't registered a blood bank yet or your application is not associated with this account.
        </p>
      </motion.div>
    );
  }

  if (registeredBank.status !== 'approved') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={40} className="text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Approval Pending</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Your blood bank <strong>"{registeredBank.name}"</strong> is currently pending admin approval.
          Stock management will be available once your license is verified.
        </p>
      </motion.div>
    );
  }

  const handleUpdate = (bg, val) => {
    const num = parseInt(val) || 0;
    if (num < 0) return;
    setStock(prev => ({ ...prev, [bg]: num }));
  };

  const onSave = async () => {
    try {
      setIsSaving(true);
      await dispatch(updateBloodStockApi({ id: registeredBank.id || registeredBank._id, bloodStock: stock })).unwrap();
      toast.success('Inventory updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update stock');
    } finally {
      setIsSaving(false);
    }
  };

  const totalUnits = Object.values(stock).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Droplet className="text-red-600" size={28} />
            Blood Stock Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Managing inventory for <strong className="text-gray-700 dark:text-gray-300">{registeredBank.name}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-panel rounded-xl px-4 py-2 text-center">
            <div className="text-xl font-bold text-red-600">{totalUnits}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">total units</div>
          </div>
          <Button
            onClick={onSave}
            isLoading={isSaving}
            className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 px-6"
          >
            <Save size={17} className="mr-2" /> Save Changes
          </Button>
        </div>
      </motion.header>

      {/* Stock Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {BLOOD_GROUPS.map((bg) => {
          const units = stock[bg] || 0;
          const isLow = units < 10;
          const isCritical = units === 0;
          return (
            <motion.div
              key={bg}
              variants={item}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
              className="clay-card p-5 relative overflow-hidden group"
            >
              {/* Bg accent */}
              <div className={`absolute inset-0 rounded-[1.25rem] transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                isCritical ? 'bg-red-500/5' : isLow ? 'bg-amber-500/5' : 'bg-emerald-500/5'
              }`} />

              <div className="flex items-center justify-between mb-3 relative">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold ${
                  isCritical
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-600'
                    : isLow
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                }`}>
                  {bg}
                </div>
                <Droplet size={16} className={`${isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-gray-300 dark:text-zinc-700'}`} />
              </div>

              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 relative">
                Available Units
              </label>
              <input
                type="number"
                min="0"
                value={units}
                onChange={(e) => handleUpdate(bg, e.target.value)}
                className="w-full text-3xl font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white outline-none neo-inset rounded-lg relative"
              />
              <div className="mt-2 relative">
                <StockLevel units={units} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-panel rounded-2xl p-5 flex items-start gap-4 border border-emerald-200/50 dark:border-emerald-900/30"
      >
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 shrink-0">
          <CheckCircle2 size={22} />
        </div>
        <div>
          <h4 className="font-bold text-emerald-900 dark:text-emerald-400">Inventory Sync Active</h4>
          <p className="text-emerald-700/80 dark:text-emerald-400/70 text-sm mt-1">
            Updating stock here immediately reflects in public searches and the donor matching engine.
            Keep your records accurate to help users find blood faster.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
