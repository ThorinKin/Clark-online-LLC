import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
const PrivacyPolicyPage = () => {
  return <div className="py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
      <Helmet>
        <title>Privacy Policy | CLARK ONLINE, LLC</title>
        <meta name="description" content="Privacy Policy for CLARK ONLINE, LLC's AI-powered image and video processing services." />
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
        <h1>Privacy Policy</h1>
        <p>Last updated: September, 2025</p>

        <h2>1. Who We Are</h2>
        <p>CLARK ONLINE, LLC (“we”, “our”, “us”) provides AI-powered image and video processing services. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our website and services.</p>

        <h2>2. Information We Collect</h2>
        <ul>
          <li><strong>Account & Contact Data:</strong> name, email, company name, billing details.</li>
          <li><strong>Usage Data:</strong> feature usage, conversation counts, image/video processing requests, timestamps, device/browser info, IP address, and cookies.</li>
          <li><strong>Content You Provide:</strong> images, prompts, text instructions, and generated outputs (stored only as needed to provide and improve services; you can request deletion).</li>
          <li><strong>Payment Data:</strong> processed by our payment providers; we receive limited billing info and transaction status.</li>
        </ul>

        <h2>3. How We Use Information</h2>
        <ul>
          <li>Provide, maintain, and improve our services.</li>
          <li>Process payments, prevent fraud, and provide customer support.</li>
          <li>Personalize content and recommend relevant features.</li>
          <li>Analytics and product development.</li>
          <li>Legal compliance and enforcement of our Terms.</li>
        </ul>

        <h2>4. Legal Bases (EEA/UK)</h2>
        <p>We process data under legitimate interests, contract necessity, consent (where required), and legal obligations.</p>

        <h2>5. Sharing & Disclosure</h2>
        <ul>
          <li><strong>Service Providers:</strong> hosting, analytics, payment processors, customer support tools.</li>
          <li><strong>Legal & Safety:</strong> if required by law or to protect rights and security.</li>
          <li><strong>Business Transfers:</strong> in connection with mergers, acquisitions, or asset sales.</li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>We retain data only as long as necessary for service delivery, compliance, and legitimate business needs. You can request deletion of your account data, subject to legal obligations.</p>

        <h2>7. International Transfers</h2>
        <p>Your data may be processed in countries with different data protection laws. We use appropriate safeguards (e.g., standard contractual clauses).</p>

        <h2>8. Your Rights</h2>
        <ul>
          <li><strong>EEA/UK:</strong> access, rectify, erase, restrict, portability, object, and withdraw consent.</li>
          <li><strong>California (CCPA/CPRA):</strong> know, delete, correct, limit use of sensitive data, and opt-out of “sale”/“sharing” (we do not sell personal data).</li>
        </ul>
        <p>Submit requests via <a href="mailto:support@clarknets.com">support@clarknets.com</a>.</p>

        <h2>9. Cookies & Tracking</h2>
        <p>We use cookies and similar technologies for authentication, personalization, and analytics. You can adjust cookie preferences in your browser; some features may not work without cookies.</p>

        <h2>10. Security</h2>
        <p>We implement reasonable technical and organizational measures to protect your data. No method of transmission or storage is 100% secure.</p>

        <h2>11. Children’s Privacy</h2>
        <p>Our services are not directed to children under 13 (or under 16 in some regions). We do not knowingly collect data from children.</p>

        <h2>12. Contact</h2>
        <p>For questions or rights requests: <a href="mailto:support@clarknets.com">support@clarknets.com</a>.</p>
      </motion.div>
    </div>;
};
export default PrivacyPolicyPage;