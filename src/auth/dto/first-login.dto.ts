import { IsEmail, IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FirstLoginDto {
  @ApiProperty({
    example: 'vendeur@example.com',
    description: 'Email du vendeur'
  })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Code d\'activation à 6 chiffres reçu par email'
  })
  @IsString({ message: 'Le code d\'activation doit être une chaîne' })
  @IsNotEmpty({ message: 'Le code d\'activation est requis' })
  @Matches(/^\d{6}$/, { message: 'Le code d\'activation doit contenir exactement 6 chiffres' })
  activationCode: string;

  @ApiProperty({
    example: 'MonNouveauMotDePasse123!',
    description: 'Nouveau mot de passe (minimum 8 caractères, avec majuscule, minuscule, chiffre et caractère spécial)'
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Le mot de passe doit contenir au moins : une minuscule, une majuscule, un chiffre et un caractère spécial' }
  )
  newPassword: string;

  @ApiProperty({
    example: 'MonNouveauMotDePasse123!',
    description: 'Confirmation du nouveau mot de passe'
  })
  @IsString({ message: 'La confirmation du mot de passe doit être une chaîne' })
  confirmPassword: string;
}

export class FirstLoginResponseDto {
  @ApiProperty({ description: 'Message de succès' })
  message: string;

  @ApiProperty({ description: 'Données de l\'utilisateur activé' })
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    vendeur_type: string;
    shop_name?: string;
  };

  @ApiProperty({ description: 'Token JWT pour la session' })
  access_token: string;
}