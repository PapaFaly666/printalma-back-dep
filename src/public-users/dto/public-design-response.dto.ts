import { ApiProperty } from '@nestjs/swagger';

export class DelimitationDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty()
  x: number;

  @ApiProperty()
  y: number;

  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;

  @ApiProperty()
  rotation: number;

  @ApiProperty()
  coordinateType: string;

  @ApiProperty({ required: false })
  absoluteX?: number;

  @ApiProperty({ required: false })
  absoluteY?: number;

  @ApiProperty({ required: false })
  absoluteWidth?: number;

  @ApiProperty({ required: false })
  absoluteHeight?: number;

  @ApiProperty({ required: false })
  originalImageWidth?: number;

  @ApiProperty({ required: false })
  originalImageHeight?: number;

  @ApiProperty()
  referenceWidth: number;

  @ApiProperty()
  referenceHeight: number;
}

export class ProductImageDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  url: string;

  @ApiProperty()
  naturalWidth: number;

  @ApiProperty()
  naturalHeight: number;

  @ApiProperty({ type: [DelimitationDto] })
  delimitations: DelimitationDto[];
}

export class ColorVariationDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  colorCode: string;

  @ApiProperty({ type: [ProductImageDto] })
  images: ProductImageDto[];
}

export class BaseProductDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ type: [ColorVariationDto] })
  colorVariations: ColorVariationDto[];
}

export class DesignPositionDto {
  @ApiProperty({ type: 'object' })
  position: any;

  @ApiProperty()
  designId: number;
}

export class MockupProductDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  status: string;

  @ApiProperty({ type: BaseProductDto })
  baseProduct: BaseProductDto;

  @ApiProperty({ type: [DesignPositionDto] })
  designPositions: DesignPositionDto[];
}

export class VendorDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  shopName?: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  photo?: string;

  @ApiProperty({ required: false })
  country?: string;
}

export class CategoryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  coverImageUrl?: string;
}

export class ProductPositionDto {
  @ApiProperty({ type: 'object' })
  position: any;

  @ApiProperty()
  vendorProductId: number;
}

export class PublicDesignDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty({ required: false })
  thumbnailUrl?: string;

  @ApiProperty({ type: 'object' })
  dimensions: any;

  @ApiProperty()
  format: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty()
  views: number;

  @ApiProperty()
  likes: number;

  @ApiProperty()
  earnings: number;

  @ApiProperty()
  usageCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  publishedAt?: Date;

  @ApiProperty({ type: VendorDto })
  vendor: VendorDto;

  @ApiProperty({ type: CategoryDto, required: false })
  category?: CategoryDto;

  @ApiProperty({ type: [MockupProductDto] })
  mockupProducts: MockupProductDto[];

  @ApiProperty({ type: [ProductPositionDto] })
  productPositions: ProductPositionDto[];
}

export class PaginationDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  hasMore: boolean;
}

export class PublicDesignsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [PublicDesignDto] })
  data: PublicDesignDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;
}

export class SinglePublicDesignResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: PublicDesignDto })
  data: PublicDesignDto;
}
