import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Droplet, Save, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { updateBloodStockApi } from '../../features/data/dataSlice';
import toast from 'react-hot-toast';
import Button from '../../components/Button';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ManageBloodStock() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { bloodBanks } = useSelector(state => state.data);

  // Find the bank registered by this user
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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
          <Building2 size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Blood Bank Found</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          You haven't registered a blood bank yet or your application is not associated with this account.
        </p>
      </div>
    );
  }

  if (registeredBank.status !== 'approved') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={40} className="text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Approval Pending</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Your blood bank <strong>"{registeredBank.name}"</strong> is currently pending admin approval. 
          Stock management will be available once your license is verified.
        </p>
      </div>
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
      await dispatch(updateBloodStockApi({ id: registeredBank.id, bloodStock: stock })).unwrap();
      toast.success('Inventory updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update stock');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blood Stock Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage real-time inventory for <strong>{registeredBank.name}</strong></p>
        </div>
        <Button 
          onClick={onSave} 
          isLoading={isSaving}
          className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 px-8"
        >
          <Save size={18} className="mr-2" /> Save Changes
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {BLOOD_GROUPS.map((bg) => (
          <motion.div
            key={bg}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600 font-bold">
                {bg}
              </div>
              <Droplet size={18} className="text-gray-300 dark:text-zinc-700" />
            </div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Available Units</label>
            <input
              type="number"
              min="0"
              value={stock[bg] || 0}
              onChange={(e) => handleUpdate(bg, e.target.value)}
              className="w-full text-3xl font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white"
            />
          </motion.div>
        ))}
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl flex items-start gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-2xl text-blue-600">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 dark:text-blue-400">Inventory Sync Active</h4>
          <p className="text-blue-700/80 dark:text-blue-400/70 text-sm mt-1">
            Updating the stock here will immediately reflect in the public searches and donor matching engine.
            Ensure your records are accurate to help users finding blood.
          </p>
        </div>
      </div>
    </div>
  );
}
