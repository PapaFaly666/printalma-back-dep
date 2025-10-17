import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { MockupService } from '../product/services/mockup.service';

@Injectable()
export class SubCategoryService {
  private readonly logger = new Logger(SubCategoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mockupService: MockupService
  ) {}

  async create(dto: CreateSubCategoryDto) {
    // Vérifier que la catégorie parente existe
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId }
    });

    if (!category) {
      throw new NotFoundException(`Catégorie avec ID ${dto.categoryId} non trouvée`);
    }

    // Vérifier que la sous-catégorie n'existe pas déjà
    const existing = await this.prisma.subCategory.findFirst({
      where: {
        name: dto.name.trim(),
        categoryId: dto.categoryId
      }
    });

    if (existing) {
      throw new ConflictException(
        `La sous-catégorie "${dto.name}" existe déjà dans cette catégorie`
      );
    }

    // Générer le slug
    const slug = dto.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Créer la sous-catégorie
    const subCategory = await this.prisma.subCategory.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || '',
        categoryId: dto.categoryId,
        displayOrder: dto.displayOrder || 0
      },
      include: {
        category: true
      }
    });

    return {
      success: true,
      message: 'Sous-catégorie créée avec succès',
      data: subCategory
    };
  }

  async findAll(categoryId?: number) {
    const where = categoryId ? { categoryId, isActive: true } : { isActive: true };

    const subCategories = await this.prisma.subCategory.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            variations: { where: { isActive: true } },
            products: { where: { isDelete: false } }
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return subCategories;
  }

  async findOne(id: number) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id },
      include: {
        category: true,
        variations: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!subCategory) {
      throw new NotFoundException(`Sous-catégorie avec ID ${id} non trouvée`);
    }

    return subCategory;
  }

  async update(id: number, dto: Partial<CreateSubCategoryDto>) {
    // Vérifier que la sous-catégorie existe
    const subCategory = await this.findOne(id);

    // Si le nom est modifié, vérifier qu'il n'existe pas déjà
    if (dto.name && dto.name.trim() !== subCategory.name) {
      const existing = await this.prisma.subCategory.findFirst({
        where: {
          name: dto.name.trim(),
          categoryId: dto.categoryId || subCategory.categoryId,
          id: { not: id }
        }
      });

      if (existing) {
        throw new ConflictException(
          `La sous-catégorie "${dto.name}" existe déjà dans cette catégorie`
        );
      }
    }

    // Préparer les données de mise à jour
    const dataToUpdate: any = {};

    if (dto.name) {
      dataToUpdate.name = dto.name.trim();
      // Régénérer le slug si le nom change
      dataToUpdate.slug = dto.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    if (dto.description !== undefined) {
      dataToUpdate.description = dto.description?.trim() || '';
    }

    if (dto.categoryId !== undefined) {
      // Vérifier que la nouvelle catégorie existe
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId }
      });

      if (!category) {
        throw new NotFoundException(`Catégorie avec ID ${dto.categoryId} non trouvée`);
      }

      dataToUpdate.categoryId = dto.categoryId;
    }

    if (dto.displayOrder !== undefined) {
      dataToUpdate.displayOrder = dto.displayOrder;
    }

    // Mettre à jour la sous-catégorie
    const updated = await this.prisma.subCategory.update({
      where: { id },
      data: dataToUpdate,
      include: {
        category: true,
        variations: true
      }
    });

    // Régénérer les mockups pour cette sous-catégorie
    this.logger.log(`🔄 Déclenchement de la régénération des mockups pour la sous-catégorie ${id}`);
    try {
      await this.mockupService.regenerateMockupsForSubCategory(id);
    } catch (error) {
      this.logger.warn(`⚠️ Erreur lors de la régénération des mockups: ${error.message}`);
      // On continue même si la régénération échoue
    }

    return {
      success: true,
      message: 'Sous-catégorie mise à jour avec succès',
      data: updated
    };
  }

  /**
   * Supprimer une sous-catégorie si elle n'est pas utilisée par des produits
   */
  async remove(id: number) {
    // Vérifier que la sous-catégorie existe
    const subCategory = await this.findOne(id);

    // Vérifier si des produits sont liés directement à cette sous-catégorie
    const directProductsCount = await this.prisma.product.count({
      where: {
        subCategoryId: id,
        isDelete: false
      }
    });

    // Vérifier si des variations de cette sous-catégorie sont utilisées par des produits
    const variationsWithProducts = await this.prisma.variation.findMany({
      where: {
        subCategoryId: id,
        products: {
          some: {
            isDelete: false
          }
        }
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isDelete: false
              }
            }
          }
        }
      }
    });

    const totalProductsThroughVariations = variationsWithProducts.reduce(
      (total, variation) => total + variation._count.products,
      0
    );

    // Calculer le nombre total de produits affectés
    const totalAffectedProducts = directProductsCount + totalProductsThroughVariations;

    if (totalAffectedProducts > 0) {
      const messages = [];
      if (directProductsCount > 0) {
        messages.push(`${directProductsCount} produit(s) lié(s) directement`);
      }
      if (totalProductsThroughVariations > 0) {
        messages.push(`${totalProductsThroughVariations} produit(s) via ${variationsWithProducts.length} variation(s)`);
      }

      throw new ConflictException({
        success: false,
        error: 'SUBCATEGORY_IN_USE',
        message: `La sous-catégorie est utilisée par ${totalAffectedProducts} produit(s) au total. Elle ne peut pas être supprimée.`,
        details: {
          subCategoryId: id,
          directProductsCount,
          variationsWithProducts: variationsWithProducts.length,
          totalProductsThroughVariations,
          totalAffectedProducts,
          breakdown: messages.join(', ')
        }
      });
    }

    // Vérifier si la sous-catégorie a des variations (même sans produits)
    const variationsCount = await this.prisma.variation.count({
      where: {
        subCategoryId: id,
        isActive: true
      }
    });

    if (variationsCount > 0) {
      throw new ConflictException({
        success: false,
        error: 'SUBCATEGORY_HAS_VARIATIONS',
        message: `La sous-catégorie contient ${variationsCount} variation(s). Veuillez d'abord supprimer toutes les variations.`,
        details: {
          subCategoryId: id,
          variationsCount
        }
      });
    }

    // Supprimer la sous-catégorie
    await this.prisma.subCategory.delete({
      where: { id }
    });

    return {
      success: true,
      message: 'Sous-catégorie supprimée avec succès'
    };
  }
}
