import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum StockMovementTypeDto {
  IN = 'IN',
  OUT = 'OUT',
}

export class CreateStockMovementDto {
  @ApiProperty({
    description: 'ID de la variation de couleur',
    example: 15,
  })
  @IsInt()
  @IsNotEmpty()
  colorId: number;

  @ApiProperty({
    description: 'Nom de la taille',
    example: 'M',
  })
  @IsString()
  @IsNotEmpty()
  sizeName: string;

  @ApiProperty({
    description: 'Type de mouvement',
    enum: StockMovementTypeDto,
    example: 'IN',
  })
  @IsEnum(StockMovementTypeDto)
  @IsNotEmpty()
  type: StockMovementTypeDto;

  @ApiProperty({
    description: 'Quantité du mouvement (doit être positive)',
    example: 50,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    description: 'Raison du mouvement',
    example: 'Réception fournisseur XYZ',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
