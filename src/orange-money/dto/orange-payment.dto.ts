import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour la génération d'un paiement Orange Money
 * Conforme à l'API Orange Money v4 (POST /api/eWallet/v4/qrcode)
 */
export class CreateOrangePaymentDto {
  @ApiProperty({
    description: 'ID de la commande dans la base de données',
    example: 123,
    type: 'number',
  })
  @IsNumber()
  orderId: number;

  @ApiProperty({
    description: 'Montant total à payer en Francs CFA (XOF). Minimum: 100 FCFA',
    example: 10000,
    minimum: 100,
    type: 'number',
  })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({
    description: 'Nom complet du client',
    example: 'Mamadou Diallo',
    type: 'string',
  })
  @IsString()
  customerName: string;

  @ApiProperty({
    description: 'Numéro de téléphone du client (optionnel, format international recommandé)',
    example: '221771234567',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({
    description: 'Numéro de commande unique (référence externe)',
    example: 'ORD-2024-001234',
    type: 'string',
  })
  @IsString()
  orderNumber: string;
}
