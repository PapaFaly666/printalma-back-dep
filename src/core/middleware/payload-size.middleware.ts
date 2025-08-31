import { Injectable, NestMiddleware, BadRequestException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PayloadSizeMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PayloadSizeMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Monitoring des tailles de payload
    const startTime = Date.now();
    
    // Écouter l'événement de données pour calculer la taille
    let totalSize = 0;
    const originalOn = req.on.bind(req);
    
    req.on = function(event: string, listener: any) {
      if (event === 'data') {
        const originalListener = listener;
        listener = (chunk: Buffer) => {
          totalSize += chunk.length;
          
          // Vérifier les limites par route
          const maxSize = this.getMaxSizeForRoute(req.path);
          if (totalSize > maxSize) {
            const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
            const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
            
            this.logger.error(`❌ Payload trop volumineux: ${sizeMB}MB (max: ${maxSizeMB}MB) sur ${req.path}`);
            throw new BadRequestException(`Payload trop volumineux: ${sizeMB}MB. Maximum autorisé: ${maxSizeMB}MB`);
          }
          
          return originalListener(chunk);
        };
      }
      return originalOn(event, listener);
    }.bind(this);

    // Log de fin de requête
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
      
      if (totalSize > 1024 * 1024) { // Si > 1MB
        this.logger.log(`📊 Requête traitée: ${req.method} ${req.path} - ${sizeMB}MB en ${duration}ms`);
      }
    });

    next();
  }

  private getMaxSizeForRoute(path: string): number {
    // Limites par route (en bytes)
    const limits = {
      '/vendor/publish': 100 * 1024 * 1024, // 100MB
      '/products': 50 * 1024 * 1024,        // 50MB
      '/upload': 50 * 1024 * 1024,          // 50MB
      'default': 10 * 1024 * 1024           // 10MB
    };

    for (const [route, limit] of Object.entries(limits)) {
      if (route !== 'default' && path.includes(route)) {
        return limit;
      }
    }

    return limits.default;
  }
}

// Interceptor pour compresser les réponses volumineuses
@Injectable()
export class PayloadCompressionInterceptor {
  private readonly logger = new Logger(PayloadCompressionInterceptor.name);

  compress(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Compresser les images base64 si présentes
    if (data.finalImagesBase64) {
      this.logger.log('🗜️ Compression des images base64...');
      
      for (const [key, value] of Object.entries(data.finalImagesBase64)) {
        if (typeof value === 'string' && value.startsWith('data:image/')) {
          // Log de la taille originale
          const originalSize = (value.length / 1024).toFixed(2);
          this.logger.log(`📊 Image ${key}: ${originalSize}KB`);
          
          // Ici on pourrait implémenter une compression plus avancée
          // Pour l'instant, on garde tel quel mais on log les informations
        }
      }
    }

    return data;
  }

  decompress(data: any): any {
    // Décompression si nécessaire
    return data;
  }
}

// Utilitaires pour optimiser les images base64
export class ImageOptimizationUtils {
  private static readonly logger = new Logger(ImageOptimizationUtils.name);

  /**
   * Valide et optimise une image base64
   */
  static validateAndOptimizeBase64Image(base64: string, maxSizeMB: number = 10): string {
    if (!base64) {
      throw new BadRequestException('Image base64 manquante');
    }

    // Si le préfixe data:image/... est manquant, tenter de le déduire automatiquement
    if (!base64.startsWith('data:image/')) {
      const detectedMime = this.detectMimeFromBase64(base64);
      if (!detectedMime) {
        this.logger.warn('❔ Impossible de détecter le type mime. Utilisation de image/png par défaut');
      }
      base64 = `data:${detectedMime || 'image/png'};base64,${base64}`;
      this.logger.log(`ℹ️ Préfixe data:image ajouté automatiquement (${detectedMime || 'image/png'})`);
    }

    // Calculer la taille (en tenant compte de la partie header)
    const pureBase64 = base64.substring(base64.indexOf(',') + 1);
    const sizeBytes = (pureBase64.length * 3) / 4;
    const sizeMB = sizeBytes / (1024 * 1024);

    if (sizeMB > maxSizeMB) {
      this.logger.warn(`⚠️ Image trop volumineuse: ${sizeMB.toFixed(2)}MB (max: ${maxSizeMB}MB)`);
      throw new BadRequestException(`Image trop volumineuse: ${sizeMB.toFixed(2)}MB. Maximum: ${maxSizeMB}MB`);
    }

    this.logger.log(`✅ Image validée: ${sizeMB.toFixed(2)}MB`);
    return base64;
  }

  /**
   * Détecte rapidement le type MIME en fonction des premiers octets base64
   * @returns string | null
   */
  private static detectMimeFromBase64(b64: string): string | null {
    if (!b64 || b64.length < 10) return null;

    // Signatures courantes
    if (b64.startsWith('iVBOR')) return 'image/png'; // PNG
    if (b64.startsWith('/9j/')) return 'image/jpeg'; // JPG / JPEG
    if (b64.startsWith('R0lGOD')) return 'image/gif'; // GIF
    if (b64.startsWith('PHN2Zy') || b64.startsWith('PD94bW')) return 'image/svg+xml'; // SVG

    return null; // Inconnu
  }

  /**
   * Estime la taille totale d'un payload avec images
   */
  static estimatePayloadSize(payload: any): { sizeMB: number; imageCount: number } {
    let totalSize = JSON.stringify(payload).length;
    let imageCount = 0;

    // Compter les images base64
    if (payload.finalImagesBase64) {
      for (const [key, value] of Object.entries(payload.finalImagesBase64)) {
        if (typeof value === 'string' && value.startsWith('data:image/')) {
          imageCount++;
          // Les images base64 sont plus volumineuses que leur taille réelle
          totalSize += (value as string).length;
        }
      }
    }

    return {
      sizeMB: totalSize / (1024 * 1024),
      imageCount
    };
  }

  /**
   * Recommandations pour optimiser les payloads
   */
  static getOptimizationRecommendations(sizeMB: number, imageCount: number): string[] {
    const recommendations: string[] = [];

    if (sizeMB > 50) {
      recommendations.push('Considérer la compression des images avant conversion base64');
      recommendations.push('Réduire la qualité/résolution des images si possible');
    }

    if (imageCount > 10) {
      recommendations.push('Traitement par batch recommandé pour plus de 10 images');
      recommendations.push('Considérer l\'upload séquentiel plutôt que parallèle');
    }

    if (sizeMB > 100) {
      recommendations.push('Payload très volumineux - considérer un système de queue asynchrone');
      recommendations.push('Upload par chunks recommandé');
    }

    return recommendations;
  }
} 