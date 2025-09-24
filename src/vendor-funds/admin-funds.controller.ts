import {
  Controller,
  Get,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { VendorFundsService } from './vendor-funds.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  AdminFundsRequestFiltersDto,
  ProcessFundsRequestDto,
  BatchProcessFundsRequestDto,
  VendorFundsRequestResponseDto,
  VendorFundsRequestsListResponseDto,
  AdminFundsStatisticsResponseDto,
} from './dto/vendor-funds.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminFundsController {
  constructor(private readonly vendorFundsService: VendorFundsService) {}

  /**
   * 1. Récupérer toutes les demandes (admin)
   * GET /admin/funds-requests
   */
  @Get('funds-requests')
  async getAllFundsRequests(
    @Query() filters: AdminFundsRequestFiltersDto,
  ): Promise<VendorFundsRequestsListResponseDto> {
    try {
      const result = await this.vendorFundsService.getAllFundsRequests(filters);

      return {
        success: true,
        message: 'Demandes récupérées avec succès',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des demandes',
        data: null,
      };
    }
  }

  /**
   * 2. Récupérer les statistiques des demandes
   * GET /admin/funds-requests/statistics
   */
  @Get('funds-requests/statistics')
  async getAdminFundsStatistics(): Promise<AdminFundsStatisticsResponseDto> {
    try {
      const statistics = await this.vendorFundsService.getAdminFundsStatistics();

      return {
        success: true,
        message: 'Statistiques récupérées avec succès',
        data: statistics,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des statistiques',
        data: null,
      };
    }
  }

  /**
   * 3. Récupérer les détails d'une demande (admin)
   * GET /admin/funds-requests/:requestId
   */
  @Get('funds-requests/:requestId')
  async getAdminFundsRequestDetails(
    @Param('requestId', ParseIntPipe) requestId: number,
  ): Promise<VendorFundsRequestResponseDto> {
    try {
      // Pour l'admin, on peut accéder directement via le service
      const request = await this.vendorFundsService.prismaService.vendorFundsRequest.findUnique({
        where: { id: requestId },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              shop_name: true,
            },
          },
          processedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!request) {
        return {
          success: false,
          message: 'Demande non trouvée',
          data: null,
          statusCode: 404,
        };
      }

      return {
        success: true,
        message: 'Détails de demande récupérés avec succès',
        data: this.vendorFundsService['formatFundsRequest'](request),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des détails',
        data: null,
        statusCode: error.status || 500,
      };
    }
  }

  /**
   * 4. Traiter une demande (admin)
   * PATCH /admin/funds-requests/:requestId/process
   */
  @Patch('funds-requests/:requestId/process')
  async processFundsRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() processData: ProcessFundsRequestDto,
    @Req() req: any,
  ): Promise<VendorFundsRequestResponseDto> {
    try {
      const adminId = req.user.sub || req.user.id;
      const request = await this.vendorFundsService.processFundsRequest(
        adminId,
        requestId,
        processData,
      );

      const statusMessage = {
        APPROVED: 'approuvée',
        PAID: 'marquée comme payée',
      }[processData.status];

      return {
        success: true,
        message: `Demande ${statusMessage} avec succès`,
        data: request,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors du traitement de la demande',
        data: null,
        statusCode: error.status || 500,
      };
    }
  }

  /**
   * 5. Traitement en lot (admin)
   * PATCH /admin/funds-requests/batch-process
   */
  @Patch('funds-requests/batch-process')
  async batchProcessRequests(
    @Body() batchData: BatchProcessFundsRequestDto,
    @Req() req: any,
  ) {
    try {
      const adminId = req.user.sub || req.user.id;
      const result = await this.vendorFundsService.batchProcessRequests(
        adminId,
        batchData,
      );

      const statusMessage = {
        APPROVED: 'approuvées',
        PAID: 'marquées comme payées',
      }[batchData.status];

      return {
        success: true,
        message: `${result.processed} demandes ${statusMessage} avec succès`,
        data: {
          processed: result.processed,
          errors: result.errors,
          totalRequested: batchData.requestIds.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors du traitement en lot',
        data: null,
        statusCode: error.status || 500,
      };
    }
  }
}