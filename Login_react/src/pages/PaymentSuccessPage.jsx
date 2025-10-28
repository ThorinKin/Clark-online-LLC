//Login_react/src/pages/PaymentSuccessPage.jsx
//import React from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
//import { Link } from 'react-router-dom';
//import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const POLL_LIMIT = 5;
const POLL_DELAY_MS = 3000;

const PaymentSuccessPage = () => {
    const location = useLocation();
    const { clearCart } = useCart();
    const { userId } = useAuth();
    const [status, setStatus] = useState('checking');
    const [details, setDetails] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const invoiceRef = useRef(null);
    const pollTimeout = useRef(null);

    const storedCredits = useMemo(() => {
        const raw = sessionStorage.getItem('ttxs-last-credits');
        return raw ? Number(raw) : null;
    }, []);

    const storedAmount = useMemo(() => {
        const raw = sessionStorage.getItem('ttxs-last-amount');
        return raw ? Number(raw) : null;
    }, []);

    const cleanupTimer = () => {
        if (pollTimeout.current) {
            clearTimeout(pollTimeout.current);
            pollTimeout.current = null;
        }
    };

    useEffect(() => () => cleanupTimer(), []);

    const confirmPayment = useCallback(async (attempt = 0, providedTransactionId) => {
        if (!invoiceRef.current || !userId) {
            return;
        }

        try {
            const payload = {
                invoiceNumber: invoiceRef.current,
                transactionId: providedTransactionId,
            };

            const response = await apiFetch('/api/payments/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': userId,
                },
                body: JSON.stringify(payload),
            });

            if (!response || typeof response !== 'object') {
                throw new Error('Unexpected confirmation response.');
            }

            if (response.status === 'completed') {
                cleanupTimer();
                setStatus('success');
                setDetails(response);
                sessionStorage.removeItem('ttxs-last-invoice');
                sessionStorage.removeItem('ttxs-last-amount');
                sessionStorage.removeItem('ttxs-last-credits');
                clearCart();
                toast({
                    title: 'Payment confirmed',
                    description: 'Credits have been added to your account.',
                });
                return;
            }

            if (response.status === 'pending' && attempt < POLL_LIMIT) {
                setStatus('pending');
                setInfoMessage(response.message || 'Waiting for Authorize.net confirmation...');
                cleanupTimer();
                pollTimeout.current = setTimeout(() => confirmPayment(attempt + 1), POLL_DELAY_MS);
                return;
            }

            if (response.status === 'pending') {
                setStatus('pending');
                setInfoMessage(response.message || 'Payment is still processing. Please check back shortly.');
                return;
            }

            if (response.status === 'failed' || response.status === 'cancelled') {
                cleanupTimer();
                setStatus('failed');
                setErrorMessage(response.message || 'The payment did not complete.');
                return;
            }

            throw new Error(response.message || 'Unable to confirm payment.');
        } catch (error) {
            cleanupTimer();
            setStatus('error');
            setErrorMessage(error?.message || 'We could not verify your payment.');
        }
    }, [clearCart, userId]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const invoiceFromQuery = params.get('invoiceNumber');
        const transactionId = params.get('transactionId') || params.get('transId');

        const savedInvoice = sessionStorage.getItem('ttxs-last-invoice');
        const invoiceNumber = invoiceFromQuery || savedInvoice;

        invoiceRef.current = invoiceNumber;

        if (!userId) {
            setStatus('error');
            setErrorMessage('Please log in again so we can verify your payment.');
            return;
        }

        if (!invoiceNumber) {
            setStatus('error');
            setErrorMessage('We could not find your invoice. Please contact support if the problem persists.');
            return;
        }

        setStatus('checking');
        setInfoMessage('Verifying your payment with Authorize.net...');
        confirmPayment(0, transactionId || undefined);
    }, [confirmPayment, location.search, userId]);

    const renderContent = () => {
        if (status === 'checking' || status === 'pending') {
            return (
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Finalizing your purchase
                    </h1>
                    <p className="text-lg text-muted-foreground mb-6">
                        {infoMessage || 'Please wait while we confirm your payment.'}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        This may take a few seconds while we receive confirmation from Authorize.net.
                    </p>
                </div>
            );
        }

        if (status === 'success' && details) {
            const credits = details.creditsAdded ?? storedCredits;
            const amount = details.amount ?? storedAmount;
            return (
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                        className="mx-auto mb-6"
                    >
                        <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Payment Successful!</h1>
                    <p className="text-lg text-muted-foreground mb-6">
                        {credits ? `We added ${credits} credits to your account.` : 'Your credits are now available.'}
                    </p>
                    {amount ? (
                        <p className="text-sm text-muted-foreground mb-8">
                            Charged amount: ${amount.toFixed(2)} USD
                        </p>
                    ) : null}

                    <div className="space-y-4">
                        <Link to="/ai-image-editor">
                            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-6 rounded-lg transition-all duration-300">
                                Start Creating
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        <Link to="/products">
                            <Button variant="outline" className="w-full">
                                Browse More Packages
                            </Button>
                        </Link>
                    </div>

                    <p className="text-sm text-muted-foreground mt-8">
                        An email receipt will be sent to you shortly. Keep this page for your records.
                    </p>
                </div>
            );
        }

        const heading = status === 'failed' ? 'Payment Not Completed' : 'Verification failed';
        const description = errorMessage || 'Please contact support for assistance.';

        return (
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{heading}</h1>
                <p className="text-lg text-muted-foreground mb-6">{description}</p>
            <div className="space-y-4">
                <Link to="/cart">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-6 rounded-lg transition-all duration-300">
                        Return to Cart
                    </Button>
                </Link>
                <Link to="/contact">
                    <Button variant="outline" className="w-full">
                        Contact Support

                    </Button>
                </Link>
            </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
            <Helmet>
                <title>Payment Verification - TTXS Technology</title>
                <meta name="description" content="We are verifying your payment with Authorize.net." />
            </Helmet>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-lg w-full bg-secondary p-8 rounded-2xl shadow-2xl border border-border"
            >
                {renderContent()}
            </motion.div>
        </div>
    );
};

export default PaymentSuccessPage;