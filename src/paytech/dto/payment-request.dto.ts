import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PayTechCurrency {
  XOF = 'XOF',
  EUR = 'EUR',
  USD = 'USD',
  CAD = 'CAD',
  GBP = 'GBP',
  MAD = 'MAD'
}

export enum PayTechEnvironment {
  TEST = 'test',
  PROD = 'prod'
}

/**
 * DTO for PayTech payment request
 * Based on official PayTech documentation
 */
export class PaymentRequestDto {
  @ApiProperty({ description: 'Product or service name' })
  @IsNotEmpty()
  @IsString()
  item_name: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  item_price: number;

  @ApiProperty({ description: 'Unique command reference' })
  @IsNotEmpty()
  @IsString()
  ref_command: string;

  @ApiProperty({ description: 'Order description' })
  @IsNotEmpty()
  @IsString()
  command_name: string;

  @ApiProperty({ description: 'Currency code', enum: PayTechCurrency, default: PayTechCurrency.XOF })
  @IsOptional()
  @IsEnum(PayTechCurrency)
  currency?: PayTechCurrency;

  @ApiProperty({ description: 'Environment', enum: PayTechEnvironment, default: PayTechEnvironment.PROD })
  @IsOptional()
  @IsEnum(PayTechEnvironment)
  env?: PayTechEnvironment;

  @ApiProperty({ description: 'Specific payment method targeting', required: false })
  @IsOptional()
  @IsString()
  target_payment?: string;

  @ApiProperty({ description: 'Webhook notification endpoint (must be HTTPS)', required: false })
  @IsOptional()
  @IsString()
  ipn_url?: string;

  @ApiProperty({ description: 'Post-payment success redirect URL', required: false })
  @IsOptional()
  @IsString()
  success_url?: string;

  @ApiProperty({ description: 'Cancellation redirect URL', required: false })
  @IsOptional()
  @IsString()
  cancel_url?: string;

  @ApiProperty({ description: 'JSON-encoded additional data', required: false })
  @IsOptional()
  @IsString()
  custom_field?: string;
}
