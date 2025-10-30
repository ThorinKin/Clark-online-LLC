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
                <h1 className="text-3xl font-bold mb-4 text-foreground">正在跳转到安全结账页</h1>
                <p className="text-muted-foreground text-lg">
                    请稍候，我们正在为您加载 Collect Checkout。若没有自动跳转，请返回购物车重新发起结账。
                </p>
            </div>
        </div>
    );
};

export default CheckoutPage;