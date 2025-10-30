// Login_react/src/lib/loadCollectCheckout.js
const DEFAULT_SCRIPT_SRC = import.meta.env.VITE_NMI_COLLECT_SRC ?? 'https://secure.nmi.com/js/collect.js';
const SCRIPT_ID = 'nmi-collect-checkout';

export function loadCollectCheckoutScript() {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Collect Checkout is only available in browser environments'));
    }

    if (window.CollectCheckout?.redirectToCheckout) {
        return Promise.resolve(window.CollectCheckout);
    }

    const existing = document.getElementById(SCRIPT_ID);

    return new Promise((resolve, reject) => {
        const onReady = () => {
            if (window.CollectCheckout?.redirectToCheckout) {
                resolve(window.CollectCheckout);
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