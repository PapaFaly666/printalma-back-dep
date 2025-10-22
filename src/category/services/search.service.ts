import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { QueryCategoryDto } from '../dto/query-category.dto';
import { QuerySubCategoryDto } from '../../sub-category/dto/query-sub-category.dto';
import { QueryVariationDto } from '../../variation/dto/query-variation.dto';

/**
 * Service pour la recherche et le filtrage avancé des catégories
 */
@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Recherche et filtre les catégories avec pagination
   */
  async searchCategories(queryDto: QueryCategoryDto) {
    const {
      search,
      isActive,
      includeSubCategories = false,
      includeVariations = false,
      limit = 50,
      offset = 0,
    } = queryDto;

    // Construction de la clause where
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Construction de la clause include
    const include: any = {
      _count: {
        select: {
          subCategories: true,
          directProducts: true,
        },
      },
    };

    if (includeSubCategories) {
      include.subCategories = {
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: includeVariations
          ? {
              variations: {
                where: { isActive: true },
                orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
              },
              _count: {
                select: { variations: true, products: true },
              },
            }
          : {
              _count: {
                select: { variations: true, products: true },
              },
            },
      };
    }

    // Exécuter la requête avec pagination
    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip: offset,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + items.length < total,
          totalPages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1,
        },
      },
    };
  }

  /**
   * Recherche et filtre les sous-catégories avec pagination
   */
  async searchSubCategories(queryDto: QuerySubCategoryDto) {
    const {
      search,
      categoryId,
      isActive,
      includeVariations = false,
      limit = 50,
      offset = 0,
    } = queryDto;

    // Construction de la clause where
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId !== undefined) {
      where.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Construction de la clause include
    const include: any = {
      category: {
        select: { id: true, name: true, slug: true },
      },
      _count: {
        select: {
          variations: true,
          products: true,
        },
      },
    };

    if (includeVariations) {
      include.variations = {
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: { products: true },
          },
        },
      };
    }

    // Exécuter la requête avec pagination
    const [items, total] = await Promise.all([
      this.prisma.subCategory.findMany({
        where,
        include,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip: offset,
        take: limit,
      }),
      this.prisma.subCategory.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + items.length < total,
          totalPages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1,
        },
      },
    };
  }

  /**
   * Recherche et filtre les variations avec pagination
   */
  async searchVariations(queryDto: QueryVariationDto) {
    const { search, subCategoryId, isActive, limit = 50, offset = 0 } = queryDto;

    // Construction de la clause where
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (subCategoryId !== undefined) {
      where.subCategoryId = subCategoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Exécuter la requête avec pagination
    const [items, total] = await Promise.all([
      this.prisma.variation.findMany({
        where,
        include: {
          subCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          _count: {
            select: { products: true },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip: offset,
        take: limit,
      }),
      this.prisma.variation.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + items.length < total,
          totalPages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1,
        },
      },
    };
  }

  /**
   * Recherche globale dans toute la hiérarchie
   */
  async globalSearch(searchTerm: string, limit: number = 20) {
    const [categories, subCategories, variations] = await Promise.all([
      this.prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { slug: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.subCategory.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { slug: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        include: {
          category: { select: { id: true, name: true } },
        },
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.variation.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { slug: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        include: {
          subCategory: {
            select: {
              id: true,
              name: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      success: true,
      data: {
        categories: categories.map((c) => ({
          ...c,
          type: 'category',
          level: 0,
        })),
        subCategories: subCategories.map((sc) => ({
          ...sc,
          type: 'subCategory',
          level: 1,
        })),
        variations: variations.map((v) => ({
          ...v,
          type: 'variation',
          level: 2,
        })),
        totalResults: categories.length + subCategories.length + variations.length,
      },
    };
  }
}
