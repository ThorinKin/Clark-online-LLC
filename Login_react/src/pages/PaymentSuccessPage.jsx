//Login_react/src/pages/PaymentSuccessPage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestWithFetch } from '@/service/fetch';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const { clearCart } = useCart();
    const { userId } = useAuth();
    const [status, setStatus] = useState('pending');
    const [message, setMessage] = useState('We are verifying your payment. Hang tight while we confirm the transaction.');
    const [creditsAwarded, setCreditsAwarded] = useState(null);
    const clearCartRef = useRef(clearCart);
    const refreshCredits = useCallback(async () => {
        if (!userId) {
            return null;
        }

        try {
            const credits = await requestWithFetch('/api/user/me/credits', {
                method: 'GET',
                headers: { 'X-User-Id': userId },
            });

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('credits:updated', { detail: credits }));
            }

            return credits;
        } catch (error) {
            console.error('Failed to refresh credits', error);
            return null;
        }
    }, [userId]);

    useEffect(() => {
        clearCartRef.current = clearCart;
    }, [clearCart]);

    const details = useMemo(() => {
        const orderId = searchParams.get('orderId');
        const transactionId = searchParams.get('t') ?? searchParams.get('transactionId');
        return { orderId, transactionId };
    }, [searchParams]);

    useEffect(() => {
        if (!details.orderId || !details.transactionId) {
            setStatus('error');
            setMessage('We could not find your order information. Please contact support with your receipt.');
            return;
        }

        let cancelled = false;

        const confirmPayment = async () => {
            try {
                const response = await requestWithFetch(`/api/orders/${details.orderId}/confirm`, {
                    payload: {
                        transactionId: details.transactionId,
                    },
                    headers: userId ? { 'X-User-Id': userId } : undefined,
                });

                if (cancelled) return;

                setStatus('success');
                setMessage('Your payment has been confirmed and your credits are ready to use.');
                setCreditsAwarded(response?.creditsAwarded ?? null);
                clearCartRef.current?.();
                await refreshCredits();
            } catch (error) {
                if (cancelled) return;
                console.error('Failed to confirm payment', error);
                setStatus('error');
                setMessage(error?.message ?? 'We could not verify your payment. Please retry later or contact support.');
            }
        };

        confirmPayment();

        return () => {
            cancelled = true;
        };
    }, [details, userId, refreshCredits]);

    const renderStatusIcon = () => {
        if (status === 'pending') {
            return <Loader2 className="w-24 h-24 text-primary mx-auto animate-spin" />;
        }

        if (status === 'success') {
            return <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />;
        }

        return <AlertTriangle className="w-24 h-24 text-destructive mx-auto" />;
    };

    const headline = status === 'success' ? 'Payment Confirmed!' : status === 'pending' ? 'Confirming your payment' : 'We could not confirm the payment';

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
      <Helmet>
        <title>Payment Status - TTXS Technology</title>
        <meta name="description" content="Track the status of your payment and access your AI credits." />
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
          {renderStatusIcon()}
        </motion.div>
        

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{headline}</h1>
        <p className="text-lg text-muted-foreground mb-6">{message}</p>

        {status === 'success' && (
            <div className="bg-background/50 border border-border rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-medium text-foreground">Order ID</p>
                <p className="text-sm text-muted-foreground break-all mb-3">{details.orderId}</p>
                <p className="text-sm font-medium text-foreground">Transaction ID</p>
                <p className="text-sm text-muted-foreground break-all mb-3">{details.transactionId}</p>
                {typeof creditsAwarded === 'number' && (
                    <p className="text-sm text-foreground">
                        Added Credits: <span className="font-semibold">{creditsAwarded}</span>
                    </p>
                )}
            </div>
        )}

        <div className="space-y-4">
          <Link to="/products">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-6 rounded-lg transition-all duration-300" disabled={status === 'pending'}>
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
        

        {status !== 'pending' && (
            <p className="text-sm text-muted-foreground mt-8">
                Need help? Contact support with your order ID for further assistance.
            </p>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage;