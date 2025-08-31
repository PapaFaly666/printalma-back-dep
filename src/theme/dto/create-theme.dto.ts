import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ThemeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export class CreateThemeDto {
  @ApiProperty({ 
    description: 'Nom du thème',
    example: 'Manga Collection'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Description du thème',
    example: 'Thème dédié aux mangas et animes populaires'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    description: 'Catégorie du thème',
    example: 'anime'
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ 
    description: 'Statut du thème',
    enum: ThemeStatus,
    example: ThemeStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(ThemeStatus)
  status?: ThemeStatus = ThemeStatus.ACTIVE;

  @ApiProperty({ 
    description: 'Si le thème est mis en avant',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  featured?: boolean = false;
} 