import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for requesting a PayDunya refund
 * Note: PayDunya refund API may vary, check official documentation for exact structure
 */
export class PayDunyaRefundRequestDto {
  @ApiProperty({
    description: 'Invoice token to refund',
    example: 'abc123def456'
  })
  @IsString()
  @IsNotEmpty()
  invoice_token: string;

  @ApiProperty({
    description: 'Reason for refund',
    example: 'Customer requested cancellation'
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class PayDunyaRefundResponseDto {
  @ApiProperty({ description: 'Response code (00 = success)', example: '00' })
  response_code: string;

  @ApiProperty({ description: 'Response message', example: 'Refund successful' })
  response_text: string;

  @ApiProperty({ description: 'Refund status', example: 'completed' })
  status?: string;

  @ApiProperty({ description: 'Transaction details' })
  data?: Record<string, any>;
}
