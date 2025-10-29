import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { PaymentRequestDto } from './dto/payment-request.dto';
import { PaymentResponseDto, PaymentStatusResponseDto, RefundResponseDto } from './dto/payment-response.dto';
import { IpnCallbackDto } from './dto/ipn-callback.dto';
import { RefundRequestDto } from './dto/refund-request.dto';

/**
 * PayTech Payment Service
 * Based on official PayTech documentation at https://doc.intech.sn/doc_paytech.php
 *
 * Important notes from documentation:
 * - All requests must include API_KEY and API_SECRET in headers
 * - CORS is not enabled on PayTech servers
 * - API keys must remain confidential; always use server-side controllers
 * - IPN verification using HMAC-SHA256 is recommended
 */
@Injectable()
export class PaytechService {
  private readonly logger = new Logger(PaytechService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl = 'https://paytech.sn/api';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PAYTECH_API_KEY');
    this.apiSecret = this.configService.get<string>('PAYTECH_API_SECRET');

    if (!this.apiKey || !this.apiSecret) {
      this.logger.error('PayTech credentials are not configured');
      throw new Error('PayTech API credentials missing in environment variables');
    }

    // Initialize axios instance with default headers as per PayTech documentation
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'API_KEY': this.apiKey,
        'API_SECRET': this.apiSecret,
        'Content-Type': 'application/json',
      },
    });

    this.logger.log('PayTech service initialized successfully');
  }

  /**
   * Request a payment link from PayTech
   * Endpoint: POST /payment/request-payment
   *
   * @param paymentData Payment request data
   * @returns Payment response with token and redirect URL
   */
  async requestPayment(paymentData: PaymentRequestDto): Promise<PaymentResponseDto> {
    try {
      this.logger.log(`Requesting payment for command: ${paymentData.ref_command}`);

      // Build request payload
      const payload = {
        item_name: paymentData.item_name,
        item_price: paymentData.item_price,
        ref_command: paymentData.ref_command,
        command_name: paymentData.command_name,
        currency: paymentData.currency || 'XOF',
        env: paymentData.env || 'prod',
        ...(paymentData.target_payment && { target_payment: paymentData.target_payment }),
        ...(paymentData.ipn_url && { ipn_url: paymentData.ipn_url }),
        // PayTech expects camelCase for these fields
        ...(paymentData.success_url && { successRedirectUrl: paymentData.success_url }),
        ...(paymentData.cancel_url && { cancelRedirectUrl: paymentData.cancel_url }),
        ...(paymentData.custom_field && { custom_field: paymentData.custom_field }),
      };

      // Log request for debugging
      this.logger.debug(`PayTech request payload: ${JSON.stringify(payload)}`);

      const response = await this.axiosInstance.post<PaymentResponseDto>(
        '/payment/request-payment',
        payload
      );

      this.logger.debug(`PayTech response: ${JSON.stringify(response.data)}`);

      if (response.data.success === 1) {
        this.logger.log(`Payment link created successfully: ${response.data.token}`);
        return response.data;
      } else {
        this.logger.error(`Payment request failed: ${response.data.message}`);
        throw new BadRequestException(response.data.message || 'Payment request failed');
      }
    } catch (error) {
      this.logger.error(`Error requesting payment: ${error.message}`, error.stack);

      // Log detailed error information
      if (error.response) {
        this.logger.error(`PayTech API Error Response: ${JSON.stringify(error.response.data)}`);
        this.logger.error(`PayTech API Error Status: ${error.response.status}`);
        throw new BadRequestException(error.response.data.message || error.response.data || 'Payment request failed');
      }
      throw new InternalServerErrorException('Failed to initialize payment');
    }
  }

  /**
   * Get payment status from PayTech
   * Endpoint: GET /payment/get-status
   *
   * @param tokenPayment Payment token
   * @returns Payment status information
   */
  async getPaymentStatus(tokenPayment: string): Promise<PaymentStatusResponseDto> {
    try {
      this.logger.log(`Checking payment status for token: ${tokenPayment}`);

      const response = await this.axiosInstance.get<PaymentStatusResponseDto>(
        '/payment/get-status',
        {
          params: { token_payment: tokenPayment }
        }
      );

      this.logger.log(`Payment status retrieved: ${response.data.data?.status}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error getting payment status: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve payment status');
    }
  }

  /**
   * Request a refund for a payment
   * Endpoint: POST /payment/refund-payment
   *
   * @param refundData Refund request data
   * @returns Refund response
   */
  async refundPayment(refundData: RefundRequestDto): Promise<RefundResponseDto> {
    try {
      this.logger.log(`Requesting refund for command: ${refundData.ref_command}`);

      const response = await this.axiosInstance.post<RefundResponseDto>(
        '/payment/refund-payment',
        new URLSearchParams({
          ref_command: refundData.ref_command
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      if (response.data.success === 1) {
        this.logger.log(`Refund processed successfully for: ${refundData.ref_command}`);
        return response.data;
      } else {
        this.logger.error(`Refund request failed: ${response.data.message}`);
        throw new BadRequestException(response.data.message || 'Refund request failed');
      }
    } catch (error) {
      this.logger.error(`Error processing refund: ${error.message}`, error.stack);
      if (error.response?.data) {
        throw new BadRequestException(error.response.data.message || 'Refund request failed');
      }
      throw new InternalServerErrorException('Failed to process refund');
    }
  }

  /**
   * Verify IPN callback using HMAC-SHA256
   *
   * Per PayTech documentation:
   * Compute: HMAC-SHA256(amount|ref_command|api_key, api_secret)
   * Compare with hmac_compute parameter
   *
   * @param ipnData IPN callback data
   * @returns true if verification succeeds
   */
  verifyIpnHmac(ipnData: IpnCallbackDto): boolean {
    try {
      if (!ipnData.hmac_compute) {
        this.logger.warn('No HMAC signature provided in IPN callback');
        return false;
      }

      // Construct the message as per PayTech documentation: amount|ref_command|api_key
      const message = `${ipnData.item_price}|${ipnData.ref_command}|${this.apiKey}`;

      // Compute HMAC-SHA256
      const expectedHmac = crypto
        .createHmac('sha256', this.apiSecret)
        .update(message)
        .digest('hex');

      const isValid = expectedHmac === ipnData.hmac_compute;

      if (isValid) {
        this.logger.log(`IPN HMAC verification succeeded for: ${ipnData.ref_command}`);
      } else {
        this.logger.warn(`IPN HMAC verification failed for: ${ipnData.ref_command}`);
        this.logger.debug(`Expected: ${expectedHmac}, Received: ${ipnData.hmac_compute}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Error verifying IPN HMAC: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Verify IPN callback using SHA256 hashing (alternative method)
   *
   * Per PayTech documentation:
   * Compare SHA256(api_key) and SHA256(api_secret) hashes
   *
   * @param ipnData IPN callback data
   * @returns true if verification succeeds
   */
  verifyIpnSha256(ipnData: IpnCallbackDto): boolean {
    try {
      if (!ipnData.api_key_sha256 || !ipnData.api_secret_sha256) {
        this.logger.warn('No SHA256 hashes provided in IPN callback');
        return false;
      }

      // Compute SHA256 hashes
      const expectedApiKeyHash = crypto
        .createHash('sha256')
        .update(this.apiKey)
        .digest('hex');

      const expectedApiSecretHash = crypto
        .createHash('sha256')
        .update(this.apiSecret)
        .digest('hex');

      const isValid =
        expectedApiKeyHash === ipnData.api_key_sha256 &&
        expectedApiSecretHash === ipnData.api_secret_sha256;

      if (isValid) {
        this.logger.log(`IPN SHA256 verification succeeded for: ${ipnData.ref_command}`);
      } else {
        this.logger.warn(`IPN SHA256 verification failed for: ${ipnData.ref_command}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Error verifying IPN SHA256: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Verify IPN callback (tries HMAC first, then SHA256)
   *
   * @param ipnData IPN callback data
   * @returns true if verification succeeds
   */
  verifyIpn(ipnData: IpnCallbackDto): boolean {
    // Try HMAC-SHA256 first (recommended by PayTech)
    if (ipnData.hmac_compute) {
      return this.verifyIpnHmac(ipnData);
    }

    // Fallback to SHA256 hashing
    if (ipnData.api_key_sha256 && ipnData.api_secret_sha256) {
      return this.verifyIpnSha256(ipnData);
    }

    this.logger.error('IPN callback has no verification parameters');
    return false;
  }

  /**
   * Check if payment was successful based on IPN data
   *
   * @param ipnData IPN callback data
   * @returns true if payment is successful
   */
  isPaymentSuccessful(ipnData: IpnCallbackDto): boolean {
    // Check event type
    if (ipnData.type_event === 'sale_complete') {
      return true;
    }

    if (ipnData.type_event === 'sale_canceled') {
      return false;
    }

    // Check success field (can be boolean, number, or string)
    if (typeof ipnData.success === 'boolean') {
      return ipnData.success;
    }

    if (typeof ipnData.success === 'number') {
      return ipnData.success === 1;
    }

    if (typeof ipnData.success === 'string') {
      return ipnData.success === '1' || ipnData.success.toLowerCase() === 'true';
    }

    return false;
  }
}
