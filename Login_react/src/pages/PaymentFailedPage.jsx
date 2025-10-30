//Login_react/src/pages/PaymentFailedPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestWithFetch } from '@/service/fetch';
import { useAuth } from '@/contexts/AuthContext';

const PaymentFailedPage = () => {
    const [searchParams] = useSearchParams();
    const { userId } = useAuth();
    const [message, setMessage] = useState('Unfortunately, we were unable to process your payment. You can try again or contact our support team.');
    const [hasNotified, setHasNotified] = useState(false);

    const details = useMemo(() => {
        const orderId = searchParams.get('orderId');
        const transactionId = searchParams.get('t') ?? searchParams.get('transactionId');
        const reason = searchParams.get('reason') ?? 'cancelled';
        return { orderId, transactionId, reason };
    }, [searchParams]);

    useEffect(() => {
        if (!details.orderId) {
            setMessage('We could not locate the order information for this payment attempt. Please reach out to support for assistance.');
            return;
        }

        let cancelled = false;

        const notifyFailure = async () => {
            try {
                await requestWithFetch(`/api/orders/${details.orderId}/fail`, {
                    payload: {
                        transactionId: details.transactionId,
                        reason: details.reason,
                    },
                    headers: userId ? { 'X-User-Id': userId } : undefined,
                });

                if (!cancelled) {
                    setHasNotified(true);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to record failed payment', error);
                    setMessage('We were unable to record the payment failure automatically. Please try again or contact support.');
                }
            }
        };

        notifyFailure();

        return () => {
            cancelled = true;
        };
    }, [details, userId]);



  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
      <Helmet>
        <title>Payment Failed - TTXS Technology</title>
        <meta name="description" content="Your payment could not be processed. Please try again." />
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

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Payment Failed</h1>
        <p className="text-lg text-muted-foreground mb-8">{message}</p>

        {hasNotified && details.orderId && (
            <div className="bg-background/50 border border-border rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-medium text-foreground">Order ID</p>
                <p className="text-sm text-muted-foreground break-all">{details.orderId}</p>
            </div>
        )}

        <div className="space-y-4">
            <Link to="/cart">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-6 rounded-lg transition-all duration-300">
              <RefreshCw className="w-4 h-4 mr-2" />
            Return to Cart
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-muted-foreground mt-8">
            We will keep an eye on this order and update you if the payment status changes.
        </p>
      </motion.div>
    </div>
  );
};

export default PaymentFailedPage;