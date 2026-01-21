/**
 * 🎯 Utilitaire de Calcul de Bounding Box (Backend)
 *
 * Ce module implémente l'algorithme unifié de calcul de bounding box
 * pour garantir un alignement pixel-perfect entre le frontend et le backend.
 *
 * Documentation : BOUNDING_BOX_IMPLEMENTATION.md
 * Version : 2.0
 * Date : 19 janvier 2026
 */

/**
 * Interface pour la délimitation (zone de placement sur le produit)
 */
export interface Delimitation {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PIXEL' | 'PERCENTAGE';

  // Dimensions de l'image originale (pour conversion de pourcentages stockés)
  originalImageWidth?: number;
  originalImageHeight?: number;
  referenceWidth?: number;
  referenceHeight?: number;
}

/**
 * Interface pour les transformations du design
 * (format envoyé par le frontend)
 */
export interface DesignTransform {
  /** Offset horizontal depuis le centre de la délimitation (en pixels absolus) */
  x: number;

  /** Offset vertical depuis le centre de la délimitation (en pixels absolus) */
  y: number;

  /** Échelle du design (0.8 = 80% de la délimitation) */
  designScale: number;

  /** Rotation en degrés (0-360) */
  rotation: number;

  /** Unité de position (toujours PIXEL) */
  positionUnit: 'PIXEL';

  /** Largeur de la délimitation en pixels absolus (ESSENTIEL) */
  delimitationWidth: number;

  /** Hauteur de la délimitation en pixels absolus (ESSENTIEL) */
  delimitationHeight: number;
}

/**
 * Interface pour la bounding box absolue calculée
 */
export interface BoundingBox {
  /** Position X du coin supérieur gauche (pixels) */
  left: number;

  /** Position Y du coin supérieur gauche (pixels) */
  top: number;

  /** Largeur du conteneur (pixels) */
  width: number;

  /** Hauteur du conteneur (pixels) */
  height: number;
}

/**
 * Interface pour les contraintes de position
 */
