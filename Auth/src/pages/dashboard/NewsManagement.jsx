import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { createNewsApi, deleteNewsApi } from '../../features/data/dataSlice';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Megaphone, Trash2, Radio, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const schema = yup.object().shape({
  title: yup.string().required('Title is required').min(5, 'Title too short'),
  content: yup.string().required('Content is required').min(10, 'Please write a proper description'),
});

const listItem = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

export default function NewsManagement() {
  const { news } = useSelector(state => state.data);
  const dispatch = useDispatch();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    try {
      await dispatch(createNewsApi(data)).unwrap();
      toast.success('News broadcasted successfully');
      reset();
    } catch (error) {
      toast.error(error.message || 'Failed to publish news');
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteNewsApi(id)).unwrap();
      toast.success('News removed from feed');
    } catch (error) {
      toast.error(error.message || 'Failed to remove news');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Megaphone className="text-red-600" size={30} />
          Broadcast News
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Post critical announcements, alerts, or shortage notices to all users.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Compose Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-3xl p-6 h-fit"
        >
          <h2 className="text-xl font-bold mb-5 text-gray-900 dark:text-white flex items-center gap-2">
            <Radio size={18} className="text-red-500" /> Create Broadcast
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Headline / Title"
              placeholder="e.g. Critical Blood Shortage in Lahore"
              {...register('title')}
              error={errors.title?.message}
            />
            <div className="flex flex-col">
              <label className="mb-1.5 text-sm font-medium text-gray-900 dark:text-white">Full Message Content</label>
              <textarea
                rows="5"
                {...register('content')}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all bg-transparent text-gray-900 dark:text-white resize-y neo-inset ${
                  errors.content
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-gray-200 dark:border-zinc-700 focus:border-red-500'
                }`}
                placeholder="Write your announcement details here..."
              />
              {errors.content && <span className="mt-1 text-sm text-red-500">{errors.content.message}</span>}
            </div>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 mt-4 shadow-lg shadow-red-500/20"
            >
              <Megaphone size={16} className="mr-2" /> Publish to Dashboard
            </Button>
          </form>
        </motion.div>

        {/* Broadcast Feed */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3 max-h-[580px] overflow-y-auto pr-1"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Active Broadcasts <span className="text-sm font-normal text-gray-400">({news.length})</span>
          </h2>

          <AnimatePresence mode="popLayout">
            {news.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-10 text-center glass-panel rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700"
              >
                <Megaphone size={36} className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No broadcasts yet.</p>
              </motion.div>
            ) : (
              news.map(n => (
                <motion.div
                  key={n.id || n._id}
                  variants={listItem}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  layout
                  className="clay-card p-5 relative overflow-hidden group"
                >
                  {/* Left accent stripe */}
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-red-600 to-amber-500" />

                  <div className="flex justify-between items-start pl-3">
                    <div className="flex-1 min-w-0 mr-3">
                      <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">{n.title}</h3>
                      <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {n.date ? new Date(n.date).toLocaleDateString() : 'Recently posted'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(n.id || n._id)}
                      className="p-2 bg-gray-50 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mt-3 pl-3 bg-gray-50/60 dark:bg-zinc-800/40 p-3 rounded-xl">
                    {n.content}
                  </p>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
