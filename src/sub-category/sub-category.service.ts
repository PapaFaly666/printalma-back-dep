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
          select: { variations: true }
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
}