export interface PositionConstraints {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * 🎯 Convertir une délimitation en pixels absolus
 *
 * @param delimitation - Délimitation (peut être en PIXEL ou PERCENTAGE)
 * @param imageWidth - Largeur de l'image produit
 * @param imageHeight - Hauteur de l'image produit
 * @returns Délimitation en pixels absolus
 */
export function convertDelimitationToPixels(
  delimitation: Delimitation,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  // Si déjà en pixels, retourner directement
  if (delimitation.coordinateType === 'PIXEL') {
    return {
      x: delimitation.x,
      y: delimitation.y,
      width: delimitation.width,
      height: delimitation.height,
    };
  }

  // ⚠️ CAS SPÉCIAL: Si marqué PERCENTAGE mais valeurs > 100,
  // ce sont probablement des pixels absolus enregistrés sur une image de référence
  if (
    delimitation.coordinateType === 'PERCENTAGE' &&
    (delimitation.x > 100 || delimitation.y > 100 ||
     delimitation.width > 100 || delimitation.height > 100)
  ) {
    // Tenter de convertir depuis les dimensions de l'image originale si disponibles
    if (delimitation.originalImageWidth && delimitation.originalImageHeight) {
      const percentX = (delimitation.x / delimitation.originalImageWidth) * 100;
      const percentY = (delimitation.y / delimitation.originalImageHeight) * 100;
      const percentWidth = (delimitation.width / delimitation.originalImageWidth) * 100;
      const percentHeight = (delimitation.height / delimitation.originalImageHeight) * 100;

      return {
        x: (percentX / 100) * imageWidth,
        y: (percentY / 100) * imageHeight,
        width: (percentWidth / 100) * imageWidth,
        height: (percentHeight / 100) * imageHeight,
      };
    }

    // Fallback: traiter comme pixels absolus (échelle si nécessaire)
    // Si les valeurs semblent être pour une image différente de l'actuelle
    const maxDimension = Math.max(imageWidth, imageHeight);
    if (delimitation.x > maxDimension || delimitation.y > maxDimension) {
      // Les valeurs sont trop grandes, elles doivent être mises à l'échelle
      // Supposer qu'elles étaient pour une image de 6000x6000 (valeur arbitraire mais raisonnable)
      const refDimension = 6000;
      const scaleX = imageWidth / refDimension;
      const scaleY = imageHeight / refDimension;

      return {
        x: delimitation.x * scaleX,
        y: delimitation.y * scaleY,
        width: delimitation.width * scaleX,
        height: delimitation.height * scaleY,
      };
    }

    // Sinon, utiliser directement les valeurs (elles sont peut-être déjà correctes)
    return {
      x: delimitation.x,
      y: delimitation.y,
      width: delimitation.width,
      height: delimitation.height,
    };
  }

  // Conversion pourcentage → pixels (cas normal, valeurs entre 0-100)
  return {
    x: (delimitation.x / 100) * imageWidth,
    y: (delimitation.y / 100) * imageHeight,
    width: (delimitation.width / 100) * imageWidth,
    height: (delimitation.height / 100) * imageHeight,
  };
}

/**
 * 🎯 Calculer les contraintes de position
 *
 * Les contraintes garantissent que le conteneur reste toujours dans la délimitation.
 *
 * @param delimitationWidth - Largeur de la délimitation (pixels)
 * @param delimitationHeight - Hauteur de la délimitation (pixels)
 * @param designScale - Échelle du design
 * @returns Contraintes min/max pour x et y
 */
export function calculatePositionConstraints(
  delimitationWidth: number,
  delimitationHeight: number,
  designScale: number
): PositionConstraints {
  const containerWidth = delimitationWidth * designScale;
  const containerHeight = delimitationHeight * designScale;

  const maxX = (delimitationWidth - containerWidth) / 2;
  const minX = -(delimitationWidth - containerWidth) / 2;
  const maxY = (delimitationHeight - containerHeight) / 2;
  const minY = -(delimitationHeight - containerHeight) / 2;

  return { minX, maxX, minY, maxY };
}

/**
 * 🎯 Calculer la bounding box absolue
 *
 * Cette fonction implémente l'algorithme exact de la documentation.
 *
 * **Algorithme :**
 * 1. Calculer les dimensions du conteneur : containerWidth = delimitationWidth × designScale
 * 2. Calculer le centre de la délimitation : centerX = delimitation.x + delimitationWidth / 2
 * 3. Calculer le centre du conteneur : containerCenterX = centerX + offsetX
 * 4. Calculer le coin supérieur gauche : left = containerCenterX - containerWidth / 2
 *
 * @param delimitation - Délimitation (en pixels absolus)
 * @param transform - Transformations du design
 * @returns Bounding box absolue
 */
export function calculateAbsoluteBoundingBox(
  delimitation: { x: number; y: number; width: number; height: number },
  transform: DesignTransform
): BoundingBox {
  // 1. Dimensions du conteneur
  const containerWidth = transform.delimitationWidth * transform.designScale;
  const containerHeight = transform.delimitationHeight * transform.designScale;

  // 2. Centre de la délimitation
  const centerX = delimitation.x + transform.delimitationWidth / 2;
  const centerY = delimitation.y + transform.delimitationHeight / 2;

  // 3. Position du centre du conteneur (avec offsets)
  const containerCenterX = centerX + transform.x;
  const containerCenterY = centerY + transform.y;

  // 4. Coin supérieur gauche de la bounding box
  const left = containerCenterX - containerWidth / 2;
  const top = containerCenterY - containerHeight / 2;

  return {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(containerWidth),
    height: Math.round(containerHeight),
  };
}

/**
 * 🎯 Calculer la bounding box avec conversion automatique de la délimitation
 *
 * Version complète qui gère automatiquement la conversion de la délimitation.
 *
 * @param delimitation - Délimitation (peut être en PIXEL ou PERCENTAGE)
 * @param transform - Transformations du design
 * @param imageWidth - Largeur de l'image produit
 * @param imageHeight - Hauteur de l'image produit
 * @returns Bounding box absolue
 */
export function calculateBoundingBoxWithConversion(
  delimitation: Delimitation,
  transform: DesignTransform,
  imageWidth: number,
  imageHeight: number
): BoundingBox {
  // Convertir la délimitation en pixels si nécessaire
  const delimInPixels = convertDelimitationToPixels(
    delimitation,
    imageWidth,
    imageHeight
  );

  // Calculer la bounding box
  return calculateAbsoluteBoundingBox(delimInPixels, transform);
}

/**
 * 🎯 Appliquer les contraintes sur une position
 *
 * Garantit que la position reste dans les limites autorisées.
 *
 * @param x - Position X demandée
 * @param y - Position Y demandée
 * @param constraints - Contraintes calculées
 * @returns Position contrainte
 */
export function applyPositionConstraints(
  x: number,
  y: number,
  constraints: PositionConstraints
): { x: number; y: number } {
  return {
    x: Math.max(constraints.minX, Math.min(constraints.maxX, x)),
    y: Math.max(constraints.minY, Math.min(constraints.maxY, y)),
  };
}

/**
 * 🎯 Calculer toutes les informations de positionnement en une fois
 *
 * Fonction complète qui calcule :
 * - La bounding box absolue
 * - Les contraintes de position
 * - La position contrainte
 *
 * @param delimitation - Délimitation
 * @param transform - Transformations du design
 * @param imageWidth - Largeur de l'image produit
 * @param imageHeight - Hauteur de l'image produit
 * @returns Objet complet avec toutes les informations
 */
export function calculateCompletePositioning(
  delimitation: Delimitation,
  transform: DesignTransform,
  imageWidth: number,
  imageHeight: number
): {
  boundingBox: BoundingBox;
  constraints: PositionConstraints;
  constrainedPosition: { x: number; y: number };
  delimInPixels: { x: number; y: number; width: number; height: number };
  containerDimensions: { width: number; height: number };
  centerDelimitation: { x: number; y: number };
  centerContainer: { x: number; y: number };
} {
  // 1. Convertir la délimitation en pixels
  const delimInPixels = convertDelimitationToPixels(
    delimitation,
    imageWidth,
    imageHeight
  );

  // 2. Calculer les dimensions du conteneur
  const containerWidth = transform.delimitationWidth * transform.designScale;
  const containerHeight = transform.delimitationHeight * transform.designScale;

  // 3. Calculer les contraintes
  const constraints = calculatePositionConstraints(
    transform.delimitationWidth,
    transform.delimitationHeight,
    transform.designScale
  );

  // 4. Appliquer les contraintes sur la position
  const constrainedPosition = applyPositionConstraints(
    transform.x,
    transform.y,
    constraints
  );

  // 5. Calculer les centres
  const centerX = delimInPixels.x + transform.delimitationWidth / 2;
  const centerY = delimInPixels.y + transform.delimitationHeight / 2;

  const containerCenterX = centerX + constrainedPosition.x;
  const containerCenterY = centerY + constrainedPosition.y;

  // 6. Calculer la bounding box
  const boundingBox: BoundingBox = {
    left: Math.round(containerCenterX - containerWidth / 2),
    top: Math.round(containerCenterY - containerHeight / 2),
    width: Math.round(containerWidth),
    height: Math.round(containerHeight),
  };

  return {
    boundingBox,
    constraints,
    constrainedPosition,
    delimInPixels,
    containerDimensions: {
      width: Math.round(containerWidth),
      height: Math.round(containerHeight),
    },
    centerDelimitation: {
      x: Math.round(centerX),
      y: Math.round(centerY),
    },
    centerContainer: {
      x: Math.round(containerCenterX),
      y: Math.round(containerCenterY),
    },
  };
}

/**
 * 🎯 Valider les données de transformation
 *
 * Vérifie que les données essentielles sont présentes et valides.
 *
 * @param transform - Transformations du design
 * @throws Error si les données sont invalides
 */
export function validateDesignTransform(transform: DesignTransform): void {
  if (!transform.delimitationWidth || !transform.delimitationHeight) {
    throw new Error(
      '❌ delimitationWidth et delimitationHeight sont obligatoires'
    );
  }

  if (transform.delimitationWidth <= 0 || transform.delimitationHeight <= 0) {
    throw new Error(
      `❌ Dimensions de délimitation invalides: ${transform.delimitationWidth}x${transform.delimitationHeight}`
    );
  }

  if (transform.designScale <= 0 || transform.designScale > 1) {
    throw new Error(
      `❌ designScale invalide (${transform.designScale}), doit être entre 0 et 1`
    );
  }
}
