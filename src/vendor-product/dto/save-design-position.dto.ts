import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsString, Min, Max } from 'class-validator';

export class SaveDesignPositionDto {
  @ApiProperty({ example: 2, description: 'ID du produit vendeur' })
  @IsNumber()
  vendorProductId: number;

  @ApiProperty({ example: 42, description: 'ID du design' })
  @IsNumber()
  designId: number;

  @ApiProperty({ 
    example: { 
      x: 0, 
      y: 0, 
      scale: 1, 
      rotation: 0,
      design_width: 200, 
      design_height: 150 
    },
    description: 'Position du design sur le produit (y compris largeur/hauteur finales)'
  })
  @IsObject()
  position: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    /** Largeur finale du design affichée en pixels */
    design_width?: number;
    /** Hauteur finale du design affichée en pixels */
    design_height?: number;
    constraints?: any;
  };

  @ApiProperty({ 
    example: 'https://res.cloudinary.com/...',
    required: false,
    description: 'URL du design (optionnel pour validation)'
  })
  @IsOptional()
  @IsString()
  designUrl?: string;

  @ApiProperty({
    example: 200.0,
    required: false,
    description: 'Largeur finale du design affichée en pixels',
  })
  @IsOptional()
  @IsNumber()
  @Min(10, { message: 'La largeur doit être au moins 10 pixels' })
  @Max(2000, { message: 'La largeur ne peut pas dépasser 2000 pixels' })
  design_width?: number;

  @ApiProperty({
    example: 150.0,
    required: false,
    description: 'Hauteur finale du design affichée en pixels',
  })
  @IsOptional()
  @IsNumber()
  @Min(10, { message: 'La hauteur doit être au moins 10 pixels' })
  @Max(2000, { message: 'La hauteur ne peut pas dépasser 2000 pixels' })
  design_height?: number;
} 