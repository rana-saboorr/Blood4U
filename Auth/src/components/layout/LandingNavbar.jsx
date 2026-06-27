import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, Droplet } from 'lucide-react';
import { toggleTheme } from '../../features/theme/themeSlice';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import Button from '../Button';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Events', to: '/upcoming-events' },
  { label: 'About', href: '#about' },
];

export default function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.theme);
  const { navVisible, scrolled } = useScrollDirection();

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: navVisible ? 0 : -100 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-panel border-b border-white/20 dark:border-zinc-800/50 shadow-sm' : 'bg-transparent'
      }`}
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-xl font-bold text-gray-900 dark:text-white hover:opacity-90 transition-opacity"
          aria-label="Blood4U home"
        >
          <span className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/25">
            <Droplet size={18} aria-hidden="true" />
          </span>
          Blood<span className="text-red-600">4</span>U
        </Link>

        <ul className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.label}>
              {link.to ? (
                <NavLink
                  to={link.to}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  {link.label}
                </NavLink>
              ) : (
                <a
                  href={link.href}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer-interactive"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link to="/signin">
            <Button variant="ghost" className="!py-2.5 !px-4 !shadow-none">
              Sign in
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="!py-2.5 !px-5">Get started</Button>
          </Link>
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-gray-700 dark:text-gray-200 cursor-pointer-interactive"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-panel border-t border-white/10 overflow-hidden"
          >
            <ul className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <NavLink
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      {link.label}
                    </NavLink>
                  ) : (
                    <a
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
              <li className="pt-3 flex flex-col gap-2">
                <Link to="/signin" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Sign in</Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Get started free</Button>
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
