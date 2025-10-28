import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
const TermsOfServicePage = () => {
  return <div className="py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
      <Helmet>
        <title>Terms of Service | CLARK ONLINE, LLC</title>
        <meta name="description" content="Terms of Service for CLARK ONLINE, LLC's AI-powered image and video processing services." />
      </Helmet>
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.8
    }} className="max-w-4xl mx-auto prose prose-invert prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
        <h1>Terms of Service</h1>
        <p>Last updated: September, 2025</p>

        <h2>1. Agreement</h2>
        <p>These Terms govern your access to and use of CLARK ONLINE, LLC’s website and services. By using the services, you agree to these Terms.</p>

        <h2>2. Services & Accounts</h2>
        <ul>
          <li>We provide AI-based image and video processing and usage-based packages (conversation credits and video minutes).</li>
          <li>You are responsible for maintaining your account security and for all activities under your account.</li>
          <li>You must be at least 18 years old (or the age of majority in your region).</li>
        </ul>

        <h2>3. Usage Credits & Limits</h2>
        <ul>
          <li>Packages include a specified number of AI conversations or image-to-video minutes.</li>
          <li>Credits/minutes are consumed upon each successful request.</li>
          <li>Credits may expire if stated at checkout or in your account; we may offer rollover at our discretion.</li>
        </ul>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Upload unlawful, infringing, or harmful content.</li>
          <li>Violate privacy, publicity, IP, or other rights.</li>
          <li>Reverse engineer or abuse the services, or bypass quotas/limits.</li>
          <li>Use outputs in ways that violate applicable laws or third-party policies.</li>
        </ul>

        <h2>5. Ownership & Licenses</h2>
        <ul>
          <li>You retain rights to your input content.</li>
          <li>Subject to payment and compliance with these Terms, we grant you a license to use the outputs for your lawful business or personal purposes.</li>
          <li>We may use anonymized/aggregated usage data to improve the services.</li>
        </ul>

        <h2>6. Payments</h2>
        <p>All fees are shown at checkout. Taxes may apply. Payments are processed by third-party providers. By purchasing, you agree to our Refund Policy.</p>

        <h2>7. Service Availability & Changes</h2>
        <p>We may update, suspend, or discontinue features. We aim for high availability but do not guarantee uninterrupted service.</p>

        <h2>8. Disclaimers</h2>
        <p>Services and outputs are provided “as is”. We do not warrant accuracy, fitness for a particular purpose, or error-free operation.</p>

        <h2>9. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages.</p>

        <h2>10. Indemnification</h2>
        <p>You will indemnify and hold CLARK ONLINE, LLC harmless from claims arising from your content, use of the services, or violation of these Terms.</p>

        <h2>11. Term & Termination</h2>
        <p>We may suspend or terminate access for violations. Upon termination, your right to use the services ceases; sections intended to survive will survive.</p>

        <h2>12. Governing Law & Dispute Resolution</h2>
        <p>Specify governing law and venue (update with your jurisdiction). Consider adding arbitration/waiver provisions if desired.</p>

        <h2>13. Changes to Terms</h2>
        <p>We may update these Terms; continued use after changes constitutes acceptance. We will post the “Last updated” date.</p>

        <h2>14. Contact</h2>
        <p><a href="mailto:support@clarknets.com">support@clarknets.com</a></p>
      </motion.div>
    </div>;
};
export default TermsOfServicePage;