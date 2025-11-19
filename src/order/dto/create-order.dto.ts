import { IsNotEmpty, IsString, IsArray, ValidateNested, IsOptional, IsNumber, Min, Max, IsObject, IsNotEmptyObject, IsEnum, IsBoolean, IsInt } from 'class-validator';
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

  @ApiProperty({
    description: 'Quantité du produit commandé',
    minimum: 1,
    maximum: 100,
    example: 1
  })
  @IsNotEmpty()
  @IsInt({ message: 'La quantité doit être un nombre entier' })
  @Min(1, { message: 'La quantité minimum est 1' })
  @Max(100, { message: 'La quantité maximum est 100' })
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

  // 🎨 Informations de design et mockup
  @ApiProperty({
    description: 'URL du mockup avec le design appliqué',
    required: false
  })
  @IsOptional()
  @IsString()
  mockupUrl?: string;

  @ApiProperty({
    description: 'ID du design utilisé',
    required: false
  })
  @IsOptional()
  @IsNumber()
  designId?: number;

  @ApiProperty({
    description: 'Coordonnées de placement du design (JSON)',
    required: false,
    example: { x: 0.5, y: 0.5, scale: 0.6, rotation: 0 }
  })
  @IsOptional()
  @IsObject()
  designPositions?: any;

  @ApiProperty({
    description: 'Métadonnées complètes du design pour l\'historique (JSON)',
    required: false
  })
  @IsOptional()
  @IsObject()
  designMetadata?: any;

  // 🎨 ID de la personnalisation sauvegardée
  @ApiProperty({
    description: 'ID de la personnalisation sauvegardée (product_customizations)',
    required: false
  })
  @IsOptional()
  @IsNumber()
  customizationId?: number;

  // 🎨 NOUVEAU SYSTÈME MULTI-VUES
  @ApiProperty({
    description: 'IDs des personnalisations par vue - format: {"colorId-viewId": customizationId}',
    required: false,
    example: { "1-5": 456, "1-6": 457 }
  })
  @IsOptional()
  @IsObject()
  customizationIds?: Record<string, number>;

  @ApiProperty({
    description: 'Éléments de design par vue - format: {"colorId-viewId": [elements]}',
    required: false,
    example: {
      "1-5": [
        {
          id: "text-123",
          type: "text",
          text: "MON TEXTE",
          x: 0.5,
          y: 0.3,
          width: 200,
          height: 50,
          fontSize: 24,
          fontFamily: "Arial",
          color: "#000000",
          zIndex: 1
        }
      ]
    }
  })
  @IsOptional()
  @IsObject()
  designElementsByView?: Record<string, any[]>;

  @ApiProperty({
    description: 'Métadonnées des vues avec imageUrl pour chaque vue',
    required: false,
    example: [
      {
        viewKey: "1-5",
        colorId: 1,
        viewId: 5,
        viewType: "FRONT",
        imageUrl: "https://example.com/front.png",
        hasElements: true,
        elementsCount: 2
      },
      {
        viewKey: "1-6",
        colorId: 1,
        viewId: 6,
        viewType: "BACK",
        imageUrl: "https://example.com/back.png",
        hasElements: true,
        elementsCount: 1
      }
    ]
  })
  @IsOptional()
  @IsArray()
  viewsMetadata?: Array<{
    viewKey: string;
    colorId: number;
    viewId: number;
    viewType: string;
    imageUrl: string;
    hasElements: boolean;
    elementsCount: number;
  }>;

  @ApiProperty({
    description: 'Zone de placement du design (délimitation)',
    required: false
  })
  @IsOptional()
  @IsObject()
  delimitation?: any;
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