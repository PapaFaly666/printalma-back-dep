import { ApiProperty } from '@nestjs/swagger';

export class VendorTypeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Photographe' })
  label: string;

  @ApiProperty({ example: 'Spécialiste de la photographie professionnelle' })
  description: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 5, description: 'Nombre de vendeurs utilisant ce type' })
  userCount?: number;
}
