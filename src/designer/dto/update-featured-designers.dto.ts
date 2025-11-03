import { IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateFeaturedDesignersDto {
  @IsArray({ message: 'designerIds doit être un tableau' })
  @ArrayMinSize(6, { message: 'Exactement 6 designers doivent être sélectionnés' })
  @ArrayMaxSize(6, { message: 'Maximum 6 designers autorisés' })
  @Transform(({ value }) => {
    // Convertir les strings en nombres si nécessaire
    if (Array.isArray(value)) {
      return value.map(id => typeof id === 'string' ? id : String(id));
    }
    return value;
  })
  designerIds: string[];
}
