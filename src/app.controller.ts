import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { VendorPublishService } from './vendor-product/vendor-publish.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly vendorPublishService: VendorPublishService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('public/vendor-products')
  async getAllVendorProducts(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('search') search?: string,
    @Query('vendorId') vendorId?: number,
    @Query('category') category?: string,
    @Query('adminProductName') adminProductName?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('allProducts') allProducts?: boolean,
  ) {
    try {
      // Construire les filtres
      const filters: any = {};

      if (vendorId) filters.vendorId = parseInt(vendorId.toString());
      if (search) filters.search = search;
      if (category) filters.category = category;
      if (adminProductName) filters.adminProductName = adminProductName;
      if (minPrice) filters.minPrice = minPrice;
      if (maxPrice) filters.maxPrice = maxPrice;

      // Par défaut on affiche tous les produits (pas seulement les best sellers)
      // Sauf si on veut explicitement filtrer par best sellers
      if (allProducts === false) {
        filters.isBestSeller = true;
      }

      // Récupérer les produits enrichis avec toutes les informations
      const result = await this.vendorPublishService.getPublicVendorProducts({
        limit: Math.min(limit || 20, 100),
        offset: offset || 0,
        ...filters
      });

      // Retourner les produits enrichis avec toutes les informations
      return {
        success: true,
        message: 'Produits récupérés avec succès',
        data: result.products,
        pagination: result.pagination
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
