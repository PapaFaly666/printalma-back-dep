import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateColorDto {
  @ApiProperty({
    description: 'Nom de la couleur',
    example: 'Rouge'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Code hexadécimal de la couleur',
    example: '#FF0000',
    required: false
  })
  @IsString()
  @IsOptional()
  hexCode?: string;
}