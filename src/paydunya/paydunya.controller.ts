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
import { PaydunyaService } from './paydunya.service';
import { PayDunyaPaymentRequestDto } from './dto/payment-request.dto';
import { PayDunyaCallbackDto } from './dto/payment-response.dto';
import { PayDunyaRefundRequestDto } from './dto/refund-request.dto';
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
    private readonly configService: ConfigService
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
}
