import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { createNewsApi, deleteNewsApi } from '../../features/data/dataSlice';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Megaphone, Trash2 } from 'lucide-react';

const schema = yup.object().shape({
  title: yup.string().required('Title is required').min(5, 'Title too short'),
  content: yup.string().required('Content is required').min(10, 'Please write a proper description'),
});

export default function NewsManagement() {
  const { news } = useSelector(state => state.data);
  const dispatch = useDispatch();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
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
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Megaphone className="text-indigo-600" size={32} />
          Broadcast News
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Post critical announcements, alerts, or shortage notices to all users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-zinc-800 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create Broadcast</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Headline / Title" placeholder="e.g. Critical Blood Shortage" {...register('title')} error={errors.title?.message} />
            <div className="flex flex-col">
              <label className="mb-1.5 text-sm font-medium text-gray-900 dark:text-white">Full Message Content</label>
              <textarea 
                rows="5"
                {...register('content')}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all bg-transparent text-gray-900 dark:text-white dark:bg-zinc-800/50 resize-y ${errors.content ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 dark:border-zinc-700'}`}
                placeholder="Write your announcement details here..."
              ></textarea>
              {errors.content && <span className="mt-1 text-sm text-red-500">{errors.content.message}</span>}
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4 shadow-lg shadow-indigo-500/20">
              Publish to Dashboard
            </Button>
          </form>
        </div>

        {/* Existing Feed */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {news.map(item => (
            <div key={item.id} className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500"></div>
              <div className="flex justify-between items-start pl-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.title}</h3>
                  <span className="text-xs text-gray-500 block mb-3">{item.date}</span>
                </div>
                <button onClick={() => handleDelete(item.id)} className="p-2 bg-gray-50 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed pl-2 bg-gray-50 dark:bg-zinc-800/30 p-3 rounded-xl">
                {item.content}
              </p>
            </div>
          ))}
          {news.length === 0 && (
            <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl">
              No news items posted yet.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
