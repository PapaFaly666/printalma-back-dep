import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * PayDunya API Response DTOs
 * Based on PayDunya API documentation
 */

export class PayDunyaPaymentResponseDto {
  @ApiProperty({ description: 'Response code (00 = success)', example: '00' })
  response_code: string;

  @ApiProperty({ description: 'Response text - Contains checkout URL when response_code is 00', example: 'https://app.paydunya.com/sandbox-checkout/invoice/abc123' })
  response_text: string;

  @ApiPropertyOptional({ description: 'Invoice token for tracking', example: 'abc123def456' })
  token?: string;

  @ApiPropertyOptional({ description: 'Payment redirect URL (alternative field)' })
  response_url?: string;

  @ApiPropertyOptional({ description: 'Custom data attached to the invoice' })
  custom_data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Invoice description' })
  description?: string;
}

export class PayDunyaPaymentStatusDto {
  @ApiProperty({ description: 'Response code (00 = success)', example: '00' })
  response_code: string;

  @ApiProperty({ description: 'Response message', example: 'Successful' })
  response_text: string;

  @ApiPropertyOptional({ description: 'Payment status (completed, pending, cancelled, failed)' })
  status?: string;

  @ApiPropertyOptional({ description: 'Invoice token', example: 'abc123def456' })
  invoice_token?: string;

  @ApiPropertyOptional({ description: 'Transaction amount' })
  total_amount?: number;

  @ApiPropertyOptional({ description: 'Customer information' })
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };

  @ApiPropertyOptional({ description: 'Custom data attached to the invoice' })
  custom_data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Invoice description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Payment receipt URL' })
  receipt_url?: string;
}

export class PayDunyaCallbackDto {
  @ApiProperty({ description: 'Invoice token', example: 'abc123def456' })
  invoice_token: string;

  @ApiProperty({ description: 'Transaction status (completed, cancelled, failed)', example: 'completed' })
  status: string;

  @ApiPropertyOptional({ description: 'Custom data attached to the invoice' })
  custom_data?: string;

  @ApiPropertyOptional({ description: 'Invoice description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Total amount' })
  total_amount?: number;

  @ApiPropertyOptional({ description: 'Customer name' })
  customer_name?: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  customer_email?: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  customer_phone?: string;

  @ApiPropertyOptional({ description: 'Payment method used' })
  payment_method?: string;

  @ApiPropertyOptional({ description: 'Failure reason if payment failed' })
  cancel_reason?: string;

  @ApiPropertyOptional({ description: 'Error code if payment failed' })
  error_code?: string;
}
