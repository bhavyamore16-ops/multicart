import crypto from 'crypto';

export const getRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const testMode = keyId.startsWith('rzp_test_');
  return { keyId, keySecret, enabled: Boolean(keyId && keySecret && testMode), testMode };
};

const razorpayRequest = async (path, { method = 'GET', body } = {}) => {
  const { keyId, keySecret, enabled } = getRazorpayConfig();
  if (!enabled) throw new Error('Razorpay test mode is not configured.');

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.description || data?.error?.reason || 'Razorpay request failed.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
};

export const createRazorpayOrder = (data) => razorpayRequest('/orders', { method: 'POST', body: data });
export const fetchRazorpayPayment = (paymentId) => razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
export const captureRazorpayPayment = (paymentId, amountPaise, currency = 'INR') =>
  razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: 'POST', body: { amount: amountPaise, currency }
  });
export const refundRazorpayPayment = (paymentId, amountPaise, receipt) =>
  razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST', body: { amount: amountPaise, notes: { order_reference: receipt } }
  });

export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const { keySecret, enabled } = getRazorpayConfig();
  if (!enabled || !orderId || !paymentId || typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest();
  const supplied = Buffer.from(signature, 'hex');
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
};
