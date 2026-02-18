import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CloudinaryService } from '../../core/cloudinary/cloudinary.service';
import { ProductPreviewGeneratorService } from './product-preview-generator.service';

/**
 * 🚀 Service pour la génération d'images parallèle
 * Résout le problème de blocage UI lors de la création de produits
 */
@Injectable()
export class ImageGenerationQueueService {
  private readonly logger = new Logger(ImageGenerationQueueService.name);

  // 🔄 RETRY CONFIGURATION - Pour garantir que TOUTES les images soient générées
  private readonly MAX_RETRIES = 3; // 3 tentatives max par image
  private readonly RETRY_DELAY = 2000; // 2 secondes entre les retry

  // ⚡ CONCURRENCY LIMIT - Réduit pour éviter les timeouts
  private readonly MAX_CONCURRENT_GENERATIONS = 2; // Max 2 images en parallèle

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly previewGenerator: ProductPreviewGeneratorService,
  ) {}

  /**
   * ⏱️ Pause pour retry
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🚀 Génère les images pour toutes les couleurs en parallèle avec RETRY
   * Toutes les images DOIVENT être générées, avec retry en cas d'erreur
   */
  async generateImagesForColors(
    productId: number,
    colors: Array<{ id: number; name: string; colorCode: string }>,
    design: { id: number; name: string; imageUrl: string },
    positionData: any,
    isSticker: boolean = false,
  ): Promise<{
    totalGenerationTime: number;
    totalColors: number;
    colorsProcessed: number;
    colorsRemaining: number;
    averageTimePerColor: number;
    colorTimings: Array<{ colorName: string; duration: number; success: boolean }>;
    generatedImages: Array<{ colorId: number; url: string; publicId: string }>;
  }> {
    const generationStartTime = Date.now();
    const totalColors = colors.length;
    const colorTimings: Array<{ colorName: string; duration: number; success: boolean }> = [];
    const generatedImages: Array<{ colorId: number; url: string; publicId: string }> = [];

    this.logger.log(`🚀 [PARALLEL] Début génération parallèle pour produit ${productId}`);
    this.logger.log(`📊 [PARALLEL] ${totalColors} couleurs à traiter`);
    this.logger.log(`⚡ [PARALLEL] Concurrency max: ${this.MAX_CONCURRENT_GENERATIONS}`);
    this.logger.log(`🔄 [PARALLEL] Max retries: ${this.MAX_RETRIES} par couleur`);

    try {
      // Traiter chaque couleur avec retry
      const results = await this.processWithConcurrency(
        colors,
        this.MAX_CONCURRENT_GENERATIONS,
        async (color, index) => {
          const colorStartTime = Date.now();
          let lastError: Error | null = null;

          // 🔄 RETRY LOOP - Tenter jusqu'à MAX_RETRIES fois
          for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
              this.logger.log(`🎨 [PARALLEL] Couleur ${index + 1}/${totalColors}: ${color.name} (Tentative ${attempt}/${this.MAX_RETRIES})`);

              // 1. Récupérer les infos de la couleur
              const colorInfo = await this.getColorInfo(color.id);
              if (!colorInfo) {
                throw new Error(`Couleur ${color.id} introuvable dans la base de données`);
              }

              this.logger.log(`📎 [PARALLEL] URL image de base pour ${color.name}: ${colorInfo.productImage.url}`);
              this.logger.log(`📐 [PARALLEL] Délimitation pour ${color.name}: ${JSON.stringify(colorInfo.delimitation)}`);

              // 2. Génération de l'image (SANS timeout - prend le temps qu'il faut)
              this.logger.log(`🖼️ [PARALLEL] Génération preview pour ${color.name}...`);
              const imageBuffer = await this.previewGenerator.generatePreviewFromJson(
                colorInfo.productImage.url,
                design.imageUrl,
                colorInfo.delimitation,
                positionData,
                false,
                isSticker
              );

              this.logger.log(`✅ [PARALLEL] Image générée pour ${color.name} (${imageBuffer.length} bytes)`);

              // 3. Upload Cloudinary (SANS timeout)
              this.logger.log(`☁️ [PARALLEL] Upload vers Cloudinary pour ${color.name}...`);
              const uploadResult = await this.cloudinaryService.uploadBuffer(imageBuffer, {
                folder: 'vendor-product-finals',
                public_id: `final_${productId}_color_${color.id}_${Date.now()}`,
                resource_type: 'image',
              });

              this.logger.log(`☁️ [PARALLEL] Upload terminé pour ${color.name}: ${uploadResult.secure_url}`);

              // 4. Sauvegarder en BDD
              await this.prisma.vendorProductImage.create({
                data: {
                  vendorProductId: productId,
                  colorId: color.id,
                  colorName: color.name,
                  colorCode: color.colorCode,
                  imageType: 'final',
                  cloudinaryUrl: colorInfo.productImage.url,
                  cloudinaryPublicId: this.extractPublicIdFromUrl(colorInfo.productImage.url),
                  finalImageUrl: uploadResult.secure_url,
                  finalImagePublicId: uploadResult.public_id,
                  width: uploadResult.width || null,
                  height: uploadResult.height || null,
                },
              });

              this.logger.log(`💾 [PARALLEL] Sauvegardé en BDD pour ${color.name}`);

              const colorDuration = Date.now() - colorStartTime;

              return {
                colorId: color.id,
                colorName: color.name,
                duration: colorDuration,
                success: true,
                imageUrl: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                attempt,
              };

            } catch (error) {
              lastError = error;
              this.logger.error(`❌ [PARALLEL] Erreur tentative ${attempt}/${this.MAX_RETRIES} pour ${color.name}: ${error.message}`);

              // Si ce n'est pas la dernière tentative, attendre avant de réessayer
              if (attempt < this.MAX_RETRIES) {
                this.logger.log(`⏳ [PARALLEL] Attente ${this.RETRY_DELAY}ms avant retry...`);
                await this.sleep(this.RETRY_DELAY);
              }
            }
          }

          // 🚨 Si on arrive ici, tous les retries ont échoué
          const colorDuration = Date.now() - colorStartTime;
          this.logger.error(`💀 [PARALLEL] ÉCHEC FINAL pour ${color.name} après ${this.MAX_RETRIES} tentatives: ${lastError?.message}`);

          return {
            colorId: color.id,
            colorName: color.name,
            duration: colorDuration,
            success: false,
            imageUrl: null,
            publicId: null,
            error: lastError?.message || 'Unknown error',
            attempt: this.MAX_RETRIES,
          };
          }
      );

      // Traiter les résultats
      for (const result of results) {
        colorTimings.push({
          colorName: result.colorName,
          duration: result.duration,
          success: result.success,
        });

        if (result.success && result.imageUrl) {
          generatedImages.push({
            colorId: result.colorId,
            url: result.imageUrl,
            publicId: result.publicId,
          });
        }
      }

      const totalGenerationTime = Date.now() - generationStartTime;
      const successfulColors = colorTimings.filter(c => c.success).length;
      const failedColors = totalColors - successfulColors;
      const averageTimePerColor = successfulColors > 0
        ? Math.round(colorTimings.reduce((sum, c) => sum + c.duration, 0) / successfulColors)
        : 0;

      this.logger.log(`⏱️ [PARALLEL] Génération terminée: ${successfulColors}/${totalColors} couleurs en ${totalGenerationTime}ms`);
      this.logger.log(`⏱️ [PARALLEL] Succès: ${successfulColors}, Échecs: ${failedColors}, Temps moyen: ${averageTimePerColor}ms`);

      // ⚠️ LOG WARNING si des couleurs ont échoué
      if (failedColors > 0) {
        const failedColorsList = colorTimings.filter(c => !c.success).map(c => c.colorName);
        this.logger.warn(`⚠️ [PARALLEL] Couleurs échouées: ${failedColorsList.join(', ')}`);
      }

      // Mettre à jour VendorProduct avec la première image générée
      if (generatedImages.length > 0) {
        await this.prisma.vendorProduct.update({
          where: { id: productId },
          data: {
            finalImageUrl: generatedImages[0].url,
            finalImagePublicId: generatedImages[0].publicId,
          },
        });
        this.logger.log(`🏷️ [PARALLEL] Produit ${productId} mis à jour avec finalImageUrl`);
      }

      return {
        totalGenerationTime,
        totalColors,
        colorsProcessed: successfulColors,
        colorsRemaining: failedColors,
        averageTimePerColor,
        colorTimings,
        generatedImages,
      };

    } catch (error) {
      this.logger.error(`❌ [PARALLEL] Erreur critique génération:`, error);
      throw error;
    }
  }

  /**
   * ⚡ Traite des items avec une limite de concurrence
   */
  private async processWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    processor: (item: T, index: number) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const index = i;

      const promise = processor(item, index).then((result) => {
        results[index] = result;
        executing.splice(executing.indexOf(promise), 1);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Récupère les informations d'une couleur
   */
  private async getColorInfo(colorId: number) {
    const colorVariation = await this.prisma.colorVariation.findUnique({
      where: { id: colorId },
      include: {
        images: {
          include: {
            delimitations: true,
          },
          take: 1,
        },
      },
    });

    if (!colorVariation || !colorVariation.images[0]) {
      return null;
    }

    const productImage = colorVariation.images[0];
    const delimitation = productImage.delimitations?.[0];

    return {
      productImage,
      delimitation: delimitation ? {
        x: delimitation.x,
        y: delimitation.y,
        width: delimitation.width,
        height: delimitation.height,
        coordinateType: delimitation.coordinateType as 'PERCENTAGE' | 'PIXEL',
        originalImageWidth: delimitation.originalImageWidth,
        originalImageHeight: delimitation.originalImageHeight,
        referenceWidth: delimitation.referenceWidth,
        referenceHeight: delimitation.referenceHeight,
      } : {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        coordinateType: 'PERCENTAGE' as const,
      },
    };
  }

  /**
   * Extrait le public_id depuis une URL Cloudinary
   */
  private extractPublicIdFromUrl(url: string): string {
    const matches = url.match(/\/v\d+\/(.+?)\.(jpg|jpeg|png|webp)/);
    return matches ? matches[1] : `image_${Date.now()}`;
  }

  /**
   * 🔄 Génère les images en arrière-plan pour un produit
   * À utiliser avec la réponse immédiate
   */
  async generateImagesInBackground(
    productId: number,
    colors: Array<{ id: number; name: string; colorCode: string }>,
    design: { id: number; name: string; imageUrl: string },
    positionData: any,
    isSticker: boolean = false,
  ): Promise<void> {
    try {
      this.logger.log(`🔄 [BACKGROUND] Début génération asynchrone pour produit ${productId}`);

      // Générer les images en arrière-plan sans changer le statut du produit
      const result = await this.generateImagesForColors(
        productId,
        colors,
        design,
        positionData,
        isSticker,
      );

      if (result.colorsProcessed === result.totalColors) {
        this.logger.log(`✅ [BACKGROUND] Toutes les images générées pour produit ${productId} (${result.totalColors}/${result.totalColors})`);
      } else if (result.colorsProcessed > 0) {
        this.logger.warn(`⚠️ [BACKGROUND] Produit ${productId}: ${result.colorsProcessed}/${result.totalColors} couleurs générées`);
      } else {
        this.logger.error(`❌ [BACKGROUND] Aucune image générée pour produit ${productId}`);
      }

    } catch (error) {
      this.logger.error(`❌ [BACKGROUND] Erreur génération pour produit ${productId}:`, error);
    }
  }
}
