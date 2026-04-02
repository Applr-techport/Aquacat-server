import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReceiptVerifyService {
  private readonly logger = new Logger(ReceiptVerifyService.name);

  async verify(platform: string, receipt: string, productId: string): Promise<{ valid: boolean; transactionId?: string }> {
    if (platform === 'android') {
      return this.verifyGoogle(receipt, productId);
    } else if (platform === 'ios') {
      return this.verifyApple(receipt, productId);
    }
    return { valid: false };
  }

  private async verifyGoogle(purchaseToken: string, productId: string): Promise<{ valid: boolean; transactionId?: string }> {
    try {
      const packageName = process.env.ANDROID_PACKAGE_NAME || 'com.aquacat.app';
      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

      if (!serviceAccountKey) {
        this.logger.warn('GOOGLE_SERVICE_ACCOUNT_KEY not set, skipping verification');
        return { valid: true, transactionId: purchaseToken.slice(0, 32) };
      }

      const { GoogleAuth } = await import('google-auth-library');
      const credentials = JSON.parse(serviceAccountKey);
      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });

      const client = await auth.getClient();
      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;
      const res = await client.request({ url }) as any;

      const purchaseState = res.data.purchaseState;
      // 0 = purchased, 1 = canceled, 2 = pending
      if (purchaseState === 0) {
        return { valid: true, transactionId: res.data.orderId };
      }
      this.logger.warn(`Google purchase invalid: state=${purchaseState}`);
      return { valid: false };
    } catch (err) {
      this.logger.error('Google verification failed', err);
      return { valid: false };
    }
  }

  private async verifyApple(receiptData: string, productId: string): Promise<{ valid: boolean; transactionId?: string }> {
    try {
      // Try production first, then sandbox
      const result = await this.callAppleVerify(receiptData, false);

      // Status 21007 means sandbox receipt sent to production
      if (result.status === 21007) {
        const sandboxResult = await this.callAppleVerify(receiptData, true);
        return this.parseAppleResponse(sandboxResult, productId);
      }

      return this.parseAppleResponse(result, productId);
    } catch (err) {
      this.logger.error('Apple verification failed', err);
      return { valid: false };
    }
  }

  private async callAppleVerify(receiptData: string, sandbox: boolean): Promise<any> {
    const url = sandbox
      ? 'https://sandbox.itunes.apple.com/verifyReceipt'
      : 'https://buy.itunes.apple.com/verifyReceipt';

    const body: any = { 'receipt-data': receiptData };
    const sharedSecret = process.env.APPLE_SHARED_SECRET;
    if (sharedSecret) {
      body.password = sharedSecret;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  private parseAppleResponse(result: any, productId: string): { valid: boolean; transactionId?: string } {
    if (result.status !== 0) {
      this.logger.warn(`Apple receipt invalid: status=${result.status}`);
      return { valid: false };
    }

    // Find matching in-app purchase
    const inApp = result.receipt?.in_app || [];
    const match = inApp.find((item: any) => item.product_id === productId);

    if (match) {
      return { valid: true, transactionId: match.transaction_id };
    }

    // Check latest_receipt_info for subscriptions/non-consumables
    const latest = result.latest_receipt_info || [];
    const latestMatch = latest.find((item: any) => item.product_id === productId);
    if (latestMatch) {
      return { valid: true, transactionId: latestMatch.transaction_id };
    }

    this.logger.warn(`Apple receipt valid but product ${productId} not found`);
    return { valid: false };
  }
}
