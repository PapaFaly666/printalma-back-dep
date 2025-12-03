import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

interface GetAllDesignsParams {
  limit?: number;
  offset?: number;
  search?: string;
  categoryId?: number;
  vendorId?: number;
}

@Injectable()
export class PublicDesignsService {
  private readonly logger = new Logger(PublicDesignsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllDesigns(params: GetAllDesignsParams) {
    const { limit, offset, search, categoryId, vendorId } = params;

    try {
      const whereClause: any = {
        isDelete: false,
        isPublished: true,
        isValidated: true,
      };

      // Filtrage par recherche textuelle
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }

      // Filtrage par catégorie
      if (categoryId) {
        whereClause.categoryId = categoryId;
      }

      // Filtrage par vendeur
      if (vendorId) {
        whereClause.vendorId = vendorId;
      }

      const designs = await this.prisma.design.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              shop_name: true,
              profile_photo_url: true,
              country: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              coverImageUrl: true,
            },
          },
          vendorProducts: {
            where: {
              isDelete: false,
              status: 'PUBLISHED',
            },
            include: {
              baseProduct: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  colorVariations: {
                    select: {
                      id: true,
                      name: true,
                      colorCode: true,
                      images: {
                        select: {
                          id: true,
                          url: true,
                          naturalWidth: true,
                          naturalHeight: true,
                          delimitations: {
                            select: {
                              id: true,
                              name: true,
                              x: true,
                              y: true,
                              width: true,
                              height: true,
                              rotation: true,
                              coordinateType: true,
                              absoluteX: true,
                              absoluteY: true,
                              absoluteWidth: true,
                              absoluteHeight: true,
                              originalImageWidth: true,
                              originalImageHeight: true,
                              referenceWidth: true,
                              referenceHeight: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              designPositions: {
                select: {
                  position: true,
                  designId: true,
                },
              },
            },
          },
          productPositions: {
            select: {
              position: true,
              vendorProductId: true,
            },
          },
        },
        orderBy: [
          { views: 'desc' },
          { likes: 'desc' },
          { createdAt: 'desc' },
        ],
        take: Math.min(limit || 20, 100),
        skip: offset || 0,
      });

      // Compter le total pour la pagination
      const total = await this.prisma.design.count({
        where: whereClause,
      });

      return {
        success: true,
        message: 'Designs récupérés avec succès',
        data: designs.map((design) => this.formatDesignResponse(design)),
        pagination: {
          total,
          limit: limit || 20,
          offset: offset || 0,
          hasMore: (offset || 0) + (limit || 20) < total,
        },
      };
    } catch (error) {
      this.logger.error('❌ Erreur récupération designs:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des designs',
        error: error.message,
      };
    }
  }

  async getDesignById(designId: number) {
    try {
      const design = await this.prisma.design.findFirst({
        where: {
          id: designId,
          isDelete: false,
          isPublished: true,
          isValidated: true,
        },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              shop_name: true,
              profile_photo_url: true,
              country: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              coverImageUrl: true,
            },
          },
          vendorProducts: {
            where: {
              isDelete: false,
              status: 'PUBLISHED',
            },
            include: {
              baseProduct: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  colorVariations: {
                    select: {
                      id: true,
                      name: true,
                      colorCode: true,
                      images: {
                        select: {
                          id: true,
                          url: true,
                          naturalWidth: true,
                          naturalHeight: true,
                          delimitations: {
                            select: {
                              id: true,
                              name: true,
                              x: true,
                              y: true,
                              width: true,
                              height: true,
                              rotation: true,
                              coordinateType: true,
                              absoluteX: true,
                              absoluteY: true,
                              absoluteWidth: true,
                              absoluteHeight: true,
                              originalImageWidth: true,
                              originalImageHeight: true,
                              referenceWidth: true,
                              referenceHeight: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              designPositions: {
                select: {
                  position: true,
                  designId: true,
                },
              },
            },
          },
          productPositions: {
            select: {
              position: true,
              vendorProductId: true,
            },
          },
        },
      });

      if (!design) {
        throw new NotFoundException(`Design #${designId} non trouvé`);
      }

      // Incrémenter les vues
      await this.prisma.design.update({
        where: { id: designId },
        data: { views: { increment: 1 } },
      });

      return {
        success: true,
        message: 'Design récupéré avec succès',
        data: this.formatDesignResponse(design),
      };
    } catch (error) {
      this.logger.error(`❌ Erreur récupération design #${designId}:`, error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      return {
        success: false,
        message: 'Erreur lors de la récupération du design',
        error: error.message,
      };
    }
  }

  private formatDesignResponse(design: any) {
    return {
      id: design.id,
      name: design.name,
      description: design.description,
      price: design.price,
      imageUrl: design.imageUrl,
      thumbnailUrl: design.thumbnailUrl,
      dimensions: design.dimensions,
      format: design.format,
      tags: design.tags,
      views: design.views,
      likes: design.likes,
      earnings: design.earnings,
      usageCount: design.usageCount,
      createdAt: design.createdAt,
      publishedAt: design.publishedAt,

      // Informations du vendeur/créateur
      vendor: {
        id: design.vendor.id,
        name: `${design.vendor.firstName} ${design.vendor.lastName}`,
        shopName: design.vendor.shop_name,
        email: design.vendor.email,
        photo: design.vendor.profile_photo_url,
        country: design.vendor.country,
      },

      // Catégorie du design
      category: design.category,

      // Produits mockup associés avec leurs détails
      mockupProducts: design.vendorProducts.map((vp: any) => ({
        id: vp.id,
        name: vp.name,
        description: vp.description,
        price: vp.price,
        stock: vp.stock,
        status: vp.status,

        // Produit de base avec ses variations de couleur
        baseProduct: {
          id: vp.baseProduct?.id,
          name: vp.baseProduct?.name,
          description: vp.baseProduct?.description,

          // Variations de couleur avec images et délimitations
          colorVariations: vp.baseProduct?.colorVariations?.map((cv: any) => ({
            id: cv.id,
            name: cv.name,
            colorCode: cv.colorCode,

            // Images avec délimitations
            images: cv.images?.map((img: any) => ({
              id: img.id,
              url: img.url,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,

              // Zones de délimitation pour le design
              delimitations: img.delimitations?.map((delim: any) => ({
                id: delim.id,
                name: delim.name,
                x: delim.x,
                y: delim.y,
                width: delim.width,
                height: delim.height,
                rotation: delim.rotation,
                coordinateType: delim.coordinateType,
                absoluteX: delim.absoluteX,
                absoluteY: delim.absoluteY,
                absoluteWidth: delim.absoluteWidth,
                absoluteHeight: delim.absoluteHeight,
                originalImageWidth: delim.originalImageWidth,
                originalImageHeight: delim.originalImageHeight,
                referenceWidth: delim.referenceWidth,
                referenceHeight: delim.referenceHeight,
              })) || [],
            })) || [],
          })) || [],
        },

        // Positions du design sur ce produit
        designPositions: vp.designPositions?.map((dp: any) => ({
          position: dp.position,
          designId: dp.designId,
        })) || [],
      })),

      // Positions globales du design
      productPositions: design.productPositions?.map((pp: any) => ({
        position: pp.position,
        vendorProductId: pp.vendorProductId,
      })) || [],
    };
  }
}
