import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVendorTypeDto {
  @ApiProperty({
    description: 'Nom du type de vendeur',
    example: 'Photographe',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  label: string;

  @ApiProperty({
    description: 'Description du type de vendeur',
    example: 'Spécialiste de la photographie professionnelle',
    minLength: 5,
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  description: string;
}
