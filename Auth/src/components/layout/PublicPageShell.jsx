import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LandingNavbar from './LandingNavbar';
import LandingFooter from './LandingFooter';
import BackToTop from './BackToTop';

export default function PublicPageShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen hero-mesh transition-theme flex flex-col">
      <LandingNavbar />
      <main id="main-content" className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 mb-8 transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to home
          </Link>

          <header className="mb-10">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">{subtitle}</p>
            )}
          </header>

          <article className="glass-panel rounded-3xl p-8 sm:p-10 prose-legal space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
            {children}
          </article>
        </div>
      </main>
      <LandingFooter />
      <BackToTop />
    </div>
  );
}
