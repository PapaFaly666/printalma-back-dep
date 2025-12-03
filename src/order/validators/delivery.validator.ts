import { BadRequestException } from '@nestjs/common';

/**
 * Interface pour les résultats de validation de livraison
 */
export interface DeliveryValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valide les données de livraison d'une commande
 * Basé sur BACKEND_DELIVERY_SYSTEM_GUIDE.md
 */
export class DeliveryValidator {
  /**
   * Valide les informations de livraison complètes
   */
  static validateDeliveryInfo(deliveryInfo: any): DeliveryValidationResult {
    const errors: string[] = [];

    if (!deliveryInfo) {
      errors.push('Informations de livraison manquantes');
      return { isValid: false, errors };
    }

    // 🇸🇳 EXEMPTION POUR LE SÉNÉGAL - Pas besoin de transporteur/tarif pour le Sénégal
    const isSenegal = deliveryInfo.countryCode === 'SN' ||
                     deliveryInfo.countryName?.toLowerCase() === 'sénégal' ||
                     deliveryInfo.countryName?.toLowerCase() === 'senegal';

    if (isSenegal) {
      // Pour le Sénégal, aucune validation de transporteur/tarif n'est requise
      // On accepte les données de livraison de base
      return { isValid: true, errors: [] };
    }

    // 🔍 VALIDATION POUR L'INTERNATIONAL (hors Sénégal)
    // Champs obligatoires uniquement pour l'international
    if (!deliveryInfo.transporteurId) {
      errors.push('Transporteur non spécifié');
    }

    if (!deliveryInfo.zoneTarifId) {
      errors.push('Tarif de livraison non spécifié');
    }

    if (typeof deliveryInfo.deliveryFee !== 'number' || deliveryInfo.deliveryFee < 0) {
      errors.push('Frais de livraison invalides');
    }

    // Validation du type de livraison
    const validTypes = ['city', 'region', 'international'];
    if (!deliveryInfo.deliveryType) {
      errors.push('Type de livraison non spécifié');
    } else if (!validTypes.includes(deliveryInfo.deliveryType)) {
      errors.push(`Type de livraison invalide: "${deliveryInfo.deliveryType}" (doit être: city, region, ou international)`);
    }

    // Vérifier la cohérence des données selon le type
    if (deliveryInfo.deliveryType === 'city') {
      if (!deliveryInfo.cityId) {
        errors.push('ID de ville manquant pour livraison en ville');
      }
    }

    if (deliveryInfo.deliveryType === 'region') {
      if (!deliveryInfo.regionId) {
        errors.push('ID de région manquant pour livraison en région');
      }
    }

    if (deliveryInfo.deliveryType === 'international') {
      if (!deliveryInfo.zoneId) {
        errors.push('ID de zone manquant pour livraison internationale');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide qu'un transporteur existe et est actif
   */
  static validateTransporteurExists(transporteur: any): DeliveryValidationResult {
    const errors: string[] = [];

    if (!transporteur) {
      errors.push('Transporteur introuvable');
      return { isValid: false, errors };
    }

    if (transporteur.status !== 'active') {
      errors.push('Transporteur inactif ou désactivé');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide qu'un tarif existe et correspond au transporteur
   */
  static validateTarifExists(tarif: any, transporteurId: string): DeliveryValidationResult {
    const errors: string[] = [];

    if (!tarif) {
      errors.push('Tarif de livraison introuvable');
      return { isValid: false, errors };
    }

    if (tarif.transporteurId !== transporteurId) {
      errors.push('Tarif ne correspond pas au transporteur sélectionné');
    }

    if (tarif.status !== 'active') {
      errors.push('Tarif inactif ou désactivé');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide la cohérence des frais de livraison
   * Tolérance de 1% pour les arrondis
   */
  static validateDeliveryFee(requestedFee: number, tarifFromDB: any): DeliveryValidationResult {
    const errors: string[] = [];

    const tarifPrice = parseFloat(tarifFromDB.prixTransporteur?.toString() || '0');
    const tolerance = tarifPrice * 0.01;
    const difference = Math.abs(requestedFee - tarifPrice);

    if (difference > tolerance) {
      errors.push(
        `Frais de livraison incorrects. Attendu: ${tarifPrice} XOF, Reçu: ${requestedFee} XOF`
      );
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide qu'une zone de livraison existe
   */
  static validateZoneExists(zone: any, zoneType: string): DeliveryValidationResult {
    const errors: string[] = [];

    if (!zone) {
      errors.push(`Zone de livraison (${zoneType}) introuvable`);
      return { isValid: false, errors };
    }

    if (zone.status && zone.status !== 'active') {
      errors.push(`Zone de livraison (${zoneType}) inactive`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide et lance une exception si les données sont invalides
   */
  static validateOrThrow(deliveryInfo: any): void {
    const result = this.validateDeliveryInfo(deliveryInfo);

    if (!result.isValid) {
      throw new BadRequestException({
        message: 'Données de livraison invalides',
        errors: result.errors
      });
    }
  }

  /**
   * Valide la compatibilité transporteur-zone
   */
  static validateTransporteurZoneCompatibility(
    transporteurZones: any[],
    zoneId: string,
    zoneType: string
  ): DeliveryValidationResult {
    const errors: string[] = [];

    // Vérifier si le transporteur couvre cette zone
    const hasZone = transporteurZones.some(
      tz => tz.zoneId === zoneId && tz.zoneType === zoneType
    );

    if (!hasZone) {
      errors.push(`Le transporteur ne couvre pas cette zone (${zoneType}: ${zoneId})`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
