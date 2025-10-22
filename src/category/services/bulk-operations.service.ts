import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BulkReorderCategoryDto, BulkReorderSubCategoryDto, BulkReorderVariationDto } from '../dto/bulk-reorder.dto';

/**
 * Service pour gérer les opérations en lot sur les catégories
 */
@Injectable()
export class BulkOperationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Réordonne plusieurs catégories en une seule transaction
   */
  async reorderCategories(dto: BulkReorderCategoryDto) {
    const { items } = dto;

    // Vérifier que tous les IDs existent
    const categoryIds = items.map((item) => item.id);
    const existingCategories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });

    if (existingCategories.length !== categoryIds.length) {
      const existingIds = existingCategories.map((c) => c.id);
      const missingIds = categoryIds.filter((id) => !existingIds.includes(id));
      throw new NotFoundException(
        `Catégories non trouvées avec les IDs: ${missingIds.join(', ')}`
      );
    }

    // Vérifier qu'il n'y a pas de doublons dans les displayOrder
    const displayOrders = items.map((item) => item.displayOrder);
    const uniqueOrders = new Set(displayOrders);
    if (uniqueOrders.size !== displayOrders.length) {
      throw new BadRequestException(
        'Les valeurs de displayOrder doivent être uniques'
      );
    }

    // Mettre à jour toutes les catégories en une seule transaction
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    return {
      success: true,
      message: `${items.length} catégorie(s) réordonnée(s) avec succès`,
      data: {
        updatedCount: items.length,
      },
    };
  }

  /**
   * Réordonne plusieurs sous-catégories en une seule transaction
   */
  async reorderSubCategories(dto: BulkReorderSubCategoryDto) {
    const { items } = dto;

    // Vérifier que tous les IDs existent
    const subCategoryIds = items.map((item) => item.id);
    const existingSubCategories = await this.prisma.subCategory.findMany({
      where: { id: { in: subCategoryIds } },
      select: { id: true, categoryId: true },
    });

    if (existingSubCategories.length !== subCategoryIds.length) {
      const existingIds = existingSubCategories.map((sc) => sc.id);
      const missingIds = subCategoryIds.filter((id) => !existingIds.includes(id));
      throw new NotFoundException(
        `Sous-catégories non trouvées avec les IDs: ${missingIds.join(', ')}`
      );
    }

    // Vérifier que toutes les sous-catégories appartiennent à la même catégorie
    const categoryIds = [...new Set(existingSubCategories.map((sc) => sc.categoryId))];
    if (categoryIds.length > 1) {
      throw new BadRequestException(
        'Toutes les sous-catégories doivent appartenir à la même catégorie parente'
      );
    }

    // Mettre à jour toutes les sous-catégories en une seule transaction
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.subCategory.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    return {
      success: true,
      message: `${items.length} sous-catégorie(s) réordonnée(s) avec succès`,
      data: {
        updatedCount: items.length,
      },
    };
  }

  /**
   * Réordonne plusieurs variations en une seule transaction
   */
  async reorderVariations(dto: BulkReorderVariationDto) {
    const { items } = dto;

    // Vérifier que tous les IDs existent
    const variationIds = items.map((item) => item.id);
    const existingVariations = await this.prisma.variation.findMany({
      where: { id: { in: variationIds } },
      select: { id: true, subCategoryId: true },
    });

    if (existingVariations.length !== variationIds.length) {
      const existingIds = existingVariations.map((v) => v.id);
      const missingIds = variationIds.filter((id) => !existingIds.includes(id));
      throw new NotFoundException(
        `Variations non trouvées avec les IDs: ${missingIds.join(', ')}`
      );
    }

    // Vérifier que toutes les variations appartiennent à la même sous-catégorie
    const subCategoryIds = [...new Set(existingVariations.map((v) => v.subCategoryId))];
    if (subCategoryIds.length > 1) {
      throw new BadRequestException(
        'Toutes les variations doivent appartenir à la même sous-catégorie parente'
      );
    }

    // Mettre à jour toutes les variations en une seule transaction
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.variation.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    return {
      success: true,
      message: `${items.length} variation(s) réordonnée(s) avec succès`,
      data: {
        updatedCount: items.length,
      },
    };
  }

  /**
   * Active/désactive plusieurs catégories en une seule transaction
   */
  async toggleCategoriesStatus(categoryIds: number[], isActive: boolean) {
    // Vérifier que tous les IDs existent
    const existingCategories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });

    if (existingCategories.length !== categoryIds.length) {
      const existingIds = existingCategories.map((c) => c.id);
      const missingIds = categoryIds.filter((id) => !existingIds.includes(id));
      throw new NotFoundException(
        `Catégories non trouvées avec les IDs: ${missingIds.join(', ')}`
      );
    }

    // Mettre à jour le statut de toutes les catégories
    const result = await this.prisma.category.updateMany({
      where: { id: { in: categoryIds } },
      data: { isActive },
    });

    return {
      success: true,
      message: `${result.count} catégorie(s) ${isActive ? 'activée(s)' : 'désactivée(s)'} avec succès`,
      data: {
        updatedCount: result.count,
        isActive,
      },
    };
  }

  /**
   * Active/désactive plusieurs sous-catégories en une seule transaction
   */
  async toggleSubCategoriesStatus(subCategoryIds: number[], isActive: boolean) {
    const existingSubCategories = await this.prisma.subCategory.findMany({
      where: { id: { in: subCategoryIds } },
      select: { id: true },
    });

    if (existingSubCategories.length !== subCategoryIds.length) {
      const existingIds = existingSubCategories.map((sc) => sc.id);
      const missingIds = subCategoryIds.filter((id) => !existingIds.includes(id));
      throw new NotFoundException(
        `Sous-catégories non trouvées avec les IDs: ${missingIds.join(', ')}`
      );
    }

    const result = await this.prisma.subCategory.updateMany({
      where: { id: { in: subCategoryIds } },
      data: { isActive },
    });

    return {
      success: true,
      message: `${result.count} sous-catégorie(s) ${isActive ? 'activée(s)' : 'désactivée(s)'} avec succès`,
      data: {
        updatedCount: result.count,
        isActive,
      },
    };
  }

  /**
   * Active/désactive plusieurs variations en une seule transaction
   */
  async toggleVariationsStatus(variationIds: number[], isActive: boolean) {
    const existingVariations = await this.prisma.variation.findMany({
      where: { id: { in: variationIds } },
      select: { id: true },
    });

    if (existingVariations.length !== variationIds.length) {
      const existingIds = existingVariations.map((v) => v.id);
      const missingIds = variationIds.filter((id) => !existingIds.includes(id));
      throw new NotFoundException(
        `Variations non trouvées avec les IDs: ${missingIds.join(', ')}`
      );
    }

    const result = await this.prisma.variation.updateMany({
      where: { id: { in: variationIds } },
      data: { isActive },
    });

    return {
      success: true,
      message: `${result.count} variation(s) ${isActive ? 'activée(s)' : 'désactivée(s)'} avec succès`,
      data: {
        updatedCount: result.count,
        isActive,
      },
    };
  }
}
