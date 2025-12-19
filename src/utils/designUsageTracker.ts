import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Service de tracking des utilisations de designs vendeurs
 * Extrait les designs des customizations et crée les enregistrements design_usages
 */
export class DesignUsageTracker {
  private static readonly logger = new Logger(DesignUsageTracker.name);

  /**
   * Extraire et enregistrer les designs vendeurs utilisés dans une commande
   * Appelé lors de la création de la commande
   *
   * @param prisma Instance Prisma pour les requêtes DB
   * @param order La commande créée
   * @param orderItem L'article de la commande
   * @param customizationIds Map des customization IDs (viewKey -> customizationId)
   */
  static async extractAndRecordDesignUsages(
    prisma: PrismaService,
    order: any,
    orderItem: any,
    customizationIds: Record<string, number> | null
  ): Promise<void> {
    if (!customizationIds || Object.keys(customizationIds).length === 0) {
      this.logger.log(`📦 [Design Usage] Aucune personnalisation pour orderItem ${orderItem.id}`);
      return;
    }

    this.logger.log(`🎨 [Design Usage] Analyse orderItem ${orderItem.id} - ${Object.keys(customizationIds).length} vue(s)`);

    // Set pour éviter les doublons de designs dans la même commande
    const recordedDesigns = new Set<number>();

    // Parcourir toutes les vues personnalisées
    for (const [viewKey, customizationId] of Object.entries(customizationIds)) {
      try {
        // Récupérer la customization depuis la base de données
        const customization = await prisma.productCustomization.findUnique({
          where: { id: customizationId },
          select: {
            id: true,
            designElements: true,
            elementsByView: true,
          },
        });

        if (!customization) {
          this.logger.warn(`⚠️ [Design Usage] Customization ${customizationId} introuvable`);
          continue;
        }

        // Récupérer les éléments de design pour cette vue
        let designElements: any[] = [];

        if (customization.elementsByView && typeof customization.elementsByView === 'object') {
          // Nouveau format multi-vues
          const elementsByView = customization.elementsByView as Record<string, any[]>;
          designElements = elementsByView[viewKey] || [];
          this.logger.debug(`📦 [Design Usage] Format multi-vues détecté - ${designElements.length} éléments dans vue ${viewKey}`);
        } else if (customization.designElements && Array.isArray(customization.designElements)) {
          // Format simple (ancien)
          designElements = customization.designElements as any[];
          this.logger.debug(`📦 [Design Usage] Format simple détecté - ${designElements.length} éléments`);
        }

        if (designElements.length === 0) {
          this.logger.debug(`📦 [Design Usage] Aucun élément de design dans customization ${customizationId}`);
          continue;
        }

        // Parcourir les éléments de design
        for (const element of designElements) {
          // Ne traiter que les images qui sont des designs vendeurs
          if (element.type !== 'image' || !element.designId || !element.designPrice) {
            continue;
          }

          const designId = parseInt(element.designId);
          const designPrice = parseFloat(element.designPrice);

          // Éviter les doublons (si le même design est utilisé plusieurs fois dans différentes vues)
          if (recordedDesigns.has(designId)) {
            this.logger.log(`✅ [Design Usage] Design ${designId} déjà enregistré pour commande ${order.orderNumber}, skip`);
            continue;
          }

          // Récupérer les infos complètes du design
          const design = await prisma.design.findUnique({
            where: { id: designId },
            select: {
              id: true,
              name: true,
              price: true,
              vendorId: true,
            },
          });

          if (!design) {
            this.logger.warn(`⚠️ [Design Usage] Design ${designId} introuvable dans la DB`);
            continue;
          }

          // 💰 Récupérer le taux de commission du vendeur depuis VendorCommission
          const vendorCommission = await prisma.vendorCommission.findUnique({
            where: { vendorId: design.vendorId },
            select: { commissionRate: true }
          });

          // Taux de commission plateforme (par défaut 40%)
          const platformCommissionRate = vendorCommission?.commissionRate || 40.0;

          // Le vendeur (designer) reçoit: 100% - commission plateforme
          // Exemple: si plateforme prend 40%, designer reçoit 60%
          const vendorRevenueRate = 100 - platformCommissionRate;
          const vendorRevenue = (designPrice * vendorRevenueRate) / 100;
          const platformFee = designPrice - vendorRevenue;

          // 🎯 Créer l'enregistrement design_usage
          const designUsage = await prisma.designUsage.create({
            data: {
              designId: design.id,
              designName: design.name,
              designPrice: new Prisma.Decimal(designPrice),
              vendorId: design.vendorId,
              orderId: order.id,
              orderNumber: order.orderNumber,
              orderItemId: orderItem.id,
              customerName: order.shippingName || 'Client',
              customerEmail: order.email || null,
              productId: orderItem.productId,
              productName: orderItem.product?.name || 'Produit',
              commissionRate: new Prisma.Decimal(platformCommissionRate),
              vendorRevenue: new Prisma.Decimal(vendorRevenue),
              platformFee: new Prisma.Decimal(platformFee),
              paymentStatus: 'PENDING', // Commande pas encore payée
              customizationId,
              viewKey,
              usedAt: new Date(),
            },
          });

          this.logger.log(`✅ [Design Usage] Design ${design.id} (${design.name}) enregistré - Vendeur ${design.vendorId} recevra ${vendorRevenue} FCFA (${vendorRevenueRate}% du prix ${designPrice} FCFA, plateforme: ${platformCommissionRate}%)`);

          // Marquer comme enregistré
          recordedDesigns.add(designId);
        }
      } catch (error) {
        this.logger.error(`❌ [Design Usage] Erreur traitement customization ${customizationId}:`, error);
        // Continuer avec les autres customizations même en cas d'erreur
      }
    }

    this.logger.log(`📊 [Design Usage] Total: ${recordedDesigns.size} design(s) unique(s) enregistré(s) pour orderItem ${orderItem.id}`);
  }

