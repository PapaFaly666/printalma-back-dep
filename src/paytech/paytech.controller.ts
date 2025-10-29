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
    private readonly orderService: OrderService
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

      // Update order payment status in database
      if (ipnData.ref_command) {
        try {
          await this.orderService.updateOrderPaymentStatus(
            ipnData.ref_command,
            isSuccess ? 'PAID' : 'FAILED',
            ipnData.transaction_id
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

      return {
        success: true,
        message: 'IPN processed successfully',
        data: {
          ref_command: ipnData.ref_command,
          payment_status: isSuccess ? 'success' : 'failed',
          verified: true,
        }
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
}
