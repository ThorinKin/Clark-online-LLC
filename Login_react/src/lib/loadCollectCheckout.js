// Login_react/src/lib/loadCollectCheckout.js
const DEFAULT_SCRIPT_SRC = import.meta.env.VITE_NMI_COLLECT_SRC ?? 'https://emscorporate.transactiongateway.com/token/CollectCheckout.js';
const SCRIPT_ID = 'nmi-collect-checkout';

function configureCollectInstance(instance) {
    const publicKey = import.meta.env.VITE_NMI_PUBLIC_KEY?.trim();
    if (!instance || typeof instance.configure !== 'function') {
        return instance;
    }

    if (!publicKey) {
        console.error('VITE_NMI_PUBLIC_KEY is not configured.');
        return instance;
    }
    
    if (!window.__collectCheckoutConfigured) {
        try {
            instance.configure({ key: publicKey, publicApiKey: publicKey });
            window.__collectCheckoutConfigured = true;
        } catch (error) {
            console.error('Failed to configure Collect Checkout', error);
            throw error;
        }
    }
    return instance;
}

export function loadCollectCheckoutScript() {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Collect Checkout is only available in browser environments'));
    }

    if (window.CollectCheckout?.redirectToCheckout) {
        return Promise.resolve(configureCollectInstance(window.CollectCheckout));
    }

    const existing = document.getElementById(SCRIPT_ID);

    return new Promise((resolve, reject) => {
        const onReady = () => {
            if (window.CollectCheckout?.redirectToCheckout) {
                try {
                    resolve(configureCollectInstance(window.CollectCheckout));
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error('Collect Checkout script did not initialize as expected'));
            }
        };

        const onError = () => {
            reject(new Error('Failed to load Collect Checkout script'));
        };

        if (existing) {
            existing.addEventListener('load', onReady, { once: true });
            existing.addEventListener('error', onError, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = DEFAULT_SCRIPT_SRC;
        script.async = true;
        script.id = SCRIPT_ID;
        script.onload = onReady;
        script.onerror = onError;

        document.body.appendChild(script);
    });
}