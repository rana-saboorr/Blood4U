import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Settings as SettingsIcon, ShieldCheck, HeartPulse, User, 
  Bell, Lock, Eye, Activity, Save, CheckCircle2
} from 'lucide-react';
import Button from '../../components/Button';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } } };

function Toggle({ checked, onChange, id }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      id={id}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
        checked ? 'bg-red-600' : 'bg-gray-200 dark:bg-zinc-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const { role } = useSelector(state => state.auth);
  const [notifs, setNotifs] = useState({ email: true, push: true, emergency: true });
  const [privacy, setPrivacy] = useState({ showPhone: true, showLocation: true });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Settings saved successfully');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon size={28} className="text-red-600" />
          Account Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your notification preferences and privacy controls.</p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Notifications */}
        <motion.div variants={item} className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <Bell size={18} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <div className="space-y-3">
            {[
              { id: 'email', label: 'Email Notifications', desc: 'Receive updates about requests' },
              { id: 'emergency', label: 'Emergency SOS Alerts', desc: 'Priority alerts for critical needs' },
              { id: 'push', label: 'Browser Push Notifications', desc: 'Real-time dashboard updates' },
            ].map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{setting.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{setting.desc}</p>
                </div>
                <Toggle
                  id={setting.id}
                  checked={notifs[setting.id]}
                  onChange={() => setNotifs(p => ({ ...p, [setting.id]: !p[setting.id] }))}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Privacy */}
        <motion.div variants={item} className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Lock size={18} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Privacy Controls</h2>
          </div>
          <div className="space-y-3">
            {[
              { id: 'showPhone', label: 'Public Phone Number', desc: 'Visible on requests and profile' },
              { id: 'showLocation', label: 'City Visibility', desc: 'Allow others to see your city' },
            ].map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{setting.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{setting.desc}</p>
                </div>
                <Toggle
                  id={setting.id}
                  checked={privacy[setting.id]}
                  onChange={() => setPrivacy(p => ({ ...p, [setting.id]: !p[setting.id] }))}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Role & System Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel rounded-3xl p-8"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-zinc-800 pb-4">
          Access & System Integrity
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="clay-card flex items-center gap-3 p-5">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
              {role === 'admin' ? <ShieldCheck size={22} /> : role === 'donor' ? <HeartPulse size={22} /> : <User size={22} />}
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Account Role</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{role}</p>
            </div>
          </div>

          <div className="clay-card flex items-center gap-3 p-5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Request Limit</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">1 Active Request</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} className="px-8 gap-2">
            {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {saved ? 'Saved!' : 'Save Settings'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
