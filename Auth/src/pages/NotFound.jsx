import { Link } from 'react-router-dom';
import { Search, Home, Droplet } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/layout/LandingNavbar';
import LandingFooter from '../components/layout/LandingFooter';
import Button from '../components/Button';

export default function NotFound() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (q.includes('sign') || q.includes('login')) navigate('/signin');
    else if (q.includes('event')) navigate('/upcoming-events');
    else if (q.includes('dash')) navigate('/dashboard');
    else navigate('/');
  };

  return (
    <div className="min-h-screen hero-mesh flex flex-col">
      <LandingNavbar />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 animate-float">
            <Droplet size={36} aria-hidden="true" />
          </div>
          <p className="text-8xl font-black text-gradient-brand tabular-nums" aria-hidden="true">404</p>
          <h1 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Page not found
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed">
            The page you're looking for doesn't exist or may have moved. Try searching or head back home.
          </p>

          <form onSubmit={handleSearch} className="mt-8 flex gap-2 max-w-md mx-auto" role="search">
            <label htmlFor="404-search" className="sr-only">Search pages</label>
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id="404-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try sign in, events, dashboard..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl glass-panel border border-white/30 dark:border-zinc-700 text-sm outline-none focus:ring-2 focus:ring-red-500/30 text-gray-900 dark:text-white"
              />
            </div>
            <Button type="submit" className="!px-5 shrink-0">Go</Button>
          </form>

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/">
              <Button variant="secondary" className="gap-2">
                <Home size={18} aria-hidden="true" />
                Back to home
              </Button>
            </Link>
            <Link to="/signin">
              <Button variant="outline">Sign in</Button>
            </Link>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
