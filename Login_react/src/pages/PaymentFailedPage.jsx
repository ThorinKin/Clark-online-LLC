//Login_react/src/pages/PaymentFailedPage.jsx
//import React from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
//import { Link } from 'react-router-dom';
//import { XCircle, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const PaymentFailedPage = () => {
    const location = useLocation();
    const { userId } = useAuth();
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    const invoiceNumber = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('invoiceNumber') || sessionStorage.getItem('ttxs-last-invoice');
    }, [location.search]);

    useEffect(() => {
        const cancelPayment = async () => {
            if (!invoiceNumber || !userId) {
                return;
            }

            try {
                setStatus('processing');
                const response = await apiFetch('/api/payments/cancel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Id': userId,
                    },
                    body: JSON.stringify({ invoiceNumber }),
                });

                if (response?.status === 'cancelled') {
                    setStatus('cancelled');
                    setMessage('Your payment session was cancelled. No charges were made.');
                    sessionStorage.removeItem('ttxs-last-invoice');
                    sessionStorage.removeItem('ttxs-last-amount');
                    sessionStorage.removeItem('ttxs-last-credits');
                }
            } catch (error) {
                setStatus('error');
                setMessage(error?.message || 'We could not cancel the payment session automatically.');
            }
        };

        cancelPayment();
    }, [invoiceNumber, userId]);

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
          <Helmet>
              <title>Payment Cancelled - TTXS Technology</title>
              <meta name="description" content="Your payment was cancelled or could not be processed." />
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
              <XCircle className="w-24 h-24 text-destructive mx-auto" />
            </motion.div>
        
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Payment Not Completed</h1>
              <p className="text-lg text-muted-foreground mb-6">
                  {message || 'We were unable to process your payment. You can try again or reach out to our support team.'}
            </p>

            {status === 'error' && (
                <div className="flex items-center justify-center gap-2 text-sm text-destructive mb-6">
                    <AlertTriangle className="w-4 h-4" />
                    Unable to cancel the session automatically. You can safely retry your payment.
                </div>
            )}

            <div className="space-y-4">
                <Link to="/cart">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-6 rounded-lg transition-all duration-300">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Checkout Again
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
    );
};

export default PaymentFailedPage;