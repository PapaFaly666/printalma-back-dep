import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import axios from 'axios';
import {
  calculateCompletePositioning,
  validateDesignTransform,
  convertDelimitationToPixels,
  type DesignTransform,
  type Delimitation as BBoxDelimitation,
} from '../utils/bounding-box-calculator';

interface Delimitation {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
}

/**
 * 🎯 Interface de position du design (nouveau format unifié)
 */
interface DesignPosition {
  x: number;              // Offset X depuis le centre de la délimitation (en pixels)
  y: number;              // Offset Y depuis le centre de la délimitation (en pixels)

  // Support des deux formats (rétro-compatibilité)
  designScale?: number;   // ✅ NOUVEAU: Échelle du design (0.8 = 80% de la délimitation)
  scale?: number;         // 🔄 ANCIEN: Échelle du design (rétro-compatibilité)

  rotation?: number;      // Rotation en degrés (0-360)
  designWidth?: number;   // ❌ OBSOLÈTE: Le backend calcule avec fit: 'inside'
  designHeight?: number;  // ❌ OBSOLÈTE: Le backend calcule avec fit: 'inside'
  positionUnit?: 'PIXEL' | 'PERCENTAGE'; // Toujours PIXEL (logique unifiée)

  // 🎯 LOGIQUE UNIFIÉE - Dimensions ESSENTIELLES envoyées par le frontend
  delimitationWidth?: number;   // ✅ ESSENTIEL: Largeur de la délimitation en pixels
  delimitationHeight?: number;  // ✅ ESSENTIEL: Hauteur de la délimitation en pixels

  // ❌ OBSOLÈTE: Le backend recalcule containerWidth/containerHeight
  // containerWidth?: number;
  // containerHeight?: number;
}

interface ProductPreviewConfig {
  productImageUrl: string;    // Image du produit (t-shirt, mug, etc.)
  designImageUrl: string;      // Image du design
  delimitation: Delimitation;  // Zone imprimable (OBLIGATOIRE)
  position: DesignPosition;    // Position du design dans la délimitation
  showDelimitation?: boolean;  // ⚠️ DEBUG: Afficher un contour rouge autour de la délimitation
  isSticker?: boolean;         // 🎨 Si true, applique une bordure blanche au design (style autocollant)
}

@Injectable()
export class ProductPreviewGeneratorService {
  private readonly logger = new Logger(ProductPreviewGeneratorService.name);

