import { IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Nouveau mot de passe (minimum 8 caractères)',
    example: 'NewSecurePass123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    description: 'Générer automatiquement un nouveau mot de passe aléatoire',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  generateRandom?: boolean;

  @ApiProperty({
    description: 'Envoyer le nouveau mot de passe par email à l\'utilisateur',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;

  @ApiProperty({
    description: 'Forcer l\'utilisateur à changer son mot de passe à la prochaine connexion',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  forceChange?: boolean;
}
