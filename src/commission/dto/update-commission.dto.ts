import { IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateCommissionDto {
  @ApiProperty({
    description: 'Taux de commission entre 0 et 100%',
    minimum: 0,
    maximum: 100,
    example: 35.5,
    type: Number,
  })
  @IsNotEmpty({ message: 'Le taux de commission est requis' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 }, { 
    message: 'Le taux de commission doit être un nombre avec maximum 2 décimales' 
  })
  @Min(0, { message: 'Le taux de commission ne peut pas être négatif' })
  @Max(100, { message: 'Le taux de commission ne peut pas dépasser 100%' })
  commissionRate: number;
}