import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';

@ApiTags('Public Best Sellers')
@Controller('public')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(
    private readonly prismaService: PrismaService,
  ) {}

  @Get('best-sellers')
  @ApiOperation({
    summary: 'Lister les meilleures ventes publiques',
    description: `
    Retourne la liste des produits les plus vendus (best sellers) de manière publique.
    Les produits sont triés par nombre de ventes décroissant et filtrés pour n'afficher
    que les produits validés et publiés.

    **Critères de classement:**
    1. Nombre de ventes (salesCount) - priorité principale
    2. Revenu total (totalRevenue) - priorité secondaire
    3. Date de dernière vente (lastSaleDate) - priorité tertiaire

    **Filtres appliqués:**
    - Produits validés (isValidated = true)
    - Produits publiés (status = PUBLISHED)
    - Non supprimés (isDelete = false)
    `
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre de produits à retourner (défaut: 20, maximum: 100)'
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filtrer par nom de catégorie'
  })
  @ApiQuery({
    name: 'genre',
    required: false,
    enum: ['HOMME', 'FEMME', 'BEBE', 'UNISEXE'],
    description: 'Filtrer par genre (public cible)'
  })
  @ApiQuery({
    name: 'minSales',
    required: false,
    type: Number,
    description: 'Nombre minimum de ventes (défaut: 1)'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des meilleures ventes récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            bestSellers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'T-shirt Premium Coton Bio' },
                  description: { type: 'string', example: 'T-shirt de haute qualité en coton biologique' },
                  price: { type: 'number', example: 25000 },
                  salesCount: { type: 'number', example: 150 },
                  totalRevenue: { type: 'number', example: 3750000 },
                  averageRating: { type: 'number', example: 4.5, nullable: true },
                  lastSaleDate: { type: 'string', example: '2024-01-15T10:30:00Z', nullable: true },
                  isBestSeller: { type: 'boolean', example: true },
                  bestSellerRank: { type: 'number', example: 1, nullable: true },
                  viewsCount: { type: 'number', example: 1250 },
                  vendorId: { type: 'number', example: 123 },
                  vendorName: { type: 'string', example: 'Boutique Mode' },
                  baseProductId: { type: 'number', example: 45 },
                  baseProductName: { type: 'string', example: 'T-shirt Classic' },
                  category: { type: 'string', example: 'Vêtements' },
                  genre: { type: 'string', example: 'UNISEXE' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 50 },
                limit: { type: 'number', example: 20 },
                hasMore: { type: 'boolean', example: true }
              }
            },
            filters: {
              type: 'object',
              properties: {
                category: { type: 'string', nullable: true },
                genre: { type: 'string', nullable: true },
                minSales: { type: 'number', example: 1 }
              }
            }
          }
        }
      }
    }
  })
  async getBestSellers(
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('genre') genre?: string,
    @Query('minSales') minSales?: number,
  ) {
    this.logger.log(`📈 Récupération des meilleures ventes - limit: ${limit}, category: ${category}, genre: ${genre}, minSales: ${minSales}`);

    try {
      // Validation des paramètres
      const parsedLimit = Math.min(Math.max(limit || 20, 1), 100); // Entre 1 et 100
      const parsedMinSales = Math.max(minSales || 1, 0); // Minimum 0

      // Construction de la requête SQL pour éviter les problèmes de types Prisma
      let sqlQuery = `
        SELECT
          vp.id,
          vp.name,
          vp.description,
          vp.price,
          vp.sales_count,
          vp.total_revenue,
          vp.average_rating,
          vp.last_sale_date,
          vp.is_best_seller,
          vp.best_seller_rank,
          vp.views_count,
          vp.vendor_id,
          u.shop_name as vendor_name,
          u.first_name as vendor_first_name,
          u.last_name as vendor_last_name,
          vp.base_product_id,
          p.name as base_product_name,
          p.genre,
          c.name as category_name
        FROM vendor_products vp
        JOIN users u ON vp.vendor_id = u.id
        JOIN products p ON vp.base_product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE vp.is_validated = true
          AND vp.status = 'PUBLISHED'
          AND vp.is_delete = false
          AND vp.sales_count >= $1
      `;

      const params: (number | string)[] = [parsedMinSales];

      // Ajout des filtres
      if (category) {
        sqlQuery += ` AND LOWER(c.name) LIKE LOWER($${params.length + 1})`;
        params.push(`%${category}%`);
      }

      if (genre) {
        sqlQuery += ` AND p.genre = $${params.length + 1}`;
        params.push(genre);
      }

      // Ajout du tri et de la limitation
      sqlQuery += `
        ORDER BY vp.sales_count DESC, vp.total_revenue DESC, vp.last_sale_date DESC NULLS LAST
        LIMIT $${params.length + 1}
      `;
      params.push(parsedLimit);

      // Exécution de la requête principale
      const bestSellers = await this.prismaService.$queryRawUnsafe(sqlQuery, ...params) as Array<{
        id: number;
        name: string;
        description: string | null;
        price: number;
        sales_count: bigint;
        total_revenue: bigint;
        average_rating: number | null;
        last_sale_date: Date | null;
        is_best_seller: boolean;
        best_seller_rank: number | null;
        views_count: bigint;
        vendor_id: number;
        vendor_name: string | null;
        vendor_first_name: string | null;
        vendor_last_name: string | null;
        base_product_id: number;
        base_product_name: string;
        genre: string;
        category_name: string | null;
      }>;

      // Requête pour le comptage total
      let countQuery = `
        SELECT COUNT(*) as total
        FROM vendor_products vp
        JOIN products p ON vp.base_product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE vp.is_validated = true
          AND vp.status = 'PUBLISHED'
          AND vp.is_delete = false
          AND vp.sales_count >= $1
      `;

      const countParams: (number | string)[] = [parsedMinSales];

      if (category) {
        countQuery += ` AND LOWER(c.name) LIKE LOWER($${countParams.length + 1})`;
        countParams.push(`%${category}%`);
      }

      if (genre) {
        countQuery += ` AND p.genre = $${countParams.length + 1}`;
        countParams.push(genre);
      }

      const countResult = await this.prismaService.$queryRawUnsafe(countQuery, ...countParams) as Array<{ total: bigint }>;
      const total = Number(countResult[0].total);

      // Formatage des résultats
      const formattedBestSellers = bestSellers.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        salesCount: Number(product.sales_count),
        totalRevenue: Number(product.total_revenue),
        averageRating: product.average_rating,
        lastSaleDate: product.last_sale_date,
        isBestSeller: product.is_best_seller,
        bestSellerRank: product.best_seller_rank,
        viewsCount: Number(product.views_count),
        vendorId: product.vendor_id,
        vendorName: product.vendor_name || `${product.vendor_first_name} ${product.vendor_last_name}`,
        baseProductId: product.base_product_id,
        baseProductName: product.base_product_name,
        category: product.category_name || 'Non catégorisé',
        genre: product.genre
      }));

      const response = {
        success: true,
        data: {
          bestSellers: formattedBestSellers,
          pagination: {
            total,
            limit: parsedLimit,
            hasMore: total > parsedLimit
          },
          filters: {
            category: category || null,
            genre: genre || null,
            minSales: parsedMinSales
          }
        }
      };

      this.logger.log(`✅ ${formattedBestSellers.length} meilleures ventes récupérées avec succès`);
      return response;

    } catch (error) {
      this.logger.error(`❌ Erreur lors de la récupération des meilleures ventes: ${error.message}`);
      throw error;
    }
  }

  @Get('best-sellers/stats')
  @ApiOperation({
    summary: 'Statistiques des meilleures ventes',
    description: `
    Retourne des statistiques générales sur les meilleures ventes.
    Utile pour les dashboards et pages d'accueil.
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des meilleures ventes',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            totalBestSellers: { type: 'number', example: 25 },
            totalSales: { type: 'number', example: 5000 },
            totalRevenue: { type: 'number', example: 125000000 },
            topCategory: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Vêtements' },
                productCount: { type: 'number', example: 15 },
                totalSales: { type: 'number', example: 3000 }
              }
            },
            topGenre: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'UNISEXE' },
                productCount: { type: 'number', example: 12 },
                totalSales: { type: 'number', example: 2500 }
              }
            },
            averagePrice: { type: 'number', example: 25000 },
            averageSalesPerProduct: { type: 'number', example: 200 }
          }
        }
      }
    }
  })
  async getBestSellersStats() {
    this.logger.log('📊 Récupération des statistiques des meilleures ventes');

    try {
      // Statistiques générales
      const statsQuery = `
        SELECT
          COUNT(*) as total_best_sellers,
          COALESCE(SUM(sales_count), 0) as total_sales,
          COALESCE(SUM(total_revenue), 0) as total_revenue,
          COALESCE(AVG(price), 0) as average_price,
          COALESCE(AVG(sales_count), 0) as average_sales_per_product
        FROM vendor_products
        WHERE is_validated = true
          AND status = 'PUBLISHED'
          AND is_delete = false
          AND sales_count > 0
      `;

      const statsResult = await this.prismaService.$queryRawUnsafe(statsQuery) as Array<{
        total_best_sellers: bigint;
        total_sales: bigint;
        total_revenue: bigint;
        average_price: number;
        average_sales_per_product: number;
      }>;

      // Catégorie la plus populaire
      const topCategoryQuery = `
        SELECT
          c.name,
          COUNT(vp.id) as product_count,
          COALESCE(SUM(vp.sales_count), 0) as total_sales
        FROM vendor_products vp
        JOIN products p ON vp.base_product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE vp.is_validated = true
          AND vp.status = 'PUBLISHED'
          AND vp.is_delete = false
          AND vp.sales_count > 0
        GROUP BY c.name
        ORDER BY total_sales DESC
        LIMIT 1
      `;

      const topCategoryResult = await this.prismaService.$queryRawUnsafe(topCategoryQuery) as Array<{
        name: string;
        product_count: bigint;
        total_sales: bigint;
      }>;

      // Genre le plus populaire
      const topGenreQuery = `
        SELECT
          p.genre,
          COUNT(vp.id) as product_count,
          COALESCE(SUM(vp.sales_count), 0) as total_sales
        FROM vendor_products vp
        JOIN products p ON vp.base_product_id = p.id
        WHERE vp.is_validated = true
          AND vp.status = 'PUBLISHED'
          AND vp.is_delete = false
          AND vp.sales_count > 0
        GROUP BY p.genre
        ORDER BY total_sales DESC
        LIMIT 1
      `;

      const topGenreResult = await this.prismaService.$queryRawUnsafe(topGenreQuery) as Array<{
        genre: string;
        product_count: bigint;
        total_sales: bigint;
      }>;

      const stats = statsResult[0];
      const topCategory = topCategoryResult[0];
      const topGenre = topGenreResult[0];

      const response = {
        success: true,
        data: {
          totalBestSellers: Number(stats.total_best_sellers),
          totalSales: Number(stats.total_sales),
          totalRevenue: Number(stats.total_revenue),
          topCategory: topCategory ? {
            name: topCategory.name,
            productCount: Number(topCategory.product_count),
            totalSales: Number(topCategory.total_sales)
          } : null,
          topGenre: topGenre ? {
            name: topGenre.genre,
            productCount: Number(topGenre.product_count),
            totalSales: Number(topGenre.total_sales)
          } : null,
          averagePrice: Number(stats.average_price),
          averageSalesPerProduct: Number(stats.average_sales_per_product)
        }
      };

      this.logger.log('✅ Statistiques des meilleures ventes récupérées avec succès');
      return response;

    } catch (error) {
      this.logger.error(`❌ Erreur lors de la récupération des statistiques: ${error.message}`);
      throw error;
    }
  }
}