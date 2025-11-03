import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsObject, IsArray, IsEmail, Min, IsUrl } from 'class-validator';

/**
 * DTO for creating a PayDunya checkout invoice
 * Based on PayDunya API documentation: https://developers.paydunya.com/doc/FR/introduction
 */

export class CustomerDto {
  @ApiProperty({ description: 'Customer name', example: 'Amadou Diallo' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Customer email', example: 'customer@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Customer phone number', example: '+221701234567' })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class StoreDto {
  @ApiProperty({ description: 'Store name', example: 'Printalma Store' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Store tagline', example: 'Impression de qualité' })
  @IsString()
  @IsOptional()
  tagline?: string;

  @ApiPropertyOptional({ description: 'Postal address', example: 'Dakar, Sénégal' })
  @IsString()
  @IsOptional()
  postal_address?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+221338234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsUrl()
  @IsOptional()
  logo_url?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsUrl()
  @IsOptional()
  website_url?: string;
}

export class ActionsDto {
  @ApiPropertyOptional({ description: 'URL to redirect on payment cancellation' })
  @IsUrl()
  @IsOptional()
  cancel_url?: string;

  @ApiPropertyOptional({ description: 'URL to redirect after successful payment' })
  @IsUrl()
  @IsOptional()
  return_url?: string;

  @ApiPropertyOptional({ description: 'Webhook callback URL for IPN notifications' })
  @IsUrl()
  @IsOptional()
  callback_url?: string;
}

export class InvoiceDto {
  @ApiPropertyOptional({ description: 'Invoice items', example: {} })
  @IsObject()
  @IsOptional()
  items?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Invoice taxes', example: {} })
  @IsObject()
  @IsOptional()
  taxes?: Record<string, any>;

  @ApiProperty({ description: 'Customer information' })
  @IsObject()
  customer: CustomerDto;

  @ApiPropertyOptional({
    description: 'Payment channels (e.g., orange-money-senegal, wave-senegal, mtn-benin)',
    example: ['orange-money-senegal', 'wave-senegal']
  })
  @IsArray()
  @IsOptional()
  channels?: string[];

  @ApiProperty({ description: 'Total amount in the smallest currency unit (e.g., 5000 for 5000 XOF)', example: 5000 })
  @IsNumber()
  @Min(1)
  total_amount: number;

  @ApiProperty({ description: 'Invoice description', example: 'Order #ORD-123456' })
  @IsString()
  description: string;
}

export class PayDunyaPaymentRequestDto {
  @ApiProperty({ description: 'Invoice information' })
  @IsObject()
  invoice: InvoiceDto;

  @ApiProperty({ description: 'Store information' })
  @IsObject()
  store: StoreDto;

  @ApiPropertyOptional({ description: 'Custom data to attach to the invoice', example: { order_id: '123' } })
  @IsObject()
  @IsOptional()
  custom_data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Actions configuration' })
  @IsObject()
  @IsOptional()
  actions?: ActionsDto;
}
