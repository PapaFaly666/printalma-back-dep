import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RechargeStockDto {
  @ApiProperty({
    description: 'Quantité à ajouter au stock existant',
    example: 20,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  amount: number;
}
