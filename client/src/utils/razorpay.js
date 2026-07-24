// NexORA — Razorpay Checkout Widget Helper
// Shared between Checkout.jsx (new orders) and OrderDetail.jsx (retry payment)
// so the widget-invocation logic only lives in one place.

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

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
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
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
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    onFailure('Payment gateway failed to load. Please check your connection and try again.');
    return;
  }

  const razorpay = new window.Razorpay({
    key: razorpayKeyId,
    order_id: razorpayOrderId,
    amount,
    currency,
    name: 'NexORA',
    description: 'Luxury Commerce Order',
    prefill: prefill || {},
    theme: { color: '#D4AF37' },
    handler: (response) => onSuccess(response),
    modal: {
      ondismiss: () => onFailure('Payment cancelled'),
    },
  });

  razorpay.on('payment.failed', (response) => {
    onFailure(response?.error?.description || 'Payment failed');
  });

  razorpay.open();
};
