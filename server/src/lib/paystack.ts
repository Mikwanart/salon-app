const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const getSecretKey = (): string => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured on the server.');
  }
  return key;
};

export interface PaystackInitResult {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
}

/**
 * Starts a real Paystack transaction and returns a hosted checkout URL.
 * The user is sent to this URL to actually enter their MoMo PIN / card
 * details on Paystack's own secure page — we never touch that ourselves.
 *
 * Amount is in Ghana cedis (e.g. 65.00); Paystack itself expects the
 * smallest currency unit (pesewas), so we convert here.
 */
export const initializeTransaction = async (options: {
  email: string;
  amountCedis: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}): Promise<PaystackInitResult> => {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: options.email,
      amount: Math.round(options.amountCedis * 100), // cedis -> pesewas
      currency: 'GHS',
      reference: options.reference,
      callback_url: options.callbackUrl,
      channels: ['mobile_money', 'card'],
      metadata: options.metadata || {},
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Failed to initialize Paystack transaction');
  }

  return {
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
    accessCode: data.data.access_code,
  };
};

export type PaystackVerifiedStatus = 'success' | 'failed' | 'abandoned' | 'pending';

export interface PaystackVerifyResult {
  status: PaystackVerifiedStatus;
  reference: string;
  amountCedis: number;
  paidAt: string | null;
}

/**
 * Confirms what actually happened to a transaction, straight from Paystack —
 * never trust a client-side redirect alone as proof of payment.
 */
export const verifyTransaction = async (reference: string): Promise<PaystackVerifyResult> => {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${getSecretKey()}` },
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Failed to verify Paystack transaction');
  }

  return {
    status: data.data.status as PaystackVerifiedStatus,
    reference: data.data.reference,
    amountCedis: (data.data.amount || 0) / 100,
    paidAt: data.data.paid_at || null,
  };
};
