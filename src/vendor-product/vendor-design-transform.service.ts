import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SaveDesignTransformsDto } from './dto/vendor-design-transform.dto';
import { ProductTypeDetectorService, DesignPositioning } from './services/product-type-detector.service';
import { DesignPositionService } from './services/design-position.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VendorDesignTransformService {
  private readonly logger = new Logger(VendorDesignTransformService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productTypeDetector: ProductTypeDetectorService,
    private readonly designPositionService: DesignPositionService
  ) {}

  /**
   * Retourne le VendorProduct appartenant au vendeur, que le paramètre soit :
   *  - l'id du VendorProduct
   *  - l'id du produit admin (baseProductId) utilisé par ce vendeur
   * 
   * Si aucun VendorProduct n'est trouvé, mais que l'admin product existe,
   * on peut temporairement permettre les transforms (phase de conception)
   */
  private async resolveVendorProduct(vendorId: number, anyProductId: number): Promise<{ vendorProduct?: any, strategy: 'vendor' | 'admin' }> {
    this.logger.log(`🔍 resolveVendorProduct: vendorId=${vendorId}, anyProductId=${anyProductId}`);
    
    // 1. Essayer de trouver un VendorProduct
    const vendorProduct = await this.prisma.vendorProduct.findFirst({
      where: {
        vendorId,
        OR: [{ id: anyProductId }, { baseProductId: anyProductId }],
        isDelete: false,
      },
    });

    if (vendorProduct) {
      this.logger.log(`✅ VendorProduct trouvé: id=${vendorProduct.id}, baseProductId=${vendorProduct.baseProductId}`);
      return { vendorProduct, strategy: 'vendor' };
    }

    // Debug: lister tous les vendor products de ce vendeur
    const allVendorProducts = await this.prisma.vendorProduct.findMany({
      where: { vendorId, isDelete: false },
      select: { id: true, baseProductId: true, name: true }
    });
    this.logger.warn(`📋 VendorProducts disponibles: ${JSON.stringify(allVendorProducts)}`);
    
    return { strategy: 'vendor' }; // Échec – aucun vendorProduct trouvé
  }

  /**
   * Sauvegarde ou met à jour les transformations de design pour un produit vendeur
   * Supporte maintenant les admin products en mode conception
   */
  async saveTransforms(vendorId: number, dto: SaveDesignTransformsDto) {
    const logUrl = dto.designUrl ? dto.designUrl.substring(0, 50) : 'undefined';
    this.logger.log(`💾 saveTransforms: vendorId=${vendorId}, productId=${dto.productId}, designUrl=${logUrl}...`);
    
    const resolution = await this.resolveVendorProduct(vendorId, dto.productId);
    
    if (!resolution.vendorProduct) {
      throw new ForbiddenException('Accès refusé à ce produit');
    }

    const { designUrl, transforms, lastModified } = dto;

    // Stratégie selon le type de produit
      const vendorProductId = resolution.vendorProduct.id;

      const existing = await this.prisma.vendorDesignTransform.findFirst({
        where: {
          vendorId,
          vendorProductId,
          ...(designUrl ? { designUrl } : {}),
        },
      });

      if (existing) {
        this.logger.log(`🔄 Mise à jour transform existant: id=${existing.id}`);
      const result = await this.prisma.vendorDesignTransform.update({
          where: { id: existing.id },
          data: {
            transforms,
            lastModified: new Date(lastModified),
          },
        });
      
      // 🆕 Sauvegarder la position dans ProductDesignPosition
      await this.designPositionService.savePositionFromTransform(
        vendorId,
        vendorProductId,
        designUrl,
        transforms
      );
      
      return result;
      }

      this.logger.log(`🆕 Création nouveau transform pour vendorProductId=${vendorProductId}`);
    // ✅ UPSERT au lieu de CREATE pour gérer la contrainte d'unicité
    const result = await this.prisma.vendorDesignTransform.upsert({
      where: {
        unique_vendor_product_design: {
          vendorId,
          vendorProductId,
          designUrl,
        },
      },
      update: {
        transforms,
        lastModified: new Date(lastModified),
      },
      create: {
        vendorId,
        vendorProductId,
        designUrl,
        transforms,
        lastModified: new Date(lastModified),
      },
    });
      
    // 🆕 Sauvegarder la position dans ProductDesignPosition
    // ✅ EXTRACTION CORRECTE des positions depuis transforms
    await this.saveDesignPositionFromTransforms(
      vendorId,
      vendorProductId,
      designUrl,
      transforms
    );
    
    return result;
  }

  /**
   * 🆕 MÉTHODE PRIVÉE: Extraire et sauvegarder les positions depuis transforms
   */
  private async saveDesignPositionFromTransforms(
    vendorId: number,
    vendorProductId: number,
    designUrl: string,
    transforms: any
  ): Promise<void> {
    this.logger.log(`🔄 Extraction position depuis transforms: ${JSON.stringify(transforms)}`);
    
    try {
      // Les transforms peuvent être sous différents formats :
      // Format 1: { '0': { x: -44, y: -68, scale: 0.44, rotation: 0 } }
      // Format 2: { positioning: { x: 0, y: 0, scale: 1, rotation: 0 } }
      
      let position = null;
      
      // Chercher dans transforms.positioning
      if (transforms.positioning) {
        position = transforms.positioning;
        this.logger.log(`✅ Position trouvée dans transforms.positioning: ${JSON.stringify(position)}`);
      }
      // Chercher dans transforms.position
      else if (transforms.position) {
        position = transforms.position;
        this.logger.log(`✅ Position trouvée dans transforms.position: ${JSON.stringify(position)}`);
      }
      // Chercher dans transforms['0'] (format numérique)
      else if (transforms['0']) {
        position = transforms['0'];
        this.logger.log(`✅ Position trouvée dans transforms['0']: ${JSON.stringify(position)}`);
      }
      // Chercher dans le premier élément si c'est un objet
      else if (typeof transforms === 'object' && transforms !== null) {
        const keys = Object.keys(transforms);
        if (keys.length > 0) {
          const firstKey = keys[0];
          const firstValue = transforms[firstKey];
          if (firstValue && typeof firstValue === 'object' && 'x' in firstValue) {
            position = firstValue;
            this.logger.log(`✅ Position trouvée dans transforms['${firstKey}']: ${JSON.stringify(position)}`);
          }
        }
      }
      
      if (!position) {
        this.logger.warn(`⚠️ Aucune position valide trouvée dans transforms`);
        return;
      }
      
      // Valider que la position contient les champs requis
      if (typeof position.x !== 'number' || typeof position.y !== 'number') {
        this.logger.warn(`⚠️ Position invalide - x ou y manquant: ${JSON.stringify(position)}`);
        return;
      }
      
      // Trouver le design par URL
      const design = await this.prisma.design.findFirst({
        where: {
          imageUrl: designUrl,
          vendorId: vendorId
        }
      });
      
      if (!design) {
        this.logger.warn(`❌ Design non trouvé pour URL: ${designUrl}`);
        return;
      }
      
      // Sauvegarder la position
      await this.prisma.productDesignPosition.upsert({
        where: {
          vendorProductId_designId: {
            vendorProductId,
            designId: design.id,
          },
        },
        create: {
          vendorProductId,
          designId: design.id,
          position: {
            x: position.x,
            y: position.y,
            scale: position.scale || 1,
            rotation: position.rotation || 0,
            constraints: position.constraints || {}
          },
        },
        update: {
          position: {
            x: position.x,
            y: position.y,
            scale: position.scale || 1,
            rotation: position.rotation || 0,
            constraints: position.constraints || {}
          },
        },
      });
      
      this.logger.log(`✅ Position sauvegardée: Produit ${vendorProductId} ↔ Design ${design.id}`);
      
    } catch (error) {
      this.logger.error('❌ Erreur sauvegarde position depuis transforms:', error);
      // Ne pas faire échouer le processus principal
    }
  }

  /**
   * Récupère la dernière transformation sauvegardée
   * Supporte maintenant les admin products en mode conception
   */
  async loadTransforms(
    vendorId: number,
    vendorProductId: number,
    designUrl?: string,
  ) {
    const logUrl = designUrl ? designUrl.substring(0, 50) : 'undefined';
    this.logger.log(
      `📥 loadTransforms: vendorId=${vendorId}, vendorProductId=${vendorProductId}, designUrl=${logUrl}...`,
    );
    
    const resolution = await this.resolveVendorProduct(vendorId, vendorProductId);
    
    if (!resolution.vendorProduct) {
      this.logger.warn(`🚫 Aucun VendorProduct associé pour vendorId=${vendorId}, productId=${vendorProductId}`);
      throw new ForbiddenException('Produit vendeur introuvable');
    }

    let transform = null;

    // Chercher les transforms pour ce VendorProduct
      transform = await this.prisma.vendorDesignTransform.findFirst({
        where: {
          vendorId,
          vendorProductId: resolution.vendorProduct.id,
          ...(designUrl ? { designUrl } : {}),
        },
        orderBy: { lastModified: 'desc' },
      });

    if (transform) {
      this.logger.log(`✅ Transform trouvé: id=${transform.id}, lastModified=${transform.lastModified}`);
      
      // 🆕 Enrichir avec la position depuis ProductDesignPosition
      if (designUrl) {
        const design = await this.prisma.design.findFirst({
          where: { imageUrl: designUrl, vendorId: vendorId }
        });

        if (design) {
          const savedPosition = await this.designPositionService.getPositionByDesignId(
            resolution.vendorProduct?.id || vendorProductId,
            design.id
          );
          
          if (savedPosition) {
            // Fusionner la position sauvegardée avec les transforms
            transform.transforms = {
              ...(transform.transforms as any),
              position: savedPosition,
            };
            this.logger.log(`✅ Position enrichie depuis ProductDesignPosition`);
          }
        }
      }
    } else {
      const safeLogUrl = designUrl ? designUrl.substring(0, 50) : 'undefined';
      this.logger.log(`🔍 Aucun transform trouvé pour strategy=${resolution.strategy}, productId=${vendorProductId}, designUrl=${safeLogUrl}...`);
    }

    return transform;
  }

  /**
   * 🆕 NOUVELLE MÉTHODE: Obtient le positionnement optimal pour un produit
   */
  async getOptimalPositioning(
    vendorId: number,
    productId: number,
    designUrl?: string
  ): Promise<{
    positioning: DesignPositioning;
    productType: string;
    description: string;
    presets: Record<string, DesignPositioning>;
  }> {
    this.logger.log(`🎯 getOptimalPositioning: vendorId=${vendorId}, productId=${productId}`);
    
    const resolution = await this.resolveVendorProduct(vendorId, productId);
    
    if (!resolution.vendorProduct) {
      throw new ForbiddenException('Accès refusé à ce produit');
    }

    // 1. Vérifier s'il existe déjà un positionnement personnalisé
    if (resolution.vendorProduct && designUrl) {
      const existingTransform = await this.prisma.vendorDesignTransform.findFirst({
        where: {
          vendorId,
          vendorProductId: resolution.vendorProduct.id,
          designUrl
        }
      });

      if ((existingTransform?.transforms as any)?.positioning) {
        const positioning = (existingTransform.transforms as any).positioning;
        const baseProduct = await this.prisma.product.findUnique({
          where: { id: resolution.vendorProduct.baseProductId }
        });
        
        const productType = this.productTypeDetector.detectProductType(baseProduct?.name || '');
        
        return {
          positioning,
          productType,
          description: this.productTypeDetector.getProductTypeDescription(productType),
          presets: this.productTypeDetector.getPresetPositions(productType)
        };
      }
    }

    // 2. Obtenir le produit de base pour détecter le type
    const baseProduct = await this.prisma.product.findUnique({
      where: { id: resolution.vendorProduct.baseProductId }
    });

    if (!baseProduct) {
      throw new Error('Produit de base non trouvé');
    }

    // 3. Détecter le type et obtenir le positionnement optimal
    const productType = this.productTypeDetector.detectProductType(baseProduct.name);
    const positioning = this.productTypeDetector.getDefaultPositioning(productType);
    
    this.logger.log(`✅ Type détecté: ${productType}, positionnement: ${JSON.stringify(positioning)}`);

    return {
      positioning,
      productType,
      description: this.productTypeDetector.getProductTypeDescription(productType),
      presets: this.productTypeDetector.getPresetPositions(productType)
    };
  }

  /**
   * 🆕 NOUVELLE MÉTHODE: Sauvegarde un positionnement personnalisé
   */
  async saveCustomPositioning(
    vendorId: number,
    productId: number,
    designUrl: string,
    positioning: DesignPositioning
  ): Promise<void> {
    this.logger.log(`💾 saveCustomPositioning: vendorId=${vendorId}, productId=${productId}`);
    // Résoudre le VendorProduct
    const resolution = await this.resolveVendorProduct(vendorId, productId);

    if (!resolution.vendorProduct) {
      // Mode conception désactivé : on refuse la sauvegarde si aucun VendorProduct n'existe
      this.logger.warn(`🚫 Mode conception désactivé : aucun VendorProduct pour adminProduct ${productId}`);
      throw new ForbiddenException('Créez d\'abord un produit vendeur avant de sauvegarder un positionnement personnalisé');
    }

    const vendorProductId = resolution.vendorProduct.id;

    // Chercher un transform existant pour ce design
    const existingTransform = await this.prisma.vendorDesignTransform.findFirst({
      where: {
        vendorId,
        vendorProductId,
        designUrl
      }
    });

    const transformDataObj = {
      positioning,
      lastModified: new Date().toISOString()
    } as unknown as Prisma.InputJsonValue;

    if (existingTransform) {
      await this.prisma.vendorDesignTransform.update({
        where: { id: existingTransform.id },
        data: {
          transforms: {
            ...(existingTransform.transforms as any),
            positioning
          } as unknown as Prisma.InputJsonValue,
          lastModified: new Date()
        }
      });
    } else {
      await this.prisma.vendorDesignTransform.create({
        data: {
          vendorId,
          vendorProductId,
          designUrl,
          transforms: transformDataObj,
          lastModified: new Date()
        }
      });
    }

    // Sauvegarder également dans ProductDesignPosition
    await this.designPositionService.savePositionFromTransform(
      vendorId,
      vendorProductId,
      designUrl,
      { positioning } as any
    );

    this.logger.log(`✅ Positionnement personnalisé sauvegardé pour produit ${vendorProductId}`);
  }
}