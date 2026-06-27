import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPublicEvents, toggleRsvpApi } from '../../features/data/dataSlice';
import { Calendar, Clock, MapPin, Users, Info, CheckCircle2, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function UpcomingEvents() {
  const { events } = useSelector(state => state.data);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [cityFilter, setCityFilter] = useState('');
  const userId = user?._id?.toString() || null;

  useEffect(() => {
    if (!events || events.length === 0) {
      dispatch(fetchPublicEvents()).catch(() => {
        toast.error('Failed to load events.');
      });
    }
  }, [dispatch, events]);

  const displayEvents = events.filter(evt =>
    evt.status === 'approved' &&
    evt.city.toLowerCase().includes(cityFilter.toLowerCase())
  );

  const handleRsvp = async (event) => {
    if (!user?._id) {
      navigate('/signin');
      return;
    }

    const userId = user._id.toString();
    const hasRsvpd = event.rsvpList.includes(userId);
    const isFull = event.rsvpList.length >= event.capacity;

    if (!hasRsvpd && isFull) {
      toast.error('This event is at full capacity!');
      return;
    }
    try {
      await dispatch(toggleRsvpApi(event.id)).unwrap();
      await dispatch(fetchPublicEvents()).unwrap();
      toast.success(hasRsvpd ? `Cancelled RSVP for ${event.name}` : `You've RSVP'd for ${event.name}! 🎉`);
    } catch (error) {
      toast.error(error.message || 'RSVP request failed');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upcoming Events</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Discover blood camps near you. RSVP to reserve your spot.</p>
        </div>
        <input
          type="text"
          placeholder="Filter by City..."
          className="w-full md:w-64 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white outline-none"
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
        />
      </div>

      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayEvents.map((evt, i) => {
            const hasRsvpd = evt.rsvpList.includes(userId);
            const isFull = evt.rsvpList.length >= evt.capacity;
            const capacityPct = Math.round((evt.rsvpList.length / evt.capacity) * 100);

            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`group bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border ${hasRsvpd ? 'border-green-300 dark:border-green-700' : 'border-gray-100 dark:border-zinc-800'}`}
              >
                {/* Header art */}
                <div className={`h-28 flex items-center justify-center relative overflow-hidden ${hasRsvpd ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-indigo-600'}`}>
                  <div className="absolute inset-0 bg-black/15 mix-blend-multiply" />
                  <Calendar size={48} className="text-white/20 absolute -left-4 -bottom-4 scale-150 rotate-[-15deg]" />
                  <div className="relative z-10 flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-full text-white text-sm font-bold border border-white/30">
                      {evt.type}
                    </span>
                    {hasRsvpd && (
                      <span className="px-3 py-1.5 bg-white/30 backdrop-blur rounded-full text-white text-xs font-bold border border-white/30 flex items-center gap-1">
                        <CheckCircle2 size={14} /> You're In!
                      </span>
                    )}
                    {isFull && !hasRsvpd && (
                      <span className="px-3 py-1.5 bg-red-800/70 backdrop-blur rounded-full text-white text-xs font-bold border border-red-900/30">
                        FULL
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-red-600 transition-colors line-clamp-1">
                    {evt.name}
                  </h3>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500 shrink-0">
                        <Clock size={16} />
                      </div>
                      <span className="text-sm">{evt.date} at {evt.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/10 flex items-center justify-center text-indigo-500 shrink-0">
                        <MapPin size={16} />
                      </div>
                      <span className="text-sm truncate">{evt.venue}, {evt.city}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-9 h-9 rounded-full bg-green-50 dark:bg-green-900/10 flex items-center justify-center text-green-500 shrink-0">
                        <Users size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{evt.rsvpList.length} attendees</span>
                          <span>Cap: {evt.capacity}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${capacityPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center text-amber-500 shrink-0">
                        <Phone size={16} />
                      </div>
                      <span className="text-sm">{evt.contact}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                    <button
                      onClick={() => handleRsvp(evt)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        hasRsvpd
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 hover:border-red-200'
                          : isFull
                          ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20'
                      }`}
                      disabled={isFull && !hasRsvpd}
                    >
                      {hasRsvpd ? '✓ Attending — Click to Cancel' : isFull ? 'Event Full' : "I'm Attending →"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {displayEvents.length === 0 && (
            <div className="col-span-full p-12 text-center bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Events Found</h3>
              <p className="text-gray-500 mt-2">Adjust your city filter or check back later.</p>
            </div>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
}
