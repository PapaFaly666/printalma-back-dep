import { BadRequestException } from '@nestjs/common';

/**
 * Interface pour les résultats de validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valide la structure des données de customisation
 * Basé sur BACKEND_ORDER_CUSTOMIZATION_GUIDE.md
 */
export class CustomizationValidator {
  /**
   * Valide les données de customisation d'un orderItem
   */
  static validateCustomizationData(itemData: any): ValidationResult {
    const errors: string[] = [];

    // Vérifier customizationIds si présent
    if (itemData.customizationIds) {
      const customizationIdsErrors = this.validateCustomizationIds(itemData.customizationIds);
      errors.push(...customizationIdsErrors);
    }

    // Vérifier designElementsByView si présent
    if (itemData.designElementsByView) {
      const designElementsErrors = this.validateDesignElementsByView(itemData.designElementsByView);
      errors.push(...designElementsErrors);
    }

    // Vérifier la cohérence entre customizationIds et designElementsByView
    if (itemData.customizationIds && itemData.designElementsByView) {
      const coherenceErrors = this.validateCoherence(
        itemData.customizationIds,
        itemData.designElementsByView
      );
      errors.push(...coherenceErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide la structure de customizationIds
   * Format attendu: {"colorId-viewId": customizationId, ...}
   */
  private static validateCustomizationIds(customizationIds: any): string[] {
    const errors: string[] = [];

    if (typeof customizationIds !== 'object' || customizationIds === null) {
      errors.push('customizationIds doit être un objet');
      return errors;
    }

    // Vérifier le format des clés et des valeurs
    for (const [key, value] of Object.entries(customizationIds)) {
      // Format de clé: "colorId-viewId" (ex: "1-5")
      if (!/^\d+-\d+$/.test(key)) {
        errors.push(`Format invalide pour customizationIds: "${key}" (format attendu: "colorId-viewId")`);
      }

      // Valeur doit être un nombre entier positif
      if (!Number.isInteger(value) || (value as number) <= 0) {
        errors.push(`ID invalide pour la vue "${key}": ${value} (doit être un entier positif)`);
      }
    }

    return errors;
  }

  /**
   * Valide la structure de designElementsByView
   * Format attendu: {"colorId-viewId": [elements], ...}
   */
  private static validateDesignElementsByView(designElementsByView: any): string[] {
    const errors: string[] = [];

    if (typeof designElementsByView !== 'object' || designElementsByView === null) {
      errors.push('designElementsByView doit être un objet');
      return errors;
    }

    for (const [viewKey, elements] of Object.entries(designElementsByView)) {
      // Vérifier le format de la clé
      if (!/^\d+-\d+$/.test(viewKey)) {
        errors.push(`Format invalide pour designElementsByView: "${viewKey}" (format attendu: "colorId-viewId")`);
      }

      // Les éléments doivent être un tableau
      if (!Array.isArray(elements)) {
        errors.push(`Les éléments de la vue "${viewKey}" doivent être un tableau`);
        continue;
      }

      // Valider chaque élément
      (elements as any[]).forEach((element, index) => {
        const elementErrors = this.validateDesignElement(element, viewKey, index);
        errors.push(...elementErrors);
      });
    }

    return errors;
  }

  /**
   * Valide un élément de design individuel
   */
  private static validateDesignElement(element: any, viewKey: string, index: number): string[] {
    const errors: string[] = [];

    // Type requis
    if (!element.type || !['text', 'image'].includes(element.type)) {
      errors.push(`Type invalide pour l'élément ${index} de la vue "${viewKey}" (doit être "text" ou "image")`);
    }

    // Champs requis pour type "text"
    if (element.type === 'text') {
      if (!element.text) {
        errors.push(`Texte manquant pour l'élément ${index} de la vue "${viewKey}"`);
      }
      if (typeof element.fontSize !== 'number' || element.fontSize <= 0) {
        errors.push(`fontSize invalide pour l'élément ${index} de la vue "${viewKey}"`);
      }
      if (!element.fontFamily) {
        errors.push(`fontFamily manquant pour l'élément ${index} de la vue "${viewKey}"`);
      }
      if (!element.color) {
        errors.push(`color manquant pour l'élément ${index} de la vue "${viewKey}"`);
      }
    }

    // Champs requis pour type "image"
    if (element.type === 'image') {
      if (!element.imageUrl) {
        errors.push(`URL d'image manquante pour l'élément ${index} de la vue "${viewKey}"`);
      }
    }

    // Coordonnées requises pour tous les types
    if (typeof element.x !== 'number') {
      errors.push(`Coordonnée x manquante ou invalide pour l'élément ${index} de la vue "${viewKey}"`);
    }
    if (typeof element.y !== 'number') {
      errors.push(`Coordonnée y manquante ou invalide pour l'élément ${index} de la vue "${viewKey}"`);
    }

    // Dimensions requises
    if (typeof element.width !== 'number' || element.width <= 0) {
      errors.push(`width invalide pour l'élément ${index} de la vue "${viewKey}"`);
    }
    if (typeof element.height !== 'number' || element.height <= 0) {
      errors.push(`height invalide pour l'élément ${index} de la vue "${viewKey}"`);
    }

    return errors;
  }

  /**
   * Vérifie la cohérence entre customizationIds et designElementsByView
   * Les clés doivent correspondre
   */
  private static validateCoherence(
    customizationIds: Record<string, number>,
    designElementsByView: Record<string, any[]>
  ): string[] {
    const errors: string[] = [];

    const customizationKeys = Object.keys(customizationIds);
    const designKeys = Object.keys(designElementsByView);

    // Vérifier que les clés correspondent
    const missingInDesign = customizationKeys.filter(key => !designKeys.includes(key));
    const missingInCustomization = designKeys.filter(key => !customizationKeys.includes(key));

    if (missingInDesign.length > 0) {
      errors.push(
        `Vues manquantes dans designElementsByView: ${missingInDesign.join(', ')}`
      );
    }

    if (missingInCustomization.length > 0) {
      errors.push(
        `Vues manquantes dans customizationIds: ${missingInCustomization.join(', ')}`
      );
    }

    return errors;
  }

  /**
   * Valide et lance une exception si les données sont invalides
   * Utilise validateCustomizationData et lance BadRequestException si erreurs
   */
  static validateOrThrow(itemData: any): void {
    const result = this.validateCustomizationData(itemData);

    if (!result.isValid) {
      throw new BadRequestException({
        message: 'Données de customisation invalides',
        errors: result.errors
      });
    }
  }
}
