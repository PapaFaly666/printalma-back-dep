import { IsNotEmpty, IsString, IsArray, ValidateNested, IsOptional, IsNumber, Min, Max, IsObject, IsNotEmptyObject, IsEnum, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ShippingDetailsDto } from './shipping-details.dto';

// 🚚 DTO pour les informations de livraison (défini en premier pour éviter les références circulaires)
export class DeliveryInfoDto {
  @ApiProperty({
    description: 'Type de livraison',
    enum: ['city', 'region', 'international'],
    example: 'city'
  })
  @IsNotEmpty()
  @IsString()
  deliveryType: 'city' | 'region' | 'international';

  // Localisation
  @ApiProperty({ description: 'ID de la ville (si deliveryType = city)', required: false })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiProperty({ description: 'Nom de la ville', required: false })
  @IsOptional()
  @IsString()
  cityName?: string;

  @ApiProperty({ description: 'ID de la région (si deliveryType = region)', required: false })
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiProperty({ description: 'Nom de la région', required: false })
  @IsOptional()
  @IsString()
  regionName?: string;

  @ApiProperty({ description: 'ID de la zone internationale (si deliveryType = international)', required: false })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiProperty({ description: 'Nom de la zone internationale', required: false })
  @IsOptional()
  @IsString()
  zoneName?: string;

  @ApiProperty({ description: 'Code pays (ex: SN, FR, US)', required: false })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ description: 'Nom du pays', required: false })
  @IsOptional()
  @IsString()
  countryName?: string;

  // Transporteur sélectionné
  @ApiProperty({
    description: 'ID du transporteur choisi (OBLIGATOIRE sauf pour le Sénégal)',
    required: false
  })
  @IsOptional()
  @IsString()
  transporteurId?: string;

  @ApiProperty({ description: 'Nom du transporteur', required: false })
  @IsOptional()
  @IsString()
  transporteurName?: string;

  @ApiProperty({ description: 'URL du logo du transporteur', required: false })
  @IsOptional()
  @IsString()
  transporteurLogo?: string;

  // Tarification
  @ApiProperty({
    description: 'ID du tarif appliqué (OBLIGATOIRE sauf pour le Sénégal)',
    required: false
  })
  @IsOptional()
  @IsString()
  zoneTarifId?: string;

  @ApiProperty({
    description: 'Montant des frais de livraison en XOF (OBLIGATOIRE sauf pour le Sénégal)',
    required: false
  })
  @IsOptional()
  @IsNumber()
  deliveryFee?: number;

  @ApiProperty({ description: 'Délai de livraison (ex: 24-48h)', required: false })
  @IsOptional()
  @IsString()
  deliveryTime?: string;

  // Métadonnées complètes (optionnel)
  @ApiProperty({ description: 'Métadonnées complètes de livraison', required: false })
  @IsOptional()
  @IsObject()
  metadata?: {
    availableCarriers?: any[];
    selectedAt?: string;
    calculationDetails?: any;
  };
}

export class CreateOrderItemDto {
  @ApiProperty({
    example: 1,
    description: 'ID du produit admin (optionnel si stickerId fourni)',
    required: false
  })
  @IsOptional()
  @IsNumber()
  productId?: number;

  @ApiProperty({
    example: 75,
    description: 'ID du sticker (optionnel si productId fourni)',
    required: false
  })
  @IsOptional()
  @IsNumber()
  stickerId?: number;

  @ApiProperty({
    example: 2,
    description: 'ID du produit vendeur (optionnel)',
    required: false
  })
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
    description: 'Zone de placement principale (première vue)',
    required: false,
    example: {
      x: 150.5,
      y: 200.3,
      width: 400.0,
      height: 500.0,
      coordinateType: 'PIXEL',
      referenceWidth: 1200,
      referenceHeight: 1500
    }
  })
  @IsOptional()
  @IsObject()
  delimitation?: any;

  @ApiProperty({
    description: 'Array de toutes les délimitations par vue pour le système multi-vues',
    required: false,
    example: [
      {
        viewId: 45,
        viewKey: '12-45',
        viewType: 'FRONT',
        imageUrl: 'https://example.com/front.png',
        x: 150.5,
        y: 200.3,
        width: 400.0,
        height: 500.0,
        coordinateType: 'PIXEL',
        referenceWidth: 1200,
        referenceHeight: 1500
      }
    ]
  })
  @IsOptional()
  @IsArray()
  delimitations?: Array<{
    viewId: number;
    viewKey: string;
    viewType?: string;
    imageUrl?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    coordinateType: string;
    referenceWidth: number;
    referenceHeight: number;
  }>;

  @ApiProperty({
    description: 'Objet complet de la variation de couleur avec toutes ses images et délimitations',
    required: false,
    example: {
      id: 12,
      name: 'Noir',
      colorCode: '#000000',
      images: [
        {
          id: 45,
          url: 'https://example.com/front.png',
          viewType: 'FRONT',
          delimitations: [
            {
              x: 150.5,
              y: 200.3,
              width: 400.0,
              height: 500.0,
              coordinateType: 'PIXEL',
              referenceWidth: 1200,
              referenceHeight: 1500
            }
          ]
        }
      ]
    }
  })
  @IsOptional()
  @IsObject()
  colorVariationData?: any;
}

export enum PaymentMethod {
  PAYDUNYA = 'PAYDUNYA',
  PAYTECH = 'PAYTECH',
  ORANGE_MONEY = 'ORANGE_MONEY',
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

  // 🚚 NOUVEAU: Informations de livraison
  @ApiProperty({
    description: 'Informations de livraison et transporteur',
    required: false,
    example: {
      deliveryType: 'city',
      cityId: '1',
      cityName: 'Dakar',
      countryCode: 'SN',
      countryName: 'Sénégal',
      transporteurId: '5',
      transporteurName: 'DHL Express',
      transporteurLogo: 'https://api.printalma.com/uploads/logos/dhl.png',
      zoneTarifId: '23',
      deliveryFee: 3000,
      deliveryTime: '24-48h'
    }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryInfoDto)
  deliveryInfo?: DeliveryInfoDto;
} 