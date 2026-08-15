import { afterEach, describe, expect, it, vi } from 'vitest';
import { openRazorpayCheckout } from './razorpay';

afterEach(() => {
  delete window.Razorpay;
});

describe('openRazorpayCheckout', () => {
  it('rejects incomplete payment sessions without opening the widget', async () => {
    const onFailure = vi.fn();

    const opened = await openRazorpayCheckout({
      razorpayKeyId: '',
      razorpayOrderId: 'order_test',
      amount: 100,
      currency: 'INR',
      onFailure,
    });

    expect(opened).toBe(false);
    expect(onFailure).toHaveBeenCalledOnce();
  });

  it('passes the server-created order to Razorpay and settles success once', async () => {
    let options;
    window.Razorpay = class RazorpayMock {
      constructor(receivedOptions) {
        options = receivedOptions;
      }

      on() {}

      open() {
        options.handler({
          razorpay_order_id: 'order_test',
          razorpay_payment_id: 'pay_test',
          razorpay_signature: 'signature_test',
        });
        options.modal.ondismiss();
      }
    };
    const onSuccess = vi.fn();
    const onFailure = vi.fn();

    const opened = await openRazorpayCheckout({
      razorpayKeyId: 'rzp_test_key',
      razorpayOrderId: 'order_test',
      amount: 12500,
      currency: 'INR',
      prefill: { name: 'Buyer' },
      onSuccess,
      onFailure,
    });

    expect(opened).toBe(true);
    expect(options).toMatchObject({
      key: 'rzp_test_key',
      order_id: 'order_test',
      amount: 12500,
      currency: 'INR',
    });
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onFailure).not.toHaveBeenCalled();
  });
});
