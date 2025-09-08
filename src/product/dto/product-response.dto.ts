import { ApiProperty } from '@nestjs/swagger';
import { ProductViewResponseDto } from '../../product-view/dto/product-view-response-dto';

class SizeDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'XL' })
  sizeName: string;
}

class CustomDesignDto {
  @ApiProperty({ example: 'design_123' })
  id: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/example/image/upload/v1620123456/designs/design_123.webp' })
  url: string;

  @ApiProperty({ example: 'mon-design.png' })
  originalName: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/example/image/upload/v1620123456/designs/thumb_design_123.webp' })
  thumbnailUrl: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  uploadedAt: string;

  @ApiProperty({ example: 245760 })
  size: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'Design personnalisé pour le front', required: false })
  description?: string;
}

class ProductImageDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Front' })
  view: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/example/image/upload/v1620123456/products/image.jpg' })
  url: string;

  @ApiProperty({ example: 'products/image_123' })
  publicId: string;

  @ApiProperty({ example: 800, required: false })
  naturalWidth?: number;

  @ApiProperty({ example: 600, required: false })
  naturalHeight?: number;

  @ApiProperty({ type: CustomDesignDto, required: false })
  customDesign?: CustomDesignDto | null;
}

class ColorVariationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Rouge' })
  name: string;

  @ApiProperty({ example: '#FF0000' })
  colorCode: string;

  @ApiProperty({ type: [ProductImageDto] })
  images: ProductImageDto[];
}

class CategoryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'T-shirts' })
  name: string;

  @ApiProperty({ example: 'Vêtements pour le haut du corps', required: false })
  description?: string;
}

class DesignsMetadataDto {
  @ApiProperty({ example: 2 })
  totalDesigns: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', required: false })
  lastUpdated?: string;
}

export class ProductResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'T-shirt Basic' })
  name: string;

  @ApiProperty({ example: 'T-shirt en coton bio' })
  description: string;

  @ApiProperty({ example: 19.99 })
  price: number;

  @ApiProperty({ example: 19.99, required: false, description: 'Prix suggéré (optionnel)' })
  suggestedPrice?: number;

  @ApiProperty({ example: 100 })
  stock: number;

  @ApiProperty({ example: 'PUBLISHED', enum: ['PUBLISHED', 'DRAFT'] })
  status: string;

  @ApiProperty({ example: false })
  hasCustomDesigns: boolean;

  @ApiProperty({ type: DesignsMetadataDto, required: false })
  designsMetadata?: DesignsMetadataDto;

  @ApiProperty({ type: [CategoryDto] })
  categories: CategoryDto[];

  @ApiProperty({ type: [SizeDto] })
  sizes: SizeDto[];

  @ApiProperty({ type: [ColorVariationDto] })
  colorVariations: ColorVariationDto[];

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;
}