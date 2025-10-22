import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DeleteCheckResponseDto } from '../dto/delete-check-response.dto';

/**
 * Service pour vérifier la possibilité de supprimer des éléments de la hiérarchie
 * et fournir des détails complets sur les bloqueurs
 */
@Injectable()
export class DeletionCheckerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Vérifie si une catégorie peut être supprimée
   * Retourne les détails complets incluant les noms des produits bloquants
   */
  async checkCategoryDeletion(categoryId: number): Promise<DeleteCheckResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        subCategories: {
          include: {
            variations: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Catégorie avec ID ${categoryId} non trouvée`);
    }

    // Compter les sous-catégories
    const subCategoryCount = category.subCategories.length;

    // Récupérer les produits directs (liés directement à la catégorie)
    const directProducts = await this.prisma.product.findMany({
      where: { categoryId, isDelete: false },
      select: { id: true, name: true },
      take: 10, // Limiter à 10 pour l'affichage
    });

    // Récupérer les IDs des sous-catégories et variations
    const subCategoryIds = category.subCategories.map((sub) => sub.id);
    const variationIds = category.subCategories.flatMap((sub) =>
      sub.variations.map((v) => v.id)
    );

    // Compter tous les produits liés
    const totalProductCount = await this.prisma.product.count({
      where: {
        OR: [
          { categoryId },
          { subCategoryId: { in: subCategoryIds } },
          { variationId: { in: variationIds } },
        ],
        isDelete: false,
      },
    });

    const canDelete = totalProductCount === 0 && subCategoryCount === 0;

    let message: string;
    if (canDelete) {
      message = 'Cette catégorie peut être supprimée en toute sécurité';
    } else {
      const reasons: string[] = [];
      if (totalProductCount > 0) {
        reasons.push(`${totalProductCount} produit(s)`);
      }
      if (subCategoryCount > 0) {
        reasons.push(`${subCategoryCount} sous-catégorie(s)`);
      }
      message = `Impossible de supprimer cette catégorie car elle est liée à ${reasons.join(' et ')}`;
    }

    return {
      canDelete,
      message,
      productCount: totalProductCount,
      subCategoryCount,
      blockers: canDelete
        ? undefined
        : {
            products: directProducts.map((p) => p.name).slice(0, 5),
            subCategories: category.subCategories.map((s) => s.name).slice(0, 5),
          },
    };
  }

  /**
   * Vérifie si une sous-catégorie peut être supprimée
   */
  async checkSubCategoryDeletion(subCategoryId: number): Promise<DeleteCheckResponseDto> {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id: subCategoryId },
      include: {
        variations: true,
      },
    });

    if (!subCategory) {
      throw new NotFoundException(`Sous-catégorie avec ID ${subCategoryId} non trouvée`);
    }

    // Compter les variations
    const variationCount = subCategory.variations.length;

    // Récupérer les produits directs
    const directProducts = await this.prisma.product.findMany({
      where: { subCategoryId, isDelete: false },
      select: { id: true, name: true },
      take: 10,
    });

    // Récupérer les IDs des variations
    const variationIds = subCategory.variations.map((v) => v.id);

    // Compter tous les produits liés
    const totalProductCount = await this.prisma.product.count({
      where: {
        OR: [{ subCategoryId }, { variationId: { in: variationIds } }],
        isDelete: false,
      },
    });

    const canDelete = totalProductCount === 0 && variationCount === 0;

    let message: string;
    if (canDelete) {
      message = 'Cette sous-catégorie peut être supprimée en toute sécurité';
    } else {
      const reasons: string[] = [];
      if (totalProductCount > 0) {
        reasons.push(`${totalProductCount} produit(s)`);
      }
      if (variationCount > 0) {
        reasons.push(`${variationCount} variation(s)`);
      }
      message = `Impossible de supprimer cette sous-catégorie car elle est liée à ${reasons.join(' et ')}`;
    }

    return {
      canDelete,
      message,
      productCount: totalProductCount,
      variationCount,
      blockers: canDelete
        ? undefined
        : {
            products: directProducts.map((p) => p.name).slice(0, 5),
            variations: subCategory.variations.map((v) => v.name).slice(0, 5),
          },
    };
  }

  /**
   * Vérifie si une variation peut être supprimée
   */
  async checkVariationDeletion(variationId: number): Promise<DeleteCheckResponseDto> {
    const variation = await this.prisma.variation.findUnique({
      where: { id: variationId },
    });

    if (!variation) {
      throw new NotFoundException(`Variation avec ID ${variationId} non trouvée`);
    }

    // Récupérer les produits liés
    const products = await this.prisma.product.findMany({
      where: { variationId, isDelete: false },
      select: { id: true, name: true },
      take: 10,
    });

    const productCount = products.length;
    const canDelete = productCount === 0;

    const message = canDelete
      ? 'Cette variation peut être supprimée en toute sécurité'
      : `Impossible de supprimer cette variation car ${productCount} produit(s) l'utilise(nt)`;

    return {
      canDelete,
      message,
      productCount,
      blockers: canDelete
        ? undefined
        : {
            products: products.map((p) => p.name).slice(0, 5),
          },
    };
  }
}
