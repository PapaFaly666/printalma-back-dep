import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { CloudinaryService } from '../../core/cloudinary/cloudinary.service';

/**
 * Tâche planifiée pour nettoyer les images orphelines uploadées par les clients
 *
 * Cette tâche s'exécute automatiquement tous les jours à 3h du matin pour:
 * 1. Trouver les personnalisations "draft" de plus de 7 jours non associées à une commande
 * 2. Supprimer les images client associées de Cloudinary
 * 3. Supprimer les enregistrements de personnalisations orphelines
 */
@Injectable()
export class CleanupClientImagesTask {
  private readonly logger = new Logger(CleanupClientImagesTask.name);

  // Nombre de jours avant qu'un draft soit considéré comme orphelin
  private ORPHANED_DAYS = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  /**
   * Nettoyer les images uploadées non associées à une commande
   * Exécution: tous les jours à 3h du matin
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOrphanedImages() {
    this.logger.log('🧹 [Cleanup] Démarrage nettoyage images orphelines...');

    try {
      // 1. Trouver toutes les customizations "draft" de plus de 7 jours sans commande
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.ORPHANED_DAYS);

      const oldDrafts = await this.prisma.productCustomization.findMany({
        where: {
          status: 'draft',
          orderId: null,
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      this.logger.log(`📋 [Cleanup] ${oldDrafts.length} drafts anciens trouvés (avant ${cutoffDate.toISOString()})`);

      if (oldDrafts.length === 0) {
        this.logger.log('✅ [Cleanup] Aucun draft orphelin à nettoyer');
        return {
          deletedImages: 0,
          deletedDrafts: 0,
          skipped: 0
        };
      }

      // 2. Pour chaque draft, extraire et supprimer les images client
      let deletedCount = 0;
      let skippedCount = 0;

      for (const draft of oldDrafts) {
        try {
          // Examiner designElements (format simple)
          const designElements = draft.designElements as any[] | null;
          deletedCount += await this.processElements(designElements, draft.id);

          // Examiner elementsByView (format multi-vues)
          if (draft.elementsByView) {
            const elementsByView = draft.elementsByView as Record<string, any[]> | null;
            if (elementsByView && typeof elementsByView === 'object') {
              for (const [viewKey, elements] of Object.entries(elementsByView)) {
                deletedCount += await this.processElements(elements, draft.id, viewKey);
              }
            }
          }

          // 3. Supprimer le draft lui-même
          await this.prisma.productCustomization.delete({
            where: { id: draft.id }
          });

          this.logger.log(`🗑️ [Cleanup] Draft ${draft.id} supprimé`);
        } catch (error) {
          this.logger.error(`❌ [Cleanup] Erreur traitement draft ${draft.id}:`, error);
          skippedCount++;
        }
      }

      this.logger.log(`✅ [Cleanup] Nettoyage terminé: ${deletedCount} images supprimées, ${oldDrafts.length - skippedCount} drafts supprimés, ${skippedCount} erreurs`);

      return {
        deletedImages: deletedCount,
        deletedDrafts: oldDrafts.length - skippedCount,
        skipped: skippedCount
      };
    } catch (error) {
      this.logger.error('❌ [Cleanup] Erreur lors du nettoyage:', error);
      throw error;
    }
  }

  /**
   * Traiter un tableau d'éléments et supprimer les images client
   */
  private async processElements(elements: any[] | null, draftId: number, viewKey?: string): Promise<number> {
    if (!elements || !Array.isArray(elements)) {
      return 0;
    }

    let deletedCount = 0;

    for (const element of elements) {
      if (!element || typeof element !== 'object') {
        continue;
      }

      // Vérifier si c'est une image client
      if (element.type === 'image' &&
          element.isClientUpload === true &&
          element.cloudinaryPublicId) {
        try {
          await this.cloudinaryService.deleteClientImage(element.cloudinaryPublicId);
          deletedCount++;
          const viewSuffix = viewKey ? ` [vue: ${viewKey}]` : '';
          this.logger.log(`🗑️ [Cleanup] Image client supprimée: ${element.cloudinaryPublicId}${viewSuffix} (draft: ${draftId})`);
        } catch (error) {
          this.logger.error(`❌ [Cleanup] Erreur suppression image ${element.cloudinaryPublicId}:`, error);
        }
      }
    }

    return deletedCount;
  }

  /**
   * Méthode pour déclencher manuellement le nettoyage (pour tests ou admin)
   */
  async manualCleanup(days?: number): Promise<{
    deletedImages: number;
    deletedDrafts: number;
    skipped: number;
  }> {
    if (days) {
      this.ORPHANED_DAYS = days;
    }

    this.logger.log(`🔧 [Cleanup] Nettoyage manuel déclenché (seuil: ${this.ORPHANED_DAYS} jours)`);
    return this.cleanupOrphanedImages();
  }

  /**
   * Obtenir des statistiques sur les drafts orphelins sans les supprimer
   */
  async getOrphanedStats(): Promise<{
    orphanedDrafts: number;
    totalClientImages: number;
    oldestDraft: Date | null;
    drafts: Array<{
      id: number;
      createdAt: Date;
      imageCount: number;
    }>;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.ORPHANED_DAYS);

    const oldDrafts = await this.prisma.productCustomization.findMany({
      where: {
        status: 'draft',
        orderId: null,
        createdAt: {
          lt: cutoffDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    let totalClientImages = 0;
    const draftsWithImageCount: Array<{
      id: number;
      createdAt: Date;
      imageCount: number;
    }> = [];

    for (const draft of oldDrafts) {
      let imageCount = 0;

      // Compter les images dans designElements
      const designElements = draft.designElements as any[] | null;
      imageCount += this.countClientImages(designElements);

      // Compter les images dans elementsByView
      if (draft.elementsByView) {
        const elementsByView = draft.elementsByView as Record<string, any[]> | null;
        if (elementsByView && typeof elementsByView === 'object') {
          for (const elements of Object.values(elementsByView)) {
            imageCount += this.countClientImages(elements);
          }
        }
      }

      totalClientImages += imageCount;
      draftsWithImageCount.push({
        id: draft.id,
        createdAt: draft.createdAt,
        imageCount
      });
    }

    return {
      orphanedDrafts: oldDrafts.length,
      totalClientImages,
      oldestDraft: oldDrafts.length > 0 ? oldDrafts[0].createdAt : null,
      drafts: draftsWithImageCount
    };
  }

  /**
   * Compter les images client dans un tableau d'éléments
   */
  private countClientImages(elements: any[] | null): number {
    if (!elements || !Array.isArray(elements)) {
      return 0;
    }

    return elements.filter(element =>
      element &&
      typeof element === 'object' &&
      element.type === 'image' &&
      element.isClientUpload === true &&
      element.cloudinaryPublicId
    ).length;
  }
}
