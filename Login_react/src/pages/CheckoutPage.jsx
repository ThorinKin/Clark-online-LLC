import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2 } from 'lucide-react';

const CheckoutPage = () => {
  useEffect(() => {
    document.title = 'Redirecting to checkout - TTXS Technology';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
      <Helmet>
        <title>Redirecting to checkout - TTXS Technology</title>
        <meta name="description" content="We are preparing your secure payment session." />
      </Helmet>

      <div className="max-w-md w-full text-center bg-secondary p-8 rounded-2xl shadow-2xl border border-border">
        <Loader2 className="w-16 h-16 mx-auto mb-6 text-primary animate-spin" />
        <h1 className="text-3xl font-bold mb-4 text-foreground">Redirecting to the secure checkout page.</h1>
        <p className="text-muted-foreground text-lg">
          Please wait while we load Collect Checkout for you. If you are not redirected automatically, please return to your cart and try checking out again.
        </p>
      </div>
    </div>
  );
};

export default CheckoutPage;