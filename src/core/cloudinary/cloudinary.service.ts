import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryUploadResult } from './cloudinary.types'; // Importez l'interface

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    console.log('🔍 Cloudinary Config from ConfigService:', {
      cloud_name: cloudName ? '✅ ' + cloudName : '❌ missing',
      api_key: apiKey ? '✅ ' + apiKey.substring(0, 6) + '...' : '❌ missing',
      api_secret: apiSecret ? '✅ ***' : '❌ missing',
    });

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'printalma'): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
          transformation: [
            {
              width: 1200,
              crop: 'limit',
              quality: 90,
              fetch_format: 'auto'
            }
          ]
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as CloudinaryUploadResult); // Cast the result to the interface
        }
      );

      const bufferStream = require('stream').Readable.from(file.buffer);
      bufferStream.pipe(upload);
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

        const result = cloudinary.uploader.upload(base64Data, {
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
          ],
          ...options
        }, (error, result) => {
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

        const result = cloudinary.uploader.upload(base64Data, {
          folder: 'designs-originals',
          resource_type: 'image',
          quality: 100,
          format: 'png',
          transformation: [], // Pas de transformation pour préserver la qualité originale
          ...options
        }, (error, result) => {
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

        const result = cloudinary.uploader.upload(base64Data, {
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
          ],
          ...options
        }, (error, result) => {
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
      // Fusionner les options par défaut avec les options personnalisées
      const uploadOptions = {
        resource_type: 'auto',
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        ...options
      };

      const upload = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) return reject(error);
          resolve(result as CloudinaryUploadResult);
        }
      );

      const bufferStream = require('stream').Readable.from(file.buffer);
      bufferStream.pipe(upload);
    });
  }

  /**
   * Upload de photo de profil pour les vendeurs
   * @param file - Fichier image de profil
   * @param vendorId - ID du vendeur (optionnel pour le nom de fichier)
   */
  async uploadProfilePhoto(file: Express.Multer.File, vendorId?: number): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      console.log(`📸 Upload photo de profil: ${file.originalname} (${Math.round(file.size / 1024)}KB)`);
      
      const uniqueId = vendorId ? `vendor_${vendorId}` : `vendor_${Date.now()}`;
      const publicId = `${uniqueId}_${Math.round(Math.random() * 1E9)}`;

      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'profile-photos',
          resource_type: 'image',
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
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary profile photo error:', error);
            return reject(new Error(`Profile photo upload failed: ${error.message}`));
          }
          
          console.log(`✅ Photo de profil uploadée: ${result.secure_url}`);
          resolve(result as CloudinaryUploadResult);
        }
      );

      const bufferStream = require('stream').Readable.from(file.buffer);
      bufferStream.pipe(upload);
    });
  }

  async deleteImage(publicId: string) {
    return await cloudinary.uploader.destroy(publicId, { invalidate: true });
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
        const defaultOptions = {
          folder: 'vendor-mockups',
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto',
          ...options,
        };

        cloudinary.uploader.upload(imageUrl, defaultOptions, (error, result) => {
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
