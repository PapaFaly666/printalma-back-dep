import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsArray, IsOptional, IsEnum, ValidateNested, Min, IsNotEmpty } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class WizardColorDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty({ example: 'Noir' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '#000000' })
  @IsString()
  @IsNotEmpty()
  colorCode: string;
}

export class WizardSizeDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  sizeName: string;
}

export class WizardProductImagesDto {
  @ApiProperty({
    description: 'Image principale en base64',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
  })
  @IsString()
  @IsNotEmpty()
  baseImage: string;

  @ApiProperty({
    description: 'Images de détail en base64',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  detailImages?: string[];
}

export class CreateWizardProductDto {
  @ApiProperty({ example: 34, description: 'ID du produit de base (mockup)' })
  @IsNumber()
  @Min(1, { message: 'baseProductId doit être un nombre positif' })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        throw new Error(`baseProductId doit être un nombre valide, reçu: ${value}`);
      }
      return parsed;
    }
    if (typeof value === 'number') {
      return value;
    }
    throw new Error(`baseProductId doit être un nombre, reçu: ${typeof value}`);
  })
  baseProductId: number;

  @ApiProperty({ example: 'Sweat Custom Noir', description: 'Nom du produit vendeur' })
  @IsString()
  @IsNotEmpty()
  vendorName: string;

  @ApiProperty({ example: 'Sweat à capuche personnalisé de qualité', description: 'Description du produit' })
  @IsString()
  @IsNotEmpty()
  vendorDescription: string;

  @ApiProperty({ example: 10000, description: 'Prix de vente en FCFA' })
  @IsNumber()
  @Min(1, { message: 'vendorPrice doit être supérieur à 0' })
  @Type(() => Number)
  vendorPrice: number;

  @ApiProperty({ example: 10, description: 'Stock initial', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'vendorStock doit être positif ou nul' })
  @Type(() => Number)
  vendorStock?: number;

  @ApiProperty({
    description: 'Couleurs sélectionnées',
    type: [WizardColorDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WizardColorDto)
  selectedColors: WizardColorDto[];

  @ApiProperty({
    description: 'Tailles sélectionnées',
    type: [WizardSizeDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WizardSizeDto)
  selectedSizes: WizardSizeDto[];

  @ApiProperty({
    description: 'Images du produit',
    type: WizardProductImagesDto
  })
  @ValidateNested()
  @Type(() => WizardProductImagesDto)
  productImages: WizardProductImagesDto;

  @ApiProperty({
    example: 'DRAFT',
    description: 'Statut forcé du produit',
    enum: ['DRAFT', 'PUBLISHED'],
    required: false
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'], { message: 'forcedStatus doit être DRAFT ou PUBLISHED' })
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