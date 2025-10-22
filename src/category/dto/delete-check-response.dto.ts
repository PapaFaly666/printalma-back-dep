import { ApiProperty } from '@nestjs/swagger';

export class DeleteCheckResponseDto {
  @ApiProperty({
    description: 'Indique si l\'élément peut être supprimé',
    example: false
  })
  canDelete: boolean;

  @ApiProperty({
    description: 'Message explicatif',
    example: 'Impossible de supprimer cette catégorie car 5 produits y sont rattachés'
  })
  message: string;

  @ApiProperty({
    description: 'Nombre de produits liés',
    example: 5
  })
  productCount: number;

  @ApiProperty({
    description: 'Nombre de sous-catégories liées (pour categories)',
    example: 3,
    required: false
  })
  subCategoryCount?: number;

  @ApiProperty({
    description: 'Nombre de variations liées (pour subcategories)',
    example: 8,
    required: false
  })
  variationCount?: number;

  @ApiProperty({
    description: 'Détails des éléments bloquants',
    example: {
      products: ['T-Shirt Premium', 'Hoodie Classique'],
      subCategories: ['T-Shirts', 'Sweats']
    },
    required: false
  })
  blockers?: {
    products?: string[];
    subCategories?: string[];
    variations?: string[];
  };
}
