import { Link } from 'react-router-dom';
import { Droplet, Code, Mail } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Upcoming Events', to: '/upcoming-events' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
  ],
  Account: [
    { label: 'Sign in', to: '/signin' },
    { label: 'Create account', to: '/signup' },
    { label: 'Dashboard', to: '/dashboard' },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="relative border-t border-gray-200/60 dark:border-zinc-800/60 bg-[#0f0c29] text-gray-300">
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(212,175,55,0.15) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold text-white">
              <span className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                <Droplet size={20} aria-hidden="true" />
              </span>
              Blood4U
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400 max-w-sm">
              A production-grade blood donation network connecting donors, hospitals, and blood banks in real time — saving lives through technology.
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href="https://github.com/rana-saboorr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer-interactive"
                aria-label="GitHub profile"
              >
                <Code size={18} aria-hidden="true" />
              </a>
              <a
                href="mailto:saboor.rana49@gmail.com"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer-interactive"
                aria-label="Email contact"
              >
                <Mail size={18} aria-hidden="true" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <nav key={title} aria-label={`${title} links`}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Blood4U. Developed with care by Abdul Saboor.</p>
          <p>JWT auth via secure httpOnly cookies · CSRF protected</p>
        </div>
      </div>
    </footer>
  );
}