  /**
   * Télécharger une image depuis une URL
   * Les SVG sont téléchargés bruts et seront convertis par Sharp
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      this.logger.log(`📥 Téléchargement de l'image: ${url}`);
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 120000, // 2 minutes - timeout augmenté pour les connexions lentes
      });

      this.logger.log(`✅ Téléchargement réussi - Status: ${response.status}, Taille: ${response.data.byteLength} bytes`);

      const buffer = Buffer.from(response.data);

      // Si c'est un SVG, le convertir immédiatement en PNG avec Sharp
      if (url.includes('.svg')) {
        this.logger.log(`🔄 Conversion SVG → PNG avec Sharp (taille SVG: ${buffer.length} bytes)`);
        try {
          // Sharp peut lire les SVG et les convertir en PNG
          // Définir une taille raisonnable pour le SVG (2000px max)
          // Augmenter la limite de densité pour les SVG complexes
          const pngBuffer = await sharp(buffer, {
            density: 300,  // DPI pour la conversion SVG → PNG
            limitInputPixels: false  // Pas de limite pour les grands SVG
          })
            .resize(2000, 2000, {
              fit: 'inside',
              withoutEnlargement: false,
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png({
              quality: 90,
              compressionLevel: 6,
              effort: 5
            })
            .toBuffer();
          this.logger.log(`✅ SVG converti en PNG (${pngBuffer.length} bytes)`);
          return pngBuffer;
        } catch (svgError) {
          this.logger.error(`❌ Erreur conversion SVG:`, {
            message: svgError.message,
            stack: svgError.stack,
            bufferLength: buffer.length,
            bufferStart: buffer.slice(0, 200).toString('utf-8').substring(0, 200)
          });
          throw new Error(`Impossible de convertir le SVG: ${svgError.message}`);
        }
      }

      return buffer;
    } catch (error) {
      this.logger.error(`❌ Erreur téléchargement image DÉTAILS:`, {
        url,
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        stack: error.stack
      });
      throw new Error(`Impossible de télécharger l'image: ${error.message || error.code || 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtenir les dimensions d'un buffer
   */
  private async getDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  }

  /**
   * Ajouter un contour blanc au design (effet autocollant) - SUIT LES CONTOURS
   *
   * Cette méthode crée une bordure blanche qui suit la forme du design
   * en utilisant une dilatation du canal alpha avec Sharp + SVG.
   *
   * @param imageBuffer - Buffer de l'image du design
   * @param strokeWidth - Épaisseur du contour en pixels
   * @returns Buffer de l'image avec contour blanc suivant la forme
   */
  private async addWhiteStrokeToDesign(
    imageBuffer: Buffer,
    strokeWidth: number = 80
  ): Promise<Buffer> {
    const dims = await this.getDimensions(imageBuffer);

    this.logger.log(`🎨🎨🎨 ===== DÉBUT AJOUT BORDURE BLANCHE AUTOCOLLANT ===== 🎨🎨🎨`);
    this.logger.log(`✏️ Contour blanc autocollant suivant les contours (${strokeWidth}px)`);
    this.logger.log(`📐 Dimensions design original: ${dims.width}x${dims.height}px`);

    try {
      const newWidth = dims.width + (strokeWidth * 2);
      const newHeight = dims.height + (strokeWidth * 2);

      this.logger.log(`📏 Dimensions finales avec bordure: ${newWidth}x${newHeight}px`);

      // STRATÉGIE: Utiliser SVG avec feMorphology pour dilater l'alpha
      // Cette approche suit parfaitement les contours du design
      const svgFilter = `
        <svg width="${newWidth}" height="${newHeight}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="white-border" x="-50%" y="-50%" width="200%" height="200%">
              <!-- Extraire le canal alpha (la forme du design) -->
              <feColorMatrix in="SourceAlpha" type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="alpha"/>

              <!-- Dilater pour créer la bordure -->
              <feMorphology operator="dilate" radius="${strokeWidth}" in="alpha" result="expanded"/>

              <!-- Remplir avec du blanc -->
              <feFlood flood-color="white" result="white"/>
              <feComposite in="white" in2="expanded" operator="in" result="whiteBorder"/>

              <!-- Superposer le design original sur la bordure blanche -->
              <feMerge>
                <feMergeNode in="whiteBorder"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Appliquer le filtre au design -->
          <image x="${strokeWidth}" y="${strokeWidth}"
                 width="${dims.width}" height="${dims.height}"
                 href="data:image/png;base64,${imageBuffer.toString('base64')}"
                 filter="url(#white-border)"/>
        </svg>
      `;

      this.logger.log(`🔄 Application filtre SVG avec feMorphology...`);

      // Convertir le SVG en PNG
      const withBorder = await sharp(Buffer.from(svgFilter), {
        density: 150
      })
      .png({
        quality: 90,
        compressionLevel: 6
      })
      .toBuffer();

      const finalDims = await this.getDimensions(withBorder);
      const sizeBefore = Math.round(imageBuffer.length / 1024);
      const sizeAfter = Math.round(withBorder.length / 1024);

      this.logger.log(`✅ Bordure blanche suivant les contours appliquée!`);
      this.logger.log(`📊 ${dims.width}x${dims.height}px → ${finalDims.width}x${finalDims.height}px`);
      this.logger.log(`📦 Taille: ${sizeBefore}KB → ${sizeAfter}KB`);
      this.logger.log(`🎨🎨🎨 ===== FIN BORDURE AUTOCOLLANT ===== 🎨🎨🎨`);

      return withBorder;
    } catch (error) {
      this.logger.error(`❌ Erreur ajout bordure autocollant: ${error.message}`);
      this.logger.error(`Stack trace:`, error.stack);

      // FALLBACK: Bordure rectangulaire simple si le filtre SVG échoue
      this.logger.warn(`⚠️ Utilisation fallback: bordure rectangulaire simple`);
      try {
        const newWidth = dims.width + (strokeWidth * 2);
        const newHeight = dims.height + (strokeWidth * 2);

        return await sharp({
          create: {
            width: newWidth,
            height: newHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        })
        .composite([{
          input: imageBuffer,
          left: strokeWidth,
          top: strokeWidth
        }])
        .png()
        .toBuffer();
      } catch (fallbackError) {
        this.logger.error(`❌ Même le fallback a échoué: ${fallbackError.message}`);
        return imageBuffer;
      }
    }
  }

  /**
   * ⚠️ DEBUG : Dessiner un contour rouge autour de la délimitation
   * Permet de vérifier visuellement que la zone d'impression est bien respectée
   */
  private async drawDelimitationRect(
    imageBuffer: Buffer,
    delimInPixels: { x: number; y: number; width: number; height: number }
  ): Promise<Buffer> {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    this.logger.log(`🔴 DEBUG: Tracé délimitation sur l'image ${width}x${height}px`);
    this.logger.log(`🔴 Rectangle: x=${Math.round(delimInPixels.x)}, y=${Math.round(delimInPixels.y)}, ` +
      `w=${Math.round(delimInPixels.width)}, h=${Math.round(delimInPixels.height)}`);

    // Créer un calque SVG avec le rectangle rouge
    const borderWidth = 4;
    const svg = `
      <svg width="${width}" height="${height}">
        <rect
          x="${Math.round(delimInPixels.x)}"
          y="${Math.round(delimInPixels.y)}"
          width="${Math.round(delimInPixels.width)}"
          height="${Math.round(delimInPixels.height)}"
          fill="none"
          stroke="#FF0000"
          stroke-width="${borderWidth}"
          stroke-dasharray="10,5"
        />
        <!-- Marqueurs aux coins pour visualiser les limites -->
        <line x1="${Math.round(delimInPixels.x) - 10}" y1="${Math.round(delimInPixels.y)}" x2="${Math.round(delimInPixels.x) + 10}" y2="${Math.round(delimInPixels.y)}" stroke="#FF0000" stroke-width="${borderWidth}" />
        <line x1="${Math.round(delimInPixels.x)}" y1="${Math.round(delimInPixels.y) - 10}" x2="${Math.round(delimInPixels.x)}" y2="${Math.round(delimInPixels.y) + 10}" stroke="#FF0000" stroke-width="${borderWidth}" />

        <line x1="${Math.round(delimInPixels.x + delimInPixels.width) - 10}" y1="${Math.round(delimInPixels.y)}" x2="${Math.round(delimInPixels.x + delimInPixels.width) + 10}" y2="${Math.round(delimInPixels.y)}" stroke="#FF0000" stroke-width="${borderWidth}" />
        <line x1="${Math.round(delimInPixels.x + delimInPixels.width)}" y1="${Math.round(delimInPixels.y) - 10}" x2="${Math.round(delimInPixels.x + delimInPixels.width)}" y2="${Math.round(delimInPixels.y) + 10}" stroke="#FF0000" stroke-width="${borderWidth}" />

        <line x1="${Math.round(delimInPixels.x)}" y1="${Math.round(delimInPixels.y + delimInPixels.height) - 10}" x2="${Math.round(delimInPixels.x)}" y2="${Math.round(delimInPixels.y + delimInPixels.height) + 10}" stroke="#FF0000" stroke-width="${borderWidth}" />
        <line x1="${Math.round(delimInPixels.x) - 10}" y1="${Math.round(delimInPixels.y + delimInPixels.height)}" x2="${Math.round(delimInPixels.x) + 10}" y2="${Math.round(delimInPixels.y + delimInPixels.height)}" stroke="#FF0000" stroke-width="${borderWidth}" />

        <line x1="${Math.round(delimInPixels.x + delimInPixels.width)}" y1="${Math.round(delimInPixels.y + delimInPixels.height) - 10}" x2="${Math.round(delimInPixels.x + delimInPixels.width)}" y2="${Math.round(delimInPixels.y + delimInPixels.height) + 10}" stroke="#FF0000" stroke-width="${borderWidth}" />
        <line x1="${Math.round(delimInPixels.x + delimInPixels.width) - 10}" y1="${Math.round(delimInPixels.y + delimInPixels.height)}" x2="${Math.round(delimInPixels.x + delimInPixels.width) + 10}" y2="${Math.round(delimInPixels.y + delimInPixels.height)}" stroke="#FF0000" stroke-width="${borderWidth}" />
      </svg>
    `;

    const svgBuffer = Buffer.from(svg);

    // Composer l'image avec le rectangle
    return await sharp(imageBuffer)
      .composite([
        {
          input: svgBuffer,
          left: 0,
          top: 0,
          blend: 'over',
        }
      ])
      .png()
      .toBuffer();
  }

  /**
   * Convertir une délimitation en pixels
   * Utilise l'utilitaire centralisé avec gestion des cas legacy
   */
  private convertDelimitationToPixelsLegacy(
    delim: any,
    imageWidth: number,
    imageHeight: number
  ): { x: number; y: number; width: number; height: number } {
    // Si c'est en PIXEL, utiliser directement les valeurs
    if (delim.coordinateType === 'PIXEL') {
      return {
        x: delim.x,
        y: delim.y,
        width: delim.width,
        height: delim.height
      };
    }

    // Si marqué comme PERCENTAGE mais valeurs > 100, ce sont probablement des pixels absolus
    // enregistrés sur une image de référence
    if (delim.coordinateType === 'PERCENTAGE' && (delim.x > 100 || delim.y > 100 || delim.width > 100 || delim.height > 100)) {
      this.logger.warn(`⚠️ Délimitation marquée PERCENTAGE mais avec valeurs > 100, traitement comme pixels absolus`);

      // Si on a originalImageWidth/Height, on peut calculer le vrai pourcentage
      if (delim.originalImageWidth && delim.originalImageHeight) {
        const percentX = (delim.x / delim.originalImageWidth) * 100;
        const percentY = (delim.y / delim.originalImageHeight) * 100;
        const percentWidth = (delim.width / delim.originalImageWidth) * 100;
        const percentHeight = (delim.height / delim.originalImageHeight) * 100;

        this.logger.log(`📐 Conversion: ${delim.x}px → ${percentX.toFixed(2)}%`);

        return {
          x: (percentX / 100) * imageWidth,
          y: (percentY / 100) * imageHeight,
          width: (percentWidth / 100) * imageWidth,
          height: (percentHeight / 100) * imageHeight
        };
      }

      // Sinon, traiter directement comme des pixels
      return {
        x: delim.x,
        y: delim.y,
        width: delim.width,
        height: delim.height
      };
    }

    // Conversion pourcentage → pixels (cas normal, valeurs entre 0-100)
    return {
      x: (delim.x / 100) * imageWidth,
      y: (delim.y / 100) * imageHeight,
      width: (delim.width / 100) * imageWidth,
      height: (delim.height / 100) * imageHeight
    };
  }

  /**
   * 🎯 LOGIQUE UNIFIÉE FRONTEND ↔ BACKEND
   *
   * Le frontend et le backend utilisent la MÊME logique pour calculer les dimensions et la position.
   *
   * ### Étape 1: Calculer les Dimensions du Conteneur
   * Utiliser les dimensions de la délimitation envoyées par le frontend
   * const containerWidth = delimitationWidth × scale
   * const containerHeight = delimitationHeight × scale
   *
   * ### Étape 2: Calculer les Contraintes de Position
   * const maxX = (delimitationWidth - containerWidth) / 2
   * const minX = -(delimitationWidth - containerWidth) / 2
   * const maxY = (delimitationHeight - containerHeight) / 2
   * const minY = -(delimitationHeight - containerHeight) / 2
   *
   * ### Étape 3: Calculer la Position Finale
   * const delimCenterX = delimitation.x + (delimitationWidth / 2)
   * const delimCenterY = delimitation.y + (delimitationHeight / 2)
   * const containerCenterX = delimCenterX + x
   * const containerCenterY = delimCenterY + y
   *
   * ### Étape 4: Redimensionner le Design avec fit: 'inside'
   * ✅ CRITIQUE: fit: 'inside' équivaut à CSS object-fit: contain
   *
   * ### Étape 5: Centrer le Design dans le Conteneur
   * Le design peut être plus petit que le conteneur (à cause de fit: 'inside')
   */


  /**
   * 🎯 Génération de Preview avec Logique Unifiée Frontend ↔ Backend
   *
   * Cette méthode utilise l'algorithme exact de la documentation BOUNDING_BOX_IMPLEMENTATION.md
   * via l'utilitaire centralisé bounding-box-calculator.
   *
   * @param config - Configuration de génération de preview
   * @returns Buffer de l'image PNG générée
   */
  async generateProductPreview(config: ProductPreviewConfig): Promise<Buffer> {
    const { productImageUrl, designImageUrl, delimitation, position } = config;

    try {
      this.logger.log(`🎨 === DÉBUT GÉNÉRATION IMAGE FINALE (ALGORITHME UNIFIÉ v2.0) ===`);

      // ========================================================================
      // VALIDATION & NORMALISATION DES DONNÉES D'ENTRÉE
      // ========================================================================

      // Support des deux formats: designScale (nouveau) et scale (ancien)
      const designScale = position.designScale ?? position.scale ?? 0.8;

      // Utiliser delimitationWidth/Height du position ou fallback sur la délimitation
      const delimitationWidth = position.delimitationWidth ?? delimitation.width;
      const delimitationHeight = position.delimitationHeight ?? delimitation.height;

      // Créer l'objet DesignTransform pour l'utilitaire
      const transform: DesignTransform = {
        x: position.x || 0,
        y: position.y || 0,
        designScale,
        rotation: position.rotation || 0,
        positionUnit: 'PIXEL',
        delimitationWidth,
        delimitationHeight,
      };

      // Valider les données
      try {
        validateDesignTransform(transform);
      } catch (validationError) {
        this.logger.error(`❌ Validation échouée: ${validationError.message}`);
        throw validationError;
      }

      this.logger.log(`📊 Entrées validées:`, {
        x: transform.x,
        y: transform.y,
        designScale: transform.designScale,
        rotation: transform.rotation,
        delimitationWidth: transform.delimitationWidth,
        delimitationHeight: transform.delimitationHeight,
      });

      // ========================================================================
      // ÉTAPE 1: Télécharger les images
      // ========================================================================
      this.logger.log(`📥 Téléchargement des images...`);
      const [productBuffer, rawDesignBuffer] = await Promise.all([
        this.downloadImage(productImageUrl),
        this.downloadImage(designImageUrl),
      ]);

      // Note: La bordure blanche pour autocollants sera appliquée APRÈS le redimensionnement
      // pour garantir une épaisseur visible proportionnelle à la taille finale
      const designBuffer = rawDesignBuffer;

      const productMetadata = await sharp(productBuffer).metadata();
      const designMetadata = await sharp(designBuffer).metadata();
      const imageWidth = productMetadata.width || 1200;
      const imageHeight = productMetadata.height || 1200;

      this.logger.log(`✅ Mockup: ${imageWidth}x${imageHeight}px`);
      this.logger.log(`✅ Design: ${designMetadata.width}x${designMetadata.height}px`);
      this.logger.log(`🔍 DEBUG: config.isSticker = ${config.isSticker}`);

      // ========================================================================
      // ÉTAPE 2: Calculer TOUTES les informations de positionnement
      // avec l'utilitaire centralisé (algorithme exact de la doc)
      // ========================================================================
      this.logger.log(`📐 Calcul bounding box avec algorithme unifié...`);

      const positioning = calculateCompletePositioning(
        delimitation as BBoxDelimitation,
        transform,
        imageWidth,
        imageHeight
      );

      const {
        boundingBox,
        constraints,
        constrainedPosition,
        delimInPixels,
        containerDimensions,
        centerDelimitation,
        centerContainer,
      } = positioning;

      this.logger.log(`📦 Conteneur: ${containerDimensions.width}x${containerDimensions.height}px`);
      this.logger.log(`🔒 Contraintes: minX=${constraints.minX.toFixed(1)}, maxX=${constraints.maxX.toFixed(1)}, ` +
        `minY=${constraints.minY.toFixed(1)}, maxY=${constraints.maxY.toFixed(1)}`);
      this.logger.log(`📍 Position: demandée={x:${transform.x}, y:${transform.y}}, ` +
        `contrainte={x:${constrainedPosition.x.toFixed(1)}, y:${constrainedPosition.y.toFixed(1)}}`);
      this.logger.log(`🎯 Centre délimitation: (${centerDelimitation.x}, ${centerDelimitation.y})`);
      this.logger.log(`🎯 Centre conteneur: (${centerContainer.x}, ${centerContainer.y})`);
      this.logger.log(`📐 Bounding Box: left=${boundingBox.left}, top=${boundingBox.top}, ` +
        `width=${boundingBox.width}, height=${boundingBox.height}`);

      // ========================================================================
      // ÉTAPE 3: Redimensionner le Design avec fit: 'inside'
      // ✅ CRITIQUE: fit: 'inside' équivaut à CSS object-fit: contain
      // Pour les autocollants, on réduit la taille pour laisser de la place à la bordure
      // ========================================================================
      this.logger.log(`🖼️ Redimensionnement design avec fit: 'inside'...`);

      // Pour les autocollants, calculer la bordure et réduire la zone de design
      const BORDER_RATIO = 0.08; // 8% de bordure blanche
      let targetWidth = boundingBox.width;
      let targetHeight = boundingBox.height;
      let borderWidth = 0;

      if (config.isSticker) {
        // Réduire la zone de design pour laisser de la place à la bordure (2x car bordure des 2 côtés)
        const reductionFactor = 1 - (BORDER_RATIO * 2);
        targetWidth = Math.round(boundingBox.width * reductionFactor);
        targetHeight = Math.round(boundingBox.height * reductionFactor);

        this.logger.log(`🎨 AUTOCOLLANT: Réduction zone design pour bordure (facteur: ${reductionFactor.toFixed(2)})`);
        this.logger.log(`📏 Zone ajustée: ${boundingBox.width}x${boundingBox.height} → ${targetWidth}x${targetHeight}px`);
      }

      let resizedDesign = await sharp(designBuffer)
        .resize({
          width: targetWidth,
          height: targetHeight,
          fit: 'inside',              // ✅ ESSENTIEL: préserve le ratio (comme object-fit: contain)
          withoutEnlargement: false,
          position: 'center',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Obtenir les dimensions réelles après resize
      let actualMetadata = await sharp(resizedDesign).metadata();
      let actualDesignWidth = actualMetadata.width || 0;
      let actualDesignHeight = actualMetadata.height || 0;

      this.logger.log(`🖼️ Design après resize: ${actualDesignWidth}x${actualDesignHeight}px ` +
        `(ratio préservé: ${(actualDesignWidth / actualDesignHeight).toFixed(3)})`);

      // 🎨 ÉTAPE 3.5: Appliquer la bordure blanche APRÈS redimensionnement pour autocollants
      if (config.isSticker) {
        this.logger.log(`🎨 ✅ AUTOCOLLANT DÉTECTÉ: Application bordure blanche`);

        // Calculer la taille de bordure proportionnelle à la zone de design
        const avgDimension = (actualDesignWidth + actualDesignHeight) / 2;
        borderWidth = Math.max(Math.round(avgDimension * BORDER_RATIO), 12); // Minimum 12px

        this.logger.log(`📏 Bordure calculée: ${borderWidth}px (${BORDER_RATIO*100}% de ${Math.round(avgDimension)}px)`);

        const beforeSize = resizedDesign.length;
        resizedDesign = await this.addWhiteStrokeToDesign(resizedDesign, borderWidth);
        const afterSize = resizedDesign.length;

        // Recalculer les dimensions après ajout de la bordure
        actualMetadata = await sharp(resizedDesign).metadata();
        actualDesignWidth = actualMetadata.width || 0;
        actualDesignHeight = actualMetadata.height || 0;

        this.logger.log(`✅ Bordure appliquée - Nouvelles dimensions: ${actualDesignWidth}x${actualDesignHeight}px`);
        this.logger.log(`📦 Taille: ${Math.round(beforeSize/1024)}KB → ${Math.round(afterSize/1024)}KB`);
        this.logger.log(`🔍 Vérification: Design+bordure rentre dans boundingBox? ` +
          `${actualDesignWidth}x${actualDesignHeight} vs ${boundingBox.width}x${boundingBox.height}`);
      } else {
        this.logger.log(`🔍 DEBUG: Pas d'autocollant (isSticker=false), pas de bordure`);
      }

      // ========================================================================
      // ÉTAPE 4: Centrer le Design dans le Conteneur
      // Le design peut être plus petit que le conteneur (à cause de fit: 'inside')
      // Pour les autocollants, le design avec bordure peut être plus grand que le boundingBox
      // ========================================================================

      // Pour les autocollants, le conteneur doit être au moins aussi grand que le design avec bordure
      // MAIS ne doit pas dépasser les dimensions du mockup!
      const maxContainerWidth = imageWidth;
      const maxContainerHeight = imageHeight;

      const containerWidth = config.isSticker
        ? Math.min(Math.max(boundingBox.width, actualDesignWidth), maxContainerWidth)
        : boundingBox.width;
      const containerHeight = config.isSticker
        ? Math.min(Math.max(boundingBox.height, actualDesignHeight), maxContainerHeight)
        : boundingBox.height;

      // Si le design est plus grand que le conteneur (après limitation), il faut le redimensionner
      if (actualDesignWidth > containerWidth || actualDesignHeight > containerHeight) {
        this.logger.warn(`⚠️ Design+bordure (${actualDesignWidth}x${actualDesignHeight}) plus grand que le conteneur max (${containerWidth}x${containerHeight}), redimensionnement nécessaire`);
        const scaleFactor = Math.min(containerWidth / actualDesignWidth, containerHeight / actualDesignHeight);
        const newWidth = Math.round(actualDesignWidth * scaleFactor);
        const newHeight = Math.round(actualDesignHeight * scaleFactor);

        resizedDesign = await sharp(resizedDesign)
          .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: false })
          .toBuffer();

        const resizedMetadata = await sharp(resizedDesign).metadata();
        actualDesignWidth = resizedMetadata.width || newWidth;
        actualDesignHeight = resizedMetadata.height || newHeight;

        this.logger.log(`📐 Design redimensionné pour tenir dans le conteneur: ${actualDesignWidth}x${actualDesignHeight}px`);
      }

      const designOffsetX = Math.max(0, Math.round((containerWidth - actualDesignWidth) / 2));
      const designOffsetY = Math.max(0, Math.round((containerHeight - actualDesignHeight) / 2));

      this.logger.log(`📐 Conteneur: ${containerWidth}x${containerHeight}px (boundingBox: ${boundingBox.width}x${boundingBox.height}px)`);
      this.logger.log(`📐 Centrage design dans conteneur: offsetX=${designOffsetX}, offsetY=${designOffsetY}`);

      // Créer un canvas transparent aux dimensions du conteneur
      const designInContainer = await sharp({
        create: {
          width: containerWidth,
          height: containerHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
      .composite([{
        input: resizedDesign,
        left: designOffsetX,
        top: designOffsetY
      }])
      .png()
      .toBuffer();

      // ========================================================================
      // ÉTAPE 5: Appliquer la Rotation si nécessaire
      // ========================================================================
      let processedDesign = designInContainer;

      // Pour les autocollants, le conteneur peut être plus grand que le boundingBox
      // Il faut ajuster la position pour centrer le conteneur sur le centre prévu
      const containerMetadata = await sharp(processedDesign).metadata();
      const actualContainerWidth = containerMetadata.width || containerWidth;
      const actualContainerHeight = containerMetadata.height || containerHeight;

      // Ajuster la position initiale en fonction de la différence entre conteneur et boundingBox
      let finalLeft = centerContainer.x - (actualContainerWidth / 2);
      let finalTop = centerContainer.y - (actualContainerHeight / 2);

      this.logger.log(`📍 Position initiale (avant rotation): (${Math.round(finalLeft)}, ${Math.round(finalTop)})`);

      if (transform.rotation !== 0) {
        this.logger.log(`🔄 Application rotation: ${transform.rotation}°`);

        const rotatedDesign = await sharp(processedDesign)
          .rotate(transform.rotation, {
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toBuffer();

        const rotatedMetadata = await sharp(rotatedDesign).metadata();

        // Recentrer après rotation (le centre doit rester au même endroit)
        finalLeft = centerContainer.x - ((rotatedMetadata.width || 0) / 2);
        finalTop = centerContainer.y - ((rotatedMetadata.height || 0) / 2);

        this.logger.log(`🔄 Après rotation: ${rotatedMetadata.width}x${rotatedMetadata.height}px`);
        this.logger.log(`📍 Position ajustée après rotation: (${Math.round(finalLeft)}, ${Math.round(finalTop)})`);

        processedDesign = rotatedDesign;
      }

      // ========================================================================
      // ÉTAPE 6: Composer l'Image Finale
      // ========================================================================
      this.logger.log(`🎨 Composition finale...`);

      let finalImage = await sharp(productBuffer)
        .composite([{
          input: processedDesign,
          left: Math.round(finalLeft),
          top: Math.round(finalTop),
          blend: 'over',
        }])
        .png({
          quality: 85,           // Réduction de 95 → 85 pour fichiers plus légers
          compressionLevel: 6,   // Compression modérée (0-9, défaut: 6)
          effort: 5              // Effort de compression (1-10, défaut: 7, réduit à 5 pour vitesse)
        })
        .toBuffer();

      // ⚠️ DEBUG: Tracer la délimitation si demandé
      if (config.showDelimitation) {
        this.logger.log(`🔴 DEBUG: Activation tracé délimitation`);
        finalImage = await this.drawDelimitationRect(finalImage, delimInPixels);
      }

      const finalDims = await this.getDimensions(finalImage);
      this.logger.log(`✅ Image finale générée: ${finalDims.width}x${finalDims.height}px (${finalImage.length} bytes)`);
      this.logger.log(`🎨 === FIN GÉNÉRATION IMAGE FINALE ===\n`);

      return finalImage;

    } catch (error) {
      this.logger.error(`❌ Erreur génération preview: ${error.message}`, error.stack);
      throw new Error(`Échec de la génération de la preview: ${error.message}`);
    }
  }

  /**
   * Générer une preview depuis les données de position stockées en JSON
   *
   * @param productImageUrl - URL de l'image du produit
   * @param designImageUrl - URL de l'image du design
   * @param delimitation - Délimitation (zone imprimable)
   * @param positionJson - JSON de position (format ProductDesignPosition)
   * @param showDelimitation - ⚠️ DEBUG: Afficher un contour rouge autour de la délimitation
   * @param isSticker - 🎨 Si true, applique une bordure blanche au design (style autocollant)
   * @returns Buffer de l'image PNG générée
   */
  async generatePreviewFromJson(
    productImageUrl: string,
    designImageUrl: string,
    delimitation: Delimitation,
    positionJson: any,
    showDelimitation = false,
    isSticker = false
  ): Promise<Buffer> {
    this.logger.log(`🔍 DEBUG generatePreviewFromJson: isSticker = ${isSticker}`);

    // Parser le JSON si c'est une string
    const position = typeof positionJson === 'string'
      ? JSON.parse(positionJson)
      : positionJson;

    // 🎯 LOGIQUE UNIFIÉE: Si delimitationWidth/Height ne sont pas fournis,
    // on les calcule depuis la délimitation (mode compatibilité)
    const delimitationWidth = position.delimitationWidth ?? delimitation.width;
    const delimitationHeight = position.delimitationHeight ?? delimitation.height;

    // Convertir le format de position au format attendu
    const config: ProductPreviewConfig = {
      productImageUrl,
      designImageUrl,
      delimitation,
      position: {
        x: position.x || 0,
        y: position.y || 0,
        scale: position.scale || 0.8,
        rotation: position.rotation || 0,
        positionUnit: position.positionUnit || 'PIXEL',
        delimitationWidth,
        delimitationHeight,
      },
      showDelimitation,
      isSticker
    };

    return this.generateProductPreview(config);
  }
}
