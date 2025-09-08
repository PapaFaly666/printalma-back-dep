import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  Logger,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CommissionService } from './commission.service';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { 
  CommissionResponseDto, 
  VendorCommissionListDto, 
  CommissionStatsDto 
} from './dto/commission-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

@ApiTags('Commission Management')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
@ApiBearerAuth()
export class CommissionController {
  private readonly logger = new Logger(CommissionController.name);

  constructor(private readonly commissionService: CommissionService) {}

  /**
   * Mettre à jour la commission d'un vendeur
   */
  @Put('vendors/:vendorId/commission')
  @ApiOperation({ 
    summary: 'Mettre à jour la commission d\'un vendeur',
    description: 'Permet aux admins de définir ou modifier le taux de commission d\'un vendeur (0-100%)'
  })
  @ApiParam({ 
    name: 'vendorId', 
    description: 'ID du vendeur', 
    type: 'integer',
    example: 123
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission mise à jour avec succès',
    type: CommissionResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Commission mise à jour avec succès',
        data: {
          vendorId: 123,
          commissionRate: 35.5,
          updatedAt: '2024-01-15T10:30:00Z',
          updatedBy: 1
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides',
    schema: {
      example: {
        success: false,
        error: 'INVALID_COMMISSION_RATE',
        message: 'La commission doit être entre 0 et 100%'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendeur non trouvé',
    schema: {
      example: {
        success: false,
        error: 'VENDOR_NOT_FOUND',
        message: 'Vendeur introuvable'
      }
    }
  })
  async updateVendorCommission(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Body() updateDto: UpdateCommissionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      this.logger.log(`Mise à jour commission - Vendeur: ${vendorId}, Taux: ${updateDto.commissionRate}%, Admin: ${req.user.id}`);

      // Extraire les informations de la requête pour l'audit
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const result = await this.commissionService.updateCommission({
        vendorId,
        commissionRate: updateDto.commissionRate,
        updatedBy: req.user.id,
        ipAddress,
        userAgent,
      });

      return {
        success: true,
        message: 'Commission mise à jour avec succès',
        data: result,
      };

    } catch (error) {
      this.logger.error(`Erreur mise à jour commission: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        return {
          success: false,
          error: 'VENDOR_NOT_FOUND',
          message: 'Vendeur introuvable',
        };
      }

      if (error instanceof BadRequestException) {
        return {
          success: false,
          error: 'INVALID_COMMISSION_RATE',
          message: error.message,
        };
      }

      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la mise à jour de la commission',
      };
    }
  }

  /**
   * Obtenir la commission d'un vendeur
   */
  @Get('vendors/:vendorId/commission')
  @ApiOperation({ 
    summary: 'Obtenir la commission d\'un vendeur',
    description: 'Récupère les informations de commission pour un vendeur spécifique'
  })
  @ApiParam({ 
    name: 'vendorId', 
    description: 'ID du vendeur', 
    type: 'integer',
    example: 123
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission récupérée avec succès',
    type: CommissionResponseDto,
    schema: {
      example: {
        success: true,
        data: {
          vendorId: 123,
          commissionRate: 35.5,
          setAt: '2024-01-15T10:30:00Z',
          setBy: {
            id: 1,
            name: 'Admin Principal'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Commission non trouvée',
    schema: {
      example: {
        success: false,
        error: 'COMMISSION_NOT_FOUND',
        message: 'Commission non trouvée pour ce vendeur'
      }
    }
  })
  async getVendorCommission(@Param('vendorId', ParseIntPipe) vendorId: number) {
    try {
      const commission = await this.commissionService.getCommissionByVendorId(vendorId);

      if (!commission) {
        return {
          success: false,
          error: 'COMMISSION_NOT_FOUND',
          message: 'Commission non trouvée pour ce vendeur',
        };
      }

      return {
        success: true,
        data: commission,
      };

    } catch (error) {
      this.logger.error(`Erreur récupération commission vendeur ${vendorId}: ${error.message}`);

      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la récupération de la commission',
      };
    }
  }

  /**
   * Obtenir toutes les commissions pour le tableau admin
   */
  @Get('vendors/commissions')
  @ApiOperation({ 
    summary: 'Obtenir toutes les commissions',
    description: 'Récupère la liste de tous les vendeurs avec leurs taux de commission et revenus estimés'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des commissions récupérée avec succès',
    type: [VendorCommissionListDto],
    schema: {
      example: {
        success: true,
        data: [
          {
            vendorId: 123,
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean@example.com',
            vendeur_type: 'DESIGNER',
            commissionRate: 35.5,
            estimatedMonthlyRevenue: 150000,
            lastUpdated: '2024-01-15T10:30:00Z'
          }
        ]
      }
    }
  })
  async getAllVendorCommissions() {
    try {
      const commissions = await this.commissionService.getAllCommissionsWithVendorInfo();

      return {
        success: true,
        data: commissions,
      };

    } catch (error) {
      this.logger.error(`Erreur récupération toutes commissions: ${error.message}`);

      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la récupération des commissions',
      };
    }
  }

  /**
   * Obtenir les statistiques des commissions
   */
  @Get('commission-stats')
  @ApiOperation({ 
    summary: 'Obtenir les statistiques des commissions',
    description: 'Récupère les statistiques globales des commissions (moyenne, min, max, etc.)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistiques récupérées avec succès',
    type: CommissionStatsDto,
    schema: {
      example: {
        success: true,
        data: {
          averageCommission: 42.5,
          minCommission: 0,
          maxCommission: 75,
          totalVendors: 25,
          freeVendors: 2,
          highCommissionVendors: 5
        }
      }
    }
  })
  async getCommissionStats() {
    try {
      const stats = await this.commissionService.getCommissionStats();

      return {
        success: true,
        data: stats,
      };

    } catch (error) {
      this.logger.error(`Erreur récupération statistiques: ${error.message}`);

      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la récupération des statistiques',
      };
    }
  }

  /**
   * Obtenir l'historique des changements de commission pour un vendeur
   */
  @Get('vendors/:vendorId/commission/history')
  @ApiOperation({ 
    summary: 'Obtenir l\'historique des changements de commission',
    description: 'Récupère l\'historique des modifications de commission pour un vendeur'
  })
  @ApiParam({ 
    name: 'vendorId', 
    description: 'ID du vendeur', 
    type: 'integer',
    example: 123
  })
  async getCommissionHistory(@Param('vendorId', ParseIntPipe) vendorId: number) {
    try {
      const history = await this.commissionService.getCommissionHistory(vendorId);

      return {
        success: true,
        data: history,
      };

    } catch (error) {
      this.logger.error(`Erreur récupération historique vendeur ${vendorId}: ${error.message}`);

      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la récupération de l\'historique',
      };
    }
  }

  /**
   * Obtenir l'historique global de toutes les modifications de commission (Admin)
   */
  @Get('commission-history/all')
  @ApiOperation({ 
    summary: 'Obtenir l\'historique global des modifications',
    description: 'Récupère les dernières modifications de commission de tous les vendeurs pour l\'admin' 
  })
  @ApiResponse({
    status: 200,
    description: 'Historique global récupéré avec succès',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 1,
            vendorName: "John Doe",
            vendorEmail: "john@example.com",
            oldRate: 40.0,
            newRate: 35.0,
            changedAt: "2024-01-15T10:30:00Z",
            changedBy: "Admin Principal",
            ipAddress: "192.168.1.1"
          }
        ]
      }
    }
  })
  async getGlobalCommissionHistory() {
    try {
      this.logger.log('Récupération historique global des commissions');

      const history = await this.commissionService.getGlobalCommissionHistory();

      return {
        success: true,
        data: history
      };

    } catch (error) {
      this.logger.error(`Erreur récupération historique global: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: 'GLOBAL_HISTORY_ERROR',
        message: 'Erreur lors de la récupération de l\'historique global'
      };
    }
  }
}