import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateBloodBankStatus } from '../../features/data/dataSlice';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Phone, Building2, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

export default function BloodBanks() {
  const { role } = useSelector(state => state.auth);
  const { bloodBanks } = useSelector(state => state.data);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Admins see all, Users/Donors see only approved
  const visibleBanks = role === 'admin' 
    ? bloodBanks 
    : bloodBanks.filter(b => b.status === 'approved');

  const filteredBanks = visibleBanks.filter(bank => 
    bank.city.toLowerCase().includes(searchTerm.toLowerCase()) || 
    bank.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatus = (id, status) => {
    dispatch(updateBloodBankStatus({ id, status }));
    toast.success(`Blood Bank marked as ${status}`);
  };

  const handleMessage = (bank) => {
    // Treat the bank as a messageable entity identical to a donor
    navigate('/dashboard/chat', { state: { selectedDonor: { ...bank, isBank: true } } });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blood Banks Directory</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {role === 'admin' ? 'Manage unverified bank registrations.' : 'Discover and contact accredited local blood banks.'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search blood banks by name or city..." 
          className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredBanks.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-transparent border border-dashed border-gray-300 dark:border-zinc-700 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">No matching blood banks found.</p>
          </div>
        ) : (
          filteredBanks.map(bank => (
            <div key={bank.id} className="bg-white dark:bg-zinc-900 rounded-2xl flex flex-col p-6 shadow-sm hover:shadow-lg transition-shadow border border-gray-200 dark:border-zinc-800 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                {role === 'admin' && (
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${bank.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                    {bank.status}
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-1">{bank.name}</h3>
              
              <div className="space-y-2 mb-6 text-gray-600 dark:text-gray-400">
                <p className="flex items-start gap-2">
                  <MapPin size={18} className="shrink-0 mt-0.5" />
                  <span className="text-sm line-clamp-2">{bank.location}, {bank.city}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={18} className="shrink-0" />
                  <span className="text-sm">{bank.contact}</span>
                </p>
              </div>

              <div className="mt-auto border-t border-gray-100 dark:border-zinc-800 pt-4">
                {role === 'admin' && bank.status === 'pending' ? (
                  <div className="flex gap-3">
                    <Button onClick={() => handleStatus(bank.id, 'approved')} className="w-full bg-green-600 hover:bg-green-700 py-2">
                      <CheckCircle size={18} className="mr-2" /> Approve
                    </Button>
                    <Button onClick={() => handleStatus(bank.id, 'rejected')} variant="secondary" className="px-4 text-red-600 border-red-200 hover:bg-red-50 py-2">
                      <XCircle size={18} />
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => handleMessage(bank)} className="w-full flex items-center gap-2" variant="outline">
                    <MessageSquare size={18} /> Contact Admin/Bank
                  </Button>
                )}
              </div>

              {/* Decorative side accent */}
              <div className="absolute top-0 right-0 bottom-0 w-1 bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
