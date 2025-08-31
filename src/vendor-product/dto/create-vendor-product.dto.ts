import { IsNumber, IsArray, ArrayNotEmpty, IsUrl, IsOptional, Min } from 'class-validator';

export class CreateVendorProductDto {
  @IsNumber()
  baseProductId: number;

  @IsUrl()
  designUrl: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsArray()
  @ArrayNotEmpty()
  sizes: number[];

  @IsArray()
  @ArrayNotEmpty()
  colors: number[];

  @IsOptional()
  @IsUrl()
  mockupUrl?: string;
} 