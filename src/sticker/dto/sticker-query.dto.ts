import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum StickerSortBy {
  CREATED_AT = 'created_at',
  PRICE = 'price',
  SALE_COUNT = 'sale_count',
  VIEW_COUNT = 'view_count',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class StickerQueryDto {
  @ApiProperty({ required: false, enum: ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED'])
  status?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ required: false, enum: StickerSortBy, default: StickerSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(StickerSortBy)
  sortBy?: StickerSortBy = StickerSortBy.CREATED_AT;

  @ApiProperty({ required: false, enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

export class PublicStickerQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vendorId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  finish?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
