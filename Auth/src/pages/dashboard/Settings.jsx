import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Settings as SettingsIcon, ShieldCheck, HeartPulse, User, 
  Bell, Lock, Eye, Activity, Save
} from 'lucide-react';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

export default function Settings() {
  const { role } = useSelector(state => state.auth);
  const [notifs, setNotifs] = useState({ email: true, push: true, emergency: true });
  const [privacy, setPrivacy] = useState({ showPhone: true, showLocation: true });

  const handleSave = () => {
    toast.success('Settings saved successfully (locally simulated)');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon size={28} className="text-red-600" />
          Account Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your notification preferences and privacy controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Notification Preferences */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-indigo-600">
            <Bell size={20} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { id: 'email', label: 'Email Notifications', desc: 'Receive updates about requests' },
              { id: 'emergency', label: 'Emergency SOS Alerts', desc: 'Priority alerts for critical needs' },
              { id: 'push', label: 'Browser Push Notifications', desc: 'Real-time dashboard updates' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifs[item.id]} 
                  onChange={() => setNotifs({...notifs, [item.id]: !notifs[item.id]})}
                  className="w-5 h-5 rounded-md text-red-600 border-gray-300 focus:ring-red-500" 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Controls */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-green-600">
            <Lock size={20} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Privacy Controls</h2>
          </div>
          <div className="space-y-4">
            {[
              { id: 'showPhone', label: 'Public Phone Number', desc: 'Visible on requests and profile' },
              { id: 'showLocation', label: 'City Visibility', desc: 'Allow others to see your city' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={privacy[item.id]} 
                  onChange={() => setPrivacy({...privacy, [item.id]: !privacy[item.id]})}
                  className="w-5 h-5 rounded-md text-red-600 border-gray-300 focus:ring-red-500" 
                />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Role & System Info */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-zinc-800 pb-4">
          Access & System Integrity
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-5 bg-gray-50 dark:bg-zinc-950/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center">
              {role === 'admin' ? <ShieldCheck /> : role === 'donor' ? <HeartPulse /> : <User />}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Account Role</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{role}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-5 bg-gray-50 dark:bg-zinc-950/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
              <Activity />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Request Limit</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">1 Active Request</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} className="w-auto px-8">
            <Save size={18} /> Save Settings
          </Button>
        </div>
      </div>
    
    </div>
  );
}
