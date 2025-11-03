import { IsString, IsOptional, IsBoolean, IsInt, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateDesignerDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(255, { message: 'Le nom ne peut pas dépasser 255 caractères' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Le nom d\'affichage ne peut pas dépasser 255 caractères' })
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'La bio ne peut pas dépasser 1000 caractères' })
  bio?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  featuredOrder?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  removeAvatar?: boolean;
}
