import { IsArray, ArrayMinSize, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentItemDto } from './content-item.dto';

export class UpdateContentDto {
  @IsArray()
  @ArrayMinSize(6, { message: 'Exactement 6 items de designs sont requis' })
  @ArrayMaxSize(6, { message: 'Exactement 6 items de designs sont requis' })
  @ValidateNested({ each: true })
  @Type(() => ContentItemDto)
  designs: ContentItemDto[];

  @IsArray()
  @ArrayMinSize(5, { message: 'Exactement 5 items d\'influenceurs sont requis' })
  @ArrayMaxSize(5, { message: 'Exactement 5 items d\'influenceurs sont requis' })
  @ValidateNested({ each: true })
  @Type(() => ContentItemDto)
  influencers: ContentItemDto[];

  @IsArray()
  @ArrayMinSize(6, { message: 'Exactement 6 items de merchandising sont requis' })
  @ArrayMaxSize(6, { message: 'Exactement 6 items de merchandising sont requis' })
  @ValidateNested({ each: true })
  @Type(() => ContentItemDto)
  merchandising: ContentItemDto[];
}