  /**
   * Mettre à jour le statut de paiement des designs utilisés dans une commande
   * Appelé après confirmation de paiement
   *
   * @param prisma Instance Prisma
   * @param orderId ID de la commande
   * @param newStatus Nouveau statut ('CONFIRMED', 'READY_FOR_PAYOUT', 'PAID', 'CANCELLED')
   */
  static async updatePaymentStatus(
    prisma: PrismaService,
    orderId: number,
    newStatus: 'CONFIRMED' | 'READY_FOR_PAYOUT' | 'PAID' | 'CANCELLED'
  ): Promise<number> {
    this.logger.log(`💰 [Design Usage] Mise à jour statut pour commande ${orderId} -> ${newStatus}`);

    try {
      // Déterminer le statut actuel requis pour la transition
      let currentStatuses: string[];
      let additionalData: any = {
        paymentStatus: newStatus,
        updatedAt: new Date(),
      };

      switch (newStatus) {
        case 'CONFIRMED':
          currentStatuses = ['PENDING'];
          additionalData.confirmedAt = new Date();
          break;
        case 'READY_FOR_PAYOUT':
          currentStatuses = ['CONFIRMED'];
          additionalData.readyForPayoutAt = new Date();
          break;
        case 'PAID':
          currentStatuses = ['READY_FOR_PAYOUT'];
          additionalData.paidAt = new Date();
          break;
        case 'CANCELLED':
          currentStatuses = ['PENDING', 'CONFIRMED'];
          break;
        default:
          this.logger.warn(`⚠️ [Design Usage] Statut inconnu: ${newStatus}`);
          return 0;
      }

      // Mettre à jour tous les design_usages de cette commande
      const result = await prisma.designUsage.updateMany({
        where: {
          orderId,
          paymentStatus: { in: currentStatuses as any },
        },
        data: additionalData,
      });

      this.logger.log(`✅ [Design Usage] ${result.count} enregistrement(s) mis à jour pour commande ${orderId}`);

      return result.count;
    } catch (error) {
      this.logger.error(`❌ [Design Usage] Erreur mise à jour statut commande ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir le résumé des design usages pour une commande
   *
   * @param prisma Instance Prisma
   * @param orderId ID de la commande
   */
  static async getOrderDesignUsagesSummary(
    prisma: PrismaService,
    orderId: number
  ): Promise<{
    totalDesigns: number;
    totalRevenue: number;
    byVendor: Array<{
      vendorId: number;
      vendorName: string;
      designCount: number;
      totalRevenue: number;
    }>;
  }> {
    const designUsages = await prisma.designUsage.findMany({
      where: { orderId },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true,
          },
        },
      },
    });

    const totalDesigns = designUsages.length;
    const totalRevenue = designUsages.reduce(
      (sum, usage) => sum + parseFloat(usage.vendorRevenue.toString()),
      0
    );

    // Grouper par vendeur
    const byVendorMap = new Map<number, {
      vendorId: number;
      vendorName: string;
      designCount: number;
      totalRevenue: number;
    }>();

    for (const usage of designUsages) {
      const vendorId = usage.vendorId;
      const vendorName = usage.vendor.shop_name || `${usage.vendor.firstName} ${usage.vendor.lastName}`;
      const revenue = parseFloat(usage.vendorRevenue.toString());

      if (byVendorMap.has(vendorId)) {
        const existing = byVendorMap.get(vendorId)!;
        existing.designCount++;
        existing.totalRevenue += revenue;
      } else {
        byVendorMap.set(vendorId, {
          vendorId,
          vendorName,
          designCount: 1,
          totalRevenue: revenue,
        });
      }
    }

    return {
      totalDesigns,
      totalRevenue,
      byVendor: Array.from(byVendorMap.values()),
    };
  }
}
