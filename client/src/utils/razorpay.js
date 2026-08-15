// NexORA — Razorpay Checkout Widget Helper
// Shared between Checkout.jsx (new orders) and OrderDetail.jsx (retry payment)
// so the widget-invocation logic only lives in one place.

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const SCRIPT_ID = 'nexora-razorpay-checkout';
const SCRIPT_TIMEOUT_MS = 15000;

let scriptLoadingPromise = null;

/** Dynamically injects the Razorpay Checkout script if not already present. */
export const loadRazorpayScript = () => {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve) => {
    const staleScript = document.getElementById(SCRIPT_ID);
    if (staleScript) staleScript.remove();

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;

    const finish = (loaded) => {
      window.clearTimeout(timeoutId);
      if (!loaded) {
        script.remove();
        scriptLoadingPromise = null;
      }
      resolve(loaded);
    };

    const timeoutId = window.setTimeout(() => finish(false), SCRIPT_TIMEOUT_MS);
    script.onload = () => finish(Boolean(window.Razorpay));
    script.onerror = () => finish(false);
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
};

/**
 * Opens the Razorpay Checkout widget for a previously-initiated payment.
 * @param {object} params
 * @param {string} params.razorpayKeyId
 * @param {string} params.razorpayOrderId
 * @param {number} params.amount - amount in paise, as returned by the server
 * @param {string} params.currency
 * @param {object} [params.prefill] - { name, email, contact }
 * @param {(response: { razorpay_order_id, razorpay_payment_id, razorpay_signature }) => void} params.onSuccess
 * @param {(reason?: string) => void} params.onFailure - called on gateway failure or if the user dismisses the widget
 */
export const openRazorpayCheckout = async ({ razorpayKeyId, razorpayOrderId, amount, currency, prefill, onSuccess, onFailure }) => {
  let settled = false;
  const failOnce = (reason) => {
    if (settled) return;
    settled = true;
    onFailure?.(reason);
  };
  const succeedOnce = (response) => {
    if (settled) return;
    settled = true;
    onSuccess?.(response);
  };

  if (!razorpayKeyId || !razorpayOrderId || !Number.isInteger(Number(amount)) || Number(amount) <= 0 || !currency) {
    failOnce('The payment session is invalid. Please retry from your order page.');
    return false;
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    failOnce('Payment gateway failed to load. Please check your connection and try again.');
    return false;
  }

  try {
    const razorpay = new window.Razorpay({
      key: razorpayKeyId,
      order_id: razorpayOrderId,
      amount: Number(amount),
      currency,
      name: 'NexORA',
      description: 'Luxury Commerce Order',
      prefill: prefill || {},
      theme: { color: '#D4AF37' },
      handler: succeedOnce,
      modal: {
        ondismiss: () => failOnce('Payment cancelled'),
      },
    });

    razorpay.on('payment.failed', (response) => {
      failOnce(response?.error?.description || 'Payment failed');
    });

    razorpay.open();
    return true;
  } catch {
    failOnce('The payment window could not be opened. Please try again.');
    return false;
  }
};
