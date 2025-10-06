import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { StockMovementTypeDto } from './create-stock-movement.dto';

export class StockHistoryQueryDto {
  @ApiProperty({
    description: 'Filtrer par ID de couleur',
    required: false,
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  colorId?: number;

  @ApiProperty({
    description: 'Filtrer par nom de taille',
    required: false,
    example: 'M',
  })
  @IsOptional()
  @IsString()
  sizeName?: string;

  @ApiProperty({
    description: 'Filtrer par type de mouvement',
    enum: StockMovementTypeDto,
    required: false,
    example: 'IN',
  })
  @IsOptional()
  @IsEnum(StockMovementTypeDto)
  type?: StockMovementTypeDto;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    required: false,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({
    description: 'Décalage pour la pagination',
    required: false,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
