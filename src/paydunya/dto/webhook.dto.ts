import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

/**
 * DTO for PayDunya webhook requests
 * Used for Swagger documentation to show expected webhook payload structure
 */
export class PaydunyaWebhookDto {
  @ApiProperty({
    description: 'PayDunya invoice token',
    example: 'test_token_123456',
    required: true
  })
  @IsString()
  invoice_token: string;

  @ApiProperty({
    description: 'Payment status',
    enum: ['completed', 'failed', 'cancelled', 'pending'],
    example: 'completed',
    required: true
  })
  @IsString()
  status: string;

  @ApiPropertyOptional({
    description: 'PayDunya response code',
    example: '00',
    enum: ['00', '01', '99', '901']
  })
  @IsString()
  @IsOptional()
  response_code?: string;

  @ApiPropertyOptional({
    description: 'Total payment amount',
    example: 15000
  })
  @IsNumber()
  @IsOptional()
  total_amount?: number;

  @ApiPropertyOptional({
    description: 'Custom data to identify the order',
    example: '{"order_number":"ORD-123456","order_id":123}',
    type: 'object'
  })
  @IsObject()
  @IsOptional()
  custom_data?: any;

  @ApiPropertyOptional({
    description: 'Payment method used',
    example: 'paydunya',
    default: 'paydunya'
  })
  @IsString()
  @IsOptional()
  payment_method?: string;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'Client Test'
  })
  @IsString()
  @IsOptional()
  customer_name?: string;

  @ApiPropertyOptional({
    description: 'Customer email',
    example: 'client@example.com'
  })
  @IsString()
  @IsOptional()
  customer_email?: string;

  @ApiPropertyOptional({
    description: 'Customer phone number',
    example: '775588834'
  })
  @IsString()
  @IsOptional()
  customer_phone?: string;

  @ApiPropertyOptional({
    description: 'Payment cancellation reason',
    example: 'User cancelled payment'
  })
  @IsString()
  @IsOptional()
  cancel_reason?: string;

  @ApiPropertyOptional({
    description: 'Error code for failed payments',
    example: 'insufficient_funds'
  })
  @IsString()
  @IsOptional()
  error_code?: string;

  // Alternative field names that PayDunya might use
  @ApiPropertyOptional({
    description: 'Alternative field for invoice token',
    example: 'test_token_123456'
  })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiPropertyOptional({
    description: 'Alternative field for payment status',
    example: 'completed'
  })
  @IsString()
  @IsOptional()
  payment_status?: string;

  @ApiPropertyOptional({
    description: 'Alternative field for total amount',
    example: 15000
  })
  @IsNumber()
  @IsOptional()
  amount?: number;
}

/**
 * Example webhook payload for successful payment
 */
export class PaydunyaWebhookSuccessExample {
  @ApiProperty({
    description: 'Example of successful payment webhook',
    example: {
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
  })
  example: any;
}

/**
 * Example webhook payload for failed payment
 */
export class PaydunyaWebhookFailureExample {
  @ApiProperty({
    description: 'Example of failed payment webhook',
    example: {
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
  })
  example: any;
}