import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

/**
 * Helper service pour enrichir les données de customisation
 * avec les informations complètes de couleur et délimitations
 */
export class CustomizationEnricherHelper {
  private static readonly logger = new Logger(CustomizationEnricherHelper.name);

  /**
   * Enrichit un orderItem avec les données complètes de colorVariation
   * Récupère les images, vues et délimitations depuis la base de données
   */
  static async enrichOrderItemWithColorVariation(
    orderItem: any,
    prisma: PrismaService
  ): Promise<any> {
    try {
      // Si pas de colorId, retourner tel quel
      if (!orderItem.colorId) {
        this.logger.warn('OrderItem sans colorId, impossible d\'enrichir');
        return orderItem;
      }

      // Récupérer la variation de couleur complète avec ses images
      const colorVariation = await prisma.colorVariation.findUnique({
        where: { id: orderItem.colorId },
        include: {
          images: {
            include: {
              delimitations: true,
            },
          },
        },
      });

      if (!colorVariation) {
        this.logger.warn(`ColorVariation ${orderItem.colorId} non trouvée`);
        return orderItem;
      }

      // Construire l'objet colorVariationData
      const colorVariationData = {
        id: colorVariation.id,
        name: colorVariation.name,
        colorCode: colorVariation.colorCode,
        images: colorVariation.images.map((image: any) => ({
          id: image.id,
          url: image.url,
          viewType: image.viewType,
          delimitations: image.delimitations.map((delim: any) => ({
            x: delim.x,
            y: delim.y,
            width: delim.width,
            height: delim.height,
            coordinateType: delim.coordinateType || 'PIXEL',
            referenceWidth: delim.referenceWidth,
            referenceHeight: delim.referenceHeight,
          })),
        })),
      };

      // Enrichir les délimitations si manquantes
      const enrichedDelimitations = this.buildDelimitationsArray(
        orderItem,
        colorVariationData
      );

      // Enrichir la délimitation principale si manquante
      const enrichedDelimitation = orderItem.delimitation ||
        enrichedDelimitations[0] ||
        null;

      return {
        ...orderItem,
        colorVariationData,
        delimitations: enrichedDelimitations.length > 0 ? enrichedDelimitations : orderItem.delimitations,
        delimitation: enrichedDelimitation,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'enrichissement de l'orderItem: ${error.message}`,
        error.stack
      );
      return orderItem;
    }
  }

  /**
   * Construit l'array de délimitations à partir de viewsMetadata et colorVariationData
   */
  private static buildDelimitationsArray(
    orderItem: any,
    colorVariationData: any
  ): any[] {
    const delimitations: any[] = [];

    // Si delimitations déjà présent, le retourner
    if (orderItem.delimitations && Array.isArray(orderItem.delimitations)) {
      return orderItem.delimitations;
    }

    // Construire depuis viewsMetadata
    if (orderItem.viewsMetadata && Array.isArray(orderItem.viewsMetadata)) {
      for (const viewMeta of orderItem.viewsMetadata) {
        // Trouver l'image correspondante dans colorVariationData
        const image = colorVariationData.images.find(
          (img: any) => img.id === viewMeta.viewId
        );

        if (image && image.delimitations && image.delimitations[0]) {
          const delim = image.delimitations[0];
          delimitations.push({
            viewId: viewMeta.viewId,
            viewKey: viewMeta.viewKey,
            viewType: viewMeta.viewType || image.viewType,
            imageUrl: viewMeta.imageUrl || image.url,
            x: delim.x,
            y: delim.y,
            width: delim.width,
            height: delim.height,
            coordinateType: delim.coordinateType || 'PIXEL',
            referenceWidth: delim.referenceWidth,
            referenceHeight: delim.referenceHeight,
          });
        }
      }
    }

    // Si toujours vide, construire depuis designElementsByView
    if (delimitations.length === 0 && orderItem.designElementsByView) {
      for (const viewKey of Object.keys(orderItem.designElementsByView)) {
        const [colorId, viewId] = viewKey.split('-').map(Number);

        // Trouver l'image correspondante
        const image = colorVariationData.images.find(
          (img: any) => img.id === viewId
        );

        if (image && image.delimitations && image.delimitations[0]) {
          const delim = image.delimitations[0];
          delimitations.push({
            viewId: viewId,
            viewKey: viewKey,
            viewType: image.viewType,
            imageUrl: image.url,
            x: delim.x,
            y: delim.y,
            width: delim.width,
            height: delim.height,
            coordinateType: delim.coordinateType || 'PIXEL',
            referenceWidth: delim.referenceWidth,
            referenceHeight: delim.referenceHeight,
          });
        }
      }
    }

    return delimitations;
  }

  /**
   * Enrichit tous les items d'une commande
   */
  static async enrichAllOrderItems(
    orderItems: any[],
    prisma: PrismaService
  ): Promise<any[]> {
    const enrichedItems = [];

    for (const item of orderItems) {
      const enrichedItem = await this.enrichOrderItemWithColorVariation(
        item,
        prisma
      );
      enrichedItems.push(enrichedItem);
    }

    return enrichedItems;
  }

  /**
   * Valide que les délimitations ont des dimensions de référence correctes
   * Retourne un warning si 800x800 est détecté
   */
  static validateDelimitationDimensions(delimitations: any[]): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    if (!delimitations || !Array.isArray(delimitations)) {
      return { isValid: true, warnings };
    }

    for (const delim of delimitations) {
      if (delim.referenceWidth === 800 || delim.referenceHeight === 800) {
        warnings.push(
          `⚠️ Délimitation pour vue ${delim.viewKey || delim.viewId} ` +
          `a des dimensions de référence suspectes (800x800)`
        );
      }

      if (!delim.referenceWidth || !delim.referenceHeight) {
        warnings.push(
          `❌ Délimitation pour vue ${delim.viewKey || delim.viewId} ` +
          `manque les dimensions de référence`
        );
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }
}
