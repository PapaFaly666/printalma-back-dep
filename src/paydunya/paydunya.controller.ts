import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Request,
  BadRequestException,
  Res,
  Render,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { PaydunyaService } from './paydunya.service';
import { PayDunyaPaymentRequestDto } from './dto/payment-request.dto';
import { PayDunyaCallbackDto } from './dto/payment-response.dto';
import { PayDunyaRefundRequestDto } from './dto/refund-request.dto';
import { PaydunyaWebhookDto } from './dto/webhook.dto';
import { PaydunyaSyncService } from './paydunya-sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/guards/roles.decorator';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * PayDunya Payment Controller
 * Based on official PayDunya documentation at https://developers.paydunya.com/doc/FR/introduction
 *
 * Endpoints:
 * - POST /paydunya/payment - Initialize payment (create invoice)
 * - POST /paydunya/callback - Handle IPN webhooks
 * - GET /paydunya/status/:token - Check payment status
 * - POST /paydunya/refund - Request refund
 */
@ApiTags('paydunya')
@Controller('paydunya')
export class PaydunyaController {
  private readonly logger = new Logger(PaydunyaController.name);

  constructor(
    private readonly paydunyaService: PaydunyaService,
    private readonly orderService: OrderService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly paydunyaSyncService: PaydunyaSyncService
  ) {}

