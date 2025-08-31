import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { DesignCategory } from './create-design.dto';

export enum DesignStatus {
  ALL = 'all',
  DRAFT = 'draft',
  PENDING = 'pending',
  PUBLISHED = 'published',
  PENDING_VALIDATION = 'pending_validation', // En attente de validation admin
  VALIDATED = 'validated',                   // Validé par admin
  REJECTED = 'rejected'                      // Rejeté par admin
}

export class QueryDesignsDto {
  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ enum: DesignCategory, required: false })
  @IsOptional()
  @IsEnum(DesignCategory)
  category?: DesignCategory;

  @ApiProperty({ enum: DesignStatus, required: false })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase() : value)
  @IsEnum(DesignStatus)
  status?: DesignStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, default: 'createdAt', enum: ['createdAt', 'price', 'views', 'likes', 'earnings'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ required: false, default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}