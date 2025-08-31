import { IsNumber, IsOptional, IsObject, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PositionDto {
  @ApiProperty({ example: 50.5, description: 'Position X du design' })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 30.2, description: 'Position Y du design' })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 1.0, description: "Échelle du design", required: false })
  @IsOptional()
  @IsNumber()
  scale?: number;

  @ApiProperty({ example: 0, description: 'Rotation du design en degrés', required: false })
  @IsOptional()
  @IsNumber()
  rotation?: number;

  @ApiProperty({
    example: 200.0,
    required: false,
    description: 'Largeur finale du design affichée en pixels',
  })
  @IsOptional()
  @IsNumber()
  @Min(10, { message: 'La largeur doit être au moins 10 pixels' })
  @Max(2000, { message: 'La largeur ne peut pas dépasser 2000 pixels' })
  designWidth?: number;

  @ApiProperty({
    example: 150.0,
    required: false,
    description: 'Hauteur finale du design affichée en pixels',
  })
  @IsOptional()
  @IsNumber()
  @Min(10, { message: 'La hauteur doit être au moins 10 pixels' })
  @Max(2000, { message: 'La hauteur ne peut pas dépasser 2000 pixels' })
  designHeight?: number;
  
  @ApiProperty({ description: 'Contraintes de position', required: false })
  @IsOptional()
  @IsObject()
  constraints?: any;
}

export class UpdateDesignPositionDto {
  @ApiProperty({ type: () => PositionDto, description: 'Objet contenant la position et les transformations du design' })
  @ValidateNested()
  @Type(() => PositionDto)
  position: PositionDto;
} 
 
 
 
