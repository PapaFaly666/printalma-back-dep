import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'pf.d@gmail.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email est requis' })
  email: string;

  @ApiProperty({ example: 'printalmatest123' })
  @IsString()
  @IsNotEmpty({ message: 'Mot de passe est requis' })
  password: string;
}
