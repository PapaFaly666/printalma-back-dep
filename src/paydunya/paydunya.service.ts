import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import { PayDunyaPaymentRequestDto } from './dto/payment-request.dto';
import { PayDunyaPaymentResponseDto, PayDunyaPaymentStatusDto } from './dto/payment-response.dto';
import { PayDunyaCallbackDto } from './dto/payment-response.dto';
import { PayDunyaRefundRequestDto, PayDunyaRefundResponseDto } from './dto/refund-request.dto';
import { PaymentConfigService } from '../payment-config/payment-config.service';
import { PaymentProvider } from '../payment-config/dto/create-payment-config.dto';

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
 *
 * CONFIGURATION DYNAMIQUE:
 * - Les clés API sont maintenant stockées en base de données
 * - L'admin peut les configurer sans toucher au code
 * - Fallback sur les variables d'environnement si aucune config en BDD
 */
@Injectable()
export class PaydunyaService {
  private readonly logger = new Logger(PaydunyaService.name);

  constructor(
    private configService: ConfigService,
    private paymentConfigService: PaymentConfigService,
  ) {
    this.logger.log('PayDunya service initialized with dynamic configuration');
  }

  /**
   * Récupère l'instance Axios configurée avec les clés actuelles
   * Les clés sont chargées depuis la BDD (priorité) ou depuis les variables d'environnement (fallback)
   */
  private async getAxiosInstance(): Promise<AxiosInstance> {
    // Récupérer la configuration depuis la base de données
    const dbConfig = await this.paymentConfigService.getActiveConfig(PaymentProvider.PAYDUNYA);

    let masterKey: string;
    let privateKey: string;
    let token: string;
    let mode: 'test' | 'live';

    if (dbConfig && dbConfig.isActive) {
      // Utiliser la configuration depuis la base de données
      this.logger.debug('Using PayDunya configuration from database');
      mode = dbConfig.activeMode as 'test' | 'live';

      // Sélectionner les clés appropriées selon le mode actif
      if (mode === 'test') {
        masterKey = dbConfig.testMasterKey;
        privateKey = dbConfig.testPrivateKey;
        token = dbConfig.testToken;
      } else {
        masterKey = dbConfig.liveMasterKey;
        privateKey = dbConfig.livePrivateKey;
        token = dbConfig.liveToken;
      }
    } else {
      // Fallback sur les variables d'environnement
      this.logger.warn('No active PayDunya config in database, falling back to environment variables');
      masterKey = this.configService.get<string>('PAYDUNYA_MASTER_KEY');
      privateKey = this.configService.get<string>('PAYDUNYA_PRIVATE_KEY');
      token = this.configService.get<string>('PAYDUNYA_TOKEN');
      mode = this.configService.get<'test' | 'live'>('PAYDUNYA_MODE', 'test');
    }

    // Vérifier que les clés sont présentes
    if (!privateKey || !token) {
      this.logger.error('PayDunya credentials are not configured in database or environment variables');
      throw new BadRequestException(
        'Configuration PayDunya manquante. Veuillez configurer les clés API dans l\'administration.'
      );
    }

    // Déterminer l'URL de base selon le mode
    const baseUrl = mode === 'test'
      ? 'https://app.paydunya.com/sandbox-api/v1'
      : 'https://app.paydunya.com/api/v1';

    // Créer et retourner l'instance axios avec les headers requis
    const headers: any = {
      'PAYDUNYA-PRIVATE-KEY': privateKey,
      'PAYDUNYA-TOKEN': token,
      'Content-Type': 'application/json',
    };

    // Master key est optionnel (certains endpoints ne le requièrent pas)
    if (masterKey) {
      headers['PAYDUNYA-MASTER-KEY'] = masterKey;
    }

    return axios.create({
      baseURL: baseUrl,
      headers,
      timeout: 30000, // 30 secondes de timeout
      httpsAgent: new https.Agent({
        rejectUnauthorized: true, // Valider les certificats SSL
        keepAlive: true,
      }),
      // Retry configuration pour les erreurs réseau
      validateStatus: (status) => status < 600, // Accepter tous les codes HTTP
    });
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

      const axiosInstance = await this.getAxiosInstance();

      // Log request details for debugging
      this.logger.log(`📤 PayDunya Request Details:`);
      this.logger.log(`   URL: ${axiosInstance.defaults.baseURL}/checkout-invoice/create`);
      this.logger.log(`   Headers: ${JSON.stringify({
        ...axiosInstance.defaults.headers,
        'PAYDUNYA-MASTER-KEY': axiosInstance.defaults.headers['PAYDUNYA-MASTER-KEY'] ? '***masked***' : 'not set',
        'PAYDUNYA-PRIVATE-KEY': axiosInstance.defaults.headers['PAYDUNYA-PRIVATE-KEY'] ? '***masked***' : 'not set',
        'PAYDUNYA-TOKEN': axiosInstance.defaults.headers['PAYDUNYA-TOKEN'] ? '***masked***' : 'not set',
      }, null, 2)}`);
      this.logger.log(`   Payload: ${JSON.stringify(paymentData, null, 2)}`);

      const response = await axiosInstance.post<PayDunyaPaymentResponseDto>(
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
      this.logger.error(`❌ Error creating invoice: ${error.message}`);

      // Log detailed error information
      if (error.response) {
        this.logger.error(`📥 PayDunya API Error Details:`);
        this.logger.error(`   Status: ${error.response.status}`);
        this.logger.error(`   Status Text: ${error.response.statusText}`);
        this.logger.error(`   Headers: ${JSON.stringify(error.response.headers)}`);

        // Tronquer la réponse si c'est du HTML (erreur 500)
        const responseData = error.response.data;
        if (typeof responseData === 'string' && responseData.includes('<!DOCTYPE html>')) {
          this.logger.error(`   Response: HTML error page (500 Internal Server Error)`);
          this.logger.error(`   → L'API PayDunya a rencontré une erreur interne`);
          this.logger.error(`   → Vérifiez que les clés API sont correctes et que le payload est valide`);
        } else {
          this.logger.error(`   Response: ${JSON.stringify(responseData, null, 2)}`);
        }

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
    const maxRetries = 3;
    const retryDelay = 2000; // 2 secondes entre les tentatives

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Checking payment status for invoice: ${invoiceToken} (attempt ${attempt}/${maxRetries})`);

        const axiosInstance = await this.getAxiosInstance();
        const response = await axiosInstance.get<PayDunyaPaymentStatusDto>(
          `/checkout-invoice/confirm/${invoiceToken}`
        );

        this.logger.log(`Payment status retrieved: ${response.data.status}`);
        return response.data;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const isNetworkError = error.code === 'ENOTFOUND' ||
                              error.code === 'ETIMEDOUT' ||
                              error.code === 'ECONNREFUSED' ||
                              error.code === 'ECONNRESET' ||
                              error.message?.includes('socket hang up') ||
                              error.message?.includes('AggregateError');

        this.logger.error(
          `Error getting payment status (attempt ${attempt}/${maxRetries}): ${error.message}`,
          error.stack
        );

        if (error.response) {
          // Erreur HTTP (serveur a répondu)
          this.logger.error(`HTTP Error - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);

          // Si c'est une erreur 4xx (client), pas la peine de retry
          if (error.response.status >= 400 && error.response.status < 500) {
            throw new InternalServerErrorException(
              `PayDunya API error: ${error.response.data?.message || 'Invalid request'}`
            );
          }
        } else if (error.request) {
          // La requête a été envoyée mais aucune réponse reçue
          this.logger.error(`Network Error - No response received from PayDunya API`);
          this.logger.error(`Error code: ${error.code}`);
          this.logger.error(`Error message: ${error.message}`);
        } else {
          // Erreur lors de la configuration de la requête
          this.logger.error(`Request Setup Error: ${error.message}`);
        }

        // Retry si ce n'est pas la dernière tentative et que c'est une erreur réseau
        if (!isLastAttempt && isNetworkError) {
          this.logger.warn(`Network error detected, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // Dernière tentative ou erreur non-retry : throw
        if (isLastAttempt) {
          throw new InternalServerErrorException(
            'Failed to retrieve payment status after multiple attempts. Please check your network connection and PayDunya API configuration.'
          );
        } else {
          throw new InternalServerErrorException('Failed to retrieve payment status');
        }
      }
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

      const axiosInstance = await this.getAxiosInstance();
      // Note: PayDunya refund endpoint may need to be adjusted based on official API
      const response = await axiosInstance.post<PayDunyaRefundResponseDto>(
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
      const axiosInstance = await this.getAxiosInstance();
      // Make a simple request to test connectivity
      // Using a status check for a dummy token to test the API
      await axiosInstance.get('/checkout-invoice/confirm/test-connection', {
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

  /**
   * Initiate Orange Money Sénégal payment via SoftPay API
   * Doc: https://developers.paydunya.com/doc/FR/softpay
   * Endpoint: POST /softpay/new-orange-money-senegal
   *
   * Orange Money requires this dedicated SoftPay call AFTER creating the invoice.
   * The standard checkout redirect does NOT work for Orange Money.
   */
  async initiateSoftPayOrangeMoney(
    invoiceToken: string,
    customerName: string,
    customerEmail: string,
    phoneNumber: string,
  ): Promise<{ url: string; other_url?: { om_url?: string; maxit_url?: string }; fees?: number; currency?: string }> {
    try {
      this.logger.log(`🟠 [SoftPay OM] Initiation paiement Orange Money pour token: ${invoiceToken}`);

      const axiosInstance = await this.getAxiosInstance();

      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        phone_number: phoneNumber,
        invoice_token: invoiceToken,
      };

      this.logger.log(`🟠 [SoftPay OM] Payload: ${JSON.stringify(payload)}`);

      const response = await axiosInstance.post('/softpay/new-orange-money-senegal', payload);

      this.logger.log(`🟠 [SoftPay OM] Réponse PayDunya: ${JSON.stringify(response.data)}`);

      if (response.data.success === true && response.data.url) {
        this.logger.log(`✅ [SoftPay OM] URL Orange Money: ${response.data.url}`);
        return {
          url: response.data.url,
          other_url: response.data.other_url,
          fees: response.data.fees,
          currency: response.data.currency,
        };
      }

      throw new BadRequestException(
        response.data.message || 'Échec de l\'initiation du paiement Orange Money'
      );
    } catch (error) {
      this.logger.error(`❌ [SoftPay OM] Erreur: ${error.message}`);
      if (error.response) {
        this.logger.error(`   Status: ${error.response.status}`);
        this.logger.error(`   Response: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
}
