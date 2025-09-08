import {
  Controller,
  Get,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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

@ApiTags('Vendor Commission')
@Controller('vendors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VendorCommissionController {
  private readonly logger = new Logger(VendorCommissionController.name);

  constructor(private readonly commissionService: CommissionService) {}

  /**
   * Obtenir la commission du vendeur connecté
   */
  @Get('my-commission')
  @ApiOperation({ 
    summary: 'Obtenir ma commission',
    description: 'Permet au vendeur connecté de voir son taux de commission actuel défini par l\'admin'
  })
  @ApiResponse({
    status: 200,
    description: 'Commission récupérée avec succès',
    schema: {
      example: {
        success: true,
        data: {
          vendorId: 123,
          commissionRate: 35.5,
          lastUpdated: '2024-01-15T10:30:00Z',
          updatedBy: {
            firstName: 'Admin',
            lastName: 'Principal'
          },
          defaultRate: 40.0,
          isCustomRate: true
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - réservé aux vendeurs',
    schema: {
      example: {
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Accès réservé aux vendeurs'
      }
    }
  })
  async getMyCommission(@Req() req: AuthenticatedRequest) {
    try {
      const vendorId = req.user.id;
      const userRole = req.user.role;

      this.logger.log(`Récupération commission pour vendeur ${vendorId} (${req.user.email})`);

      // Vérifier que l'utilisateur est bien un vendeur
      if (userRole !== 'VENDEUR') {
        this.logger.warn(`Tentative d'accès non autorisé par utilisateur ${vendorId} avec rôle ${userRole}`);
        return {
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Accès réservé aux vendeurs'
        };
      }

      // Récupérer la commission du vendeur
      const commission = await this.commissionService.getCommissionByVendorId(vendorId);
      const defaultRate = 40.0;

      // Récupérer les infos de l'admin qui a modifié (si applicable)
      let updatedBy = null;
      if (commission) {
        try {
          const adminInfo = await this.commissionService.getAdminInfo(commission.updatedBy);
          if (adminInfo) {
            updatedBy = {
              firstName: adminInfo.firstName,
              lastName: adminInfo.lastName
            };
          }
        } catch (error) {
          this.logger.warn(`Impossible de récupérer les infos admin pour la commission du vendeur ${vendorId}`);
        }
      }

      const result = {
        vendorId: vendorId,
        commissionRate: commission?.commissionRate || defaultRate,
        lastUpdated: commission?.updatedAt || null,
        updatedBy: updatedBy,
        defaultRate: defaultRate,
        isCustomRate: commission ? commission.commissionRate !== defaultRate : false,
        appliedSince: commission?.updatedAt || null
      };

      this.logger.log(`Commission récupérée pour vendeur ${vendorId}: ${result.commissionRate}%`);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      this.logger.error(`Erreur récupération commission vendeur ${req.user.id}: ${error.message}`, error.stack);

      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la récupération de votre commission'
      };
    }
  }

  /**
   * Obtenir l'historique de ses commissions
   */
  @Get('my-commission/history')
  @ApiOperation({ 
    summary: 'Obtenir l\'historique de ma commission',
    description: 'Permet au vendeur de voir l\'historique des modifications de sa commission'
  })
  @ApiResponse({
    status: 200,
    description: 'Historique récupéré avec succès'
  })
  async getMyCommissionHistory(@Req() req: AuthenticatedRequest) {
    try {
      const vendorId = req.user.id;

      // Vérifier que l'utilisateur est bien un vendeur
      if (req.user.role !== 'VENDEUR') {
        return {
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Accès réservé aux vendeurs'
        };
      }

      const history = await this.commissionService.getCommissionHistory(vendorId);

      // Filtrer les informations sensibles pour le vendeur
      const vendorHistory = history.map(entry => ({
        oldRate: entry.oldRate,
        newRate: entry.newRate,
        changedAt: entry.changedAt,
        changedBy: entry.changedBy // Nom de l'admin déjà formaté
      }));

      return {
        success: true,
        data: vendorHistory
      };

    } catch (error) {
      this.logger.error(`Erreur récupération historique commission vendeur ${req.user.id}: ${error.message}`);

      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la récupération de l\'historique'
      };
    }
  }
}