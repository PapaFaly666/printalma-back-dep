import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { CreateThemeDto, ThemeStatus } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { AddProductsToThemeDto } from './dto/add-products-to-theme.dto';
import { ThemeStatus as PrismaThemeStatus } from '@prisma/client';

@Injectable()
export class ThemeService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) {}

  async findAll(filters: {
    status?: 'active' | 'inactive' | 'all';
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
    featured?: boolean;
  }) {
    const { 
      status = 'all', 
      category, 
      search, 
      limit = 20, 
      offset = 0, 
      featured 
    } = filters;

    const where: any = {};

    if (status !== 'all') {
      where.status = status === 'active' ? PrismaThemeStatus.ACTIVE : PrismaThemeStatus.INACTIVE;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (featured !== undefined) {
      where.featured = featured;
    }

    const [themes, total] = await Promise.all([
      this.prisma.theme.findMany({
        where,
        include: {
          _count: {
            select: {
              themeProducts: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.theme.count({ where })
    ]);

    // Transformer les données pour correspondre à l'API attendue
    const transformedThemes = themes.map(theme => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      coverImage: theme.coverImageUrl,
      productCount: theme._count.themeProducts,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
      status: theme.status === PrismaThemeStatus.ACTIVE ? 'active' : 'inactive',
      category: theme.category,
      featured: theme.featured
    }));

    return {
      success: true,
      data: transformedThemes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  async findOne(id: number) {
    const theme = await this.prisma.theme.findUnique({
      where: { id },
      include: {
        themeProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                status: true
              }
            }
          }
        },
        _count: {
          select: {
            themeProducts: true
          }
        }
      }
    });

    if (!theme) {
      throw new NotFoundException('Thème non trouvé');
    }

    // Transformer les données
    const transformedTheme = {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      coverImage: theme.coverImageUrl,
      productCount: theme._count.themeProducts,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
      status: theme.status === PrismaThemeStatus.ACTIVE ? 'active' : 'inactive',
      category: theme.category,
      featured: theme.featured,
      products: theme.themeProducts.map(tp => ({
        id: tp.product.id,
        name: tp.product.name,
        price: tp.product.price,
        status: tp.product.status
      }))
    };

    return {
      success: true,
      data: transformedTheme
    };
  }

  async create(createThemeDto: CreateThemeDto, coverImage?: Express.Multer.File) {
    let coverImageUrl: string | null = null;
    let coverImagePublicId: string | null = null;

    // Upload de l'image si fournie
    if (coverImage) {
      try {
        const uploadResult = await this.cloudinaryService.uploadImage(coverImage, 'themes');
        coverImageUrl = uploadResult.secure_url;
        coverImagePublicId = uploadResult.public_id;
      } catch (error) {
        throw new BadRequestException(`Erreur lors de l'upload de l'image: ${error.message}`);
      }
    }

    // Créer le thème
    const theme = await this.prisma.theme.create({
      data: {
        name: createThemeDto.name,
        description: createThemeDto.description,
        category: createThemeDto.category,
        status: createThemeDto.status === ThemeStatus.ACTIVE ? PrismaThemeStatus.ACTIVE : PrismaThemeStatus.INACTIVE,
        featured: createThemeDto.featured || false,
        coverImageUrl,
        coverImagePublicId
      }
    });

    // Transformer les données
    const transformedTheme = {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      coverImage: theme.coverImageUrl,
      productCount: 0,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
      status: theme.status === PrismaThemeStatus.ACTIVE ? 'active' : 'inactive',
      category: theme.category,
      featured: theme.featured
    };

    return {
      success: true,
      data: transformedTheme,
      message: 'Thème créé avec succès'
    };
  }

  async update(id: number, updateThemeDto: UpdateThemeDto, coverImage?: Express.Multer.File) {
    // Vérifier que le thème existe
    const existingTheme = await this.prisma.theme.findUnique({
      where: { id }
    });

    if (!existingTheme) {
      throw new NotFoundException('Thème non trouvé');
    }

    let coverImageUrl = existingTheme.coverImageUrl;
    let coverImagePublicId = existingTheme.coverImagePublicId;

    // Upload de la nouvelle image si fournie
    if (coverImage) {
      try {
        // Supprimer l'ancienne image si elle existe
        if (existingTheme.coverImagePublicId) {
          await this.cloudinaryService.deleteImage(existingTheme.coverImagePublicId);
        }

        const uploadResult = await this.cloudinaryService.uploadImage(coverImage, 'themes');
        coverImageUrl = uploadResult.secure_url;
        coverImagePublicId = uploadResult.public_id;
      } catch (error) {
        throw new BadRequestException(`Erreur lors de l'upload de l'image: ${error.message}`);
      }
    }

    // Mettre à jour le thème
    const theme = await this.prisma.theme.update({
      where: { id },
      data: {
        name: updateThemeDto.name,
        description: updateThemeDto.description,
        category: updateThemeDto.category,
        status: updateThemeDto.status === ThemeStatus.ACTIVE ? PrismaThemeStatus.ACTIVE : PrismaThemeStatus.INACTIVE,
        featured: updateThemeDto.featured,
        coverImageUrl,
        coverImagePublicId
      }
    });

    // Transformer les données
    const transformedTheme = {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      coverImage: theme.coverImageUrl,
      productCount: existingTheme.productCount,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
      status: theme.status === PrismaThemeStatus.ACTIVE ? 'active' : 'inactive',
      category: theme.category,
      featured: theme.featured
    };

    return {
      success: true,
      data: transformedTheme,
      message: 'Thème modifié avec succès'
    };
  }

  async remove(id: number) {
    // Vérifier que le thème existe
    const existingTheme = await this.prisma.theme.findUnique({
      where: { id }
    });

    if (!existingTheme) {
      throw new NotFoundException('Thème non trouvé');
    }

    // Supprimer l'image de Cloudinary si elle existe
    if (existingTheme.coverImagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(existingTheme.coverImagePublicId);
      } catch (error) {
        console.warn('Erreur lors de la suppression de l\'image Cloudinary:', error.message);
      }
    }

    // Supprimer le thème (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await this.prisma.theme.delete({
      where: { id }
    });

    return {
      success: true,
      message: 'Thème supprimé avec succès'
    };
  }

  async addProductsToTheme(themeId: number, addProductsDto: AddProductsToThemeDto) {
    // Vérifier que le thème existe
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId }
    });

    if (!theme) {
      throw new NotFoundException('Thème non trouvé');
    }

    // Construire les filtres pour les produits
    const where: any = {
      id: { in: addProductsDto.productIds },
      isDelete: false // Exclure les produits supprimés
    };

    // Ajouter le filtre de statut si spécifié
    if (addProductsDto.productStatus) {
      where.status = addProductsDto.productStatus;
    }

    // Vérifier que les produits existent et correspondent aux critères
    const products = await this.prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        isReadyProduct: true
      }
    });

    if (products.length === 0) {
      throw new BadRequestException('Aucun produit trouvé correspondant aux critères');
    }

    // Vérifier quels produits sont déjà dans le thème
    const existingThemeProducts = await this.prisma.themeProduct.findMany({
      where: {
        themeId,
        productId: { in: addProductsDto.productIds }
      },
      select: {
        productId: true
      }
    });

    const existingProductIds = existingThemeProducts.map(tp => tp.productId);
    const newProductIds = addProductsDto.productIds.filter(id => !existingProductIds.includes(id));

    if (newProductIds.length === 0) {
      return {
        success: true,
        message: 'Tous les produits sont déjà dans ce thème',
        data: {
          added: 0,
          alreadyExists: addProductsDto.productIds.length,
          total: addProductsDto.productIds.length
        }
      };
    }

    // Ajouter les nouveaux produits au thème
    const themeProducts = newProductIds.map(productId => ({
      themeId,
      productId
    }));

    await this.prisma.themeProduct.createMany({
      data: themeProducts,
      skipDuplicates: true
    });

    // Mettre à jour le compteur de produits du thème
    const currentCount = await this.prisma.themeProduct.count({
      where: { themeId }
    });

    await this.prisma.theme.update({
      where: { id: themeId },
      data: { productCount: currentCount }
    });

    return {
      success: true,
      message: 'Produits ajoutés au thème avec succès',
      data: {
        added: newProductIds.length,
        alreadyExists: existingProductIds.length,
        total: addProductsDto.productIds.length,
        themeId,
        productCount: currentCount
      }
    };
  }

  async getAvailableProducts(themeId: number, filters: {
    status?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    // Vérifier que le thème existe
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId }
    });

    if (!theme) {
      throw new NotFoundException('Thème non trouvé');
    }

    const { 
      status, 
      category, 
      search, 
      limit = 20, 
      offset = 0 
    } = filters;

    // Construire les filtres pour les produits
    const where: any = {
      isDelete: false, // Exclure les produits supprimés
      // Exclure les produits déjà dans le thème
      themeProducts: {
        none: {
          themeId
        }
      }
    };

    // Ajouter le filtre de statut si spécifié
    if (status) {
      where.status = status;
    }

    // Ajouter le filtre de catégorie si spécifié
    if (category) {
      where.categories = {
        some: {
          name: category
        }
      };
    }

    // Ajouter la recherche par nom si spécifiée
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Récupérer les produits disponibles
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          categories: {
            select: {
              name: true
            }
          },
          colorVariations: {
            include: {
              images: {
                take: 1,
                select: {
                  url: true,
                  view: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.product.count({ where })
    ]);

    // Transformer les données
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      status: product.status,
      isReadyProduct: product.isReadyProduct,
      description: product.description,
      categories: product.categories.map(cat => cat.name),
      mainImage: product.colorVariations[0]?.images[0]?.url || null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    return {
      success: true,
      data: transformedProducts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  async getThemeProducts(themeId: number, filters: {
    status?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    // Vérifier que le thème existe
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId }
    });

    if (!theme) {
      throw new NotFoundException('Thème non trouvé');
    }

    const { 
      status, 
      category, 
      search, 
      limit = 20, 
      offset = 0,
      sort = 'createdAt',
      order = 'desc'
    } = filters;

    // Construire les filtres pour les produits du thème
    const where: any = {
      isDelete: false, // Exclure les produits supprimés
      // Inclure uniquement les produits du thème
      themeProducts: {
        some: {
          themeId
        }
      }
    };

    // Ajouter le filtre de statut si spécifié
    if (status) {
      where.status = status;
    }

    // Ajouter le filtre de catégorie si spécifié
    if (category) {
      where.categories = {
        some: {
          name: category
        }
      };
    }

    // Ajouter la recherche par nom si spécifiée
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Construire l'ordre de tri
    const orderBy: any = {};
    if (sort === 'name') {
      orderBy.name = order;
    } else if (sort === 'price') {
      orderBy.price = order;
    } else {
      orderBy.createdAt = order;
    }

    // Récupérer les produits du thème
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          categories: {
            select: {
              name: true
            }
          },
          colorVariations: {
            include: {
              images: {
                select: {
                  url: true,
                  view: true,
                  publicId: true
                }
              }
            }
          },
          themeProducts: {
            where: { themeId },
            select: {
              createdAt: true
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.product.count({ where })
    ]);

    // Transformer les données
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      status: product.status,
      isReadyProduct: product.isReadyProduct,
      description: product.description,
      categories: product.categories.map(cat => cat.name),
      mainImage: product.colorVariations[0]?.images[0]?.url || null,
      addedToThemeAt: product.themeProducts[0]?.createdAt || null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      colorVariations: product.colorVariations.map(colorVar => ({
        id: colorVar.id,
        name: colorVar.name,
        colorCode: colorVar.colorCode,
        images: colorVar.images.map(img => ({
          url: img.url,
          view: img.view,
          publicId: img.publicId
        }))
      }))
    }));

    return {
      success: true,
      data: transformedProducts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      theme: {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        coverImage: theme.coverImageUrl,
        category: theme.category,
        status: theme.status === PrismaThemeStatus.ACTIVE ? 'active' : 'inactive',
        featured: theme.featured
      }
    };
  }

  async removeProductsFromTheme(themeId: number, productIds: number[]) {
    // Vérifier que le thème existe
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId }
    });

    if (!theme) {
      throw new NotFoundException('Thème non trouvé');
    }

    // Vérifier que les produits existent dans le thème
    const existingThemeProducts = await this.prisma.themeProduct.findMany({
      where: {
        themeId,
        productId: { in: productIds }
      },
      select: {
        productId: true
      }
    });

    if (existingThemeProducts.length === 0) {
      return {
        success: true,
        message: 'Aucun produit trouvé dans ce thème',
        data: {
          removed: 0,
          notFound: productIds.length,
          total: productIds.length
        }
      };
    }

    const existingProductIds = existingThemeProducts.map(tp => tp.productId);

    // Supprimer les produits du thème
    await this.prisma.themeProduct.deleteMany({
      where: {
        themeId,
        productId: { in: existingProductIds }
      }
    });

    // Mettre à jour le compteur de produits du thème
    const currentCount = await this.prisma.themeProduct.count({
      where: { themeId }
    });

    await this.prisma.theme.update({
      where: { id: themeId },
      data: { productCount: currentCount }
    });

    return {
      success: true,
      message: 'Produits supprimés du thème avec succès',
      data: {
        removed: existingProductIds.length,
        notFound: productIds.length - existingProductIds.length,
        total: productIds.length,
        themeId,
        productCount: currentCount
      }
    };
  }
} 