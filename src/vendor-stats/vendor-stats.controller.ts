import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VendorStatsService } from './vendor-stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  MonthlyRevenueQueryDto,
  MonthlyRevenueResponseDto,
  RevenueStatsResponseDto,
} from './dto/monthly-revenue.dto';

@ApiTags('Vendor Stats')
@Controller('vendor/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VENDEUR)
@ApiBearerAuth()
export class VendorStatsController {
  constructor(private readonly vendorStatsService: VendorStatsService) {}

  /**
   * Récupère les statistiques de revenus avec pourcentages d'évolution
   * GET /vendor/stats/revenue
   */
  @Get('revenue')
  @ApiOperation({
    summary: 'Récupère les statistiques de revenus avec pourcentages',
    description: 'Retourne les revenus annuels et mensuels avec leur évolution en pourcentage',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques de revenus récupérées avec succès',
    type: RevenueStatsResponseDto,
  })
  async getRevenueStats(@Req() req: any): Promise<RevenueStatsResponseDto> {
    try {
      const vendorId = req.user.id;

      console.log(`📊 [VendorStatsController] GET /vendor/stats/revenue - vendorId: ${vendorId}`);

      const data = await this.vendorStatsService.getRevenueStats(vendorId);

      return {
        success: true,
        message: 'Statistiques de revenus récupérées avec succès',
        data,
      };
    } catch (error) {
      console.error('❌ [VendorStatsController] Erreur:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des statistiques de revenus',
        data: {
          annual: {
            currentYearRevenue: 0,
            previousYearRevenue: 0,
            yearOverYearGrowth: 0,
            monthlyData: Array(12).fill(0),
          },
          monthly: {
            currentMonthRevenue: 0,
            previousMonthRevenue: 0,
            monthOverMonthGrowth: 0,
            weeklyData: Array(7).fill(0),
          },
        },
      };
    }
  }

  /**
   * Récupère les statistiques de revenus mensuels
   * GET /vendor/stats/monthly-revenue
   */
  @Get('monthly-revenue')
  @ApiOperation({
    summary: 'Récupère les statistiques de revenus mensuels',
    description: 'Retourne les revenus et le nombre de commandes pour les X derniers mois',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques mensuelles récupérées avec succès',
    type: MonthlyRevenueResponseDto,
  })
  async getMonthlyRevenue(
    @Query() query: MonthlyRevenueQueryDto,
    @Req() req: any,
  ): Promise<MonthlyRevenueResponseDto> {
    try {
      const vendorId = req.user.id;
      const months = query.months || 7;

      console.log(`📊 [VendorStatsController] GET /vendor/stats/monthly-revenue - vendorId: ${vendorId}, months: ${months}`);

      const data = await this.vendorStatsService.getMonthlyRevenue(
        vendorId,
        months,
      );

      return {
        success: true,
        message: 'Statistiques mensuelles récupérées avec succès',
        data,
      };
    } catch (error) {
      console.error('❌ [VendorStatsController] Erreur:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des statistiques mensuelles',
        data: [],
      };
    }
  }

  /**
   * Récupère les statistiques globales du vendeur
   * GET /vendor/stats
   */
  @Get()
  @ApiOperation({
    summary: 'Récupère les statistiques globales du vendeur',
    description: 'Retourne toutes les statistiques du vendeur (produits, designs, etc.)',
  })
  async getVendorStats(@Req() req: any) {
    try {
      const vendorId = req.user.id;

      console.log(`📊 [VendorStatsController] GET /vendor/stats - vendorId: ${vendorId}`);

      const data = await this.vendorStatsService.getVendorStats(vendorId);

      return {
        success: true,
        message: 'Statistiques récupérées avec succès',
        data,
      };
    } catch (error) {
      console.error('❌ [VendorStatsController] Erreur:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des statistiques',
        data: null,
      };
    }
  }
}
