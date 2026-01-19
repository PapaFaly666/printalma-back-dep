import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import axios from 'axios';

export interface StickerConfig {
  designImageUrl: string;
  borderColor: 'transparent' | 'white' | 'glossy-white' | 'matte-white';
  stickerType: 'autocollant' | 'pare-chocs';
  width: number;  // en pixels
  height: number; // en pixels
  shape?: 'SQUARE' | 'CIRCLE' | 'RECTANGLE' | 'DIE_CUT';
}

export interface StickerConfigWithSize {
  designImageUrl: string;
  borderColor: 'transparent' | 'white' | 'glossy-white' | 'matte-white';
  stickerType: 'autocollant' | 'pare-chocs';
  size: { width: number; height: number }; // en mm
  shape?: 'SQUARE' | 'CIRCLE' | 'RECTANGLE' | 'DIE_CUT';
}

interface Dimensions {
  width: number;
  height: number;
}

@Injectable()
export class StickerGeneratorService {
  private readonly logger = new Logger(StickerGeneratorService.name);
  private readonly DPI = 300;
  private readonly MM_TO_INCH = 0.0393701;

  /**
   * Convertit millimètres en pixels (300 DPI pour impression haute qualité)
   */
  mmToPixels(mm: number): number {
    return Math.round(mm * this.DPI * this.MM_TO_INCH);
  }

