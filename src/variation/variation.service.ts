import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateVariationDto } from './dto/create-variation.dto';

@Injectable()
export class VariationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVariationDto) {
    // Vérifier que la sous-catégorie parente existe
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id: dto.subCategoryId }
    });

    if (!subCategory) {
      throw new NotFoundException(`Sous-catégorie avec ID ${dto.subCategoryId} non trouvée`);
    }

    // Vérifier que la variation n'existe pas déjà
    const existing = await this.prisma.variation.findFirst({
      where: {
        name: dto.name.trim(),
        subCategoryId: dto.subCategoryId
      }
    });

    if (existing) {
      throw new ConflictException(
        `La variation "${dto.name}" existe déjà dans cette sous-catégorie`
      );
    }

    // Générer le slug
    const slug = dto.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Créer la variation
    const variation = await this.prisma.variation.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || '',
        subCategoryId: dto.subCategoryId,
        displayOrder: dto.displayOrder || 0
      },
      include: {
        subCategory: {
          include: {
            category: true
          }
        }
      }
    });

    return {
      success: true,
      message: 'Variation créée avec succès',
      data: variation
    };
  }

  async findAll(subCategoryId?: number) {
    const where = subCategoryId ? { subCategoryId, isActive: true } : { isActive: true };

    const variations = await this.prisma.variation.findMany({
      where,
      include: {
        subCategory: {
          include: {
            category: true
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return variations;
  }

  async findOne(id: number) {
    const variation = await this.prisma.variation.findUnique({
      where: { id },
      include: {
        subCategory: {
          include: {
            category: true
          }
        }
      }
    });

    if (!variation) {
      throw new NotFoundException(`Variation avec ID ${id} non trouvée`);
    }

    return variation;
  }
}
