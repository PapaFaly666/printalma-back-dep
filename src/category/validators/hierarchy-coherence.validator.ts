import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PrismaService } from '../../prisma.service';

/**
 * Validateur pour vérifier la cohérence de la hiérarchie Category -> SubCategory -> Variation
 * Utilisé principalement pour la création/mise à jour de produits
 */
@ValidatorConstraint({ name: 'HierarchyCoherence', async: true })
@Injectable()
export class HierarchyCoherenceConstraint implements ValidatorConstraintInterface {
  constructor(private prisma: PrismaService) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const object = args.object as any;
    const { categoryId, subCategoryId, variationId } = object;

    // Si aucune hiérarchie n'est spécifiée, c'est OK
    if (!categoryId && !subCategoryId && !variationId) {
      return true;
    }

    // Si on a une variation, on doit avoir une sous-catégorie
    if (variationId && !subCategoryId) {
      return false;
    }

    // Si on a une sous-catégorie, on doit avoir une catégorie
    if (subCategoryId && !categoryId) {
      return false;
    }

    // Vérifier que la sous-catégorie appartient bien à la catégorie
    if (categoryId && subCategoryId) {
      const subCategory = await this.prisma.subCategory.findFirst({
        where: {
          id: subCategoryId,
          categoryId: categoryId,
        },
      });

      if (!subCategory) {
        return false;
      }
    }

    // Vérifier que la variation appartient bien à la sous-catégorie
    if (subCategoryId && variationId) {
      const variation = await this.prisma.variation.findFirst({
        where: {
          id: variationId,
          subCategoryId: subCategoryId,
        },
      });

      if (!variation) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as any;
    const { categoryId, subCategoryId, variationId } = object;

    if (variationId && !subCategoryId) {
      return 'Une variation nécessite une sous-catégorie parente';
    }

    if (subCategoryId && !categoryId) {
      return 'Une sous-catégorie nécessite une catégorie parente';
    }

    if (categoryId && subCategoryId) {
      return `La sous-catégorie ${subCategoryId} n'appartient pas à la catégorie ${categoryId}`;
    }

    if (subCategoryId && variationId) {
      return `La variation ${variationId} n'appartient pas à la sous-catégorie ${subCategoryId}`;
    }

    return 'La hiérarchie des catégories est incohérente';
  }
}

export function HierarchyCoherence(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'HierarchyCoherence',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: HierarchyCoherenceConstraint,
    });
  };
}
