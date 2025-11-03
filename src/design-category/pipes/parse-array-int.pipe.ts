import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseArrayIntPipe implements PipeTransform<any, any> {
  transform(value: any, metadata: ArgumentMetadata): any {
    if (!value || !value.categoryIds) {
      throw new BadRequestException('La liste des IDs de catégories est requise');
    }

    const categoryIds = value.categoryIds;

    if (!Array.isArray(categoryIds)) {
      throw new BadRequestException('categoryIds doit être un tableau');
    }

    if (categoryIds.length === 0) {
      throw new BadRequestException('Au moins 1 catégorie doit être sélectionnée');
    }

    if (categoryIds.length > 5) {
      throw new BadRequestException('Maximum 5 thèmes autorisés');
    }

    // Convertir chaque élément en nombre
    const parsedIds = categoryIds.map((id, index) => {
      const num = Number(id);

      if (isNaN(num)) {
        throw new BadRequestException(`ID invalide à l'index ${index}: "${id}" n'est pas un nombre valide`);
      }

      const intNum = Math.floor(num);

      if (intNum !== num) {
        throw new BadRequestException(`ID invalide à l'index ${index}: "${id}" doit être un nombre entier`);
      }

      return intNum;
    });

    // Retourner l'objet avec les IDs convertis
    return {
      ...value,
      categoryIds: parsedIds,
    };
  }
}
