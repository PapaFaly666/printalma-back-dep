import {
  Controller,
  Get,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';

@ApiTags('public-vendor-products')
@Controller('api/public/vendor-products')
export class SimplePublicProductsController {
  private readonly logger = new Logger(SimplePublicProductsController.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister tous les produits vendeurs (Public)',
    description: 'Récupère tous les produits vendeurs sans nécessiter d\'authentification'
  })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Nombre de produits (défaut: 20)' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Pagination (défaut: 0)' })
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Recherche textuelle' })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des produits récupérée avec succès'
  })
  async getAllVendorProducts(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('search') search?: string,
  ) {
    this.logger.log(`📦 Récupération de tous les produits vendeurs`);
    
    try {
      const whereClause: any = {
        isDelete: false,
        status: 'PUBLISHED'
      };

      // Recherche textuelle si fournie
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const products = await this.prisma.vendorProduct.findMany({
        where: whereClause,
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
                      naturalHeight: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: Math.min(limit || 20, 100),
        skip: offset || 0,
      });

      // Compter le total pour la pagination
      const total = await this.prisma.vendorProduct.count({
        where: whereClause
      });

      return {
        success: true,
        message: 'Produits récupérés avec succès',
        data: {
          products: products.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            status: product.status,
            createdAt: product.createdAt,
            vendor: {
              id: product.vendor.id,
              name: `${product.vendor.firstName} ${product.vendor.lastName}`,
              shopName: product.vendor.shop_name,
              photo: product.vendor.profile_photo_url
            },
            baseProduct: product.baseProduct,
            images: product.baseProduct?.colorVariations?.[0]?.images || []
          })),
          pagination: {
            total,
            limit: limit || 20,
            offset: offset || 0,
            pages: Math.ceil(total / (limit || 20))
          }
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur récupération produits:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des produits',
        error: error.message
      };
    }
  }
}