  /**
   * Télécharger une image depuis une URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      this.logger.log(`📥 Téléchargement de l'image: ${url}`);
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`❌ Erreur téléchargement image: ${error.message}`);
      throw new Error(`Impossible de télécharger l'image: ${error.message}`);
    }
  }

  /**
   * Obtenir les dimensions d'un buffer
   */
  private async getDimensions(buffer: Buffer): Promise<Dimensions> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  }

  /**
   * Ajouter des bordures blanches à l'image (style autocollant cartoon)
   *
   * Cette méthode crée une bordure blanche épaisse autour de l'image
   * pour reproduire l'effet "autocollant" visible sur les stickers physiques.
   *
   * @param imageBuffer - Buffer de l'image originale
   * @param borderWidth - Épaisseur de la bordure en pixels
   * @returns Buffer de l'image avec bordure
   */
  private async addWhiteBorder(
    imageBuffer: Buffer,
    borderWidth: number
  ): Promise<Buffer> {
    const dims = await this.getDimensions(imageBuffer);
    const newWidth = dims.width + (borderWidth * 2);
    const newHeight = dims.height + (borderWidth * 2);

    this.logger.log(`🖼️ Ajout bordure blanche (${borderWidth}px): ${dims.width}x${dims.height} → ${newWidth}x${newHeight}`);

    try {
      // Créer une image avec bordure blanche opaque en utilisant composite
      const borderedImage = await sharp({
        create: {
          width: newWidth,
          height: newHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
        .composite([
          {
            input: imageBuffer,
            left: borderWidth,
            top: borderWidth
          }
        ])
        .png()
        .toBuffer();

      return borderedImage;
    } catch (error) {
      this.logger.error(`❌ Erreur ajout bordure: ${error.message}`);
      // En cas d'erreur, retourner l'image originale
      return imageBuffer;
    }
  }

  /**
   * Ajouter un contour blanc à l'image (effet stroke/bordure interne)
   *
   * Cette méthode utilise Sharp pour créer proprement un contour blanc
   * autour de l'image SANS dégrader la qualité.
   *
   * Technique : Utilisation de feMorphology dilate pour étendre les contours
   * de l'image alpha, puis composition propre.
   *
   * @param imageBuffer - Buffer de l'image originale
   * @param strokeWidth - Épaisseur du contour en pixels (default: 4px)
   * @returns Buffer de l'image avec contour
   */
  private async addWhiteStroke(
    imageBuffer: Buffer,
    strokeWidth: number = 4
  ): Promise<Buffer> {
    const dims = await this.getDimensions(imageBuffer);

    this.logger.log(`✏️ Ajout contour blanc propre (${strokeWidth}px)`);

    try {
      // Pour les grandes bordures (>50px), on applique plusieurs fois feMorphology
      // car il y a une limite pratique sur le radius
      const maxRadius = 50;
      const iterations = Math.ceil(strokeWidth / maxRadius);
      const radiusPerIteration = strokeWidth / iterations;

      this.logger.log(`📐 Application contour en ${iterations} itération(s) de ${radiusPerIteration}px`);

      let processedBuffer = imageBuffer;

      // Appliquer le dilate progressivement
      for (let i = 0; i < iterations; i++) {
        const currentDims = await this.getDimensions(processedBuffer);
        const svgStroke = `
          <svg width="${currentDims.width + radiusPerIteration * 2}" height="${currentDims.height + radiusPerIteration * 2}">
            <defs>
              <filter id="white-border-${i}" x="-50%" y="-50%" width="200%" height="200%">
                <feMorphology operator="dilate" radius="${radiusPerIteration}" in="SourceAlpha" result="expanded-alpha"/>
                <feFlood flood-color="white" result="white-color"/>
                <feComposite in="white-color" in2="expanded-alpha" operator="in" result="white-border"/>
                <feMerge>
                  <feMergeNode in="white-border"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <image x="${radiusPerIteration}" y="${radiusPerIteration}"
                   width="${currentDims.width}" height="${currentDims.height}"
                   href="data:image/png;base64,${processedBuffer.toString('base64')}"
                   filter="url(#white-border-${i})" />
          </svg>
        `;

        processedBuffer = await sharp(Buffer.from(svgStroke))
          .png()
          .toBuffer();
      }

      return processedBuffer;
    } catch (error) {
      this.logger.error(`❌ Erreur ajout contour: ${error.message}`);
      // En cas d'erreur, retourner l'image originale
      return imageBuffer;
    }
  }

  /**
   * Ajouter un contour gris fin interne (simule le trait de découpe)
   *
   * @param imageBuffer - Buffer de l'image
   * @returns Buffer de l'image avec contour gris
   */
  private async addGrayStroke(imageBuffer: Buffer): Promise<Buffer> {
    this.logger.log(`✏️ Ajout contour gris MASSIF (5px)`);

    try {
      const dims = await this.getDimensions(imageBuffer);
      const svgBorder = `
        <svg width="${dims.width + 12}" height="${dims.height + 12}">
          <defs>
            <filter id="gray-stroke">
              <feMorphology operator="dilate" radius="5" in="SourceAlpha" result="expanded"/>
              <feFlood flood-color="rgb(50, 50, 50)" flood-opacity="0.9" result="gray-color"/>
              <feComposite in="gray-color" in2="expanded" operator="in" result="stroke"/>
              <feMerge>
                <feMergeNode in="stroke"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <image x="6" y="6" width="${dims.width}" height="${dims.height}"
                 href="data:image/png;base64,${imageBuffer.toString('base64')}"
                 filter="url(#gray-stroke)" />
        </svg>
      `;

      return await sharp(Buffer.from(svgBorder))
        .png()
        .toBuffer();
    } catch (error) {
      this.logger.error(`❌ Erreur ajout contour gris: ${error.message}`);
      return imageBuffer;
    }
  }

  /**
   * Ajouter un effet glossy (brillant) à l'image
   *
   * @param imageBuffer - Buffer de l'image
   * @returns Buffer de l'image avec effet glossy
   */
  private async addGlossyEffect(imageBuffer: Buffer): Promise<Buffer> {
    this.logger.log(`✨ Ajout effet glossy`);

    try {
      const dims = await this.getDimensions(imageBuffer);

      // Créer un dégradé de brillance (highlight)
      const svgGlossy = `
        <svg width="${dims.width}" height="${dims.height}">
          <defs>
            <linearGradient id="glossy-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="white" stop-opacity="0.4"/>
              <stop offset="40%" stop-color="white" stop-opacity="0.1"/>
              <stop offset="100%" stop-color="white" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="${dims.width}" height="${dims.height}"
                fill="url(#glossy-gradient)" />
        </svg>
      `;

      const glossyOverlay = await sharp(Buffer.from(svgGlossy)).png().toBuffer();

      return await sharp(imageBuffer)
        .composite([
          { input: glossyOverlay, blend: 'over' }
        ])
        .png()
        .toBuffer();
    } catch (error) {
      this.logger.error(`❌ Erreur ajout effet glossy: ${error.message}`);
      return imageBuffer;
    }
  }

  /**
   * Ajouter une ombre portée (drop shadow) pour effet "autocollant décollé"
   *
   * @param imageBuffer - Buffer de l'image
   * @returns Buffer de l'image avec ombre portée
   */
  private async addDropShadow(imageBuffer: Buffer): Promise<Buffer> {
    this.logger.log(`🌑 Ajout ombre portée`);

    try {
      const dims = await this.getDimensions(imageBuffer);
      const shadowOffset = 5;
      const shadowBlur = 5;

      const svgShadow = `
        <svg width="${dims.width + shadowOffset + shadowBlur}" height="${dims.height + shadowOffset + shadowBlur}">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="2" dy="3" stdDeviation="3" flood-opacity="0.3"/>
            </filter>
          </defs>
          <image x="${shadowOffset / 2}" y="${shadowOffset / 2}"
                 width="${dims.width}" height="${dims.height}"
                 href="data:image/png;base64,${imageBuffer.toString('base64')}"
                 filter="url(#shadow)" />
        </svg>
      `;

      return await sharp(Buffer.from(svgShadow))
        .png()
        .toBuffer();
    } catch (error) {
      this.logger.error(`❌ Erreur ajout ombre portée: ${error.message}`);
      return imageBuffer;
    }
  }

  /**
   * Améliorer les couleurs de l'image (brightness, contrast, saturation)
   *
   * @param imageBuffer - Buffer de l'image
   * @returns Buffer de l'image avec couleurs améliorées
   */
  private async enhanceColors(imageBuffer: Buffer): Promise<Buffer> {
    this.logger.log(`🎨 Amélioration des couleurs`);

    try {
      return await sharp(imageBuffer)
        .modulate({
          brightness: 1.02,
          saturation: 1.1
        })
        .linear(
          [1.05, 1.05, 1.05], // Contrast adjustment
          [0, 0, 0]
        )
        .png()
        .toBuffer();
    } catch (error) {
      this.logger.error(`❌ Erreur amélioration couleurs: ${error.message}`);
      return imageBuffer;
    }
  }

  /**
   * Appliquer les effets autocollant cartoon complets
   *
   * Cette méthode combine tous les effets pour reproduire le style
   * "autocollant cartoon" généré par les filtres CSS du frontend.
   *
   * @param imageBuffer - Buffer de l'image originale
   * @param borderColor - Type de bordure demandé
   * @param stickerType - Type de sticker
   * @returns Buffer de l'image avec tous les effets appliqués
   */
  private async applyStickerEffects(
    imageBuffer: Buffer,
    borderColor: 'transparent' | 'white' | 'glossy-white' | 'matte-white',
    stickerType: 'autocollant' | 'pare-chocs'
  ): Promise<Buffer> {
    let processedBuffer = imageBuffer;

    // 1. Améliorer les couleurs (brightness, contrast, saturation)
    processedBuffer = await this.enhanceColors(processedBuffer);

    // 2. Appliquer les effets uniquement si bordure demandée
    if (borderColor !== 'transparent') {
      this.logger.log(`🎨 Application effets autocollant (border: ${borderColor})`);

      // 3. Ajouter contour blanc ULTRA MASSIF (suit la forme de l'image)
      // Épaisseur fixe et bien visible pour tous les stickers
      // - autocollant: 150px (contour bien visible)
      // - pare-chocs: 120px (contour visible)
      const strokeWidth = stickerType === 'autocollant' ? 150 : 120;

      this.logger.log(`📏 Contour blanc fixe: ${strokeWidth}px`);
      // Utiliser addWhiteStroke qui suit la forme de l'image (pas un cadre rectangulaire)
      processedBuffer = await this.addWhiteStroke(processedBuffer, strokeWidth);

      // 4. Pour autocollant: ajouter ombre portée au lieu du contour noir
      // Pour pare-chocs: garder le contour gris
      if (stickerType === 'autocollant') {
        processedBuffer = await this.addDropShadow(processedBuffer);
      } else {
        processedBuffer = await this.addGrayStroke(processedBuffer);
      }

      // 5. Ajouter effet glossy si demandé
      if (borderColor === 'glossy-white') {
        processedBuffer = await this.addGlossyEffect(processedBuffer);
      }
    }

    return processedBuffer;
  }

  /**
   * Générer l'image du sticker avec tous les effets
   *
   * Cette méthode génère maintenant une image complète avec tous les effets
   * "autocollant cartoon" appliqués côté serveur (bordures, ombres, couleurs).
   *
   * Les effets appliqués correspondent à ceux qui étaient générés par les
   * filtres CSS dans le frontend, mais sont maintenant générés par Sharp côté
   * serveur pour une performance optimale.
   *
   * @param config - Configuration du sticker
   * @returns Buffer de l'image PNG complète avec effets
   */
  async generateStickerImage(config: StickerConfig): Promise<Buffer> {
    const { designImageUrl, borderColor, stickerType, width, height, shape } = config;

    try {
      this.logger.log(`🎨 Génération sticker ${stickerType} - ${width}x${height}px`);

      // 1. Télécharger et redimensionner l'image
      const designBuffer = await this.downloadImage(designImageUrl);

      let image = sharp(designBuffer);
      image = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: false,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      });

      let imageBuffer = await image.png().toBuffer();
      const initialDims = await this.getDimensions(imageBuffer);
      this.logger.log(`📐 Dimensions après resize: ${initialDims.width}x${initialDims.height}px`);

      // 2. Appliquer les effets autocollant (bordures, ombres, couleurs)
      // Ceci remplace tous les filtres CSS qui étaient dans le frontend
      imageBuffer = await this.applyStickerEffects(
        imageBuffer,
        borderColor,
        stickerType
      );

      // 3. Appliquer la forme si nécessaire (uniquement pour CIRCLE)
      let finalImage = sharp(imageBuffer);

      if (shape === 'CIRCLE') {
        this.logger.log(`🔵 Application masque circulaire`);
        const dims = await this.getDimensions(imageBuffer);
        const radius = Math.min(dims.width, dims.height) / 2;

        const circleSvg = Buffer.from(
          `<svg width="${dims.width}" height="${dims.height}">
            <defs>
              <mask id="circle-mask">
                <rect width="100%" height="100%" fill="black" />
                <circle cx="${dims.width / 2}" cy="${dims.height / 2}" r="${radius - 4}" fill="white" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="white" mask="url(#circle-mask)" />
          </svg>`
        );

        const masked = await finalImage
          .composite([
            {
              input: circleSvg,
              blend: 'dest-in'
            }
          ])
          .png()
          .toBuffer();

        finalImage = sharp(masked);
      }

      // 4. Retourner le buffer final en PNG haute qualité
      const finalBuffer = await finalImage
        .png({
          quality: 100,
          compressionLevel: 0,
          effort: 1
        })
        .toBuffer();

      const finalDims = await this.getDimensions(finalBuffer);
      this.logger.log(`✅ Sticker généré: ${finalDims.width}x${finalDims.height}px (${finalBuffer.length} bytes)`);

      return finalBuffer;

    } catch (error) {
      this.logger.error(`❌ Erreur génération sticker: ${error.message}`, error.stack);
      throw new Error(`Échec de la génération du sticker: ${error.message}`);
    }
  }

  /**
   * Créer un sticker depuis un design avec taille en mm
   */
  async createStickerFromDesign(
    designImageUrl: string,
    stickerType: 'autocollant' | 'pare-chocs',
    borderColor: string,
    size: string,
    shape?: 'SQUARE' | 'CIRCLE' | 'RECTANGLE' | 'DIE_CUT'
  ): Promise<Buffer> {
    const sizeMatch = size.match(/(\d+(?:\.\d+)?)\s*(mm|cm)\s*x\s*(\d+(?:\.\d+)?)\s*(mm|cm)/i);

    if (!sizeMatch) {
      throw new Error(`Format de taille invalide: ${size}`);
    }

    let widthMm = parseFloat(sizeMatch[1]);
    const widthUnit = sizeMatch[2].toLowerCase();
    let heightMm = parseFloat(sizeMatch[3]);
    const heightUnit = sizeMatch[4].toLowerCase();

    if (widthUnit === 'cm') widthMm = widthMm * 10;
    if (heightUnit === 'cm') heightMm = heightMm * 10;

    const widthPx = this.mmToPixels(widthMm);
    const heightPx = this.mmToPixels(heightMm);

    this.logger.log(`📐 Génération sticker: ${widthMm}x${heightMm}mm = ${widthPx}x${heightPx}px @ 300DPI`);

    return await this.generateStickerImage({
      designImageUrl,
      borderColor: borderColor as 'transparent' | 'white' | 'glossy-white' | 'matte-white',
      stickerType,
      width: widthPx,
      height: heightPx,
      shape,
    });
  }

  /**
   * Créer un sticker avec config simplifiée
   */
  async createStickerWithConfig(config: StickerConfigWithSize): Promise<Buffer> {
    const widthPx = this.mmToPixels(config.size.width);
    const heightPx = this.mmToPixels(config.size.height);

    this.logger.log(`📐 Génération sticker: ${config.size.width}x${config.size.height}mm = ${widthPx}x${heightPx}px @ 300DPI`);

    return await this.generateStickerImage({
      designImageUrl: config.designImageUrl,
      borderColor: config.borderColor,
      stickerType: config.stickerType,
      width: widthPx,
      height: heightPx,
      shape: config.shape,
    });
  }
}
