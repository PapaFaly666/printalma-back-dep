import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { 
  validateCommissionRate, 
  calculateRevenueSplit, 
  normalizeCommissionRate,
  generateAuditMessage 
} from '../utils/commission-utils';
import { 
  CommissionResponseDto, 
  VendorCommissionListDto, 
  CommissionStatsDto 
} from './dto/commission-response.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';

export interface UpdateCommissionParams {
  vendorId: number;
  commissionRate: number;
  updatedBy: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogParams {
  vendorId: number;
  oldRate: number | null;
  newRate: number;
  adminId: number;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Met à jour la commission d'un vendeur
   */
  async updateCommission(params: UpdateCommissionParams): Promise<CommissionResponseDto> {
    const { vendorId, commissionRate, updatedBy, ipAddress, userAgent } = params;

    // Validation du taux
    if (!validateCommissionRate(commissionRate)) {
      throw new BadRequestException('Taux de commission invalide (doit être entre 0 et 100)');
    }

    // Normaliser le taux
    const normalizedRate = normalizeCommissionRate(commissionRate);

    try {
      // Vérifier que le vendeur existe
      const vendor = await this.getVendorById(vendorId);
      if (!vendor) {
        throw new NotFoundException('Vendeur introuvable');
      }

      // Récupérer l'ancienne commission pour l'audit
      const oldCommission = await this.getCommissionByVendorId(vendorId);
      const oldRate = oldCommission ? oldCommission.commissionRate : null;

      // Mettre à jour ou créer la commission
      const updatedCommission = await this.prisma.vendorCommission.upsert({
        where: { vendorId },
        update: {
          commissionRate: normalizedRate,
          updatedAt: new Date(),
          createdBy: updatedBy,
        },
        create: {
          vendorId,
          commissionRate: normalizedRate,
          createdBy: updatedBy,
        },
        include: {
          vendor: {
            select: { firstName: true, lastName: true }
          },
          createdByUser: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      // Logger l'audit
      await this.logCommissionChange({
        vendorId,
        oldRate,
        newRate: normalizedRate,
        adminId: updatedBy,
        ipAddress,
        userAgent,
      });

      this.logger.log(`Commission mise à jour: Vendeur ${vendorId} -> ${normalizedRate}% par Admin ${updatedBy}`);

      return {
        vendorId: updatedCommission.vendorId,
        commissionRate: updatedCommission.commissionRate,
        updatedAt: updatedCommission.updatedAt.toISOString(),
        updatedBy: updatedCommission.createdBy || updatedBy,
      };

    } catch (error) {
      this.logger.error(`Erreur mise à jour commission: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Erreur lors de la mise à jour de la commission');
    }
  }

  /**
   * Obtient la commission d'un vendeur spécifique
   */
  async getCommissionByVendorId(vendorId: number): Promise<CommissionResponseDto | null> {
    try {
      const commission = await this.prisma.vendorCommission.findUnique({
        where: { vendorId },
        include: {
          createdByUser: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      if (!commission) {
        return null;
      }

      return {
        vendorId: commission.vendorId,
        commissionRate: commission.commissionRate,
        updatedAt: commission.updatedAt.toISOString(),
        updatedBy: commission.createdBy || 0,
      };

    } catch (error) {
      this.logger.error(`Erreur récupération commission vendeur ${vendorId}: ${error.message}`);
      throw new BadRequestException('Erreur lors de la récupération de la commission');
    }
  }

  /**
   * Obtient toutes les commissions avec les informations des vendeurs
   */
  async getAllCommissionsWithVendorInfo(): Promise<VendorCommissionListDto[]> {
    try {
      // Requête pour obtenir tous les vendeurs avec leurs commissions
      const result = await this.prisma.user.findMany({
        where: { 
          role: 'VENDEUR',
          status: true // Seulement les vendeurs actifs
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          vendeur_type: true,
          vendorCommission: {
            select: {
              commissionRate: true,
              updatedAt: true,
            }
          },
          // Calcul du revenu estimé basé sur les ventes du mois
          vendorProducts: {
            select: {
              salesCount: true,
              totalRevenue: true,
              price: true,
              lastSaleDate: true,
            }
          }
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      });

      return result.map(vendor => {
        // Calcul du revenu mensuel estimé
        const estimatedRevenue = vendor.vendorProducts.reduce((total, product) => {
          // Simple estimation basée sur le revenu total des produits
          return total + (product.totalRevenue || 0);
        }, 0);

        return {
          vendorId: vendor.id,
          firstName: vendor.firstName,
          lastName: vendor.lastName,
          email: vendor.email,
          vendeur_type: vendor.vendeur_type || 'DESIGNER',
          commissionRate: vendor.vendorCommission?.commissionRate || 40.0, // Valeur par défaut
          estimatedMonthlyRevenue: Math.round(estimatedRevenue),
          lastUpdated: vendor.vendorCommission?.updatedAt?.toISOString() || null,
        };
      });

    } catch (error) {
      this.logger.error(`Erreur récupération toutes commissions: ${error.message}`);
      throw new BadRequestException('Erreur lors de la récupération des commissions');
    }
  }

  /**
   * Obtient un vendeur par ID
   */
  async getVendorById(vendorId: number) {
    try {
      const vendor = await this.prisma.user.findFirst({
        where: { 
          id: vendorId, 
          role: 'VENDEUR',
          status: true
        },
        include: {
          vendorCommission: true
        }
      });

      if (!vendor) {
        return null;
      }

      return {
        ...vendor,
        commissionRate: vendor.vendorCommission?.commissionRate || 40.0
      };

    } catch (error) {
      this.logger.error(`Erreur récupération vendeur ${vendorId}: ${error.message}`);
      throw new BadRequestException('Erreur lors de la récupération du vendeur');
    }
  }

  /**
   * Logger les changements de commission pour audit
   */
  async logCommissionChange(params: AuditLogParams): Promise<void> {
    const { vendorId, oldRate, newRate, adminId, ipAddress, userAgent } = params;

    try {
      await this.prisma.commissionAuditLog.create({
        data: {
          vendorId,
          oldRate,
          newRate,
          changedBy: adminId,
          ipAddress,
          userAgent,
          changedAt: new Date(),
        }
      });

      this.logger.debug(`Audit log créé: Vendeur ${vendorId}, ${oldRate}% -> ${newRate}%`);

    } catch (error) {
      // L'audit ne doit pas empêcher la mise à jour principale
      this.logger.warn(`Erreur création audit log: ${error.message}`);
    }
  }

  /**
   * Obtient les statistiques des commissions
   */
  async getCommissionStats(): Promise<CommissionStatsDto> {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          COALESCE(AVG(vc.commission_rate), 40.00) as average_commission,
          COALESCE(MIN(vc.commission_rate), 40.00) as min_commission,
          COALESCE(MAX(vc.commission_rate), 40.00) as max_commission,
          COUNT(u.id) as total_vendors,
          COUNT(CASE WHEN COALESCE(vc.commission_rate, 40.00) = 0 THEN 1 END) as free_vendors,
          COUNT(CASE WHEN COALESCE(vc.commission_rate, 40.00) > 50 THEN 1 END) as high_commission_vendors
        FROM "User" u
        LEFT JOIN "vendor_commissions" vc ON u.id = vc.vendor_id
        WHERE u.role = 'VENDEUR' AND u.status = true
      ` as any[];

      const result = stats[0];

      return {
        averageCommission: parseFloat(result.average_commission) || 40.0,
        minCommission: parseFloat(result.min_commission) || 40.0,
        maxCommission: parseFloat(result.max_commission) || 40.0,
        totalVendors: parseInt(result.total_vendors) || 0,
        freeVendors: parseInt(result.free_vendors) || 0,
        highCommissionVendors: parseInt(result.high_commission_vendors) || 0,
      };

    } catch (error) {
      this.logger.error(`Erreur récupération statistiques: ${error.message}`);
      throw new BadRequestException('Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * Calcule le split de revenus pour un montant et un vendeur
   */
  async calculateRevenueForVendor(vendorId: number, totalAmount: number) {
    const commission = await this.getCommissionByVendorId(vendorId);
    const rate = commission ? commission.commissionRate : 40.0;

    return calculateRevenueSplit(totalAmount, rate);
  }

  /**
   * Obtient les informations d'un admin par ID
   */
  async getAdminInfo(adminId: number) {
    try {
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });

      return admin;
    } catch (error) {
      this.logger.warn(`Erreur récupération info admin ${adminId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Obtient l'historique des changements pour un vendeur
   */
  async getCommissionHistory(vendorId: number) {
    try {
      const history = await this.prisma.commissionAuditLog.findMany({
        where: { vendorId },
        include: {
          changedByUser: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: { changedAt: 'desc' },
        take: 50 // Limite aux 50 derniers changements
      });

      return history.map(log => ({
        id: log.id,
        oldRate: log.oldRate,
        newRate: log.newRate,
        changedAt: log.changedAt.toISOString(),
        changedBy: `User ${log.changedBy}`,
        ipAddress: log.ipAddress,
      }));

    } catch (error) {
      this.logger.error(`Erreur récupération historique vendeur ${vendorId}: ${error.message}`);
      throw new BadRequestException('Erreur lors de la récupération de l\'historique');
    }
  }

  /**
   * Obtient l'historique global de toutes les modifications de commission
   */
  async getGlobalCommissionHistory(limit: number = 50): Promise<any[]> {
    // Temporarily disabled due to compilation issues
    return [];
    try {
      const history = await this.prisma.commissionAuditLog.findMany({
        select: {
          id: true,
          vendorId: true,
          changedAt: true,
          userAgent: true,
          ipAddress: true,
          oldRate: true,
          newRate: true,
          changedBy: true
        },
        orderBy: { changedAt: 'desc' },
        take: limit
      });

      return history.map(log => ({
        id: log.id,
        vendorId: log.vendorId,
        vendorName: `Vendor ${log.vendorId}`,
        vendorEmail: `vendor${log.vendorId}@example.com`,
        oldRate: log.oldRate,
        newRate: log.newRate,
        changedAt: log.changedAt.toISOString(),
        changedBy: `User ${log.changedBy}`,
        ipAddress: log.ipAddress,
        changeType: log.oldRate === null ? 'CREATION' : 'UPDATE',
        rateDifference: log.oldRate ? (log.newRate - log.oldRate) : log.newRate
      }));

    } catch (error) {
      this.logger.error(`Erreur récupération historique global: ${error.message}`);
      throw new BadRequestException('Erreur lors de la récupération de l\'historique global');
    }
  }
}