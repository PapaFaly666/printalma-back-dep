import { ApiProperty } from '@nestjs/swagger';

enum ViewType {
  FRONT = 'FRONT',
  BACK = 'BACK',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  DETAIL = 'DETAIL',
  OTHER = 'OTHER'
}

export class ProductViewResponseDto {
  @ApiProperty({
    description: 'ID unique de la vue',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: 'Type de vue',
    enum: ViewType,
    example: ViewType.FRONT
  })
  viewType: ViewType;

  @ApiProperty({
    description: 'URL de l\'image de la vue',
    example: 'https://res.cloudinary.com/example/image/upload/v1620123456/products/views/front.jpg'
  })
  imageUrl: string;

  @ApiProperty({
    description: 'Description de la vue',
    example: 'Vue de face du T-shirt',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'ID du produit associé',
    example: 1
  })
  productId: number;

  @ApiProperty({
    description: 'Date de création',
    example: '2023-05-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2023-05-01T12:00:00Z'
  })
  updatedAt: Date;
}