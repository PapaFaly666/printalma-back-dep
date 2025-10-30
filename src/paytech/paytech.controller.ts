import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaytechService } from './paytech.service';
import { PaymentRequestDto } from './dto/payment-request.dto';
import { IpnCallbackDto } from './dto/ipn-callback.dto';
import { RefundRequestDto } from './dto/refund-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/guards/roles.decorator';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * PayTech Payment Controller
 * Based on official PayTech documentation at https://doc.intech.sn/doc_paytech.php
 *
 * Endpoints:
 * - POST /paytech/payment - Initialize payment
 * - POST /paytech/ipn-callback - Handle IPN webhooks
 * - GET /paytech/status/:token - Check payment status
 * - POST /paytech/refund - Request refund
 */
@ApiTags('paytech')
@Controller('paytech')
export class PaytechController {
  private readonly logger = new Logger(PaytechController.name);

  constructor(
    private readonly paytechService: PaytechService,
    private readonly orderService: OrderService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Initialize a payment and get redirect URL
   * Public endpoint - no authentication required
   */
  @Post('payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize a PayTech payment (Public)' })
  @ApiResponse({ status: 200, description: 'Payment initialized successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  async initializePayment(
    @Body() paymentData: PaymentRequestDto
  ) {
    try {
      this.logger.log(`Payment initialization requested for order: ${paymentData.ref_command}`);

      const response = await this.paytechService.requestPayment(paymentData);

      return {
        success: true,
        message: 'Payment initialized successfully',
        data: {
          token: response.token,
          redirect_url: response.redirect_url || response.redirectUrl,
          ref_command: paymentData.ref_command,
        }
      };
    } catch (error) {
      this.logger.error(`Payment initialization failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle IPN (Instant Payment Notification) callback from PayTech
   * This endpoint receives webhooks when payment status changes
   *
   * IMPORTANT: This endpoint should be publicly accessible (no auth guard)
   * as it receives callbacks from PayTech servers
   *
   * 🆕 Intégration automatique des fonds insuffisants:
   * - Crée automatiquement un PaymentAttempt pour chaque tentative
   * - Met à jour les compteurs et flags dans Order
   * - Détecte et flag les cas de fonds insuffisants
   */
  @Post('ipn-callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle PayTech IPN webhook callback' })
  @ApiResponse({ status: 200, description: 'IPN processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid IPN signature' })
  async handleIpnCallback(@Body() ipnData: IpnCallbackDto) {
    try {
      this.logger.log(`IPN callback received for command: ${ipnData.ref_command}`);
      this.logger.debug(`IPN data: ${JSON.stringify(ipnData)}`);

      // Verify IPN signature
      const isValid = this.paytechService.verifyIpn(ipnData);

      if (!isValid) {
        this.logger.error(`IPN verification failed for: ${ipnData.ref_command}`);
        throw new BadRequestException('Invalid IPN signature');
      }

      // Check if payment was successful
      const isSuccess = this.paytechService.isPaymentSuccessful(ipnData);

      this.logger.log(
        `IPN verified for ${ipnData.ref_command} - Status: ${isSuccess ? 'SUCCESS' : 'FAILED'}`
      );

      // Handle payment failure reasons if payment failed
      let failureDetails = null;
      if (!isSuccess) {
        failureDetails = this.paytechService.getPaymentFailureReason(ipnData);
        this.logger.log(
          `💳 Payment failed for ${ipnData.ref_command} - Reason: ${failureDetails.reason} (${failureDetails.category})`
        );
        this.logger.debug(`Support message: ${this.paytechService.getFailureSupportMessage(failureDetails)}`);
      }

      // 🆕 STEP 1: Create PaymentAttempt record
      let paymentAttempt = null;
      if (ipnData.ref_command) {
        try {
          // Get order to determine attempt number
          const order = await this.prisma.order.findFirst({
            where: { orderNumber: ipnData.ref_command }
          });

          if (order) {
            const attemptNumber = order.paymentAttempts + 1;

            paymentAttempt = await this.prisma.paymentAttempt.create({
              data: {
                orderId: order.id,
                orderNumber: ipnData.ref_command,
                amount: ipnData.item_price,
                currency: ipnData.currency || 'XOF',
                paymentMethod: ipnData.payment_method,
                status: isSuccess ? 'SUCCESS' : 'FAILED',
                paytechToken: ipnData.token,
                paytechTransactionId: ipnData.transaction_id,
                failureReason: failureDetails?.reason,
                failureCategory: failureDetails?.category,
                failureCode: failureDetails?.code,
                failureMessage: failureDetails?.message,
                processorResponse: failureDetails?.processorResponse,
                ipnData: ipnData as any, // Store complete IPN data for debugging
                isRetry: order.paymentAttempts > 0,
                attemptNumber: attemptNumber,
                attemptedAt: new Date(),
                completedAt: isSuccess ? new Date() : null,
                failedAt: !isSuccess ? new Date() : null,
              }
            });

            this.logger.log(`✅ PaymentAttempt created: ID ${paymentAttempt.id}, Attempt #${attemptNumber}`);
          }
        } catch (error) {
          this.logger.error(`❌ Failed to create PaymentAttempt: ${error.message}`, error.stack);
          // Don't fail IPN processing if PaymentAttempt creation fails
        }
      }

      // 🆕 STEP 2: Update order with enhanced tracking
      if (ipnData.ref_command) {
        try {
          await this.orderService.updateOrderPaymentStatus(
            ipnData.ref_command,
            isSuccess ? 'PAID' : 'FAILED',
            ipnData.transaction_id,
            failureDetails, // Pass failure details to order service
            paymentAttempt?.attemptNumber // Pass attempt number
          );
          this.logger.log(`✅ Order ${ipnData.ref_command} payment status updated`);
        } catch (error) {
          this.logger.error(
            `❌ Failed to update order payment status: ${error.message}`,
            error.stack
          );
          // Don't fail IPN processing even if order update fails
        }
      }

      // Prepare response with enhanced failure information
      const responseData: any = {
        ref_command: ipnData.ref_command,
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
          user_message: this.paytechService.getFailureUserMessage(failureDetails),
          support_message: this.paytechService.getFailureSupportMessage(failureDetails),
        };

        // Add technical details for debugging
        if (failureDetails.code) {
          responseData.failure_details.error_code = failureDetails.code;
        }
        if (failureDetails.processorResponse) {
          responseData.failure_details.processor_response = failureDetails.processorResponse;
        }

        // 🆕 Special handling for insufficient funds
        if (failureDetails.category === 'insufficient_funds') {
          responseData.insufficient_funds_detected = true;
          responseData.retry_url = `${this.configService.get('FRONTEND_URL')}/orders/${ipnData.ref_command}/retry-payment`;
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
  @ApiOperation({ summary: 'Check payment status by token (Public)' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  async getPaymentStatus(
    @Param('token') token: string
  ) {
    try {
      this.logger.log(`Payment status check for token: ${token}`);

      const response = await this.paytechService.getPaymentStatus(token);

      return {
        success: true,
        message: 'Payment status retrieved successfully',
        data: response.data,
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
    @Body() refundData: RefundRequestDto,
    @Request() req
  ) {
    try {
      this.logger.log(
        `Refund requested for command: ${refundData.ref_command} by admin: ${req.user.sub}`
      );

      const response = await this.paytechService.refundPayment(refundData);

      return {
        success: true,
        message: 'Refund processed successfully',
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`Refund processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Test endpoint to verify PayTech configuration
   * Public endpoint for debugging
   */
  @Get('test-config')
  @ApiOperation({ summary: 'Test PayTech configuration (Public for testing)' })
  async testConfig() {
    return {
      success: true,
      message: 'PayTech service is configured and ready',
      data: {
        baseUrl: 'https://paytech.sn/api',
        hasApiKey: !!process.env.PAYTECH_API_KEY,
        hasApiSecret: !!process.env.PAYTECH_API_SECRET,
        apiKeyLength: process.env.PAYTECH_API_KEY?.length || 0,
        apiSecretLength: process.env.PAYTECH_API_SECRET?.length || 0,
        environment: process.env.PAYTECH_ENVIRONMENT || 'not set',
        ipnUrl: process.env.PAYTECH_IPN_URL || 'not set',
      }
    };
  }

  /**
   * Diagnostic endpoint to test PayTech API connectivity
   * Public endpoint for debugging
   */
  @Get('diagnose')
  @ApiOperation({ summary: 'Diagnose PayTech API connection' })
  async diagnose() {
    try {
      // Test with minimal valid data
      const testResponse = await this.paytechService.requestPayment({
        item_name: 'Test Diagnostic',
        item_price: 100,
        ref_command: `DIAG-${Date.now()}`,
        command_name: 'Diagnostic Test',
        currency: 'XOF' as any,
        env: 'test' as any,
      });

      return {
        success: true,
        message: 'PayTech API is reachable and responding',
        data: {
          token: testResponse.token?.substring(0, 10) + '...',
          hasRedirectUrl: !!testResponse.redirect_url,
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'PayTech API connection failed',
        error: {
          message: error.message,
          response: error.response?.data || null,
          status: error.response?.status || null,
        }
      };
    }
  }

  /**
   * Specialized webhook endpoint for insufficient funds scenarios
   * This endpoint is triggered when a payment fails due to insufficient funds
   *
   * Key features:
   * - Sends customer notification about insufficient funds
   * - Logs the incident for analytics
   * - Triggers retry payment flow
   * - Offers alternative payment methods
   *
   * IMPORTANT: Configure this endpoint in PayTech dashboard as secondary IPN URL
   * or use it in conjunction with the main ipn-callback endpoint
   */
  @Post('ipn-insufficient-funds')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle insufficient funds webhook from PayTech' })
  @ApiResponse({ status: 200, description: 'Insufficient funds webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handleInsufficientFunds(@Body() ipnData: IpnCallbackDto) {
    try {
      this.logger.log(`💳 Insufficient funds webhook received for: ${ipnData.ref_command}`);

      // Step 1: Verify webhook authenticity
      const isValid = this.paytechService.verifyIpn(ipnData);
      if (!isValid) {
        this.logger.error(`❌ Invalid IPN signature for insufficient funds webhook`);
        throw new BadRequestException('Invalid webhook signature');
      }

      // Step 2: Verify this is actually an insufficient funds case
      const failureDetails = this.paytechService.getPaymentFailureReason(ipnData);

      if (failureDetails.category !== 'insufficient_funds') {
        this.logger.warn(
          `⚠️ Webhook received at insufficient-funds endpoint but failure category is: ${failureDetails.category}`
        );
        // You can choose to redirect to the main IPN handler or process anyway
      }

      // Step 3: Update order with specific insufficient funds status
      const order = await this.prisma.order.findFirst({
        where: { orderNumber: ipnData.ref_command },
        include: { user: true }
      });

      if (!order) {
        this.logger.error(`❌ Order not found: ${ipnData.ref_command}`);
        throw new BadRequestException(`Order ${ipnData.ref_command} not found`);
      }

      // Step 4: Update order with insufficient funds details
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          notes: order.notes
            ? `${order.notes}\n\n💰 INSUFFICIENT FUNDS: ${failureDetails.message}\nAttempted amount: ${ipnData.item_price} ${ipnData.currency || 'XOF'}\nTimestamp: ${new Date().toISOString()}`
            : `💰 INSUFFICIENT FUNDS: ${failureDetails.message}\nAttempted amount: ${ipnData.item_price} ${ipnData.currency || 'XOF'}\nTimestamp: ${new Date().toISOString()}`
        }
      });

      // Step 5: Log analytics event for insufficient funds
      this.logger.log(
        `📊 Analytics: Insufficient funds for order ${ipnData.ref_command} - Amount: ${ipnData.item_price} ${ipnData.currency || 'XOF'}`
      );

      // Step 6: Prepare customer notification data
      const customerNotification = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: ipnData.item_price,
        currency: ipnData.currency || 'XOF',
        customerEmail: order.user?.email,
        customerPhone: order.phoneNumber,
        message: this.paytechService.getFailureUserMessage(failureDetails),
        retryPaymentUrl: `${this.configService.get('FRONTEND_URL')}/orders/${order.orderNumber}/retry-payment`
      };

      this.logger.log(
        `📧 Customer notification prepared for ${order.user?.email || order.phoneNumber}`
      );

      // Step 7: Return detailed response with action items
      return {
        success: true,
        message: 'Insufficient funds webhook processed successfully',
        data: {
          order_id: order.id,
          order_number: order.orderNumber,
          payment_status: 'FAILED',
          failure_category: 'insufficient_funds',
          failure_details: {
            reason: failureDetails.reason,
            message: failureDetails.message,
            code: failureDetails.code,
            user_message: this.paytechService.getFailureUserMessage(failureDetails),
          },
          customer_notification: customerNotification,
          actions: {
            retry_payment: {
              available: true,
              url: customerNotification.retryPaymentUrl,
              method: 'POST',
              note: 'Customer can retry payment with sufficient funds'
            },
            alternative_payment: {
              available: true,
              methods: ['cash_on_delivery', 'bank_transfer'],
              note: 'Suggest alternative payment methods'
            },
            partial_payment: {
              available: false, // Set to true if your business logic supports it
              note: 'Partial payment not implemented yet'
            }
          },
          next_steps: [
            'Send SMS/Email notification to customer',
            'Customer can retry payment via retry URL',
            'Order remains in PENDING status until payment succeeds',
            'Consider offering alternative payment methods'
          ]
        }
      };
    } catch (error) {
      this.logger.error(`❌ Insufficient funds webhook processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Webhook verification and diagnostic endpoint
   * Allows testing IPN webhook processing without affecting real orders
   */
  @Post('webhook-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test and verify PayTech webhook processing' })
  @ApiResponse({ status: 200, description: 'Webhook test completed' })
  async verifyWebhook(@Body() ipnData: IpnCallbackDto) {
    try {
      this.logger.log(`🔍 Webhook verification test for: ${ipnData.ref_command}`);

      const results: any = {
        test_timestamp: new Date().toISOString(),
        ipn_data: ipnData,
        verification_results: {},
        failure_analysis: null,
        hmac_calculation: null,
        recommendations: []
      };

      // Step 1: Test IPN signature verification
      this.logger.log('📋 Step 1: Testing IPN signature verification...');
      try {
        const isValid = this.paytechService.verifyIpn(ipnData);
        results.verification_results.signature_valid = isValid;

        if (isValid) {
          results.verification_results.signature_status = '✅ Valid HMAC signature';
          this.logger.log('✅ HMAC signature verification: PASSED');
        } else {
          results.verification_results.signature_status = '❌ Invalid HMAC signature';
          results.recommendations.push('Check HMAC calculation or API credentials');
          this.logger.log('❌ HMAC signature verification: FAILED');
        }
      } catch (error) {
        results.verification_results.signature_status = `❌ Error: ${error.message}`;
        results.recommendations.push('Fix signature verification logic');
        this.logger.error(`❌ HMAC signature error: ${error.message}`);
      }

      // Step 2: Calculate and show expected HMAC
      this.logger.log('📋 Step 2: Calculating expected HMAC...');
      try {
        const message = `${ipnData.item_price}|${ipnData.ref_command}|${this.configService.get('PAYTECH_API_KEY')}`;
        const expectedHmac = require('crypto')
          .createHmac('sha256', this.configService.get('PAYTECH_API_SECRET'))
          .update(message)
          .digest('hex');

        results.hmac_calculation = {
          message: message,
          expected_hmac: expectedHmac,
          received_hmac: ipnData.hmac_compute,
          matches: expectedHmac === ipnData.hmac_compute
        };

        if (expectedHmac === ipnData.hmac_compute) {
          results.hmac_calculation.status = '✅ HMAC matches perfectly';
        } else {
          results.hmac_calculation.status = '❌ HMAC mismatch - check calculation';
          results.recommendations.push('Use the provided expected_hmac value');
        }
      } catch (error) {
        results.hmac_calculation = {
          error: error.message,
          status: '❌ HMAC calculation failed'
        };
      }

      // Step 3: Test payment success detection
      this.logger.log('📋 Step 3: Testing payment success detection...');
      try {
        const isSuccess = this.paytechService.isPaymentSuccessful(ipnData);
        results.verification_results.payment_success = isSuccess;

        if (isSuccess) {
          results.verification_results.payment_status = '✅ Payment successful';
          results.verification_results.order_status_change = 'PENDING → CONFIRMED';
          results.verification_results.payment_status_change = 'null → PAID';
        } else {
          results.verification_results.payment_status = '❌ Payment failed';
          results.verification_results.order_status_change = 'PENDING → PENDING (no change)';
          results.verification_results.payment_status_change = 'null → FAILED';
        }
      } catch (error) {
        results.verification_results.payment_status = `❌ Error: ${error.message}`;
      }

      // Step 4: Analyze failure reasons (if payment failed)
      if (!results.verification_results.payment_success) {
        this.logger.log('📋 Step 4: Analyzing failure reasons...');
        try {
          const failureDetails = this.paytechService.getPaymentFailureReason(ipnData);
          results.failure_analysis = {
            category: failureDetails.category,
            reason: failureDetails.reason,
            code: failureDetails.code,
            message: failureDetails.message,
            user_message: this.paytechService.getFailureUserMessage(failureDetails),
            support_message: this.paytechService.getFailureSupportMessage(failureDetails)
          };

          results.verification_results.failure_handled = '✅ Failure reason properly categorized';
        } catch (error) {
          results.failure_analysis = {
            error: error.message,
            status: '❌ Failure analysis failed'
          };
          results.recommendations.push('Fix failure reason analysis logic');
        }
      }

      // Step 5: Test order lookup (without modifying)
      if (ipnData.ref_command) {
        this.logger.log('📋 Step 5: Testing order lookup...');
        try {
          const order = await this.prisma.order.findFirst({
            where: { orderNumber: ipnData.ref_command },
            select: { id: true, status: true, paymentStatus: true, orderNumber: true }
          });

          if (order) {
            results.verification_results.order_lookup = {
              found: true,
              order_id: order.id,
              current_status: order.status,
              current_payment_status: order.paymentStatus,
              can_update: true
            };
            results.verification_results.order_lookup_status = '✅ Order found and can be updated';
          } else {
            results.verification_results.order_lookup = {
              found: false,
              order_number: ipnData.ref_command,
              can_update: false
            };
            results.verification_results.order_lookup_status = '❌ Order not found';
            results.recommendations.push('Create order first or check order number');
          }
        } catch (error) {
          results.verification_results.order_lookup = {
            error: error.message,
            status: '❌ Order lookup failed'
          };
        }
      }

      // Step 6: Generate recommendations
      if (results.recommendations.length === 0) {
        results.recommendations.push('✅ Webhook processing looks good!');
        results.recommendations.push('Ready to send to production IPN endpoint');
      }

      // Step 7: Show production usage example
      results.production_example = {
        correct_endpoint: '/paytech/ipn-callback',
        test_endpoint_used: '/paytech/webhook-verify',
        note: 'Use the correct endpoint for production webhook processing'
      };

      this.logger.log(`🔍 Webhook verification completed for: ${ipnData.ref_command}`);

      return {
        success: true,
        message: 'Webhook verification completed',
        data: results
      };

    } catch (error) {
      this.logger.error(`Webhook verification failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Webhook verification failed',
        error: {
          message: error.message,
          stack: error.stack
        }
      };
    }
  }
}
