import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryUploadResult } from './cloudinary.types'; // Importez l'interface

// Configure Cloudinary immediately when module is loaded
cloudinary.config({
  cloud_name: 'dsxab4qnu',
  api_key: '267848335846173',
  api_secret: 'WLhzU3riCxujR1DXRXyMmLPUCoU',
});

console.log('🔍 Cloudinary configured at module import: ✅ dsxab4qnu, ✅ 267848***, ✅ ***');

@Injectable()
export class CloudinaryService {
  private cloudName = 'dsxab4qnu';
  private apiKey = '267848335846173';
  private apiSecret = 'WLhzU3riCxujR1DXRXyMmLPUCoU';

  constructor() {
    console.log('🔍 Cloudinary Config from environment variables:', {
      cloud_name: this.cloudName ? '✅ ' + this.cloudName : '❌ missing',
      api_key: this.apiKey ? '✅ ' + this.apiKey : '❌ missing',
      api_secret: this.apiSecret ? '✅ ***' : '❌ missing',
    });

    // Configuration globale comme backup
    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  // Méthode helper pour s'assurer que la config est bien chargée avant chaque upload
  private ensureConfigured() {
    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'printalma'): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      try {
        // S'assurer que Cloudinary est configuré avant l'upload
        this.ensureConfigured();

        const uploadConfig = {
          folder: folder,
          resource_type: 'auto' as const,
          public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
          transformation: [
            {
              width: 1200,
              crop: 'limit',
              quality: 90,
              fetch_format: 'auto'
            }
          ]
        };

        const upload = cloudinary.uploader.upload_stream(
          uploadConfig,
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary uploadImage error:', error);
              const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
              return reject(new Error(`Image upload failed: ${errorMessage}`));
            }
            resolve(result as CloudinaryUploadResult);
          }
        );

