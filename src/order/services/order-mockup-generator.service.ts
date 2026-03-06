import { Injectable, Logger } from '@nestjs/common';
import { CloudinaryService } from '../../core/cloudinary/cloudinary.service';
import sharp from 'sharp';
import axios from 'axios';

/**
 * Interface pour un élément de design (texte, image, forme)
 */
interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape';

  // Pour les textes
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';

  // Pour les images
  imageUrl?: string;

  // Position et dimensions (en pixels)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;

  // Opacité
  opacity?: number;
}

/**
 * Configuration pour générer un mockup de commande
 */
interface GenerateMockupConfig {
  productImageUrl: string;  // Image du produit de base (t-shirt, mug, etc.)
  elements: DesignElement[];  // Tous les éléments de personnalisation
  delimitation?: {  // Zone imprimable (optionnel)
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Service pour générer automatiquement les images finales (mockups)
 * des commandes personnalisées avec tous les éléments de design appliqués
 */
@Injectable()
export class OrderMockupGeneratorService {
  private readonly logger = new Logger(OrderMockupGeneratorService.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService
  ) {}

  /**
   * Génère une image finale à partir des éléments de personnalisation
   * et l'upload vers Cloudinary
   *
   * @param config - Configuration de génération
   * @returns URL de l'image finale uploadée
   */
  async generateOrderMockup(config: GenerateMockupConfig): Promise<string> {
    this.logger.log(`🎨 [Mockup] Génération d'une image finale avec ${config.elements.length} élément(s)`);

    try {
      // 1. Télécharger l'image du produit
      this.logger.log(`📥 [Mockup] Téléchargement de l'image du produit: ${config.productImageUrl}`);
      const productBuffer = await this.downloadImage(config.productImageUrl);
      const productMetadata = await sharp(productBuffer).metadata();

      this.logger.log(`📐 [Mockup] Image du produit: ${productMetadata.width}x${productMetadata.height}px`);

      // 2. Trier les éléments par zIndex (ordre de superposition)
      const sortedElements = [...config.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      this.logger.log(`🔢 [Mockup] Éléments triés par zIndex: ${sortedElements.map(e => `${e.type}(z:${e.zIndex})`).join(', ')}`);

      // 3. Créer les calques pour chaque élément
      const composites: any[] = [];

      for (let i = 0; i < sortedElements.length; i++) {
        const element = sortedElements[i];
        this.logger.log(`🎨 [Mockup] Traitement élément ${i + 1}/${sortedElements.length}: ${element.type} (id: ${element.id})`);

        if (element.type === 'text' && element.text) {
          // Générer un calque SVG pour le texte
          const textSvg = this.createTextSvg(element);
          const textBuffer = Buffer.from(textSvg);

          composites.push({
            input: textBuffer,
            left: Math.round(element.x),
            top: Math.round(element.y),
            blend: 'over'
          });

          this.logger.log(`  ✅ Texte ajouté: "${element.text.substring(0, 30)}..." à (${Math.round(element.x)}, ${Math.round(element.y)})`);

        } else if (element.type === 'image' && element.imageUrl) {
          // Télécharger et redimensionner l'image
          this.logger.log(`  📥 Téléchargement de l'image: ${element.imageUrl}`);
          const imageBuffer = await this.downloadImage(element.imageUrl);

          // Redimensionner et appliquer la rotation si nécessaire
          let processedBuffer = await sharp(imageBuffer)
            .resize(
              Math.round(element.width),
              Math.round(element.height),
              {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
              }
            )
            .png()
            .toBuffer();

          // Appliquer la rotation si spécifiée
          if (element.rotation && element.rotation !== 0) {
            processedBuffer = await sharp(processedBuffer)
              .rotate(element.rotation, {
                background: { r: 0, g: 0, b: 0, alpha: 0 }
              })
              .png()
              .toBuffer();
          }

          composites.push({
            input: processedBuffer,
            left: Math.round(element.x),
            top: Math.round(element.y),
            blend: 'over'
          });

          this.logger.log(`  ✅ Image ajoutée: ${Math.round(element.width)}x${Math.round(element.height)}px à (${Math.round(element.x)}, ${Math.round(element.y)})`);
        }
      }

      this.logger.log(`🔧 [Mockup] Composition de ${composites.length} calque(s) sur l'image du produit...`);

      // 4. Composer tous les calques sur l'image du produit
      const finalBuffer = await sharp(productBuffer)
        .composite(composites)
        .jpeg({ quality: 92 })
        .toBuffer();

      this.logger.log(`✅ [Mockup] Image finale générée: ${finalBuffer.length} bytes`);

      // 5. Upload vers Cloudinary
      const timestamp = Date.now();
      const uploadPath = `order-mockups/mockup-${timestamp}`;

      this.logger.log(`📤 [Mockup] Upload vers Cloudinary: ${uploadPath}...`);
      const uploadResult = await this.cloudinaryService.uploadBuffer(
        finalBuffer,
        {
          folder: 'order-mockups',
          public_id: `mockup-${timestamp}`,
          quality: 90,
          resource_type: 'image'
        }
      );

      this.logger.log(`✅ [Mockup] Upload terminé: ${uploadResult.secure_url}`);
      return uploadResult.secure_url;

    } catch (error) {
      this.logger.error(`❌ [Mockup] Erreur lors de la génération:`, error.message);
      this.logger.error(`   Stack:`, error.stack);
      throw new Error(`Échec de la génération du mockup: ${error.message}`);
    }
  }

  /**
   * Créer un SVG pour un élément texte
   * Support de la rotation, couleur, police, etc.
   */
  private createTextSvg(element: DesignElement): string {
    const fontSize = element.fontSize || 24;
    const fontFamily = element.fontFamily || 'Arial, sans-serif';
    const color = element.color || '#000000';
    const text = element.text || '';
    const fontWeight = element.fontWeight || 'normal';
    const textAlign = element.textAlign || 'center';

    // Calculer l'ancrage du texte
    let textAnchor = 'middle';
    let textX = element.width / 2;

    if (textAlign === 'left') {
      textAnchor = 'start';
      textX = 0;
    } else if (textAlign === 'right') {
      textAnchor = 'end';
      textX = element.width;
    }

    // SVG avec transformation pour la rotation autour du centre du texte
    const rotation = element.rotation || 0;
    const centerX = element.width / 2;
    const centerY = element.height / 2;

    // Découper le texte en lignes si nécessaire (support de \n)
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;

    const textElements = lines.map((line, index) => {
      const y = (element.height / 2) + (index - (lines.length - 1) / 2) * lineHeight;
      return `<text
        x="${textX}"
        y="${y}"
        font-family="${fontFamily}"
        font-size="${fontSize}"
        font-weight="${fontWeight}"
        fill="${color}"
        text-anchor="${textAnchor}"
        dominant-baseline="middle"
      >${this.escapeXml(line)}</text>`;
    }).join('\n        ');

    return `
      <svg width="${element.width}" height="${element.height}" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(${rotation} ${centerX} ${centerY})">
          ${textElements}
        </g>
      </svg>
    `;
  }

  /**
   * Échapper les caractères XML spéciaux dans le texte
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Télécharger une image depuis une URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 secondes
      });

      const buffer = Buffer.from(response.data);

      // Si c'est un SVG, le convertir en PNG
      if (url.toLowerCase().includes('.svg')) {
        this.logger.log(`  🔄 Conversion SVG → PNG`);
        return await sharp(buffer, { density: 300 })
          .resize(2000, 2000, {
            fit: 'inside',
            withoutEnlargement: false,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer();
      }

      return buffer;

    } catch (error) {
      this.logger.error(`❌ Erreur téléchargement image: ${url}`, error.message);
      throw new Error(`Impossible de télécharger l'image: ${error.message}`);
    }
  }
}
