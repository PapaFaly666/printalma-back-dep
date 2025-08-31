import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ThemeStatus } from './create-theme.dto';

export class UpdateThemeDto {
  @ApiProperty({ 
    description: 'Nom du thème',
    example: 'Manga Collection Updated'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ 
    description: 'Description du thème',
    example: 'Description mise à jour du thème'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({ 
    description: 'Catégorie du thème',
    example: 'anime'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @ApiProperty({ 
    description: 'Statut du thème',
    enum: ThemeStatus,
    example: ThemeStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(ThemeStatus)
  status?: ThemeStatus;

  @ApiProperty({ 
    description: 'Si le thème est mis en avant',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  featured?: boolean;
} 