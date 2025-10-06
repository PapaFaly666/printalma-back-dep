import { IsInt, IsString, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StockItemDto {
  @ApiProperty({
    description: 'ID de la variation de couleur',
    example: 1,
  })
  @IsInt()
  colorId: number;

  @ApiProperty({
    description: 'Nom de la taille ou variation',
    example: 'M',
  })
  @IsString()
  @IsNotEmpty()
  sizeName: string;

  @ApiProperty({
    description: 'Quantité en stock',
    example: 25,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  stock: number;
}
