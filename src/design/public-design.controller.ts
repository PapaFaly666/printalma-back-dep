import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('public-designs')
@Controller('public/designs')
export class PublicDesignController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all validated vendor designs with their products and creator info',
    description: 'Returns all published and validated designs from vendors with detailed information including creator, products, pricing, and statistics'
  })
  @ApiResponse({
    status: 200,
    description: 'List of all validated vendor designs',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Designs récupérés avec succès' },
        data: {
          type: 'object',
          properties: {
            designs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Design personnalisé' },
                  description: { type: 'string', example: 'Un magnifique design personnalisé' },
                  price: { type: 'number', example: 25000 },
                  imageUrl: { type: 'string', example: 'https://cloudinary.com/design.jpg' },
                  thumbnailUrl: { type: 'string', example: 'https://cloudinary.com/thumb.jpg' },
                  format: { type: 'string', example: 'SVG' },
                  fileSize: { type: 'number', example: 245760 },
                  views: { type: 'number', example: 150 },
                  likes: { type: 'number', example: 25 },
                  earnings: { type: 'number', example: 125000 },
                  usageCount: { type: 'number', example: 8 },
                  tags: { type: 'array', items: { type: 'string' }, example: ['custom', 'art'] },
                  createdAt: { type: 'string', example: '2025-01-15T10:30:00Z' },
                  publishedAt: { type: 'string', example: '2025-01-15T14:20:00Z' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      name: { type: 'string' },
                      slug: { type: 'string' }
                    }
                  },
                  creator: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      shop_name: { type: 'string' },
                      profile_photo_url: { type: 'string' },
                      vendeur_type: { type: 'string' }
                    }
                  },
                  vendorProducts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        stock: { type: 'number' },
                        status: { type: 'string' },
                        salesCount: { type: 'number' },
                        totalRevenue: { type: 'number' },
                        isBestSeller: { type: 'boolean' },
                        viewsCount: { type: 'number' },
                        designApplicationMode: { type: 'string' },
                        designScale: { type: 'number' },
                        createdAt: { type: 'string' },
                        baseProduct: {
                          type: 'object',
                          properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                            genre: { type: 'string' }
                          }
                        }
                      }
                    }
                  },
                  statistics: {
                    type: 'object',
                    properties: {
                      totalProducts: { type: 'number' },
                      totalSales: { type: 'number' },
                      totalRevenue: { type: 'number' },
                      averageProductPrice: { type: 'number' }
                    }
                  }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'category', required: false, type: 'string', description: 'Filter by category slug' })
  @ApiQuery({ name: 'vendor', required: false, type: 'string', description: 'Filter by vendor shop name' })
  @ApiQuery({ name: 'minPrice', required: false, type: 'number', description: 'Minimum design price' })
  @ApiQuery({ name: 'maxPrice', required: false, type: 'number', description: 'Maximum design price' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'publishedAt', 'views', 'likes', 'earnings'], description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })

  async getAllDesigns(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('category') category: string,
    @Query('vendor') vendor: string,
    @Query('minPrice') minPrice: number,
    @Query('maxPrice') maxPrice: number,
    @Query('sortBy') sortBy: string = 'publishedAt',
    @Query('sortOrder') sortOrder: string = 'desc'
  ) {
    try {
      // Validation et conversion des paramètres
      const validLimit = Math.min(Math.max(parseInt(String(limit)) || 20, 1), 100);
      const validPage = Math.max(parseInt(String(page)) || 1, 1);
      const skip = (validPage - 1) * validLimit;

      // Conversion des paramètres de prix
      const parsedMinPrice = minPrice ? parseFloat(String(minPrice)) : undefined;
      const parsedMaxPrice = maxPrice ? parseFloat(String(maxPrice)) : undefined;

      // Construction du filtre
      const where: any = {
        isPublished: true,
        isValidated: true,
        isDelete: false,
        isDraft: false
      };

      // Filtre par catégorie
      if (category) {
        where.category = {
          slug: category,
          isActive: true
        };
      }

      // Filtre par vendeur
      if (vendor) {
        where.vendor = {
          shop_name: {
            contains: vendor,
            mode: 'insensitive'
          }
        };
      }

      // Filtre par prix
      if (parsedMinPrice !== undefined || parsedMaxPrice !== undefined) {
        where.price = {};
        if (!isNaN(parsedMinPrice) && parsedMinPrice >= 0) where.price.gte = parsedMinPrice;
        if (!isNaN(parsedMaxPrice) && parsedMaxPrice >= 0) where.price.lte = parsedMaxPrice;
      }

      // Construction du tri
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Récupération des designs avec toutes les informations
      const [designs, total] = await Promise.all([
        this.prisma.design.findMany({
          where,
          include: {
            // Informations du créateur
            vendor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                shop_name: true,
                profile_photo_url: true,
                vendeur_type: true,
                email: true,
                phone: true
              }
            },
            // Catégorie du design
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true
              }
            },
            // Produits vendeurs utilisant ce design
            vendorProducts: {
              where: {
                status: 'PUBLISHED',
                isValidated: true,
                isDelete: false
              },
              include: {
                baseProduct: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    genre: true,
                    categoryId: true
                  }
                },
                vendor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    shop_name: true
                  }
                },
                images: {
                  select: {
                    id: true,
                    cloudinaryUrl: true,
                    colorName: true,
                    colorCode: true,
                    imageType: true,
                    finalImageUrl: true,
                    finalImagePublicId: true,
                    colorId: true
                  },
                  take: 3 // Limiter à 3 images par produit
                }
              },
              orderBy: {
                salesCount: 'desc'
              },
              take: 5 // Limiter à 5 produits par design
            }
          },
          orderBy,
          skip,
          take: validLimit
        }),
        this.prisma.design.count({ where })
      ]);

      // Enrichissement des données avec statistiques
      const enrichedDesigns = designs.map(design => {
        const vendorProducts = design.vendorProducts || [];

        // Calcul des statistiques pour ce design
        const totalProducts = vendorProducts.length;
        const totalSales = vendorProducts.reduce((sum, product) => sum + product.salesCount, 0);
        const totalRevenue = vendorProducts.reduce((sum, product) => sum + product.totalRevenue, 0);
        const averageProductPrice = totalProducts > 0 ? totalRevenue / totalSales : 0;

        // Traitement des dimensions si disponibles
        let dimensions = null;
        try {
          dimensions = typeof design.dimensions === 'string'
            ? JSON.parse(design.dimensions)
            : design.dimensions;
        } catch (e) {
          console.error(`Error parsing dimensions for design ${design.id}:`, e);
        }

        return {
          // Informations principales du design
          id: design.id,
          name: design.name,
          description: design.description,
          price: design.price,
          imageUrl: design.imageUrl,
          thumbnailUrl: design.thumbnailUrl,
          cloudinaryPublicId: design.cloudinaryPublicId,
          format: design.format,
          fileSize: design.fileSize,
          originalFileName: design.originalFileName,

          // Dimensions et métadonnées
          dimensions,
          tags: design.tags || [],

          // Statistiques d'engagement
          views: design.views,
          likes: design.likes,
          earnings: design.earnings,
          usageCount: design.usageCount,

          // Dates
          createdAt: design.createdAt,
          updatedAt: design.updatedAt,
          publishedAt: design.publishedAt,
          validatedAt: design.validatedAt,

          // Catégorie
          category: design.category ? {
            id: design.category.id,
            name: design.category.name,
            slug: design.category.slug,
            description: design.category.description
          } : null,

          // Créateur
          creator: design.vendor ? {
            id: design.vendor.id,
            firstName: design.vendor.firstName,
            lastName: design.vendor.lastName,
            fullName: `${design.vendor.firstName} ${design.vendor.lastName}`,
            shopName: design.vendor.shop_name,
            profilePhotoUrl: design.vendor.profile_photo_url,
            sellerType: design.vendor.vendeur_type,
            email: design.vendor.email,
            phone: design.vendor.phone
          } : null,

          // Produits vendeurs utilisant ce design
          vendorProducts: vendorProducts.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            status: product.status,
            salesCount: product.salesCount,
            totalRevenue: product.totalRevenue,
            averageRating: product.averageRating,
            isBestSeller: product.isBestSeller,
            viewsCount: product.viewsCount,

            // Configuration du design
            designApplicationMode: product.designApplicationMode,
            designScale: product.designScale,
            designPositioning: product.designPositioning,
            designWidth: product.designWidth,
            designHeight: product.designHeight,

            // Produit de base
            baseProduct: product.baseProduct ? {
              id: product.baseProduct.id,
              name: product.baseProduct.name,
              description: product.baseProduct.description,
              genre: product.baseProduct.genre,
              categoryId: product.baseProduct.categoryId
            } : null,

            // Images du produit
            images: product.images?.map(img => ({
              id: img.id,
              url: img.cloudinaryUrl,
              colorName: img.colorName,
              colorCode: img.colorCode,
              imageType: img.imageType
            })) || [],

            // Dates
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            validatedAt: product.validatedAt
          })),

          // Statistiques calculées
          statistics: {
            totalProducts,
            totalSales,
            totalRevenue,
            averageProductPrice: averageProductPrice || 0,
            conversionRate: design.views > 0 ? (totalSales / design.views) * 100 : 0
          }
        };
      });

      const totalPages = Math.ceil(total / validLimit);

      return {
        success: true,
        message: 'Designs récupérés avec succès',
        data: {
          designs: enrichedDesigns,
          pagination: {
            total,
            page: validPage,
            limit: validLimit,
            totalPages,
            hasNextPage: validPage < totalPages,
            hasPreviousPage: validPage > 1
          },
          filters: {
            category,
            vendor,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder
          }
        }
      };

    } catch (error) {
      console.error('Error fetching public designs:', error);
      throw new NotFoundException('Erreur lors de la récupération des designs');
    }
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Get all design categories with counts',
    description: 'Returns all active design categories with the number of designs in each category'
  })
  async getCategories() {
    try {
      const categories = await this.prisma.designCategory.findMany({
        where: {
          isActive: true
        },
        include: {
          _count: {
            select: {
              designs: {
                where: {
                  isPublished: true,
                  isValidated: true,
                  isDelete: false,
                  isDraft: false
                }
              }
            }
          }
        },
        orderBy: {
          sortOrder: 'asc'
        }
      });

      return {
        success: true,
        message: 'Catégories récupérées avec succès',
        data: {
          categories: categories.map(category => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            coverImageUrl: category.coverImageUrl,
            isFeatured: category.isFeatured,
            featuredOrder: category.featuredOrder,
            designCount: category._count.designs,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
          })),
          total: categories.length
        }
      };

    } catch (error) {
      console.error('Error fetching design categories:', error);
      throw new NotFoundException('Erreur lors de la récupération des catégories');
    }
  }

  @Get('test')
  @ApiOperation({
    summary: 'Test endpoint',
    description: 'Simple test endpoint that doesn\'t require database'
  })
  async getTest() {
    try {
      return {
        success: true,
        message: 'Public designs controller is working!',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in test endpoint:', error);
      throw new NotFoundException('Erreur lors du test');
    }
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Get featured designs',
    description: 'Returns featured and popular designs based on views, likes, and sales'
  })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Maximum number of designs (default: 10)' })
  async getFeaturedDesigns(@Query('limit') limit: number = 10) {
    try {
      const validLimit = Math.min(Math.max(limit, 1), 50);

      const featuredDesigns = await this.prisma.design.findMany({
        where: {
          isPublished: true,
          isValidated: true,
          isDelete: false,
          isDraft: false,
          OR: [
            {
              category: {
                isFeatured: true
              }
            },
            {
              views: {
                gte: 100
              }
            },
            {
              likes: {
                gte: 10
              }
            }
          ]
        },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              shop_name: true,
              profile_photo_url: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          vendorProducts: {
            where: {
              status: 'PUBLISHED',
              isValidated: true
            },
            select: {
              id: true,
              name: true,
              price: true,
              salesCount: true,
              totalRevenue: true
            },
            take: 3
          }
        },
        orderBy: [
          { views: 'desc' },
          { likes: 'desc' },
          { publishedAt: 'desc' }
        ],
        take: validLimit
      });

      return {
        success: true,
        message: 'Designs en vedette récupérés avec succès',
        data: {
          designs: featuredDesigns.map(design => ({
            id: design.id,
            name: design.name,
            description: design.description,
            price: design.price,
            imageUrl: design.imageUrl,
            thumbnailUrl: design.thumbnailUrl,
            views: design.views,
            likes: design.likes,
            tags: design.tags || [],
            publishedAt: design.publishedAt,
            creator: {
              id: design.vendor.id,
              firstName: design.vendor.firstName,
              lastName: design.vendor.lastName,
              shopName: design.vendor.shop_name,
              profilePhotoUrl: design.vendor.profile_photo_url
            },
            category: design.category ? {
              id: design.category.id,
              name: design.category.name,
              slug: design.category.slug
            } : null,
            vendorProducts: design.vendorProducts,
            statistics: {
              totalProducts: design.vendorProducts.length,
              totalSales: design.vendorProducts.reduce((sum, p) => sum + p.salesCount, 0),
              totalRevenue: design.vendorProducts.reduce((sum, p) => sum + p.totalRevenue, 0)
            }
          })),
          total: featuredDesigns.length
        }
      };

    } catch (error) {
      console.error('Error fetching featured designs:', error);
      throw new NotFoundException('Erreur lors de la récupération des designs en vedette');
    }
  }
}