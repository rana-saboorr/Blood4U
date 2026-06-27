import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { createEventApi, deleteEventApi } from '../../features/data/dataSlice';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Plus, X, Calendar, MapPin, Trash2, Clock, Users } from 'lucide-react';

const schema = yup.object().shape({
  name: yup.string().required('Event name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  type: yup.string().required('Event type is required'),
  date: yup.date()
    .typeError('Invalid date')
    .min(new Date(new Date().setHours(0,0,0,0)), 'Event date must be in the future')
    .required('Date is required'),
  time: yup.string().required('Time is required'),
  venue: yup.string().required('Venue name is required'),
  address: yup.string().required('Address is required'),
  postalCode: yup.string().required('Postal code is required'),
  city: yup.string().required('City is required'),
  capacity: yup.number().typeError('Must be a number').min(10, 'Minimum 10 allowed').required('Capacity is required'),
});

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };

export default function Events() {
  const { events } = useSelector(state => state.data);
  const { role, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { type: 'Camp' }
  });

  const onSubmit = async (data) => {
    try {
      const formattedDate = typeof data.date === 'string' ? data.date : data.date.toISOString().split('T')[0];
      await dispatch(createEventApi({ ...data, date: formattedDate })).unwrap();
      toast.success('Event created successfully!');
      reset();
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message || 'Failed to create event');
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteEventApi(id)).unwrap();
      toast.success('Event removed');
    } catch (error) {
      toast.error(error.message || 'Failed to remove event');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Calendar className="text-red-600" size={30} /> Manage Blood Drive Events
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage blood donation camps.</p>
        </div>
        {['admin', 'bankOwner'].includes(role) && (
          <Button onClick={() => setIsModalOpen(true)} className="w-auto px-6 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 shrink-0">
            <Plus size={18} className="mr-1.5" /> Host New Camp
          </Button>
        )}
      </motion.div>

      {/* Grid */}
      {events.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center glass-panel rounded-3xl border border-dashed border-gray-300 dark:border-zinc-700"
        >
          <Calendar className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" size={48} />
          <p className="text-gray-500 dark:text-gray-400 font-semibold">No active events yet.</p>
          <p className="text-sm text-gray-400 mt-1">Create your first donation camp to get started.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          {events.map((evt) => {
            const rsvpPct = evt.capacity ? Math.round((evt.rsvpList?.length || 0) / evt.capacity * 100) : 0;
            const isOwner = role === 'admin' || evt.createdBy?.id === user?._id || evt.createdBy === user?._id;
            return (
              <motion.div
                key={evt.id || evt._id}
                variants={item}
                whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
                className="clay-card flex flex-col relative overflow-hidden group"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 to-amber-500" />
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase rounded-full tracking-wider mb-2">
                          {evt.type}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{evt.name}</h3>
                      </div>
                      
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(evt.id || evt._id)}
                          className="p-2 text-gray-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-500 dark:text-gray-400 mb-5 mt-4">
                      <div className="flex items-center gap-2">
                        <Clock size={15} className="text-red-500 shrink-0" />
                        <span>{evt.date} · {evt.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-red-500 shrink-0" />
                        <span className="truncate">{evt.venue}, {evt.city}</span>
                      </div>
                    </div>
                  </div>

                  {evt.capacity && (
                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800/80">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                        <span className="flex items-center gap-1 font-medium"><Users size={12} /> {evt.rsvpList?.length || 0} attending</span>
                        <span>Capacity: {evt.capacity}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 neo-inset">
                        <div
                          className={`h-1.5 rounded-full ${rsvpPct >= 90 ? 'bg-red-500' : rsvpPct >= 60 ? 'bg-amber-500' : 'bg-red-600'}`}
                          style={{ width: `${Math.min(100, rsvpPct)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Create Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="glass-panel rounded-3xl w-full max-w-3xl my-4 shadow-2xl border border-white/40 dark:border-zinc-700"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar size={20} className="text-red-600" /> Host New Event / Camp
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 hover:text-gray-950 dark:hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Event Name" placeholder="City Central Blood Drive" {...register('name')} error={errors.name?.message} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Event Type</label>
                    <select {...register('type')} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-white ${errors.type ? 'border-red-400' : 'border-gray-200 dark:border-zinc-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'}`}>
                      <option value="Camp">Donation Camp</option>
                      <option value="Seminar">Awareness Seminar</option>
                      <option value="Drive">Blood Drive</option>
                    </select>
                    {errors.type && <span className="text-xs text-red-500">{errors.type.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="Event Date" type="date" {...register('date')} error={errors.date?.message} />
                  <Input label="Event Time" type="time" {...register('time')} error={errors.time?.message} />
                  <Input label="Max Capacity" type="number" placeholder="100" {...register('capacity')} error={errors.capacity?.message} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Organizer Email" placeholder="org@example.com" type="email" {...register('email')} error={errors.email?.message} />
                  <Input label="Organizer Phone" placeholder="03001234567" {...register('phone')} error={errors.phone?.message} />
                </div>

                <Input label="Venue Name" placeholder="Liberty Hall" {...register('venue')} error={errors.venue?.message} />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <Input label="Full Address" placeholder="123 Street Ave" {...register('address')} error={errors.address?.message} />
                  </div>
                  <Input label="City" placeholder="Lahore" {...register('city')} error={errors.city?.message} />
                </div>

                <Input label="Postal Code" placeholder="54000" {...register('postalCode')} error={errors.postalCode?.message} />

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="w-auto px-6">Cancel</Button>
                  <Button type="submit" className="w-auto px-8 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20">Create Event</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
