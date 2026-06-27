import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthToastProvider from './components/AuthToastProvider';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import LoadingScreen from './components/LoadingScreen';
import CookieConsent from './components/layout/CookieConsent';

const Landing = lazy(() => import('./pages/Landing'));
const Signin = lazy(() => import('./pages/Signin'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const OtpVerification = lazy(() => import('./pages/OtpVerification'));
const UpcomingEvents = lazy(() => import('./pages/dashboard/UpcomingEvents'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'));
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const BloodRequests = lazy(() => import('./pages/dashboard/BloodRequests'));
const BecomeDonor = lazy(() => import('./pages/dashboard/BecomeDonor'));
const BloodBanks = lazy(() => import('./pages/dashboard/BloodBanks'));
const Events = lazy(() => import('./pages/dashboard/Events'));
const SearchDonors = lazy(() => import('./pages/dashboard/SearchDonors'));
const Chat = lazy(() => import('./pages/dashboard/Chat'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const RegisterBloodBank = lazy(() => import('./pages/dashboard/RegisterBloodBank'));
const ManageBloodStock = lazy(() => import('./pages/dashboard/ManageBloodStock'));
const NewsManagement = lazy(() => import('./pages/dashboard/NewsManagement'));
const SmartMatch = lazy(() => import('./pages/dashboard/SmartMatch'));
const EmergencyRequest = lazy(() => import('./pages/dashboard/EmergencyRequest'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const DonationHistory = lazy(() => import('./pages/dashboard/DonationHistory'));

function PageLoader() {
  return <LoadingScreen />;
}

function App() {
  return (
    <>
      <AuthToastProvider />
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public marketing */}
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/upcoming-events" element={<UpcomingEvents />} />

            {/* Public Auth Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/signin" element={<Signin />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-otp" element={<OtpVerification />} />
            </Route>

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

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <CookieConsent />
      </Router>
    </>
  );
}

export default App;
