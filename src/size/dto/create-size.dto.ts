import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

enum SizeType {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
  XXXL = 'XXXL'
}

export class CreateSizeDto {
  @ApiProperty({ 
    description: 'Nom de la taille', 
    enum: SizeType,
    example: 'L',
    enumName: 'SizeType'
  })
  @IsEnum(SizeType, { message: 'La taille doit être une des valeurs suivantes: XS, S, M, L, XL, XXL, XXXL' })
  name: SizeType;
}