// Login_react/src/pages/CartPage.jsx
import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { requestWithFetch } from '@/service/fetch';
import { loadCollectCheckoutScript } from '@/lib/loadCollectCheckout';

const CART_API = import.meta.env.VITE_NMI_CART_API?.trim();

const CartPage = () => {
    const { cartItems, removeFromCart, updateQuantity, getTotalPrice, getTotalItems } = useCart();
    const { isAuthenticated, userId } = useAuth();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);

    const successUrlTemplate = import.meta.env.VITE_NMI_SUCCESS_URL?.trim();
    const cancelUrlTemplate = import.meta.env.VITE_NMI_CANCEL_URL?.trim();

    const PUBLIC_CHECKOUT_KEY = import.meta.env.VITE_NMI_PUBLIC_KEY?.trim();

    const collectLineItems = useMemo(
        () =>
            cartItems
                .filter((item) => Boolean(item.nmiSku))
                .map((item) => ({ sku: item.nmiSku, quantity: item.quantity })),
        [cartItems]
    );

    // 仅用于站内记录待支付订单的冗余信息（金额/积分以网关为准）
    const orderItems = useMemo(
        () =>
            cartItems.map((item) => ({
                id: item.id,
                nmiSku: item.nmiSku,
                name: item.name,
                unitAmount: Number(item.price ?? 0),
                quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1,
                credits: Number.isFinite(item.credits) ? item.credits : 0,
                currency: item.currency ?? 'USD',
            })),
        [cartItems]
    );

    const ensureHttpsUrl = (configuredValue, fallbackPath) => {
        const raw = (configuredValue && configuredValue.trim()) || `${window.location.origin}${fallbackPath}`;
        let u;
        try { u = new URL(raw); } catch { throw new Error(`Invalid checkout URL: ${raw}`); }
        if (u.protocol !== 'https:') throw new Error(`Checkout URL must use HTTPS: ${raw}`);
        return raw.replace(/[?&]$/, '');
    };

    const buildSuccessUrl = (base) => {
        if (base.includes('(TRANSACTION_ID)')) return base;
        const hasQuery = base.includes('?');
        return `${base}${hasQuery ? '&' : '?'}t=(TRANSACTION_ID)`;
    };

    // 在后台先创建待支付订单，拿到 orderId；回跳用它做幂等/对账
    const createPendingOrder = async () => {
        const raw = await requestWithFetch('/api/orders/pending', {
            payload: { items: orderItems },
            headers: userId ? { 'X-User-Id': userId } : undefined,
        });
        const { success, response, raw: body } = normalizeMessageModel(raw);
        // 兜底把所有可能路径都试一遍
        const orderId =
            pick(response ?? {}, ['OrderId', 'id', 'orderId']) ??
            pick(body ?? {}, ['Response.OrderId', 'OrderId', 'id', 'orderId']) ??
            undefined;

        const orderNumber =
            pick(response ?? {}, ['OrderNumber', 'orderNumber']) ??
            pick(body ?? {}, ['Response.OrderNumber', 'OrderNumber', 'orderNumber']) ??
            undefined;

        if (!success || !orderId) {
            console.error('[pending-order] raw =', raw);
            console.error('[pending-order] normalized =', { success, response, body });
            throw new Error('Failed to create pending order.');
        }

        return { orderId, orderNumber };
    };

    function pick(obj, paths) {
        for (const p of paths) {
            const keys = p.split('.');
            let cur = obj;
            let ok = true;
            for (const k of keys) {
                if (cur && Object.prototype.hasOwnProperty.call(cur, k)) {
                    cur = cur[k];
                } else {
                    ok = false;
                    break;
                }
            }
            if (ok) return cur;
        }
        return undefined;
    }

    function normalizeMessageModel(rawInput) {
        // 先把可能的外层 { data: ... } 抽出来
        const layer1 = rawInput?.data ?? rawInput ?? {};
        // 有些会再包一层 { data: { Response, Success } }
        const layer2 = layer1?.data ?? layer1;
        // 取 Success/Response（大小写都兼容）
        const success = Boolean(
            pick(layer2, ['Success', 'success', 'ok', 'OK']) ?? false
        );
        const response =
            pick(layer2, ['Response', 'response', 'data']) ?? null;
        return { success, response, raw: layer2 };
    }

    const handleCheckout = useCallback(async () => {
        if (!CART_API) {
            toast({
                title: 'Checkout unavailable',
                description: 'Missing VITE_NMI_CART_API. Please set it in your .env',
                variant: 'destructive',
            });
            return;
        }
        if (!cartItems.length || isProcessing) return;

        if (!isAuthenticated || !userId) {
            toast({ title: 'Login required', description: 'Please sign in before proceeding to checkout.', variant: 'destructive' });
            navigate('/auth');
            return;
        }

        if (!PUBLIC_CHECKOUT_KEY) {
            toast({ title: 'Checkout unavailable', description: 'Missing VITE_NMI_PUBLIC_KEY.', variant: 'destructive' });
            return;
        }

        if (collectLineItems.length !== cartItems.length) {
            toast({ title: 'Checkout unavailable', description: 'One or more products are missing nmiSku.', variant: 'destructive' });
            return;
        }

        setIsProcessing(true);
        try {
            // 1) 生成 https 的回跳地址 + 挂上 orderId + 保留未编码的 (TRANSACTION_ID)
            const sBase = ensureHttpsUrl(successUrlTemplate, '/payment-success');
            const cBase = ensureHttpsUrl(cancelUrlTemplate, '/payment-failed');

            // 向后端登记待支付订单，拿 orderId 做幂等
            const { orderId } = await createPendingOrder();
            const successUrl = buildSuccessUrl(sBase + (sBase.includes('?') ? `&orderId=${orderId}` : `?orderId=${orderId}`));
            const cancelUrl = cBase + (cBase.includes('?') ? `&orderId=${orderId}` : `?orderId=${orderId}`);

            // 2) 优先直连 NMI REST 创建购物车
            const res = await fetch(CART_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    key: PUBLIC_CHECKOUT_KEY,           // checkout_public_*
                    lineItems: collectLineItems,        // [{ sku, quantity }]
                    successUrl,                         // 必须 https + (TRANSACTION_ID)
                    cancelUrl
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.message || data?.error || `Failed to create cart (${res.status}).`);
            }

            // 2.1 返回了跳转 URL：直接跳
            const jump = data.url || data.checkoutUrl || data.redirectUrl || data.checkout_url;
            if (jump && typeof jump === 'string') {
                window.location.assign(jump);
                return;
            }

            // 2.2 返回了 cart id：用 CollectCheckout 脚本兜底跳转
            if (data?.id) {
                const cc = await loadCollectCheckoutScript();
                if (!cc?.redirectToCheckout) throw new Error('Collect Checkout script not ready.');
                await cc.redirectToCheckout({ cartId: data.id, successUrl, cancelUrl });
                return;
            }

            // 3) 双兜底：如果 REST 没给 URL/ID，再尝试 JS 直连创建
            const cc = await loadCollectCheckoutScript();
            if (!cc?.redirectToCheckout) throw new Error('Collect Checkout script not ready.');
            await cc.redirectToCheckout({
                key: PUBLIC_CHECKOUT_KEY,
                lineItems: collectLineItems,
                successUrl,
                cancelUrl,
            });
        } catch (error) {
            console.error('Checkout error', error);
            toast({ title: 'Checkout failed', description: error?.message ?? 'Unable to start checkout. Please try again.', variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    }, [
        cartItems.length, isProcessing, isAuthenticated, userId, navigate, toast,
        successUrlTemplate, cancelUrlTemplate, PUBLIC_CHECKOUT_KEY, collectLineItems, orderItems, CART_API
    ]);


    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
                <Helmet>
                    <title>Shopping Cart - TTXS Technology</title>
                    <meta name="description" content="Review your selected AI service packages and proceed to checkout." />
                </Helmet>

                <div className="max-w-4xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-8">
                        <ShoppingBag className="w-24 h-24 text-muted-foreground mx-auto" />
                        <h1 className="text-4xl font-bold text-foreground">Your cart is empty</h1>
                        <p className="text-xl text-muted-foreground">Looks like you haven't added any AI service packages yet.</p>
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Shopping Cart</h1>
                    <p className="text-xl text-muted-foreground">
                        {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {cartItems.map((item, index) => (
                            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="bg-secondary rounded-xl p-6 border border-border">
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
                                            <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 p-0">
                                                <Minus className="w-4 h-4" />
                                            </Button>
                                            <span className="text-foreground font-medium w-8 text-center">{item.quantity}</span>
                                            <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 p-0">
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xl font-bold text-foreground">${(item.price * item.quantity).toFixed(2)}</div>
                                            <div className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</div>
                                        </div>

                                        <Button variant="outline" size="sm" onClick={() => removeFromCart(item.id)} className="border-destructive/50 text-destructive hover:bg-destructive/10">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="bg-secondary rounded-xl p-6 border border-border h-fit">
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
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-6 rounded-lg transition-all duration-300"
                            disabled={isProcessing}
                            onClick={handleCheckout}
                        >
                            {isProcessing ? 'Redirecting' : 'Checkout'}
                            <ArrowRight className="ml-2 w-5 h-5" />
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
