import PublicPageShell from '../components/layout/PublicPageShell';

export default function Terms() {
  return (
    <PublicPageShell
      title="Terms of Service"
      subtitle="Last updated: June 2026"
    >
      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Acceptance of terms</h2>
        <p>
          By accessing or using Blood4U, you agree to these Terms of Service. If you do not agree, please do not use the platform.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Platform purpose</h2>
        <p>
          Blood4U is a coordination platform connecting blood donors, requesters, and blood banks. It is <strong>not</strong> a substitute for professional medical advice, emergency services, or hospital care. In a medical emergency, call your local emergency number immediately.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">User responsibilities</h2>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Provide accurate registration information including blood type and contact details.</li>
          <li>Follow medical guidelines — including the 90-day cooldown between donations enforced by the platform.</li>
          <li>Use chat and request features responsibly and only for legitimate blood donation coordination.</li>
          <li>Blood bank owners must provide truthful inventory and registration information subject to admin approval.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Account & roles</h2>
        <p>
          Users may evolve into donor or blood bank owner roles after verification. Admins have oversight privileges including approval of blood banks and broadcast management. We reserve the right to suspend accounts that violate these terms.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Limitation of liability</h2>
        <p>
          Blood4U facilitates connections but does not guarantee donor availability, blood compatibility outcomes, or medical results. We are not liable for actions taken by users outside the platform or for delays in emergency situations.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Changes to terms</h2>
        <p>
          We may update these terms periodically. Continued use of the platform after changes constitutes acceptance of the revised terms.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Contact</h2>
        <p>
          Questions about these terms? Email{' '}
          <a href="mailto:saboor.rana49@gmail.com" className="text-red-600 hover:underline font-medium">
            saboor.rana49@gmail.com
          </a>.
        </p>
      </section>
    </PublicPageShell>
  );
}
