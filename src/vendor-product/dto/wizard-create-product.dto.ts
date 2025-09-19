import { IsNumber, IsString, IsArray, IsBoolean, IsEnum, IsOptional, ValidateNested, Min, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SelectedMockupDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  suggestedPrice?: number;
}

export class SelectedColorDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  colorCode: string;
}

export class SelectedSizeDto {
  @IsNumber()
  id: number;

  @IsString()
  sizeName: string;
}

export enum PostValidationAction {
  TO_DRAFT = 'TO_DRAFT',
  TO_PUBLISHED = 'TO_PUBLISHED'
}

export class WizardProductDataDto {
  @ValidateNested()
  @Type(() => SelectedMockupDto)
  selectedMockup: SelectedMockupDto;

  @IsString()
  productName: string;

  @IsString()
  productDescription: string;

  @IsNumber()
  @Min(0)
  productPrice: number;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsNumber()
  @Min(0)
  vendorProfit: number;

  @IsNumber()
  @Min(0)
  expectedRevenue: number;

  @IsBoolean()
  isPriceCustomized: boolean;

  @IsString()
  selectedTheme: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SelectedColorDto)
  selectedColors: SelectedColorDto[];

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SelectedSizeDto)
  selectedSizes: SelectedSizeDto[];

  @IsEnum(PostValidationAction)
  postValidationAction: PostValidationAction;
}

export class WizardCreateProductDto {
  productData: string; // JSON string qui sera parsé en WizardProductDataDto
}