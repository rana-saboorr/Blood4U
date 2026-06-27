import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Droplet, Zap, MessageSquare, Building2, Shield, MapPin,
  Heart, Activity, Sparkles, ArrowRight, CheckCircle2, Users
} from 'lucide-react';
import LandingNavbar from '../components/layout/LandingNavbar';
import LandingFooter from '../components/layout/LandingFooter';
import BackToTop from '../components/layout/BackToTop';
import Button from '../components/Button';
import { useSpotlight } from '../hooks/useSpotlight';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  {
    icon: Zap,
    title: 'Smart Matching',
    desc: 'Urgency-based donor matching by blood type and geolocation with 2dsphere proximity queries.',
    accent: 'from-red-500 to-red-700',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    desc: 'WhatsApp-style verified messaging between donors and hospitals — secure and instant.',
    accent: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Building2,
    title: 'Blood Bank Network',
    desc: 'Admin-approved bank registration with live inventory tracking and campaign management.',
    accent: 'from-purple-500 to-violet-600',
  },
  {
    icon: Sparkles,
    title: 'AI Blood Advisor',
    desc: 'Gemini-powered assistant with full donor awareness and blood compatibility rules.',
    accent: 'from-amber-500 to-orange-600',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    desc: 'JWT in httpOnly cookies, CSRF protection, rate limiting, and input sanitization.',
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    icon: MapPin,
    title: 'Near Me Discovery',
    desc: 'One-click sorting to find the physically closest life-savers in your city.',
    accent: 'from-rose-500 to-pink-600',
  },
];

const steps = [
  { step: '01', title: 'Sign up & verify', desc: 'Create your account with OTP email verification. Choose donor or blood bank path.' },
  { step: '02', title: 'Request or donate', desc: 'Post a blood request or toggle availability. Emergency SOS broadcasts to compatible donors.' },
  { step: '03', title: 'Connect & save lives', desc: 'Chat directly, coordinate donations, and track your impact with 90-day safety cooldowns.' },
];

const stats = [
  { value: '3', label: 'Lives per donation', icon: Heart },
  { value: '90', label: 'Day recovery tracking', icon: Activity },
  { value: '24/7', label: 'Emergency SOS alerts', icon: Zap },
  { value: '100%', label: 'Verified messaging', icon: Shield },
];

function BloodDropVisual() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square" aria-hidden="true">
      <div className="absolute inset-0 rounded-full bg-red-600/10 blur-3xl animate-pulse-glow" />
      <motion.div
        animate={{ y: [0, -16, 0], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-8 glass-panel rounded-[3rem] flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-[#d4af37]/10" />
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-700 rounded-full rounded-tr-none -rotate-45 shadow-2xl shadow-red-600/40 animate-float">
            <div className="absolute top-6 left-6 w-4 h-5 bg-white/30 rounded-full blur-[1px]" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 glass-panel rounded-full text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap"
          >
            Every drop counts
          </motion.div>
        </div>
      </motion.div>

      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-[#d4af37]/60"
          style={{
            top: `${20 + i * 25}%`,
            left: i % 2 === 0 ? '5%' : '88%',
          }}
          animate={{ y: [0, -20, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  const onSpotlight = useSpotlight();

  return (
    <div className="min-h-screen hero-mesh transition-theme">
      <LandingNavbar />

      <main id="main-content">
        {/* Hero */}
        <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial="hidden" animate="show" className="text-center lg:text-left">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-6">
                <Droplet size={14} aria-hidden="true" />
                Blood Donation Network
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white leading-[1.08] tracking-tight"
              >
                Connect.{' '}
                <span className="text-gradient-brand">Donate.</span>
                <br />
                Save Lives.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                Blood4U coordinates life-saving donations in real time — smart matching, emergency SOS, and verified chat between donors and hospitals.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup">
                  <Button className="w-full sm:w-auto !px-8 !py-4 !text-base group">
                    Start saving lives
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Button>
                </Link>
                <Link to="/upcoming-events">
                  <Button variant="secondary" className="w-full sm:w-auto !px-8 !py-4 !text-base">
                    Find blood drives
                  </Button>
                </Link>
              </motion.div>

              <motion.ul variants={fadeUp} custom={4} className="mt-10 flex flex-wrap gap-x-6 gap-y-3 justify-center lg:justify-start text-sm text-gray-500 dark:text-gray-400">
                {['Free to join', 'JWT-secured sessions', 'Real-time alerts'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <BloodDropVisual />
            </motion.div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="py-12 px-4 sm:px-6 lg:px-8" aria-label="Impact statistics">
          <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="clay-card p-6 text-center spotlight-group"
                onMouseMove={onSpotlight}
              >
                <stat.icon size={22} className="mx-auto text-red-600 dark:text-red-400 mb-3" aria-hidden="true" />
                <p className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-3">Platform capabilities</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Everything you need to coordinate donations
              </h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Production-grade tools built for donors, hospitals, blood banks, and administrators.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="glass-panel rounded-3xl p-7 spotlight-group hover:shadow-xl transition-shadow duration-300"
                  onMouseMove={onSpotlight}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.accent} flex items-center justify-center text-white shadow-lg mb-5`}>
                    <feature.icon size={22} aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-24 bg-gradient-to-b from-transparent via-red-600/[0.03] to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-3">Simple process</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                How Blood4U works
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="relative clay-card p-8"
                >
                  <span className="text-5xl font-black text-red-600/15 dark:text-red-500/20 absolute top-4 right-6">{item.step}</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white relative">{item.title}</h3>
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed relative">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* About / CTA */}
        <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-10 sm:p-14 text-center text-white"
            >
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle, #d4af37 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }} />
              <div className="relative z-10">
                <Users size={40} className="mx-auto text-[#d4af37] mb-6" aria-hidden="true" />
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                  Join a community of life-savers
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
                  Whether you donate, request blood, or manage a bank — Blood4U gives you the tools to act fast when every minute matters.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/signup">
                    <Button className="!bg-white !text-[#0f0c29] hover:!bg-gray-100 !shadow-white/20 !px-8">
                      Create free account
                    </Button>
                  </Link>
                  <Link to="/signin">
                    <Button variant="outline" className="!border-white/40 !text-white hover:!bg-white/10 !px-8">
                      Sign in
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <LandingFooter />
      <BackToTop />
    </div>
  );
}
