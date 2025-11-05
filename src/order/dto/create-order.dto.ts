import { IsNotEmpty, IsString, IsArray, ValidateNested, IsOptional, IsNumber, Min, IsObject, IsNotEmptyObject, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ShippingDetailsDto } from './shipping-details.dto';

export class CreateOrderItemDto {
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsOptional()
  @IsNumber()
  vendorProductId?: number; // 🆕 ID du produit vendeur

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number; // 🆕 Prix unitaire

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  colorId?: number;
}

export enum PaymentMethod {
  PAYDUNYA = 'PAYDUNYA',
  PAYTECH = 'PAYTECH',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  OTHER = 'OTHER'
}

export class CreateOrderDto {
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ShippingDetailsDto)
  shippingDetails: ShippingDetailsDto;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'Email du client (optionnel pour les invités)',
    required: false
  })
  @IsOptional()
  @IsString()
  email?: string; // 🆕 Email du client

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];

  @ApiProperty({
    description: 'Payment method for the order',
    enum: PaymentMethod,
    default: PaymentMethod.CASH_ON_DELIVERY
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Whether to initiate payment immediately (PayDunya or PayTech)',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  initiatePayment?: boolean;

  @ApiProperty({
    description: 'Total amount of the order',
    required: false
  })
  @IsOptional()
  @IsNumber()
  totalAmount?: number; // 🆕 Montant total (calculé ou fourni)
} 