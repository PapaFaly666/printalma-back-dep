import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from 'prisma.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly prisma: PrismaService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('public/vendor-products')
  async getAllVendorProducts(
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    try {
      const whereClause: any = {
        isDelete: false,
        status: 'PUBLISHED'
      };

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
              shop_name: true
            }
          },
          baseProduct: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: Math.min(limit || 20, 100)
      });

      return {
        success: true,
        message: 'Produits récupérés avec succès',
        data: products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          status: product.status,
          createdAt: product.createdAt,
          vendor: {
            id: product.vendor.id,
            name: `${product.vendor.firstName} ${product.vendor.lastName}`,
            shopName: product.vendor.shop_name
          },
          baseProduct: product.baseProduct
        }))
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des produits',
        error: error.message
      };
    }
  }
}
