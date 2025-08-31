import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUrl, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class SaveDesignTransformsDto {
  @ApiProperty({ example: 123 })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 'https://res.cloudinary.com/app/design.png', required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  designUrl?: string;

  @ApiProperty({ example: { 0: { x: 25, y: 30, scale: 0.8 } } })
  @IsObject()
  transforms: Record<string | number, { x: number; y: number; scale: number }>;

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