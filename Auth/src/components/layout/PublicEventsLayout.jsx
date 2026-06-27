import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Droplet } from 'lucide-react';
import LandingNavbar from '../layout/LandingNavbar';
import LandingFooter from '../layout/LandingFooter';
import BackToTop from '../layout/BackToTop';

export default function PublicEventsLayout({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen hero-mesh transition-theme flex flex-col">
      {isAuthenticated ? (
        <header className="h-16 glass-panel border-b border-white/30 dark:border-zinc-800/50 flex items-center px-4 lg:px-8 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold text-gray-900 dark:text-white">
            <span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <Droplet size={16} aria-hidden="true" />
            </span>
            Blood4U Dashboard
          </Link>
        </header>
      ) : (
        <LandingNavbar />
      )}

      <main id="main-content" className={`flex-1 ${isAuthenticated ? 'p-4 lg:p-8' : 'pt-24 pb-16 px-4 sm:px-6 lg:px-8'}`}>
        {children}
      </main>

      {!isAuthenticated && <LandingFooter />}
      <BackToTop />
    </div>
  );
}
