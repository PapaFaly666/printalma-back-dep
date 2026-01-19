import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUrl, IsNotEmpty, IsObject, IsOptional, IsNumber, IsEnum } from 'class-validator';

/**
 * 🎯 Format de transformation unifié (alignement frontend/backend)
 *
 * Ce format correspond exactement à celui envoyé par le frontend
 * selon la documentation BOUNDING_BOX_IMPLEMENTATION.md
 */
export class DesignTransformDto {
  @ApiProperty({ example: 50, description: 'Offset horizontal depuis le centre de la délimitation (pixels absolus)' })
  @IsNumber()
  x: number;

  @ApiProperty({ example: -30, description: 'Offset vertical depuis le centre de la délimitation (pixels absolus)' })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 0.8, description: 'Échelle du design (0.8 = 80% de la délimitation)' })
  @IsNumber()
  designScale: number;

  @ApiProperty({ example: 0, description: 'Rotation en degrés (0-360)' })
  @IsNumber()
  rotation: number;

  @ApiProperty({ example: 'PIXEL', description: 'Unité de position (toujours PIXEL)', enum: ['PIXEL'] })
  @IsEnum(['PIXEL'])
  positionUnit: 'PIXEL';

  @ApiProperty({ example: 400, description: 'Largeur de la délimitation en pixels absolus (ESSENTIEL)' })
  @IsNumber()
  delimitationWidth: number;

  @ApiProperty({ example: 400, description: 'Hauteur de la délimitation en pixels absolus (ESSENTIEL)' })
  @IsNumber()
  delimitationHeight: number;
}

/**
 * 🔄 Format de transformation avec support de l'ancien format (backward compatibility)
 *
 * Ce format supporte à la fois :
 * - Le nouveau format (designScale, delimitationWidth, delimitationHeight)
 * - L'ancien format (scale) pour rétro-compatibilité
 */
export class DesignTransformCompatibleDto {
  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  x?: number;

  @ApiProperty({ example: -30, required: false })
  @IsOptional()
  @IsNumber()
  y?: number;

  @ApiProperty({ example: 0.8, description: 'Nouvelle propriété (prioritaire)', required: false })
  @IsOptional()
  @IsNumber()
  designScale?: number;

  @ApiProperty({ example: 0.8, description: 'Ancienne propriété (rétro-compatibilité)', required: false })
  @IsOptional()
  @IsNumber()
  scale?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  rotation?: number;

  @ApiProperty({ example: 'PIXEL', required: false })
  @IsOptional()
  @IsString()
  positionUnit?: 'PIXEL' | 'PERCENTAGE';

  @ApiProperty({ example: 400, description: 'ESSENTIEL pour logique unifiée', required: false })
  @IsOptional()
  @IsNumber()
  delimitationWidth?: number;

  @ApiProperty({ example: 400, description: 'ESSENTIEL pour logique unifiée', required: false })
  @IsOptional()
  @IsNumber()
  delimitationHeight?: number;
}

export class SaveDesignTransformsDto {
  @ApiProperty({ example: 123 })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 'https://res.cloudinary.com/app/design.png', required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  designUrl?: string;

  @ApiProperty({
    example: {
      0: {
        x: 50,
        y: -30,
        designScale: 0.8,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 400,
        delimitationHeight: 400
      }
    },
    description: 'Transformations par position (format unifié frontend/backend)'
  })
  @IsObject()
  transforms: Record<string | number, DesignTransformCompatibleDto>;

  @ApiProperty({ example: 1672531200000 })
  @IsInt()
  lastModified: number;
}

export class LoadDesignTransformsQueryDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/app/design.png', required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  designUrl?: string;
} 