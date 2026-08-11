const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID || 'M22DED07QHZJP_2606151144';
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || 'NmNmZTE5YTgtN2E4Mi00ZjA1LThmOTAtOTE2N2U2NDg3NGUy';
const PHONEPE_CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || '1';
const PHONEPE_ENV = process.env.PHONEPE_ENV || 'PRODUCTION';

const BASE_URL =
  PHONEPE_ENV === 'PRODUCTION'
    ? 'https://api.phonepe.com/apis/pg' // V2 Production Endpoint
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

export interface InitiatePaymentParams {
  merchantTransactionId: string;
  amount: number; // in Rupees
  hospitalId: number;
  packageId: number;
  redirectUrl: string;
  callbackUrl: string;
  userPhone?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  url?: string;
  merchantTransactionId: string;
  message?: string;
}

export async function getOAuthToken(): Promise<string | null> {
  const params = new URLSearchParams();
  params.append('client_id', PHONEPE_CLIENT_ID);
  params.append('client_version', PHONEPE_CLIENT_VERSION);
  params.append('client_secret', PHONEPE_CLIENT_SECRET);
  params.append('grant_type', 'client_credentials');

  try {
    const response = await fetch(`${BASE_URL}/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (response.ok && data.access_token) {
      return data.access_token;
    }
    console.error('PhonePe OAuth Error:', data);
    return null;
  } catch (error) {
    console.error('PhonePe OAuth Fetch Error:', error);
    return null;
  }
}

export async function initiatePhonePePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  const { merchantTransactionId, amount, redirectUrl, callbackUrl, userPhone } = params;

  const token = await getOAuthToken();
  if (!token) {
    return {
      success: false,
      merchantTransactionId,
      message: 'Failed to generate PhonePe OAuth token',
    };
  }

  // Convert rupees to paise (PhonePe expects paise)
  const amountInPaise = Math.round(amount * 100);

  const payload: any = {
    merchantOrderId: merchantTransactionId,
    amount: amountInPaise,
    expireAfter: 1200,
    paymentFlow: {
      type: 'PG_CHECKOUT',
      merchantUrls: {
        redirectUrl: redirectUrl,
      },
    },
  };

  if (userPhone && userPhone.length >= 10) {
    payload.prefillUserLoginDetails = {
      phoneNumber: userPhone.includes('+') ? userPhone : `+91 ${userPhone}`,
    };
  }

  try {
    const response = await fetch(`${BASE_URL}/checkout/v2/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.redirectUrl) {
      return {
        success: true,
        url: data.redirectUrl,
        merchantTransactionId,
      };
    }

    console.error('PhonePe Initiate Error:', data);
    return {
      success: false,
      merchantTransactionId,
      message: data.message || `PhonePe Error: ${data.code || 'Unknown error'}`,
    };
  } catch (error) {
    console.error('PhonePe Initiate Network Error:', error);
    return {
      success: false,
      merchantTransactionId,
      message: error instanceof Error ? error.message : 'Failed to connect to PhonePe Gateway',
    };
  }
}

export async function verifyPhonePeStatus(merchantOrderId: string) {
  const token = await getOAuthToken();
  if (!token) {
    return { code: 'ERROR', message: 'Failed to generate OAuth token for status check' };
  }

  try {
    const response = await fetch(`${BASE_URL}/checkout/v2/order/${merchantOrderId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${token}`,
      },
    });

    if (response.status === 204) {
      return { state: 'NOT_FOUND', message: 'Transaction not found' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('PhonePe Status Check Error:', error);
    return { code: 'ERROR', message: 'Failed to connect to PhonePe Gateway' };
  }
}
