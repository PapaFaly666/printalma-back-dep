import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Prix suggéré (optionnel)' })
  @IsOptional()
  @IsNumber()
  suggestedPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional({ enum: ['PUBLISHED', 'DRAFT'] })
  @IsOptional()
  @IsEnum(['PUBLISHED', 'DRAFT'])
  status?: 'PUBLISHED' | 'DRAFT';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  categories?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  sizes?: string[];

  @ApiPropertyOptional({ type: 'object', isArray: true })
  @IsOptional()
  @IsArray()
  colorVariations?: any[];

  @ApiPropertyOptional({ type: 'object', isArray: true })
  @IsOptional()
  @IsArray()
  images?: any[];

  @ApiPropertyOptional({ type: 'object', isArray: true })
  @IsOptional()
  @IsArray()
  delimitations?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDelete?: boolean;
} 
 