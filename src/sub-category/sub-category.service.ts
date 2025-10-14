import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';

@Injectable()
export class SubCategoryService {
  constructor(private readonly prisma: PrismaService) {}

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
}
