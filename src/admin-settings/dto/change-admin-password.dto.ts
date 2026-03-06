import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour le changement de mot de passe du superadmin
 */
export class ChangeAdminPasswordDto {
  @ApiProperty({
    description: 'Mot de passe actuel',
    example: 'currentPassword123'
  })
  @IsNotEmpty({ message: 'Le mot de passe actuel est requis' })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'Nouveau mot de passe (minimum 8 caractères)',
    example: 'newPassword123'
  })
  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis' })
  @IsString()
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation du nouveau mot de passe',
    example: 'newPassword123'
  })
  @IsNotEmpty({ message: 'La confirmation du mot de passe est requise' })
  @IsString()
  confirmPassword: string;
}

/**
 * DTO de réponse après changement de mot de passe
 */
export class ChangePasswordResponseDto {
  @ApiProperty({ description: 'Statut du succès', example: true })
  success: boolean;

  @ApiProperty({ description: 'Message de confirmation', example: 'Mot de passe modifié avec succès' })
  message: string;

  @ApiProperty({ description: 'Date du changement', example: '2024-01-15T10:30:00Z' })
  changedAt: Date;
}
