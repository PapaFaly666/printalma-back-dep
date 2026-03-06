import { IsNumber, IsOptional, IsString, IsEnum, Min, Max, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour l'exécution d'un Cash In Orange Money
 * Conforme à l'API Orange Money v1 (POST /api/eWallet/v1/cashins)
 *
 * Le Cash In permet de créditer le wallet d'un client
 * Cas d'usage : paiement de vendeurs, remboursements, cashback, etc.
 */
export class ExecuteCashInDto {
  @ApiProperty({
    description: 'Montant à envoyer au client (en FCFA)',
    example: 50000,
    minimum: 100,
    maximum: 10000000,
    type: 'number',
  })
  @IsNumber()
  @Min(100, { message: 'Le montant minimum est de 100 FCFA' })
  @Max(10000000, { message: 'Le montant maximum est de 10 000 000 FCFA' })
  amount: number;

  @ApiProperty({
    description: 'Numéro de téléphone du bénéficiaire (format international sans +)',
    example: '221771234567',
    type: 'string',
  })
  @IsString()
  @Length(12, 12, { message: 'Le numéro doit contenir 12 chiffres (ex: 221771234567)' })
  @Matches(/^221[0-9]{9}$/, { message: 'Le numéro doit commencer par 221 et contenir 12 chiffres' })
  customerPhone: string;

  @ApiProperty({
    description: 'Nom du bénéficiaire',
    example: 'Mamadou Diallo',
    type: 'string',
  })
  @IsString()
  customerName: string;

  @ApiProperty({
    description: 'Référence externe unique (ex: ID de VendorFundsRequest)',
    example: 'FUNDS-REQ-12345',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({
    description: 'Description du paiement',
    example: 'Paiement appel de fonds vendeur',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'ID de la demande de fonds (VendorFundsRequest)',
    example: 123,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  fundsRequestId?: number;

  @ApiProperty({
    description: 'Recevoir une notification SMS',
    example: false,
    required: false,
    type: 'boolean',
    default: false,
  })
  @IsOptional()
  receiveNotification?: boolean;
}

/**
 * DTO pour la réponse d'un Cash In
 */
export class CashInResponseDto {
  @ApiProperty({
    description: 'ID de la transaction Orange Money',
    example: 'CI1234.5678.91023',
  })
  transactionId: string;

  @ApiProperty({
    description: 'Statut de la transaction',
    example: 'SUCCESS',
    enum: ['SUCCESS', 'PENDING', 'FAILED', 'REJECTED'],
  })
  status: string;

  @ApiProperty({
    description: 'Description du statut',
    example: 'Transaction réussie',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Référence externe',
    example: 'FUNDS-REQ-12345',
    required: false,
  })
  reference?: string;

  @ApiProperty({
    description: 'ID de la requête',
    example: '1234.5678.91023',
    required: false,
  })
  requestId?: string;
}
