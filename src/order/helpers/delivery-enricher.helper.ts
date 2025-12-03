import { Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DeliveryValidator } from '../validators/delivery.validator';

/**
 * Helper service pour enrichir les données de livraison
 * avec les informations complètes depuis la base de données
 */
export class DeliveryEnricherHelper {
  private static readonly logger = new Logger(DeliveryEnricherHelper.name);

  /**
   * Enrichit les données de livraison avec les informations complètes
   * depuis la base de données
   */
  static async enrichDeliveryInfo(
    deliveryInfo: any,
    prisma: PrismaService
  ): Promise<any> {
    try {
      const enriched: any = { ...deliveryInfo };

      // 🇸🇳 CAS PARTICULIER : PAYS = SÉNÉGAL OU SANS TRANSPORTEUR
      // Pour le Sénégal ou les livraisons sans transporteur, on retourne les données sans enrichissement
      if (!deliveryInfo.transporteurId ||
          deliveryInfo.countryCode === 'SN' ||
          deliveryInfo.countryName?.toLowerCase() === 'sénégal' ||
          deliveryInfo.countryName?.toLowerCase() === 'senegal') {

        this.logger.log(`🇸🇳 Livraison Sénégal détectée - Pas d'enrichissement transporteur requis`);

        // Conserver uniquement les informations de base
        enriched.transporteur = {
          id: null,
          name: deliveryInfo.transporteurName || 'Livraison standard',
          logo: null,
          phone: null,
          email: null,
          description: 'Livraison standard au Sénégal',
          status: 'active'
        };

        enriched.tarif = {
          id: null,
          amount: deliveryInfo.deliveryFee || 0,
          currency: 'XOF',
          deliveryTime: deliveryInfo.deliveryTime || '4-6 jours',
          description: 'Livraison standard au Sénégal'
        };

        // Ajouter les informations de localisation si disponibles
        if (deliveryInfo.cityName) {
          enriched.location = {
            type: 'city',
            id: deliveryInfo.cityId || null,
            name: deliveryInfo.cityName,
            countryCode: 'SN',
            countryName: 'Sénégal'
          };
        }

        enriched.calculatedAt = new Date().toISOString();
        return enriched;
      }

      // 🔍 CAS INTERNATIONAL : ENRICHISSEMENT COMPLET REQUIS
      // 1. Récupérer les infos complètes du transporteur
      const transporteur = await prisma.deliveryTransporteur.findUnique({
        where: { id: deliveryInfo.transporteurId },
        include: {
          zones: true
        }
      });

      // Valider que le transporteur existe et est actif
      const transporteurValidation = DeliveryValidator.validateTransporteurExists(transporteur);
      if (!transporteurValidation.isValid) {
        throw new BadRequestException({
          message: 'Transporteur invalide',
          errors: transporteurValidation.errors
        });
      }

      enriched.transporteur = {
        id: transporteur.id,
        name: transporteur.name,
        logo: transporteur.logoUrl,
        phone: null, // À ajouter au modèle si nécessaire
        email: null, // À ajouter au modèle si nécessaire
        description: null, // À ajouter au modèle si nécessaire
        status: transporteur.status
      };

      // 2. Récupérer les infos complètes du tarif
      const zoneTarif = await prisma.deliveryZoneTarif.findUnique({
        where: { id: deliveryInfo.zoneTarifId }
      });

      // Valider que le tarif existe et correspond au transporteur
      const tarifValidation = DeliveryValidator.validateTarifExists(
        zoneTarif,
        deliveryInfo.transporteurId
      );
      if (!tarifValidation.isValid) {
        throw new BadRequestException({
          message: 'Tarif invalide',
          errors: tarifValidation.errors
        });
      }

      // Valider la cohérence des frais
      const feeValidation = DeliveryValidator.validateDeliveryFee(
        deliveryInfo.deliveryFee,
        zoneTarif
      );
      if (!feeValidation.isValid) {
        this.logger.warn(
          `⚠️ Frais de livraison potentiellement incorrects: ${feeValidation.errors.join(', ')}`
        );
      }

      enriched.tarif = {
        id: zoneTarif.id,
        amount: parseFloat(zoneTarif.prixTransporteur.toString()),
        currency: 'XOF',
        deliveryTime: `${zoneTarif.delaiLivraisonMin}-${zoneTarif.delaiLivraisonMax} jours`,
        description: null
      };

      // 3. Récupérer les infos de la zone selon le type
      if (deliveryInfo.deliveryType === 'city' && deliveryInfo.cityId) {
        const city = await prisma.deliveryCity.findUnique({
          where: { id: deliveryInfo.cityId }
        });

        const zoneValidation = DeliveryValidator.validateZoneExists(city, 'city');
        if (!zoneValidation.isValid) {
          throw new BadRequestException({
            message: 'Ville invalide',
            errors: zoneValidation.errors
          });
        }

        enriched.location = {
          type: 'city',
          id: city.id,
          name: city.name,
          countryCode: 'SN',
          countryName: 'Sénégal',
          category: city.category,
          zoneType: city.zoneType
        };

        // Vérifier compatibilité transporteur-zone
        const compatibilityValidation = DeliveryValidator.validateTransporteurZoneCompatibility(
          transporteur.zones,
          city.id,
          'city'
        );
        if (!compatibilityValidation.isValid) {
          this.logger.warn(
            `⚠️ ${compatibilityValidation.errors.join(', ')}`
          );
        }
      } else if (deliveryInfo.deliveryType === 'region' && deliveryInfo.regionId) {
        const region = await prisma.deliveryRegion.findUnique({
          where: { id: deliveryInfo.regionId }
        });

        const zoneValidation = DeliveryValidator.validateZoneExists(region, 'region');
        if (!zoneValidation.isValid) {
          throw new BadRequestException({
            message: 'Région invalide',
            errors: zoneValidation.errors
          });
        }

        enriched.location = {
          type: 'region',
          id: region.id,
          name: region.name,
          countryCode: 'SN',
          countryName: 'Sénégal',
          mainCities: region.mainCities
        };

        // Vérifier compatibilité transporteur-zone
        const compatibilityValidation = DeliveryValidator.validateTransporteurZoneCompatibility(
          transporteur.zones,
          region.id,
          'region'
        );
        if (!compatibilityValidation.isValid) {
          this.logger.warn(
            `⚠️ ${compatibilityValidation.errors.join(', ')}`
          );
        }
      } else if (deliveryInfo.deliveryType === 'international' && deliveryInfo.zoneId) {
        const zone = await prisma.deliveryInternationalZone.findUnique({
          where: { id: deliveryInfo.zoneId },
          include: {
            countries: true
          }
        });

        const zoneValidation = DeliveryValidator.validateZoneExists(zone, 'international');
        if (!zoneValidation.isValid) {
          throw new BadRequestException({
            message: 'Zone internationale invalide',
            errors: zoneValidation.errors
          });
        }

        enriched.location = {
          type: 'international',
          id: zone.id,
          name: zone.name,
          countryCode: deliveryInfo.countryCode,
          countryName: deliveryInfo.countryName,
          countries: zone.countries.map(c => c.country)
        };

        // Vérifier compatibilité transporteur-zone
        const compatibilityValidation = DeliveryValidator.validateTransporteurZoneCompatibility(
          transporteur.zones,
          zone.id,
          'international'
        );
        if (!compatibilityValidation.isValid) {
          this.logger.warn(
            `⚠️ ${compatibilityValidation.errors.join(', ')}`
          );
        }
      }

      // 4. Ajouter le timestamp de calcul
      enriched.calculatedAt = new Date().toISOString();

      return enriched;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'enrichissement des données de livraison: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Construit l'objet deliveryMetadata pour sauvegarde en JSONB
   */
  static buildDeliveryMetadata(enrichedDeliveryInfo: any): any {
    return {
      deliveryType: enrichedDeliveryInfo.deliveryType,
      location: enrichedDeliveryInfo.location,
      transporteur: enrichedDeliveryInfo.transporteur,
      tarif: enrichedDeliveryInfo.tarif,
      calculatedAt: enrichedDeliveryInfo.calculatedAt,
      availableCarriers: enrichedDeliveryInfo.metadata?.availableCarriers || [],
      metadata: enrichedDeliveryInfo.metadata || {}
    };
  }

  /**
   * Construit l'objet deliveryInfo depuis les champs d'une commande
   * pour le retourner dans l'API
   */
  static buildDeliveryInfoFromOrder(order: any): any | null {
    // Si pas de données de livraison (anciennes commandes)
    if (!order.transporteurId) {
      return null;
    }

    const deliveryInfo: any = {
      deliveryType: order.deliveryType,
      location: {},
      transporteur: {
        id: order.transporteurId,
        name: order.transporteurName,
        logo: order.transporteurLogo,
        phone: order.transporteurPhone
      },
      tarif: {
        id: order.zoneTarifId,
        amount: order.deliveryFee,
        deliveryTime: order.deliveryTime
      }
    };

    // Ajouter les infos de localisation selon le type
    if (order.deliveryType === 'city') {
      deliveryInfo.location = {
        type: 'city',
        cityId: order.deliveryCityId,
        cityName: order.deliveryCityName,
        countryCode: 'SN',
        countryName: 'Sénégal'
      };
    } else if (order.deliveryType === 'region') {
      deliveryInfo.location = {
        type: 'region',
        regionId: order.deliveryRegionId,
        regionName: order.deliveryRegionName,
        countryCode: 'SN',
        countryName: 'Sénégal'
      };
    } else if (order.deliveryType === 'international') {
      deliveryInfo.location = {
        type: 'international',
        zoneId: order.deliveryZoneId,
        zoneName: order.deliveryZoneName,
        countryCode: order.shippingCountry, // Depuis l'adresse de livraison
        countryName: order.shippingCountry
      };
    }

    // Ajouter les métadonnées si disponibles
    if (order.deliveryMetadata) {
      deliveryInfo.metadata = typeof order.deliveryMetadata === 'string'
        ? JSON.parse(order.deliveryMetadata)
        : order.deliveryMetadata;
    }

    return deliveryInfo;
  }
}
