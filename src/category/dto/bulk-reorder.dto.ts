import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ValidateNested, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class ReorderItem {
  @ApiProperty({
    description: 'ID de l\'élément à réordonner',
    example: 1
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Nouvel ordre d\'affichage',
    example: 0
  })
  @IsInt()
  @Min(0)
  displayOrder: number;
}

export class BulkReorderCategoryDto {
  @ApiProperty({
    description: 'Liste des catégories avec leur nouvel ordre',
    example: [
      { id: 1, displayOrder: 0 },
      { id: 2, displayOrder: 1 },
      { id: 3, displayOrder: 2 }
    ],
    type: [ReorderItem]
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items: ReorderItem[];
}

export class BulkReorderSubCategoryDto {
  @ApiProperty({
    description: 'Liste des sous-catégories avec leur nouvel ordre',
    example: [
      { id: 5, displayOrder: 0 },
      { id: 6, displayOrder: 1 }
    ],
    type: [ReorderItem]
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items: ReorderItem[];
}

export class BulkReorderVariationDto {
  @ApiProperty({
    description: 'Liste des variations avec leur nouvel ordre',
    example: [
      { id: 10, displayOrder: 0 },
      { id: 11, displayOrder: 1 }
    ],
    type: [ReorderItem]
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items: ReorderItem[];
}
