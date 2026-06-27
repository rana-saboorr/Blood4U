import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, MapPin, Heart, Filter, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/Button';

const BADGE_CONFIG = {
  Gold: { icon: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' },
  Silver: { icon: '🥈', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700' },
  Bronze: { icon: '🥉', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
};

const isResting = (lastDonation) => {
  if (!lastDonation) return false;
  const daysSince = (Date.now() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < 90;
};

export default function SearchDonors() {
  const { donors } = useSelector(state => state.data);
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  const [cityFilter, setCityFilter] = useState('');
  const [bgFilter, setBgFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [skipResting, setSkipResting] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Location acquired! Finding nearby donors.');
      }, () => toast.error('Location access denied'));
    }
  };

  const filteredDonors = donors.map(d => {
    const lat = d.coords?.coordinates?.[1];
    const lng = d.coords?.coordinates?.[0];
    if (!userLocation || !lat || !lng) return { ...d, calculatedDistance: d.distance || 0 };
    const dist = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
    return { ...d, calculatedDistance: Math.round(dist * 10) / 10 };
  }).filter(donor => {
    if (bgFilter && donor.bloodGroup !== bgFilter) return false;
    if (cityFilter && !donor.city.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    if (typeFilter === 'paid' && !donor.paid) return false;
    if (typeFilter === 'unpaid' && donor.paid) return false;
    if (genderFilter && donor.gender !== genderFilter) return false;
    if (availFilter === 'available' && !donor.available) return false;
    if (availFilter === 'unavailable' && donor.available) return false;
    if (maxDistance && donor.calculatedDistance > parseFloat(maxDistance)) return false;
    if (skipResting && isResting(donor.lastDonation)) return false;
    return true;
  }).sort((a, b) => {
    if (userLocation) return a.calculatedDistance - b.calculatedDistance;
    return 0;
  });

  const handleMessage = (donor) => {
    navigate('/dashboard/chat', { state: { selectedDonor: donor } });
  };

  const clearFilters = () => {
    setCityFilter(''); setBgFilter(''); setTypeFilter('');
    setGenderFilter(''); setAvailFilter(''); setMaxDistance(''); setSkipResting(false);
  };

  const activeFilterCount = [bgFilter, cityFilter, typeFilter, genderFilter, availFilter, maxDistance, skipResting]
    .filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Donors</h1>
          <p className="text-gray-500 dark:text-gray-400">Advanced filters to find the exact match you need.</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all ${showFilters ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:border-red-300'}`}
        >
          <SlidersHorizontal size={18} />
          Filters {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-white text-red-600 text-xs font-bold flex items-center justify-center">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 flex items-center gap-3">
          <Search className="text-gray-400 shrink-0" size={20} />
          <input
            type="text"
            placeholder="Search by city..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white"
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
          />
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:underline font-medium shrink-0">Clear all</button>
          )}
        </div>
        <button
          onClick={handleNearMe}
          className={`px-6 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm
            ${userLocation ? 'bg-green-600 text-white' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.02] active:scale-95'}`}
        >
          <MapPin size={18} />
          {userLocation ? 'Location Active' : 'Near Me'}
        </button>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood Group</label>
                <select value={bgFilter} onChange={e => setBgFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white outline-none">
                  <option value="">Any</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} className="dark:bg-zinc-900" value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Donation Type</label>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white outline-none">
                  <option value="">Any</option>
                  <option className="dark:bg-zinc-900" value="unpaid">Volunteer</option>
                  <option className="dark:bg-zinc-900" value="paid">Paid</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender</label>
                <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white outline-none">
                  <option value="">Any</option>
                  {['Male','Female','Other'].map(g => <option key={g} className="dark:bg-zinc-900" value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Availability</label>
                <select value={availFilter} onChange={e => setAvailFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white outline-none">
                  <option value="">Any</option>
                  <option className="dark:bg-zinc-900" value="available">Available Now</option>
                  <option className="dark:bg-zinc-900" value="unavailable">Unavailable</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Max Distance (km)</label>
                <input type="number" value={maxDistance} onChange={e => setMaxDistance(e.target.value)}
                  placeholder="e.g. 10" min="0"
                  className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white outline-none" />
              </div>
              <div className="flex flex-col gap-1.5 justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={skipResting} onChange={e => setSkipResting(e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Hide resting donors</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {filteredDonors.length} donor{filteredDonors.length !== 1 ? 's' : ''} found
      </div>

      {/* Donor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {filteredDonors.map((donor, i) => {
            const badge = BADGE_CONFIG[donor.badge] || BADGE_CONFIG.Bronze;
            const resting = isResting(donor.lastDonation);
            return (
              <motion.div
                key={donor.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-zinc-800 flex flex-col hover:shadow-lg hover:border-red-200 dark:hover:border-red-900/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-full font-bold text-lg flex items-center justify-center border-2 ${resting ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 border-gray-200 dark:border-zinc-700' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'}`}>
                      {donor.bloodGroup}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${donor.online ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'}`} />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${badge.bg} ${badge.color}`}>
                      {badge.icon} {donor.badge}
                    </span>
                    {resting && <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full">💤 Resting</span>}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{donor.name}</h3>
                <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <p className="flex items-center gap-1.5"><MapPin size={14} />{donor.city}</p>
                  <p className="flex items-center gap-1.5">
                    <span>📏 {donor.calculatedDistance} km</span>
                    <span>·</span>
                    <span>{donor.gender}</span>
                    <span>·</span>
                    <span className={donor.paid ? 'text-amber-600' : 'text-green-600'}>{donor.paid ? '💰 Paid' : '❤️ Free'}</span>
                  </p>
                  <p className={`font-medium ${donor.available && !resting ? 'text-green-600' : 'text-gray-400'}`}>
                    {donor.available && !resting ? '✅ Available to donate' : '🔴 Not Available'}
                  </p>
                </div>

                <div className="mt-auto">
                  <Button onClick={() => handleMessage(donor)} className="w-full flex items-center gap-2 justify-center py-2.5">
                    <MessageSquare size={16} /> Message
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredDonors.length === 0 && (
          <div className="col-span-full py-16 text-center bg-transparent border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl">
            <Heart className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No matches</h3>
            <p className="text-gray-500 mt-1">Try broader search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
