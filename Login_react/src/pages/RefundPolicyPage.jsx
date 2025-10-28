import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
const RefundPolicyPage = () => {
  return <div className="py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
      <Helmet>
        <title>Refund Policy | CLARK ONLINE, LLC</title>
        <meta name="description" content="Refund Policy for CLARK ONLINE, LLC's AI-powered image and video processing services." />
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
        <h1>Refund Policy</h1>
        <p>Last updated: September, 2025</p>

        <h2>1. Digital Goods & Credits</h2>
        <p>Our products are digital usage packages (AI conversation credits and image-to-video minutes). Because delivery is instant, all sales are final once any portion of the credits/minutes has been used.</p>

        <h2>2. Trial Package</h2>
        <p>The $0.99 trial (5 conversations) is non-refundable once any conversation is consumed.</p>

        <h2>3. Unused Purchases</h2>
        <p>If 0 credits/minutes have been used, you may request a refund within 7 days of purchase. After 7 days or after any usage, refunds are not available.</p>

        <h2>4. Duplicate Charges or Payment Errors</h2>
        <p>If you experience a duplicate charge or processing error, contact <a href="mailto:support@clarknets.com">support@clarknets.com</a> with your order ID. We will investigate and, if confirmed, issue a refund.</p>

        <h2>5. Service Issues</h2>
        <p>If a technical failure on our side prevents delivery and no usage occurred, we may offer a replacement, account credit, or refund at our discretion.</p>

        <h2>6. Subscriptions (if enabled in future)</h2>
        <p>If we offer subscriptions, you may cancel anytime before the next billing date. Prorated refunds are not provided for partial periods already in progress, except where required by law.</p>

        <h2>7. How to Request a Refund</h2>
        <p>Email <a href="mailto:support@clarknets.com">support@clarknets.com</a> with your order ID, purchase email, and description of the issue.</p>
      </motion.div>
    </div>;
};
export default RefundPolicyPage;