import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class MomoService {
  private token: string | null = null;
  private tokenExpiry: number = 0; // Epoch timestamp in ms
  private simulatedTransactions = new Map<string, { status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'; createdAt: number }>();

  /**
   * Auto-provisions sandbox API User and API Key if missing from environment.
   * Modifies server/.env file in real-time to persist them.
   */
  private async ensureProvisioned(): Promise<void> {
    const subKey = process.env.MOMO_SUBSCRIPTION_KEY;
    const isSandbox = (process.env.MOMO_TARGET_ENV || 'sandbox') === 'sandbox';

    if (!subKey) {
      console.warn('⚠️ MTN Collections Subscription Key (MOMO_SUBSCRIPTION_KEY) is not configured in server/.env. Falling back to local MoMo offline simulation.');
      return;
    }

    // Auto-provisioning is only required and supported in sandbox mode
    if (!isSandbox) {
      return;
    }

    // Already provisioned
    if (process.env.MOMO_API_USER && process.env.MOMO_API_KEY) {
      return;
    }

    console.log('🔄 MTN MoMo credentials missing. Auto-provisioning Sandbox API User & API Key...');

    try {
      // 1. Generate a UUID for API User
      const apiUser = crypto.randomUUID();
      const baseUrl = process.env.MOMO_API_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';

      // 2. Create API User on MTN servers
      const createUserResponse = await fetch(`${baseUrl}/v1_0/apiuser`, {
        method: 'POST',
        headers: {
          'X-Reference-Id': apiUser,
          'Ocp-Apim-Subscription-Key': subKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerCallbackHost: 'localhost' }),
      });

      if (!createUserResponse.ok) {
        const errText = await createUserResponse.text();
        throw new Error(`Failed to create API User: ${createUserResponse.status} - ${errText}`);
      }

      console.log(`✅ Sandbox API User created: ${apiUser}`);

      // 3. Generate API Key for this user
      const createKeyResponse = await fetch(`${baseUrl}/v1_0/apiuser/${apiUser}/apikey`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': subKey,
        },
      });

      if (!createKeyResponse.ok) {
        const errText = await createKeyResponse.text();
        throw new Error(`Failed to create API Key: ${createKeyResponse.status} - ${errText}`);
      }

      const keyData: any = await createKeyResponse.json();
      const apiKey = keyData.apiKey;

      console.log('✅ Sandbox API Key generated.');

      // 4. Update environment variables in memory
      process.env.MOMO_API_USER = apiUser;
      process.env.MOMO_API_KEY = apiKey;

      // 5. Append to server/.env file to persist credentials
      const envPath = path.resolve(__dirname, '../../.env');
      if (fs.existsSync(envPath)) {
        const appendContent = `\n\n# Auto-provisioned MTN MoMo Sandbox Credentials\nMOMO_API_USER="${apiUser}"\nMOMO_API_KEY="${apiKey}"\n`;
        fs.appendFileSync(envPath, appendContent);
        console.log(`📝 Appended credentials to .env at: ${envPath}`);
      } else {
        console.warn(`⚠️ Could not find .env file at ${envPath} to persist credentials.`);
      }

    } catch (error) {
      console.error('❌ Failed to provision sandbox MTN MoMo credentials:', error);
      throw error;
    }
  }

  /**
   * Retrieves or fetches a cached OAuth 2.0 access token.
   */
  async getAccessToken(): Promise<string> {
    const subKey = process.env.MOMO_SUBSCRIPTION_KEY;
    if (!subKey) {
      return 'mock-access-token';
    }

    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    await this.ensureProvisioned();

    const apiUser = process.env.MOMO_API_USER;
    const apiKey = process.env.MOMO_API_KEY;
    const baseUrl = process.env.MOMO_API_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';

    if (!apiUser || !apiKey) {
      throw new Error('MTN MoMo API credentials are not fully configured in environment.');
    }

    const authHeader = Buffer.from(`${apiUser}:${apiKey}`).toString('base64');

    const response = await fetch(`${baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subKey,
        'Authorization': `Basic ${authHeader}`,
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch MoMo access token: ${response.status} - ${errText}`);
    }

    const data: any = await response.json();
    this.token = data.access_token;
    // Expire 1 minute early to prevent race conditions
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    return this.token!;
  }

  /**
   * Sends a charge request to MTN Mobile Money (Request to Pay).
   */
  async requestToPay(refId: string, amount: string, phoneNumber: string): Promise<void> {
    const subKey = process.env.MOMO_SUBSCRIPTION_KEY;

    if (!subKey) {
      console.log(`[MOMO OFFLINE SIMULATION] Requesting payment of $${amount} from phone ${phoneNumber}. Ref ID: ${refId}`);
      this.simulatedTransactions.set(refId, {
        status: 'PENDING',
        createdAt: Date.now()
      });
      return;
    }

    const token = await this.getAccessToken();
    const targetEnv = process.env.MOMO_TARGET_ENV || 'sandbox';
    const currency = process.env.MOMO_CURRENCY || 'EUR';
    const baseUrl = process.env.MOMO_API_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';

    // Clean phone number (leave digits only)
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    const body = {
      amount,
      currency,
      externalId: refId.slice(0, 10).replace(/-/g, ''), // 10-char reference
      payer: {
        partyIdType: 'MSISDN',
        partyId: cleanPhone,
      },
      payerMessage: 'Salon Appointment Payment',
      payeeNote: 'Lumiere Salon Booking'
    };

    const response = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Ocp-Apim-Subscription-Key': subKey,
        'X-Target-Environment': targetEnv,
        'X-Reference-Id': refId, // Must be UUID
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`MoMo RequestToPay failed: ${response.status} - ${errText}`);
    }
  }

  /**
   * Inquires the status of a request to pay.
   */
  async getTransactionStatus(refId: string): Promise<'PENDING' | 'SUCCESSFUL' | 'FAILED'> {
    const subKey = process.env.MOMO_SUBSCRIPTION_KEY;

    if (!subKey) {
      const txn = this.simulatedTransactions.get(refId);
      if (!txn) return 'FAILED';

      // Auto-approve after 6 seconds of polling
      const elapsed = Date.now() - txn.createdAt;
      if (elapsed > 6000) {
        txn.status = 'SUCCESSFUL';
      }
      return txn.status;
    }

    const token = await this.getAccessToken();
    const targetEnv = process.env.MOMO_TARGET_ENV || 'sandbox';
    const baseUrl = process.env.MOMO_API_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';

    const response = await fetch(`${baseUrl}/collection/v1_0/requesttopay/${refId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Ocp-Apim-Subscription-Key': subKey,
        'X-Target-Environment': targetEnv,
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`MoMo GetTransactionStatus failed: ${response.status} - ${errText}`);
    }

    const data: any = await response.json();
    
    // Status can be: 'PENDING', 'SUCCESSFUL', 'FAILED'
    return data.status as 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  }
}

export const momoService = new MomoService();
