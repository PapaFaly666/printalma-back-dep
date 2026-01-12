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
   * Générer l'image du sticker - SIMPLEMENT REDIMENSIONNER SANS EFFETS
   */
  async generateStickerImage(config: StickerConfig): Promise<Buffer> {
    const { designImageUrl, width, height, shape } = config;

    try {
      this.logger.log(`🎨 Génération du sticker ${width}x${height}px (sans effets)`);

      // 1. Télécharger l'image du design
      const designBuffer = await this.downloadImage(designImageUrl);

      // 2. Redimensionner l'image au format désiré SANS modifications
      let image = sharp(designBuffer);
      image = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: false,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      });

      let imageBuffer = await image.png().toBuffer();
      const dims = await this.getDimensions(imageBuffer);
      this.logger.log(`📐 Dimensions après resize: ${dims.width}x${dims.height}px`);

      // 3. Appliquer la forme SI NÉCESSAIRE (uniquement pour CIRCLE)
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

      // 4. Retourner le buffer final en PNG haute qualité SANS compression
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
