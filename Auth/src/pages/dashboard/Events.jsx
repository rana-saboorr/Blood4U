import { useState, useEffect } from 'react';
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

export default function Events() {
  const { events } = useSelector(state => state.data);
  const { role } = useSelector(state => state.auth);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="text-indigo-600" size={26} /> Manage Blood Drive Events
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create and manage blood donation camps.</p>
        </div>
        {['admin', 'bankOwner'].includes(role) && (
          <Button onClick={() => setIsModalOpen(true)} className="w-auto px-6 bg-indigo-600 hover:bg-indigo-700 shrink-0">
            <Plus size={18} /> Host New Camp
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {events.map((evt, i) => {
          const rsvpPct = evt.capacity ? Math.round((evt.rsvpList?.length || 0) / evt.capacity * 100) : 0;
          return (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-800/60 transition-all overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold uppercase rounded-full tracking-wider mb-2">
                      {evt.type}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{evt.name}</h3>
                  </div>
                  {/** Only display delete controls to admin users */}
                  {(role === 'admin' || evt.createdBy?.id === user?._id || evt.createdBy === user?._id) && (
                    <button
                      onClick={() => handleDelete(evt.id)}
                      className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-start gap-2">
                    <Clock size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                    <span>{evt.date} · {evt.time}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                    <span className="truncate">{evt.venue}, {evt.city}</span>
                  </div>
                </div>

                {evt.capacity && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="flex items-center gap-1"><Users size={12} /> {evt.rsvpList?.length || 0} attending</span>
                      <span>Capacity: {evt.capacity}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${rsvpPct >= 90 ? 'bg-red-500' : rsvpPct >= 60 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(100, rsvpPct)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {events.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700">
            <Calendar className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" size={40} />
            <p className="text-gray-500 dark:text-gray-400">No active events. Create your first camp!</p>
          </div>
        )}
      </div>

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
              className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-3xl my-4 shadow-2xl border border-gray-200 dark:border-zinc-700"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-600" /> Host New Event / Camp
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
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
                  <Input label="Organizer Phone" placeholder="+923001234567" {...register('phone')} error={errors.phone?.message} />
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
                  <Button type="submit" className="w-auto px-8 bg-indigo-600 hover:bg-indigo-700">Create Event</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
