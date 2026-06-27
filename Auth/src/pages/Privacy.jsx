import PublicPageShell from '../components/layout/PublicPageShell';

export default function Privacy() {
  return (
    <PublicPageShell
      title="Privacy Policy"
      subtitle="Last updated: June 2026"
    >
      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Overview</h2>
        <p>
          Blood4U (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) respects your privacy. This policy explains how we collect, use, and protect your personal information when you use our blood donation management platform.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Information we collect</h2>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Account details: username, email, phone number, and password (hashed server-side).</li>
          <li>Donor profile data: blood group, city, availability status, and geolocation when you register as a donor.</li>
          <li>Usage data: blood requests, chat messages, donation history, and event RSVPs.</li>
          <li>Technical data: session cookies for authentication and CSRF protection.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Authentication & cookies</h2>
        <p>
          We authenticate users using JWT tokens stored in <strong>httpOnly, SameSite=Strict</strong> cookies — never in browser localStorage or sessionStorage. This protects your session from XSS-based token theft. We also use CSRF tokens for mutating API requests.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">How we use your data</h2>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Matching blood requests with compatible donors in your area.</li>
          <li>Enabling secure chat between verified users.</li>
          <li>Enforcing medical safety rules such as the 90-day donation cooldown.</li>
          <li>Sending OTP verification and account recovery emails.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Data security</h2>
        <p>
          We implement industry-standard protections including bcrypt password hashing, input sanitization against NoSQL injection and XSS, rate limiting, and Helmet security headers. Geolocation data is used solely for proximity matching.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data by contacting us. EU users have additional rights under GDPR including data portability and the right to object to processing.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Contact</h2>
        <p>
          For privacy inquiries, email{' '}
          <a href="mailto:saboor.rana49@gmail.com" className="text-red-600 hover:underline font-medium">
            saboor.rana49@gmail.com
          </a>.
        </p>
      </section>
    </PublicPageShell>
  );
}
