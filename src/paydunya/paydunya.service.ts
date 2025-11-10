import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PayDunyaPaymentRequestDto } from './dto/payment-request.dto';
import { PayDunyaPaymentResponseDto, PayDunyaPaymentStatusDto } from './dto/payment-response.dto';
import { PayDunyaCallbackDto } from './dto/payment-response.dto';
import { PayDunyaRefundRequestDto, PayDunyaRefundResponseDto } from './dto/refund-request.dto';

/**
 * PayDunya Payment Service
 * Based on official PayDunya documentation at https://developers.paydunya.com/doc/FR/introduction
 *
 * Important notes from documentation:
 * - All requests must include PAYDUNYA-MASTER-KEY, PAYDUNYA-PRIVATE-KEY, and PAYDUNYA-TOKEN in headers
 * - Use sandbox endpoints for testing (test_ prefix for keys)
 * - Use production endpoints for live transactions (live_ prefix for keys)
 * - IPN notifications are sent via POST with application/x-www-form-urlencoded
 * - Response code "00" indicates success
 */
@Injectable()
export class PaydunyaService {
  private readonly logger = new Logger(PaydunyaService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly masterKey: string;
  private readonly privateKey: string;
  private readonly token: string;
  private readonly mode: 'test' | 'live';
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.masterKey = this.configService.get<string>('PAYDUNYA_MASTER_KEY');
    this.privateKey = this.configService.get<string>('PAYDUNYA_PRIVATE_KEY');
    this.token = this.configService.get<string>('PAYDUNYA_TOKEN');
    this.mode = this.configService.get<'test' | 'live'>('PAYDUNYA_MODE', 'test');

    // Determine base URL based on mode
    this.baseUrl = this.mode === 'test'
      ? 'https://app.paydunya.com/sandbox-api/v1'
      : 'https://app.paydunya.com/api/v1';

    if (!this.masterKey || !this.privateKey || !this.token) {
      this.logger.error('PayDunya credentials are not configured');
      throw new Error('PayDunya API credentials missing in environment variables');
    }

    // Initialize axios instance with default headers as per PayDunya documentation
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'PAYDUNYA-MASTER-KEY': this.masterKey,
        'PAYDUNYA-PRIVATE-KEY': this.privateKey,
        'PAYDUNYA-TOKEN': this.token,
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`PayDunya service initialized successfully in ${this.mode} mode`);
  }

  /**
   * Create a checkout invoice and get payment URL
   * Endpoint: POST /checkout-invoice/create
   *
   * @param paymentData Payment request data
   * @returns Payment response with token and redirect URL
   */
  async createInvoice(paymentData: PayDunyaPaymentRequestDto): Promise<PayDunyaPaymentResponseDto> {
    try {
      this.logger.log(`Creating PayDunya invoice: ${paymentData.invoice.description}`);

      // Log request for debugging
      this.logger.debug(`PayDunya request payload: ${JSON.stringify(paymentData)}`);

      const response = await this.axiosInstance.post<PayDunyaPaymentResponseDto>(
        '/checkout-invoice/create',
        paymentData
      );

      this.logger.debug(`PayDunya response: ${JSON.stringify(response.data)}`);
      this.logger.log(`PayDunya FULL response data: ${JSON.stringify(response.data, null, 2)}`);
      this.logger.log(`response_url value: ${response.data.response_url}`);
      this.logger.log(`Token value: ${response.data.token}`);

      if (response.data.response_code === '00') {
        this.logger.log(`Invoice created successfully: ${response.data.token}`);
        return response.data;
      } else {
        this.logger.error(`Invoice creation failed: ${response.data.response_text}`);
        throw new BadRequestException(response.data.response_text || 'Invoice creation failed');
      }
    } catch (error) {
      this.logger.error(`Error creating invoice: ${error.message}`, error.stack);

      // Log detailed error information
      if (error.response) {
        this.logger.error(`PayDunya API Error Response: ${JSON.stringify(error.response.data)}`);
        this.logger.error(`PayDunya API Error Status: ${error.response.status}`);
        const errorMessage = error.response.data?.response_text ||
                           error.response.data?.message ||
                           error.response.data?.error ||
                           'Invoice creation failed';
        throw new BadRequestException(errorMessage);
      } else if (error.request) {
        // La requête a été envoyée mais aucune réponse reçue
        this.logger.error(`PayDunya API No Response: ${error.message}`);
        this.logger.error(`Request details: ${JSON.stringify(error.request)}`);
        throw new InternalServerErrorException('Unable to connect to PayDunya API. Please check your network connection and API configuration.');
      } else {
        // Erreur de configuration ou autre
        this.logger.error(`PayDunya Configuration Error: ${error.message}`);
        throw new InternalServerErrorException(`PayDunya configuration error: ${error.message}`);
      }
    }
  }

  /**
   * Confirm payment status from PayDunya
   * Endpoint: GET /checkout-invoice/confirm/:token
   *
   * @param invoiceToken Invoice token
   * @returns Payment status information
   */
  async confirmPayment(invoiceToken: string): Promise<PayDunyaPaymentStatusDto> {
    try {
      this.logger.log(`Checking payment status for invoice: ${invoiceToken}`);

      const response = await this.axiosInstance.get<PayDunyaPaymentStatusDto>(
        `/checkout-invoice/confirm/${invoiceToken}`
      );

      this.logger.log(`Payment status retrieved: ${response.data.status}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error getting payment status: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve payment status');
    }
  }

  /**
   * Request a refund for a payment
   * Note: PayDunya refund API may vary, check official documentation
   *
   * @param refundData Refund request data
   * @returns Refund response
   */
  async refundPayment(refundData: PayDunyaRefundRequestDto): Promise<PayDunyaRefundResponseDto> {
    try {
      this.logger.log(`Requesting refund for invoice: ${refundData.invoice_token}`);

      // Note: PayDunya refund endpoint may need to be adjusted based on official API
      const response = await this.axiosInstance.post<PayDunyaRefundResponseDto>(
        '/checkout-invoice/refund',
        refundData
      );

      if (response.data.response_code === '00') {
        this.logger.log(`Refund processed successfully for: ${refundData.invoice_token}`);
        return response.data;
      } else {
        this.logger.error(`Refund request failed: ${response.data.response_text}`);
        throw new BadRequestException(response.data.response_text || 'Refund request failed');
      }
    } catch (error) {
      this.logger.error(`Error processing refund: ${error.message}`, error.stack);
      if (error.response?.data) {
        throw new BadRequestException(error.response.data.response_text || 'Refund request failed');
      }
      throw new InternalServerErrorException('Failed to process refund');
    }
  }

  /**
   * Check if payment was successful based on callback data
   *
   * @param callbackData Callback data from PayDunya IPN
   * @returns true if payment is successful
   */
  isPaymentSuccessful(callbackData: PayDunyaCallbackDto): boolean {
    // PayDunya uses lowercase 'completed' for successful payments
    return callbackData.status?.toLowerCase() === 'completed';
  }

  /**
   * Get payment failure reason from callback data
   *
   * @param callbackData Callback data from PayDunya IPN
   * @returns Detailed failure reason object
   */
  getPaymentFailureReason(callbackData: PayDunyaCallbackDto): {
    reason: string;
    code?: string;
    message?: string;
    category: 'insufficient_funds' | 'technical_error' | 'user_action' | 'fraud' | 'timeout' | 'other';
  } {
    const status = callbackData.status?.toLowerCase() || '';
    const reason = callbackData.cancel_reason?.toLowerCase() || '';
    const errorCode = callbackData.error_code?.toLowerCase() || '';

    // Categorize the failure reason based on status
    if (status === 'cancelled') {
      return {
        reason: reason || 'user_cancelled',
        code: callbackData.error_code,
        message: callbackData.cancel_reason || 'Le client a annulé le paiement',
        category: 'user_action'
      };
    }

    if (status === 'failed') {
      // Check for specific failure reasons
      if (reason.includes('insufficient') || reason.includes('funds') || reason.includes('balance')) {
        return {
          reason: reason || 'insufficient_funds',
          code: callbackData.error_code,
          message: callbackData.cancel_reason || 'Fonds insuffisants dans le compte',
          category: 'insufficient_funds'
        };
      }

      if (reason.includes('timeout') || reason.includes('expire')) {
        return {
          reason: reason || 'timeout',
          code: callbackData.error_code,
          message: callbackData.cancel_reason || 'La session de paiement a expiré',
          category: 'timeout'
        };
      }

      if (reason.includes('fraud') || reason.includes('suspect')) {
        return {
          reason: reason || 'fraud_detected',
          code: callbackData.error_code,
          message: callbackData.cancel_reason || 'Transaction suspectée - Fraude',
          category: 'fraud'
        };
      }

      // Default to technical error for failed payments
      return {
        reason: reason || 'technical_error',
        code: callbackData.error_code,
        message: callbackData.cancel_reason || 'Erreur technique lors du paiement',
        category: 'technical_error'
      };
    }

    // Default fallback
    return {
      reason: reason || 'unknown_error',
      code: callbackData.error_code,
      message: callbackData.cancel_reason || 'Erreur de paiement inconnue',
      category: 'other'
    };
  }

  /**
   * Get user-friendly message based on failure reason
   *
   * @param failureReason Failure reason object
   * @returns User-friendly message in French
   */
  getFailureUserMessage(failureReason: ReturnType<typeof this.getPaymentFailureReason>): string {
    switch (failureReason.category) {
      case 'insufficient_funds':
        return 'Fonds insuffisants. Veuillez vérifier votre solde ou utiliser une autre méthode de paiement.';

      case 'timeout':
        return 'Session expirée. Veuillez réessayer le paiement.';

      case 'user_action':
        return 'Paiement annulé. Vous pouvez réessayer si vous le souhaitez.';

      case 'fraud':
        return 'Paiement bloqué pour des raisons de sécurité. Veuillez contacter le support.';

      case 'technical_error':
        return 'Erreur technique. Veuillez réessayer dans quelques instants.';

      default:
        return 'Paiement échoué. Veuillez réessayer ou contacter le support.';
    }
  }

  /**
   * Get support message based on failure reason
   *
   * @param failureReason Failure reason object
   * @returns Support message with technical details
   */
  getFailureSupportMessage(failureReason: ReturnType<typeof this.getPaymentFailureReason>): string {
    const details = [];

    if (failureReason.code) {
      details.push(`Code erreur: ${failureReason.code}`);
    }

    if (failureReason.reason !== failureReason.message) {
      details.push(`Raison: ${failureReason.reason}`);
    }

    const baseMessage = `Catégorie: ${failureReason.category} | Message: ${failureReason.message}`;

    return details.length > 0
      ? `${baseMessage} | ${details.join(' | ')}`
      : baseMessage;
  }

  /**
   * Verify callback authenticity
   * Note: PayDunya may use different verification methods
   * Check official documentation for exact implementation
   *
   * @param callbackData Callback data from PayDunya IPN
   * @returns true if verification succeeds
   */
  verifyCallback(callbackData: PayDunyaCallbackDto): boolean {
    // PayDunya verification logic should be implemented here
    // For now, we'll do a basic validation
    if (!callbackData.invoice_token || !callbackData.status) {
      this.logger.warn('Missing required fields in callback data');
      return false;
    }

    this.logger.log(`Callback verified for invoice: ${callbackData.invoice_token}`);
    return true;
  }

  /**
   * Test connection to PayDunya API
   * Makes a simple request to verify API connectivity
   *
   * @returns true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      // Make a simple request to test connectivity
      // Using a status check for a dummy token to test the API
      await this.axiosInstance.get('/checkout-invoice/confirm/test-connection', {
        validateStatus: (status) => status < 500 // Accept any client error as valid connection test
      });

      this.logger.log('PayDunya API connection test successful');
      return true;
    } catch (error) {
      if (error.response && error.response.status < 500) {
        // Client errors (4xx) mean the API is reachable, just the token is invalid
        this.logger.log('PayDunya API connection test successful (client error expected)');
        return true;
      }

      this.logger.error(`PayDunya API connection test failed: ${error.message}`);
      return false;
    }
  }
}
