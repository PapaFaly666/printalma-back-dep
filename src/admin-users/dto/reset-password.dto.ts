import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Nouveau mot de passe (minimum 8 caractères)',
    example: 'NewSecurePass123!',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;
}
