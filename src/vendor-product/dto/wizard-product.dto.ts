import { ApiProperty } from '@nestjs/swagger';

export class WizardColorDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Noir' })
  name: string;

  @ApiProperty({ example: '#000000' })
  colorCode: string;
}

export class WizardSizeDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'M' })
  sizeName: string;
}

export class WizardProductImagesDto {
  @ApiProperty({
    description: 'Image principale en base64',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
  })
  baseImage: string;

  @ApiProperty({
    description: 'Images de détail en base64',
    type: [String],
    required: false
  })
  detailImages?: string[];
}

export class CreateWizardProductDto {
  @ApiProperty({ example: 34, description: 'ID du produit de base (mockup)' })
  baseProductId: number;

  @ApiProperty({ example: 'Sweat Custom Noir', description: 'Nom du produit vendeur' })
  vendorName: string;

  @ApiProperty({ example: 'Sweat à capuche personnalisé de qualité', description: 'Description du produit' })
  vendorDescription: string;

  @ApiProperty({ example: 10000, description: 'Prix de vente en FCFA' })
  vendorPrice: number;

  @ApiProperty({ example: 10, description: 'Stock initial', required: false })
  vendorStock?: number;

  @ApiProperty({
    description: 'Couleurs sélectionnées',
    type: [WizardColorDto]
  })
  selectedColors: WizardColorDto[];

  @ApiProperty({
    description: 'Tailles sélectionnées',
    type: [WizardSizeDto]
  })
  selectedSizes: WizardSizeDto[];

  @ApiProperty({
    description: 'Images du produit',
    type: WizardProductImagesDto
  })
  productImages: WizardProductImagesDto;

  @ApiProperty({
    example: 'DRAFT',
    description: 'Statut forcé du produit',
    enum: ['DRAFT', 'PUBLISHED'],
    required: false
  })
  forcedStatus?: string;
}

export class WizardProductResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: any;
}