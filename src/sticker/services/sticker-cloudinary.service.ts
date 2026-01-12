import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class StickerCloudinaryService {
  private readonly logger = new Logger(StickerCloudinaryService.name);

  constructor() {
    // Configuration Cloudinary (déjà configuré dans CloudinaryService)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dsxab4qnu',
      api_key: process.env.CLOUDINARY_API_KEY || '267848335846173',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'WLhzU3riCxujR1DXRXyMmLPUCoU',
    });
  }

  /**
   * Upload d'un buffer d'image sur Cloudinary SANS TRANSFORMATION
   * IMPORTANT: Pas de transformation pour préserver les effets exacts générés par Sharp
   */
  async uploadStickerToCloudinary(
    imageBuffer: Buffer,
    productId: number,
    designId: number
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      this.logger.log(`☁️ Upload sticker sur Cloudinary (produit ${productId}, design ${designId})`);

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'vendor-stickers',
          public_id: `sticker_${productId}_design_${designId}_${Date.now()}`,
          format: 'png',
          resource_type: 'image',
          // IMPORTANT: Pas de transformation pour préserver la qualité exacte
          // Pas de 'quality: auto' qui compresserait l'image
          // Pas de 'fetch_format: auto' qui pourrait changer le format
          // Pas de 'crop: limit' qui rognerait l'image
          use_filename: true,
          unique_filename: false,
          overwrite: true,
          // Qualité fixe à 100 pour préserver les détails fins des bordures
          quality: 100,
          // Désactiver la compression automatique
          flags: ['preserve_transparency'],
        },
        (error, result) => {
          if (error) {
            this.logger.error(`❌ Erreur upload Cloudinary: ${error.message}`, error);
            return reject(new Error(`Upload Cloudinary échoué: ${error.message}`));
          }

          if (!result || !result.secure_url || !result.public_id) {
            this.logger.error(`❌ Result Cloudinary invalide: ${JSON.stringify(result)}`);
            return reject(new Error('Result Cloudinary invalide'));
          }

          this.logger.log(`✅ Sticker uploadé avec succès:`);
          this.logger.log(`   - URL: ${result.secure_url}`);
          this.logger.log(`   - Public ID: ${result.public_id}`);
          this.logger.log(`   - Width: ${result.width}, Height: ${result.height}`);
          this.logger.log(`   - Format: ${result.format}`);

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      // Créer un stream depuis le buffer et le pipe vers Cloudinary
      const { Readable } = require('stream');
      const bufferStream = Readable.from(imageBuffer);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Supprimer une image de sticker depuis Cloudinary
   */
  async deleteStickerFromCloudinary(publicId: string): Promise<void> {
    try {
      this.logger.log(`🗑️ Suppression sticker Cloudinary: ${publicId}`);
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
      this.logger.log(`✅ Sticker supprimé de Cloudinary`);
    } catch (error) {
      this.logger.error(`❌ Erreur suppression Cloudinary: ${error.message}`);
      throw new Error(`Suppression Cloudinary échouée: ${error.message}`);
    }
  }

  /**
   * Upload d'un sticker avec options personnalisées
   */
  async uploadStickerWithOptions(
    imageBuffer: Buffer,
    options: {
      folder?: string;
      publicId?: string;
      quality?: string | number;
      transformation?: any[];
    } = {}
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      this.logger.log(`☁️ Upload sticker avec options personnalisées`);

      const defaultOptions = {
        folder: options.folder || 'vendor-stickers',
        public_id: options.publicId || `sticker_${Date.now()}`,
        format: 'png',
        resource_type: 'image' as const,
        // Par défaut, préserver la qualité
        quality: options.quality || 100,
        // Pas de transformation par défaut
        transformation: options.transformation || [],
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        flags: ['preserve_transparency'],
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        defaultOptions,
        (error, result) => {
          if (error) {
            this.logger.error(`❌ Erreur upload Cloudinary: ${error.message}`);
            return reject(new Error(`Upload Cloudinary échoué: ${error.message}`));
          }

          this.logger.log(`✅ Sticker uploadé: ${result!.secure_url}`);

          resolve({
            url: result!.secure_url,
            publicId: result!.public_id,
          });
        }
      );

      const { Readable } = require('stream');
      const bufferStream = Readable.from(imageBuffer);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Obtenir l'URL optimisée pour l'affichage avec paramètres de qualité préservée
   * Note: Utiliser q_100 pour préserver les bordures fines
   */
  getOptimizedUrl(originalUrl: string, maxWidth?: number): string {
    // Ajouter uniquement un redimensionnement si demandé, SANS compression
    if (maxWidth) {
      return originalUrl.replace(
        '/upload/',
        `/upload/q_100,f_auto,c_limit,w_${maxWidth}/`
      );
    }
    // Pour l'affichage original, juste s'assurer que la qualité est à 100
    return originalUrl.replace('/upload/', '/upload/q_100/');
  }
}
