import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthToastProvider from './components/AuthToastProvider';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';

// Public Auth Pages
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OtpVerification from './pages/OtpVerification';

// Dashboard Shell
import DashboardLayout from './components/dashboard/DashboardLayout';

// Dashboard Pages
import Overview from './pages/dashboard/Overview';
import BloodRequests from './pages/dashboard/BloodRequests';
import BecomeDonor from './pages/dashboard/BecomeDonor';
import BloodBanks from './pages/dashboard/BloodBanks';
import Events from './pages/dashboard/Events';
import UpcomingEvents from './pages/dashboard/UpcomingEvents';
import SearchDonors from './pages/dashboard/SearchDonors';
import Chat from './pages/dashboard/Chat';
import Settings from './pages/dashboard/Settings';
import RegisterBloodBank from './pages/dashboard/RegisterBloodBank';
import ManageBloodStock from './pages/dashboard/ManageBloodStock';
import NewsManagement from './pages/dashboard/NewsManagement';

// Phase 3 Pages
import SmartMatch from './pages/dashboard/SmartMatch';
import EmergencyRequest from './pages/dashboard/EmergencyRequest';
import Analytics from './pages/dashboard/Analytics';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Profile from './pages/dashboard/Profile';
import DonationHistory from './pages/dashboard/DonationHistory';

import './App.css';

function App() {
  return (
    <>
      <AuthToastProvider />
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
          </Route>

          {/* Public Events Route */}
          <Route path="/upcoming-events" element={<UpcomingEvents />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="requests" element={<BloodRequests />} />
              <Route path="smart-match" element={<SmartMatch />} />
              <Route path="emergency" element={<EmergencyRequest />} />
              <Route path="become-donor" element={<BecomeDonor />} />
              <Route path="banks" element={<BloodBanks />} />
              <Route path="register-bank" element={<RegisterBloodBank />} />
              <Route path="manage-stock" element={<ManageBloodStock />} />
              <Route path="events" element={<Events />} />
              <Route path="upcoming-events" element={<UpcomingEvents />} />
              <Route path="manage-news" element={<NewsManagement />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="search" element={<SearchDonors />} />
              <Route path="chat" element={<Chat />} />
              <Route path="profile" element={<Profile />} />
              <Route path="history" element={<DonationHistory />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
