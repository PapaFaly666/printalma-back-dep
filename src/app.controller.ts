import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
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
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Nombre de produits (défaut: 20)' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Pagination (défaut: 0)' })
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Recherche textuelle' })
  @ApiQuery({ name: 'vendorId', required: false, type: 'number', description: 'Filtrer par vendeur' })
  @ApiQuery({ name: 'category', required: false, type: 'string', description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'adminProductName', required: false, type: 'string', description: 'Filtrer par nom de produit admin' })
  @ApiQuery({ name: 'minPrice', required: false, type: 'number', description: 'Prix minimum' })
  @ApiQuery({ name: 'maxPrice', required: false, type: 'number', description: 'Prix maximum' })
  @ApiQuery({ name: 'allProducts', required: false, type: 'boolean', description: 'Inclure tous les produits (défaut: true)' })
  @ApiQuery({ name: 'genre', required: false, enum: ['HOMME', 'FEMME', 'BEBE', 'UNISEXE'], description: 'Filtrer par genre (public cible)' })
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
    @Query('genre') genre?: string,
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
      if (genre) filters.genre = genre;

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