        const bufferStream = require('stream').Readable.from(file.buffer);
        bufferStream.pipe(upload);
      } catch (error) {
        console.error('❌ Cloudinary uploadImage unexpected error:', error);
        const errorMessage = error?.message || String(error);
        reject(new Error(`Image upload failed: ${errorMessage}`));
      }
    });
  }

  /**
   * Upload d'image directement depuis un Buffer
   * @param buffer - Buffer de l'image
   * @param options - Options Cloudinary
   */
  async uploadBuffer(buffer: Buffer, options: any = {}): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      try {
        this.ensureConfigured();

        const uploadConfig = {
          folder: options.folder || 'printalma',
          resource_type: options.resource_type || 'auto',
          public_id: options.public_id || `${Date.now()}`,
          quality: options.quality || 90,
          timeout: 120000, // 2 minutes timeout pour l'upload
          ...options,
        };

        const upload = cloudinary.uploader.upload_stream(
          uploadConfig,
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary uploadBuffer error:', error);
              const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
              return reject(new Error(`Buffer upload failed: ${errorMessage}`));
            }
            resolve(result as CloudinaryUploadResult);
          }
        );

        const bufferStream = require('stream').Readable.from(buffer);
        bufferStream.pipe(upload);
      } catch (error) {
        console.error('❌ Cloudinary uploadBuffer unexpected error:', error);
        const errorMessage = error?.message || String(error);
        reject(new Error(`Buffer upload failed: ${errorMessage}`));
      }
    });
  }

  /**
   * Upload d'image directement depuis base64 avec options de qualité
   * @param base64Data - Données base64 (avec ou sans préfixe data:image/...)
   * @param options - Options Cloudinary
   */
  async uploadBase64(base64Data: string, options: any = {}): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      console.log(`🔄 Upload Cloudinary base64: ${Math.round(base64Data.length / 1024)}KB`);

      try {
        // Vérifier le format base64
        if (!base64Data.startsWith('data:image/')) {
          throw new Error('Format base64 invalide - doit commencer par data:image/');
        }

        // Détecter si c'est un SVG
        const isSVG = base64Data.includes('data:image/svg+xml');

        // Configuration par défaut (pour images raster)
        let defaultConfig: any = {
          folder: 'vendor-products',
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto',
          transformation: [
            {
              width: 2000,
              crop: 'limit',
              quality: 'auto:best',
              fetch_format: 'auto',
              flags: 'progressive'
            }
          ]
        };

        // Configuration spéciale pour SVG
        if (isSVG) {
          console.log('🎨 Détection SVG - upload sans transformations');
          defaultConfig = {
            folder: 'vendor-products',
            resource_type: 'image', // Garder 'image' pour éviter les problèmes CORS avec /raw/
            format: 'svg', // Forcer le format SVG
            // Pas de transformations pour préserver le format vectoriel
          };
        }

        // S'assurer que Cloudinary est configuré avant l'upload
        this.ensureConfigured();

        // Les options passées en paramètre peuvent override les defaults
        const uploadConfig = {
          ...defaultConfig,
          ...options
        };

        cloudinary.uploader.upload(base64Data, uploadConfig, (error, result) => {
          if (error) {
            console.error('❌ Cloudinary error:', error);
            const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
            return reject(new Error(`Upload failed: ${errorMessage}`));
          }

          console.log(`✅ Cloudinary success: ${result.secure_url}`);
          resolve(result as CloudinaryUploadResult);
        });

      } catch (error) {
        console.error('❌ Cloudinary base64 error:', error);
        const errorMessage = error?.message || error?.error?.message || String(error);
        reject(new Error(`Upload base64 failed: ${errorMessage}`));
      }
    });
  }

  /**
   * Upload d'image haute qualité pour les designs originaux
   * @param base64Data - Données base64 du design original
   * @param options - Options Cloudinary
   */
  async uploadHighQualityDesign(base64Data: string, options: any = {}): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      console.log(`🎨 Upload design haute qualité: ${Math.round(base64Data.length / 1024)}KB`);

      try {
        if (!base64Data.startsWith('data:image/')) {
          throw new Error('Format base64 invalide - doit commencer par data:image/');
        }

        // Détecter si c'est un SVG
        const isSVG = base64Data.includes('data:image/svg+xml');

        let defaultConfig: any = {
          folder: 'designs-originals',
          resource_type: 'image',
          quality: 100,
          format: 'png',
          transformation: [], // Pas de transformation pour préserver la qualité originale
        };

        // Configuration spéciale pour SVG
        if (isSVG) {
          console.log('🎨 Design SVG détecté - upload sans transformations');
          defaultConfig = {
            folder: 'designs-originals',
            resource_type: 'image', // Garder 'image' pour éviter les problèmes CORS avec /raw/
            format: 'svg', // Forcer le format SVG
            // Pas de transformation pour les SVG
          };
        }

        // S'assurer que Cloudinary est configuré avant l'upload
        this.ensureConfigured();

        const uploadConfig = {
          ...defaultConfig,
          ...options
        };

        cloudinary.uploader.upload(base64Data, uploadConfig, (error, result) => {
          if (error) {
            console.error('❌ Cloudinary design error:', error);
            const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
            return reject(new Error(`Design upload failed: ${errorMessage}`));
          }

          console.log(`✅ Design original uploadé: ${result.secure_url}`);
          resolve(result as CloudinaryUploadResult);
        });

      } catch (error) {
        console.error('❌ Cloudinary design base64 error:', error);
        const errorMessage = error?.message || error?.error?.message || String(error);
        reject(new Error(`Design upload base64 failed: ${errorMessage}`));
      }
    });
  }

  /**
   * Upload d'image produit avec qualité optimisée
   * @param base64Data - Données base64 de l'image produit
   * @param options - Options Cloudinary
   */
  async uploadProductImage(base64Data: string, options: any = {}): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      console.log(`🖼️ Upload image produit: ${Math.round(base64Data.length / 1024)}KB`);

      try {
        if (!base64Data.startsWith('data:image/')) {
          throw new Error('Format base64 invalide - doit commencer par data:image/');
        }

        // Détecter si c'est un SVG
        const isSVG = base64Data.includes('data:image/svg+xml');

        let defaultConfig: any = {
          folder: 'vendor-products',
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
          transformation: [
            {
              width: 1500,
              height: 1500,
              crop: 'limit',
              quality: 'auto:good',
              fetch_format: 'auto',
              flags: 'progressive',
              dpr: 'auto'
            }
          ]
        };

        // Configuration spéciale pour SVG
        if (isSVG) {
          console.log('🖼️ Image produit SVG détectée - upload sans transformations');
          defaultConfig = {
            folder: 'vendor-products',
            resource_type: 'image', // Garder 'image' pour éviter les problèmes CORS avec /raw/
            format: 'svg', // Forcer le format SVG
            // Pas de transformations pour les SVG
          };
        }

        // S'assurer que Cloudinary est configuré avant l'upload
        this.ensureConfigured();

        const uploadConfig = {
          ...defaultConfig,
          ...options
        };

        cloudinary.uploader.upload(base64Data, uploadConfig, (error, result) => {
          if (error) {
            console.error('❌ Cloudinary product error:', error);
            return reject(new Error(`Product upload failed: ${error.message}`));
          }

          console.log(`✅ Image produit uploadée: ${result.secure_url}`);
          resolve(result as CloudinaryUploadResult);
        });

      } catch (error) {
        console.error('❌ Cloudinary product base64 error:', error);
        reject(new Error(`Product upload base64 failed: ${error.message}`));
      }
    });
  }

  async uploadImageWithOptions(file: Express.Multer.File, options: any = {}): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      try {
        // S'assurer que Cloudinary est configuré avant l'upload
        this.ensureConfigured();

        // Fusionner les options par défaut avec les options personnalisées
        const uploadOptions = {
          resource_type: 'auto' as const,
          public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
          ...options
        };

        const upload = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary uploadImageWithOptions error:', error);
              const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
              return reject(new Error(`Image upload with options failed: ${errorMessage}`));
            }
            resolve(result as CloudinaryUploadResult);
          }
        );

        const bufferStream = require('stream').Readable.from(file.buffer);
        bufferStream.pipe(upload);
      } catch (error) {
        console.error('❌ Cloudinary uploadImageWithOptions unexpected error:', error);
        const errorMessage = error?.message || String(error);
        reject(new Error(`Image upload with options failed: ${errorMessage}`));
      }
    });
  }

  /**
   * Upload de photo de profil pour les vendeurs
   * @param file - Fichier image de profil
   * @param vendorId - ID du vendeur (optionnel pour le nom de fichier)
   */
  async uploadProfilePhoto(file: Express.Multer.File, vendorId?: number): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`📸 Upload photo de profil: ${file.originalname} (${Math.round(file.size / 1024)}KB)`);

        const uniqueId = vendorId ? `vendor_${vendorId}` : `vendor_${Date.now()}`;
        const publicId = `${uniqueId}_${Math.round(Math.random() * 1E9)}`;

        // S'assurer que Cloudinary est configuré avant l'upload
        this.ensureConfigured();

        const uploadConfig = {
          folder: 'profile-photos',
          resource_type: 'image' as const,
          public_id: publicId,
          quality: 'auto:good',
          fetch_format: 'auto',
          transformation: [
            {
              width: 400,
              height: 400,
              crop: 'fill',
              gravity: 'face',
              quality: 'auto:good',
              fetch_format: 'auto',
              flags: 'progressive'
            }
          ]
        };

        const upload = cloudinary.uploader.upload_stream(
          uploadConfig,
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary profile photo error:', error);
              const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
              return reject(new Error(`Profile photo upload failed: ${errorMessage}`));
            }

            console.log(`✅ Photo de profil uploadée: ${result.secure_url}`);
            resolve(result as CloudinaryUploadResult);
          }
        );

        const bufferStream = require('stream').Readable.from(file.buffer);
        bufferStream.pipe(upload);
      } catch (error) {
        console.error('❌ Cloudinary uploadProfilePhoto unexpected error:', error);
        const errorMessage = error?.message || String(error);
        reject(new Error(`Profile photo upload failed: ${errorMessage}`));
      }
    });
  }

  /**
   * Upload d'avatar pour les designers
   * Support: jpg, jpeg, png, gif, webp, SVG
   * Taille max: 10MB
   * @param file - Fichier image de l'avatar
   */
  async uploadDesignerAvatar(file: Express.Multer.File): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🎨 Upload avatar designer: ${file.originalname} (${Math.round(file.size / 1024)}KB)`);

        // Vérifier la taille (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          throw new Error('La taille du fichier ne doit pas dépasser 10MB');
        }

        // Détecter si c'est un SVG
        const isSVG = file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg');

        // S'assurer que Cloudinary est configuré
        this.ensureConfigured();

        let uploadConfig: any;

        if (isSVG) {
          // Configuration spéciale pour SVG
          console.log('🎨 Détection SVG - upload sans transformations');
          uploadConfig = {
            folder: 'designers',
            resource_type: 'image',
            format: 'svg',
            public_id: `avatar_${Date.now()}`,
            // Pas de transformation pour préserver le SVG
          };
        } else {
          // Configuration pour images raster (jpg, png, gif, webp)
          uploadConfig = {
            folder: 'designers',
            resource_type: 'image',
            public_id: `avatar_${Date.now()}`,
            transformation: [
              {
                width: 400,
                height: 400,
                crop: 'fill',
                gravity: 'face',
                quality: 'auto:good',
                fetch_format: 'auto',
                flags: 'progressive'
              }
            ]
          };
        }

        const upload = cloudinary.uploader.upload_stream(
          uploadConfig,
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary avatar error:', error);
              const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
              return reject(new Error(`Upload avatar failed: ${errorMessage}`));
            }

            console.log(`✅ Avatar designer uploadé: ${result.secure_url}`);
            resolve(result as CloudinaryUploadResult);
          }
        );

        const bufferStream = require('stream').Readable.from(file.buffer);
        bufferStream.pipe(upload);
      } catch (error) {
        console.error('❌ Cloudinary uploadDesignerAvatar unexpected error:', error);
        const errorMessage = error?.message || String(error);
        reject(new Error(`Upload avatar failed: ${errorMessage}`));
      }
    });
  }

  async deleteImage(publicId: string) {
    return await cloudinary.uploader.destroy(publicId, { invalidate: true });
  }

  /**
   * Upload une image client vers Cloudinary pour la personnalisation
   * @param buffer - Buffer de l'image
   * @param filename - Nom du fichier original
   * @param userId - ID utilisateur (optionnel)
   * @param sessionId - ID de session guest (optionnel)
   */
  async uploadClientImage(
    buffer: Buffer,
    filename: string,
    userId?: number,
    sessionId?: string
  ): Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      try {
        this.ensureConfigured();

        // Dossier spécifique pour les uploads client
        const folder = 'client-uploads';

        // Générer un public_id unique
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const userPrefix = userId ? `user_${userId}` : `guest_${sessionId?.substring(0, 8) || 'anonymous'}`;
        const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50);
        const publicId = `${folder}/${userPrefix}_${timestamp}_${randomStr}`;

        const uploadConfig = {
          folder: folder,
          public_id: publicId,
          resource_type: 'image' as const,
          // Optimisations
          quality: 'auto:good' as const,
          fetch_format: 'auto' as const,
          // Limites de sécurité
          max_image_width: 4096,
          max_image_height: 4096,
          // Métadonnées
          context: {
            type: 'client_upload',
            uploaded_by: userId ? `user_${userId}` : `guest_${sessionId}`,
            original_filename: cleanFilename,
            uploaded_at: new Date().toISOString()
          }
        };

        console.log(`📤 [Cloudinary] Upload image client: ${cleanFilename} (${Math.round(buffer.length / 1024)}KB)`);

        const upload = cloudinary.uploader.upload_stream(
          uploadConfig,
          (error, result) => {
            if (error) {
              console.error('❌ [Cloudinary] Erreur upload client image:', error);
              const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
              return reject(new Error(`Client image upload failed: ${errorMessage}`));
            }

            console.log('✅ [Cloudinary] Image client uploadée:', {
              url: result.secure_url,
              publicId: result.public_id,
              dimensions: { width: result.width, height: result.height }
            });

            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height
            });
          }
        );

        const bufferStream = require('stream').Readable.from(buffer);
        bufferStream.pipe(upload);
      } catch (error) {
        console.error('❌ [Cloudinary] Erreur inattendue upload client image:', error);
        const errorMessage = error?.message || String(error);
        reject(new Error(`Client image upload failed: ${errorMessage}`));
      }
    });
  }

  /**
   * Supprimer une image client de Cloudinary
   * @param publicId - Public ID de l'image à supprimer
   */
  async deleteClientImage(publicId: string): Promise<void> {
    try {
      this.ensureConfigured();
      const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
      console.log('🗑️ [Cloudinary] Image client supprimée:', publicId, 'result:', result);
    } catch (error) {
      console.error('❌ [Cloudinary] Erreur suppression image client:', error);
      throw error;
    }
  }

  /**
   * Récupérer les informations d'une image depuis Cloudinary
   * @param publicId - Public ID de l'image
   */
  async getImageInfo(publicId: string): Promise<any> {
    try {
      this.ensureConfigured();
      return await cloudinary.api.resource(publicId);
    } catch (error) {
      console.error('❌ [Cloudinary] Erreur récupération info image:', error);
      throw error;
    }
  }

  async createFolder(folderName: string) {
    try {
      await cloudinary.api.create_folder(folderName);
      return { message: `Dossier ${folderName} créé avec succès` };
    } catch (error) {
      throw new Error(`Erreur lors de la création du dossier: ${error.message}`);
    }
  }

  /**
   * Generate a transformed, secure Cloudinary URL based on the given public ID
   * and transformation options. This is a simple wrapper around
   * cloudinary.url that ensures the URL is served over HTTPS and allows
   * callers to specify any transformation parameters supported by Cloudinary
   * (e.g. width, height, crop, gravity, quality, etc.).
   *
   * @param publicId  The Cloudinary public ID of the asset (e.g. "folder/image")
   * @param options   Transformation options accepted by cloudinary.url().
   * @returns         A fully-qualified HTTPS URL pointing to the transformed asset.
   */
  getImageUrl(publicId: string, options: Record<string, any> = {}): string {
    // cloudinary.url automatically builds the URL using the cloud-name from the
    // environment configuration. We explicitly set secure: true to always
    // return an https URL.
    return cloudinary.url(publicId, {
      secure: true,
      ...options,
    });
  }

  /**
   * Upload an image to Cloudinary by fetching it from a remote URL.
   * Useful when the image is already hosted (e.g. after a mockup generation API returned an URL).
   */
  async uploadFromUrl(imageUrl: string, options: any = {}): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      try {
        // S'assurer que Cloudinary est configuré avant l'upload
        this.ensureConfigured();

        const uploadOptions = {
          folder: 'vendor-mockups',
          resource_type: 'image' as const,
          quality: 'auto',
          fetch_format: 'auto',
          ...options,
        };

        cloudinary.uploader.upload(imageUrl, uploadOptions, (error, result) => {
          if (error) {
            console.error('❌ Cloudinary uploadFromUrl error:', error);
            return reject(new Error(`Upload from URL failed: ${error.message}`));
          }

          console.log(`✅ Image uploadée depuis URL: ${result.secure_url}`);
          resolve(result as CloudinaryUploadResult);
        });
      } catch (err) {
        console.error('❌ uploadFromUrl unexpected error:', err);
        reject(err);
      }
    });
  }
}
