import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { StockItemDto } from './stock-item.dto';

export class UpdateStocksDto {
  @ApiProperty({
    description: 'Liste des stocks à mettre à jour',
    type: [StockItemDto],
    example: [
      { colorId: 1, sizeName: 'M', stock: 25 },
      { colorId: 1, sizeName: 'L', stock: 30 },
      { colorId: 2, sizeName: 'M', stock: 15 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  stocks: StockItemDto[];
}
