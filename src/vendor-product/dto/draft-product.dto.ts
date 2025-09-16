import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class SetProductDraftDto {
  @ApiProperty({
    description: 'Indique si le produit doit être mis en brouillon (true) ou publié directement (false)',
    example: true
  })
  @IsBoolean()
  isDraft: boolean;
}

export class DraftProductResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Produit en attente de validation du design par l\'admin' })
  message: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: false })
  isValidated: boolean;

  @ApiProperty({
    description: 'Indique si le produit peut être publié (true si design validé et en brouillon)',
    example: false
  })
  canPublish: boolean;

  @ApiProperty({
    description: 'Statut de validation du design',
    example: 'pending',
    enum: ['validated', 'pending', 'not_found']
  })
  designValidationStatus: 'validated' | 'pending' | 'not_found';
}