  /**
   * Initialize a payment and get redirect URL
   * Public endpoint - no authentication required
   */
  @Post('payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize a PayDunya payment (Public)' })
  @ApiResponse({ status: 200, description: 'Payment initialized successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  async initializePayment(
    @Body() paymentData: PayDunyaPaymentRequestDto
  ) {
    try {
      this.logger.log(`Payment initialization requested: ${paymentData.invoice.description}`);

      const response = await this.paydunyaService.createInvoice(paymentData);

      // PayDunya returns the payment URL in response_text field when response_code is "00"
      // According to official documentation section #4 (HTTP/JSON)
      // If response_text contains a URL, use it; otherwise construct it
      let paymentUrl: string;

      if (response.response_text && response.response_text.startsWith('http')) {
        // PayDunya returned the full URL in response_text
        paymentUrl = response.response_text;
        this.logger.log(`Using PayDunya provided URL: ${paymentUrl}`);
      } else {
        // Construct URL with /invoice/ according to PayDunya documentation
        const mode = this.configService.get('PAYDUNYA_MODE', 'test');
        const baseUrl = mode === 'test'
          ? 'https://app.paydunya.com/sandbox-checkout/invoice'
          : 'https://app.paydunya.com/checkout/invoice';
        paymentUrl = `${baseUrl}/${response.token}`;
        this.logger.log(`Constructed payment URL: ${paymentUrl}`);
      }

      this.logger.log(`Final payment URL: ${paymentUrl}`);
      this.logger.log(`Token: ${response.token}`);

      return {
        success: true,
        message: 'Payment initialized successfully',
        data: {
          token: response.token,
          redirect_url: paymentUrl,
          payment_url: paymentUrl,
          invoice_description: paymentData.invoice.description,
        }
      };
    } catch (error) {
      this.logger.error(`Payment initialization failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle IPN (Instant Payment Notification) callback from PayDunya
   * This endpoint receives webhooks when payment status changes
   *
   * IMPORTANT: This endpoint should be publicly accessible (no auth guard)
   * as it receives callbacks from PayDunya servers
   *
   * Automatic integration for payment attempts:
   * - Creates PaymentAttempt for each attempt
   * - Updates counters and flags in Order
   * - Detects and flags insufficient funds cases
   */
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle PayDunya IPN webhook callback' })
  @ApiResponse({ status: 200, description: 'IPN processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid IPN data' })
  async handleCallback(@Body() callbackData: PayDunyaCallbackDto) {
    try {
      this.logger.log(`IPN callback received for invoice: ${callbackData.invoice_token}`);
      this.logger.debug(`IPN data: ${JSON.stringify(callbackData)}`);

      // Verify callback authenticity
      const isValid = this.paydunyaService.verifyCallback(callbackData);

      if (!isValid) {
        this.logger.error(`IPN verification failed for: ${callbackData.invoice_token}`);
        throw new BadRequestException('Invalid IPN data');
      }

      // Check if payment was successful
      const isSuccess = this.paydunyaService.isPaymentSuccessful(callbackData);

      this.logger.log(
        `IPN verified for ${callbackData.invoice_token} - Status: ${isSuccess ? 'SUCCESS' : 'FAILED'}`
      );

      // Handle payment failure reasons if payment failed
      let failureDetails = null;
      if (!isSuccess) {
        failureDetails = this.paydunyaService.getPaymentFailureReason(callbackData);
        this.logger.log(
          `Payment failed for ${callbackData.invoice_token} - Reason: ${failureDetails.reason} (${failureDetails.category})`
        );
        this.logger.debug(`Support message: ${this.paydunyaService.getFailureSupportMessage(failureDetails)}`);
      }

      // Extract order reference from custom_data
      let orderNumber: string | null = null;
      if (callbackData.custom_data) {
        try {
          const customData = typeof callbackData.custom_data === 'string'
            ? JSON.parse(callbackData.custom_data)
            : callbackData.custom_data;
          orderNumber = customData.order_number || customData.ref_command;
        } catch (error) {
          this.logger.error(`Failed to parse custom_data: ${error.message}`);
        }
      }

      // STEP 1: Create PaymentAttempt record
      let paymentAttempt = null;
      if (orderNumber) {
        try {
          // Get order to determine attempt number
          const order = await this.prisma.order.findFirst({
            where: { orderNumber: orderNumber }
          });

          if (order) {
            const attemptNumber = order.paymentAttempts + 1;

            paymentAttempt = await this.prisma.paymentAttempt.create({
              data: {
                orderId: order.id,
                orderNumber: orderNumber,
                amount: callbackData.total_amount || 0,
                currency: 'XOF',
                paymentMethod: callbackData.payment_method || 'paydunya',
                status: isSuccess ? 'SUCCESS' : 'FAILED',
                paytechToken: callbackData.invoice_token,
                paytechTransactionId: callbackData.invoice_token,
                failureReason: failureDetails?.reason,
                failureCategory: failureDetails?.category,
                failureCode: failureDetails?.code,
                failureMessage: failureDetails?.message,
                ipnData: callbackData as any,
                isRetry: order.paymentAttempts > 0,
                attemptNumber: attemptNumber,
                attemptedAt: new Date(),
                completedAt: isSuccess ? new Date() : null,
                failedAt: !isSuccess ? new Date() : null,
              }
            });

            this.logger.log(`PaymentAttempt created: ID ${paymentAttempt.id}, Attempt #${attemptNumber}`);
          }
        } catch (error) {
          this.logger.error(`Failed to create PaymentAttempt: ${error.message}`, error.stack);
        }
      }

      // STEP 2: Update order with enhanced tracking
      if (orderNumber) {
        try {
          await this.orderService.updateOrderPaymentStatus(
            orderNumber,
            isSuccess ? 'PAID' : 'FAILED',
            callbackData.invoice_token,
            failureDetails,
            paymentAttempt?.attemptNumber
          );
          this.logger.log(`Order ${orderNumber} payment status updated`);
        } catch (error) {
          this.logger.error(
            `Failed to update order payment status: ${error.message}`,
            error.stack
          );
        }
      }

      // Prepare response with enhanced failure information
      const responseData: any = {
        invoice_token: callbackData.invoice_token,
        order_number: orderNumber,
        payment_status: isSuccess ? 'success' : 'failed',
        verified: true,
        payment_attempt_id: paymentAttempt?.id,
        attempt_number: paymentAttempt?.attemptNumber,
      };

      // Add failure details for failed payments
      if (!isSuccess && failureDetails) {
        responseData.failure_details = {
          category: failureDetails.category,
          reason: failureDetails.reason,
          user_message: this.paydunyaService.getFailureUserMessage(failureDetails),
          support_message: this.paydunyaService.getFailureSupportMessage(failureDetails),
        };

        // Special handling for insufficient funds
        if (failureDetails.category === 'insufficient_funds' && orderNumber) {
          responseData.insufficient_funds_detected = true;
          responseData.retry_url = `${this.configService.get('FRONTEND_URL')}/orders/${orderNumber}/retry-payment`;
        }
      }

      return {
        success: true,
        message: 'IPN processed successfully',
        data: responseData
      };
    } catch (error) {
      this.logger.error(`IPN processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check payment status
   * Public endpoint - no authentication required
   */
  @Get('status/:token')
  @ApiOperation({ summary: 'Check payment status by invoice token (Public)' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  async getPaymentStatus(
    @Param('token') token: string
  ) {
    try {
      this.logger.log(`Payment status check for invoice: ${token}`);

      const response = await this.paydunyaService.confirmPayment(token);

      return {
        success: true,
        message: 'Payment status retrieved successfully',
        data: response,
      };
    } catch (error) {
      this.logger.error(`Payment status check failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Request a payment refund
   * Protected endpoint - requires admin role
   */
  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPERADMIN'])
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a payment refund (Admin only)' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async requestRefund(
    @Body() refundData: PayDunyaRefundRequestDto,
    @Request() req
  ) {
    try {
      this.logger.log(
        `Refund requested for invoice: ${refundData.invoice_token} by admin: ${req.user.sub}`
      );

      const response = await this.paydunyaService.refundPayment(refundData);

      return {
        success: true,
        message: 'Refund processed successfully',
        data: response,
      };
    } catch (error) {
      this.logger.error(`Refund processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Test endpoint to verify PayDunya configuration
   * Public endpoint for debugging
   */
  @Get('test-config')
  @ApiOperation({ summary: 'Test PayDunya configuration (Public for testing)' })
  async testConfig() {
    return {
      success: true,
      message: 'PayDunya service is configured and ready',
      data: {
        mode: process.env.PAYDUNYA_MODE || 'test',
        baseUrl: process.env.PAYDUNYA_MODE === 'live'
          ? 'https://app.paydunya.com/api/v1'
          : 'https://app.paydunya.com/sandbox-api/v1',
        hasMasterKey: !!process.env.PAYDUNYA_MASTER_KEY,
        hasPrivateKey: !!process.env.PAYDUNYA_PRIVATE_KEY,
        hasToken: !!process.env.PAYDUNYA_TOKEN,
        masterKeyLength: process.env.PAYDUNYA_MASTER_KEY?.length || 0,
        privateKeyLength: process.env.PAYDUNYA_PRIVATE_KEY?.length || 0,
        tokenLength: process.env.PAYDUNYA_TOKEN?.length || 0,
      }
    };
  }

  /**
   * Test endpoint to simulate payment status updates without DTO validation
   * Used for testing the payment logic without strict validation
   */
  @Post('test-status-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test payment status update (for development only)' })
  async testStatusUpdate(@Body() rawData: any) {
    try {
      this.logger.log(`Test status update received: ${JSON.stringify(rawData)}`);

      // Manual validation
      if (!rawData.invoice_token || !rawData.status) {
        throw new BadRequestException('Missing invoice_token or status');
      }

      // Create a minimal callback data object
      const callbackData: PayDunyaCallbackDto = {
        invoice_token: rawData.invoice_token,
        status: rawData.status,
        custom_data: rawData.custom_data,
        total_amount: rawData.total_amount,
        payment_method: rawData.payment_method,
        cancel_reason: rawData.cancel_reason,
        error_code: rawData.error_code
      };

      // Process the callback using the same logic
      const isSuccess = this.paydunyaService.isPaymentSuccessful(callbackData);

      // Handle payment failure reasons
      let failureDetails = null;
      if (!isSuccess) {
        failureDetails = this.paydunyaService.getPaymentFailureReason(callbackData);
      }

      // Extract order reference
      let orderNumber: string | null = null;
      if (callbackData.custom_data) {
        try {
          const customData = typeof callbackData.custom_data === 'string'
            ? JSON.parse(callbackData.custom_data)
            : callbackData.custom_data;
          orderNumber = customData.order_number || customData.ref_command;
        } catch (error) {
          this.logger.error(`Failed to parse custom_data: ${error.message}`);
        }
      }

      // Update order if we have the order number
      if (orderNumber) {
        try {
          await this.orderService.updateOrderPaymentStatus(
            orderNumber,
            isSuccess ? 'PAID' : 'FAILED',
            callbackData.invoice_token,
            failureDetails,
            1 // First attempt
          );
          this.logger.log(`Order ${orderNumber} payment status updated to ${isSuccess ? 'PAID' : 'FAILED'}`);
        } catch (error) {
          this.logger.error(`Failed to update order: ${error.message}`, error.stack);
        }
      }

      return {
        success: true,
        message: 'Test status update processed successfully',
        data: {
          invoice_token: callbackData.invoice_token,
          order_number: orderNumber,
          payment_status: isSuccess ? 'success' : 'failed',
          status_updated: !!orderNumber,
          failure_details: failureDetails
        }
      };
    } catch (error) {
      this.logger.error(`Test status update failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Real PayDunya webhook handler - handles actual IPN notifications from PayDunya
   * This endpoint bypasses strict DTO validation to handle real PayDunya webhooks
   * Public endpoint - no authentication required
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle real PayDunya IPN webhook (flexible validation)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  @ApiBody({
    description: 'PayDunya webhook payload for payment status updates',
    type: PaydunyaWebhookDto,
    examples: {
      success: {
        summary: 'Successful payment webhook',
        value: {
          invoice_token: 'test_success_123',
          status: 'completed',
          response_code: '00',
          total_amount: 15000,
          custom_data: {
            order_number: 'ORD-123456',
            order_id: 123
          },
          payment_method: 'paydunya',
          customer_name: 'Client Test',
          customer_email: 'client@example.com',
          customer_phone: '775588834'
        }
      },
      failure: {
        summary: 'Failed payment webhook',
        value: {
          invoice_token: 'test_failed_456',
          status: 'failed',
          response_code: '99',
          total_amount: 10000,
          custom_data: {
            order_number: 'ORD-FAILED789',
            order_id: 456
          },
          payment_method: 'paydunya',
          customer_name: 'Client Échec',
          customer_email: 'echec@example.com',
          error_code: 'insufficient_funds',
          cancel_reason: 'Payment failed due to insufficient funds'
        }
      }
    }
  })
  async handlePaydunyaWebhook(@Body() rawData: any) {
    try {
      this.logger.log(`Real PayDunya webhook received: ${JSON.stringify(rawData)}`);

      // Handle both JSON and form-urlencoded data
      let webhookData = rawData;

      // If data looks like form-urlencoded, convert it
      if (typeof rawData === 'object' && Object.keys(rawData).length === 0) {
        this.logger.error('Empty webhook data received');
        throw new BadRequestException('Empty webhook data');
      }

      // Extract required fields with flexible naming
      const invoiceToken = webhookData.invoice_token || webhookData.token;
      const status = webhookData.status || webhookData.payment_status;

      if (!invoiceToken || !status) {
        this.logger.error(`Missing required fields. Available fields: ${Object.keys(webhookData).join(', ')}`);
        throw new BadRequestException('Missing required fields: invoice_token and status');
      }

      // Create callback data object with proper field mapping
      const callbackData: PayDunyaCallbackDto = {
        invoice_token: invoiceToken,
        status: status,
        custom_data: webhookData.custom_data || webhookData.customData,
        total_amount: webhookData.total_amount || webhookData.amount,
        customer_name: webhookData.customer_name || webhookData.customer?.name,
        customer_email: webhookData.customer_email || webhookData.customer?.email,
        customer_phone: webhookData.customer_phone || webhookData.customer?.phone,
        payment_method: webhookData.payment_method || 'paydunya',
        cancel_reason: webhookData.cancel_reason || webhookData.reason,
        error_code: webhookData.error_code || webhookData.err_code
      };

      // Process the callback using the same logic as the standard callback
      const isSuccess = this.paydunyaService.isPaymentSuccessful(callbackData);

      this.logger.log(`Real webhook processed for ${invoiceToken} - Status: ${isSuccess ? 'SUCCESS' : 'FAILED'}`);

      // Handle payment failure reasons
      let failureDetails = null;
      if (!isSuccess) {
        failureDetails = this.paydunyaService.getPaymentFailureReason(callbackData);
        this.logger.log(`Payment failed for ${invoiceToken} - Reason: ${failureDetails?.reason} (${failureDetails?.category})`);
      }

      // Extract order reference from custom_data
      let orderNumber: string | null = null;
      if (callbackData.custom_data) {
        try {
          const customData = typeof callbackData.custom_data === 'string'
            ? JSON.parse(callbackData.custom_data)
            : callbackData.custom_data;
          orderNumber = customData.order_number || customData.ref_command || customData.orderNumber;
        } catch (error) {
          this.logger.error(`Failed to parse custom_data: ${error.message}`);
        }
      }

      // Update order status if we have the order number
      if (orderNumber) {
        try {
          await this.orderService.updateOrderPaymentStatus(
            orderNumber,
            isSuccess ? 'PAID' : 'FAILED',
            invoiceToken,
            failureDetails,
            1
          );
          this.logger.log(`Order ${orderNumber} payment status updated to ${isSuccess ? 'PAID' : 'FAILED'}`);
        } catch (error) {
          this.logger.error(`Failed to update order payment status: ${error.message}`, error.stack);
        }
      }

      // Return success response
      return {
        success: true,
        message: 'PayDunya webhook processed successfully',
        data: {
          invoice_token: invoiceToken,
          order_number: orderNumber,
          payment_status: isSuccess ? 'success' : 'failed',
          status_updated: !!orderNumber,
          failure_details: failureDetails
        }
      };
    } catch (error) {
      this.logger.error(`PayDunya webhook processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Payment success page - Handles successful payment redirects from PayDunya
   * Public endpoint - no authentication required
   */
  @Get('payment/success')
  @ApiOperation({ summary: 'Payment success redirect page' })
  @ApiResponse({ status: 200, description: 'Payment success page' })
  async paymentSuccess(
    @Query('token') token: string,
    @Query('invoice_token') invoiceToken: string,
    @Query('order_id') orderId: string,
    @Res() res: Response
  ) {
    try {
      const paymentToken = token || invoiceToken;

      if (!paymentToken) {
        return this.renderErrorPage(res, 'Token de paiement manquant', 400);
      }

      this.logger.log(`Payment success redirect received for token: ${paymentToken}`);

      // Check payment status with PayDunya
      const paymentStatus = await this.paydunyaService.confirmPayment(paymentToken);

      if (paymentStatus.response_code === '00' && paymentStatus.status === 'completed') {
        // Payment successful - try to update order status
        const customData = paymentStatus.custom_data;
        let orderNumber = null;

        if (customData) {
          orderNumber = customData.orderNumber || customData.order_number || customData.ref_command;
        }

        if (orderNumber) {
          try {
            await this.orderService.updateOrderPaymentStatus(
              orderNumber,
              'PAID',
              paymentToken,
              null,
              1
            );
            this.logger.log(`Order ${orderNumber} marked as PAID after success redirect`);
          } catch (error) {
            this.logger.error(`Failed to update order status: ${error.message}`);
          }
        }

        // Render success page
        return this.renderSuccessPage(res, {
          orderNumber,
          paymentToken,
          amount: paymentStatus.total_amount,
          paymentMethod: 'PayDunya',
          timestamp: new Date().toISOString()
        });
      } else {
        // Payment not actually successful
        return this.renderErrorPage(res, 'Paiement non confirmé', 400);
      }
    } catch (error) {
      this.logger.error(`Payment success redirect error: ${error.message}`);
      return this.renderErrorPage(res, 'Erreur lors de la vérification du paiement', 500);
    }
  }

  /**
   * Payment cancel page - Handles cancelled payment redirects from PayDunya
   * Public endpoint - no authentication required
   */
  @Get('payment/cancel')
  @ApiOperation({ summary: 'Payment cancel redirect page' })
  @ApiResponse({ status: 200, description: 'Payment cancel page' })
  async paymentCancel(
    @Query('token') token: string,
    @Query('invoice_token') invoiceToken: string,
    @Query('reason') reason: string,
    @Res() res: Response
  ) {
    try {
      const paymentToken = token || invoiceToken;

      this.logger.log(`Payment cancel redirect received for token: ${paymentToken}, reason: ${reason}`);

      // Try to find and update the associated order
      if (paymentToken) {
        try {
          const paymentStatus = await this.paydunyaService.confirmPayment(paymentToken);
          const customData = paymentStatus.custom_data;

          if (customData) {
            const orderNumber = customData.orderNumber || customData.order_number || customData.ref_command;

            if (orderNumber) {
              await this.orderService.updateOrderPaymentStatus(
                orderNumber,
                'FAILED',
                paymentToken,
                {
                  reason: reason || 'User cancelled payment',
                  category: 'user_cancelled'
                },
                1
              );
              this.logger.log(`Order ${orderNumber} marked as CANCELLED after cancel redirect`);
            }
          }
        } catch (error) {
          this.logger.error(`Failed to update order status on cancel: ${error.message}`);
        }
      }

      // Render cancel page
      return this.renderCancelPage(res, {
        paymentToken,
        reason: reason || 'Paiement annulé par l\'utilisateur',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error(`Payment cancel redirect error: ${error.message}`);
      return this.renderErrorPage(res, 'Erreur lors du traitement de l\'annulation', 500);
    }
  }

  /**
   * Render HTML success page
   */
  private renderSuccessPage(res: Response, data: any) {
    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Paiement Réussi - Printalma</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .success-icon { width: 80px; height: 80px; margin: 0 auto 20px; background: #28a745; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .success-icon::after { content: "✓"; color: white; font-size: 40px; font-weight: bold; }
            h1 { color: #28a745; text-align: center; margin-bottom: 20px; }
            .details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .details p { margin: 10px 0; }
            .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .btn-success { background: #28a745; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon"></div>
            <h1>🎉 Paiement Réussi !</h1>
            <p>Merci pour votre commande. Votre paiement a été traité avec succès.</p>

            <div class="details">
                <p><strong>Numéro de commande:</strong> ${data.orderNumber || 'N/A'}</p>
                <p><strong>Montant payé:</strong> ${data.amount ? data.amount.toLocaleString() + ' FCFA' : 'N/A'}</p>
                <p><strong>Méthode de paiement:</strong> ${data.paymentMethod}</p>
                <p><strong>Date:</strong> ${new Date(data.timestamp).toLocaleString('fr-FR')}</p>
                <p><strong>Transaction:</strong> ${data.paymentToken}</p>
            </div>

            <div style="text-align: center;">
                <a href="/" class="btn btn-success">Retour à l'accueil</a>
                <a href="/orders" class="btn">Mes commandes</a>
            </div>

            <div class="footer">
                <p>Un email de confirmation vous sera envoyé prochainement.</p>
                <p>© 2025 Printalma - Tous droits réservés</p>
            </div>
        </div>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * Render HTML cancel page
   */
  private renderCancelPage(res: Response, data: any) {
    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Paiement Annulé - Printalma</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .cancel-icon { width: 80px; height: 80px; margin: 0 auto 20px; background: #dc3545; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .cancel-icon::after { content: "✕"; color: white; font-size: 40px; font-weight: bold; }
            h1 { color: #dc3545; text-align: center; margin-bottom: 20px; }
            .details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .details p { margin: 10px 0; }
            .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .btn-warning { background: #ffc107; color: #212529; }
            .btn-danger { background: #dc3545; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="cancel-icon"></div>
            <h1>🚫 Paiement Annulé</h1>
            <p>Le paiement a été annulé. Votre commande n'a pas été finalisée.</p>

            <div class="details">
                <p><strong>Raison:</strong> ${data.reason}</p>
                <p><strong>Token de paiement:</strong> ${data.paymentToken || 'N/A'}</p>
                <p><strong>Date:</strong> ${new Date(data.timestamp).toLocaleString('fr-FR')}</p>
            </div>

            <div style="text-align: center;">
                <a href="/" class="btn btn-warning">Retour à l'accueil</a>
                <a href="/orders" class="btn">Mes commandes</a>
            </div>

            <div class="footer">
                <p>Vous pouvez réessayer le paiement à tout moment depuis vos commandes.</p>
                <p>© 2025 Printalma - Tous droits réservés</p>
            </div>
        </div>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * Render HTML error page
   */
  private renderErrorPage(res: Response, message: string, statusCode: number = 500) {
    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erreur - Printalma</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .error-icon { width: 80px; height: 80px; margin: 0 auto 20px; background: #dc3545; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .error-icon::after { content: "!"; color: white; font-size: 40px; font-weight: bold; }
            h1 { color: #dc3545; text-align: center; margin-bottom: 20px; }
            .message { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #f5c6cb; }
            .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="error-icon"></div>
            <h1>❌ Erreur de Paiement</h1>

            <div class="message">
                <strong>${message}</strong>
            </div>

            <div style="text-align: center;">
                <a href="/" class="btn">Retour à l'accueil</a>
                <a href="/contact" class="btn">Contacter le support</a>
            </div>

            <div class="footer">
                <p>Si le problème persiste, veuillez contacter notre support technique.</p>
                <p>© 2025 Printalma - Tous droits réservés</p>
            </div>
        </div>
    </body>
    </html>`;

    res.status(statusCode);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * Synchronize order with PayDunya status
   * This endpoint makes a GET request to PayDunya status API and updates the order accordingly
   */
  @Get('sync/:orderId')
  @ApiOperation({ summary: 'Synchronize order with PayDunya status' })
  @ApiResponse({ status: 200, description: 'Order synchronized successfully' })
  async syncOrderStatus(
    @Param('orderId') orderId: string,
  ) {
    try {
      const orderIdNum = parseInt(orderId);
      const result = await this.paydunyaSyncService.syncOrderWithPaydunyaStatus(orderIdNum);

      return {
        success: true,
        message: result.message,
        data: {
          orderId: orderIdNum,
          orderNumber: result.paydunyaData?.custom_data?.order_number,
          oldStatus: result.oldStatus,
          newStatus: result.newStatus,
          paydunyaData: {
            responseCode: result.paydunyaData?.response_code,
            status: result.paydunyaData?.status,
            totalAmount: result.paydunyaData?.invoice?.total_amount,
            customer: result.paydunyaData?.customer,
            receiptUrl: result.paydunyaData?.receipt_url
          }
        }
      };
    } catch (error) {
      this.logger.error(`Failed to sync order ${orderId}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Synchronize order by order number with PayDunya status
   */
  @Get('sync-by-number/:orderNumber')
  @ApiOperation({ summary: 'Synchronize order by number with PayDunya status' })
  @ApiResponse({ status: 200, description: 'Order synchronized successfully' })
  async syncOrderByNumber(
    @Param('orderNumber') orderNumber: string,
  ) {
    try {
      const result = await this.paydunyaSyncService.syncOrderByNumber(orderNumber);

      return {
        success: true,
        message: result.message,
        data: {
          orderId: result.orderId,
          orderNumber: orderNumber,
          oldStatus: result.oldStatus,
          newStatus: result.newStatus,
          paydunyaData: {
            responseCode: result.paydunyaData?.response_code,
            status: result.paydunyaData?.status,
            totalAmount: result.paydunyaData?.invoice?.total_amount,
            customer: result.paydunyaData?.customer,
            receiptUrl: result.paydunyaData?.receipt_url
          }
        }
      };
    } catch (error) {
      this.logger.error(`Failed to sync order ${orderNumber}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Synchronize all pending orders with PayDunya
   */
  @Post('sync-all')
  @ApiOperation({ summary: 'Synchronize all pending orders with PayDunya' })
  @ApiResponse({ status: 200, description: 'All orders synchronized' })
  async syncAllPendingOrders() {
    try {
      const result = await this.paydunyaSyncService.syncAllPendingOrders();

      this.logger.log(`Batch sync completed: ${result.updated}/${result.total} orders updated`);

      return {
        success: true,
        message: `Synchronization completed: ${result.updated}/${result.total} orders updated`,
        data: {
          summary: {
            total: result.total,
            updated: result.updated,
            errors: result.errors,
            successRate: result.total > 0 ? (result.updated / result.total * 100).toFixed(1) + '%' : '0%'
          },
          details: result.details
        }
      };
    } catch (error) {
      this.logger.error(`Failed to sync all pending orders: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get PayDunya configuration status
   */
  @Get('sync-status')
  @ApiOperation({ summary: 'Check PayDunya sync service status' })
  @ApiResponse({ status: 200, description: 'Sync service status' })
  async getSyncStatus() {
    try {
      // Test PayDunya service availability
      const testStatus = await this.paydunyaService.testConnection();

      // Count pending orders that could be synced
      const pendingCount = await this.prisma.order.count({
        where: {
          paymentStatus: 'PENDING',
          transactionId: { not: null }
        }
      });

      return {
        success: true,
        message: 'PayDunya sync service is operational',
        data: {
          paydunyaConnection: testStatus,
          pendingOrdersCount: pendingCount,
          lastSyncTime: new Date().toISOString(),
          syncServiceReady: true
        }
      };
    } catch (error) {
      this.logger.error(`PayDunya sync service status check failed: ${error.message}`);
      return {
        success: false,
        message: 'PayDunya sync service unavailable',
        data: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}
