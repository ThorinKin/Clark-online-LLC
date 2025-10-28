//Login_react/src/pages/CartPage.jsx
//import React from 'react';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
//import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';

const CartPage = () => {
    const { cartItems, removeFromCart, updateQuantity, getTotalPrice, getTotalItems } = useCart();
    const { userId, isAuthenticated } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const lineItems = useMemo(() => (
        cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
        }))
    ), [cartItems]);

    const handleCheckout = async () => {
        if (!isAuthenticated || !userId) {
            toast({
                title: 'Log in required',
                description: 'Please sign in before proceeding to checkout.',
                variant: 'destructive',
            });
            return;
        }

        if (lineItems.length === 0) {
            toast({
                title: 'Your cart is empty',
                description: 'Add a package before checking out.',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const origin = window.location.origin;
            const payload = {
                items: lineItems,
                successUrl: `${origin}/payment-success`,
                cancelUrl: `${origin}/payment-failed`,
            };

            const session = await apiFetch('/api/payments/hosted-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': userId,
                },
                body: JSON.stringify(payload),
            });

            if (!session?.token || !session?.paymentUrl || !session?.invoiceNumber) {
                throw new Error('Missing payment session information.');
            }

            sessionStorage.setItem('ttxs-last-invoice', session.invoiceNumber);
            sessionStorage.setItem('ttxs-last-amount', String(session.amount ?? ''));
            sessionStorage.setItem('ttxs-last-credits', String(session.credits ?? ''));

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = session.paymentUrl;

            const tokenField = document.createElement('input');
            tokenField.type = 'hidden';
            tokenField.name = 'token';
            tokenField.value = session.token;
            form.appendChild(tokenField);

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        } catch (error) {
            console.error('Failed to create payment session', error);
            toast({
                title: 'Checkout unavailable',
                description: error?.message || 'Unable to start Authorize.net checkout. Please try again later.',
                variant: 'destructive',
            });
            setIsSubmitting(false);
        }
    };
    if (cartItems.length === 0) {
    return (
      <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
        <Helmet>
          <title>Shopping Cart - TTXS Technology</title>
          <meta name="description" content="Review your selected AI service packages and proceed to checkout." />
        </Helmet>

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <ShoppingBag className="w-24 h-24 text-muted-foreground mx-auto" />
            <h1 className="text-4xl font-bold text-foreground">Your cart is empty</h1>
            <p className="text-xl text-muted-foreground">
              Looks like you haven't added any AI service packages yet.
            </p>
            <Link to="/products">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4">
                Browse Packages
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
    }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
      <Helmet>
        <title>Shopping Cart - TTXS Technology</title>
        <meta name="description" content="Review your selected AI service packages and proceed to checkout." />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Shopping Cart</h1>
          <p className="text-xl text-muted-foreground">
            {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-secondary rounded-xl p-6 border border-border"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">{item.name}</h3>
                    <p className="text-primary text-sm mb-2">{item.category}</p>
                    <p className="text-muted-foreground text-sm">
                      {item.credits} {item.type === 'conversation' ? 'conversations' : 'minutes of video'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-foreground font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} each
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-secondary rounded-xl p-6 border border-border h-fit"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-xl font-bold text-foreground">
                  <span>Total</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>
            <Button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-6 rounded-lg transition-all duration-300"
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Redirecting to checkout...
                    </span>
                ) : (
                    <span className="flex items-center justify-center">
                        Checkout with Authorize.net
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </span>
                )}
            </Button>

            <Link to="/products" className="block mt-4">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;