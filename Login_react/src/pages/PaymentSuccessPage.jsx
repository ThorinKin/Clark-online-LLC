//Login_react/src/pages/PaymentSuccessPage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentSuccessPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
      <Helmet>
        <title>Payment Successful - TTXS Technology</title>
        <meta name="description" content="Your payment was successful. Thank you for your purchase." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center bg-secondary p-8 rounded-2xl shadow-2xl border border-border"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
          className="mx-auto mb-6"
        >
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
        </motion.div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Payment Successful!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Thank you for your purchase. Your AI credits have been added to your account and are ready to use.
        </p>

        <div className="space-y-4">
          <Link to="/products">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-6 rounded-lg transition-all duration-300">
              Explore More Packages
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full">
              Back to Homepage
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-muted-foreground mt-8">
          You will receive an email confirmation shortly with your order details.
        </p>
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage;