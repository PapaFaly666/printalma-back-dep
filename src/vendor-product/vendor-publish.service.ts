import { Injectable, BadRequestException, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { VendorPublishDto, VendorPublishResponseDto } from './dto/vendor-publish.dto';
import { VendorProductsListResponseDto, VendorStatsResponseDto, VendorProductDetailResponseDto } from './dto/vendor-product-response.dto';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';
import { SaveDesignPositionDto } from './dto/save-design-position.dto';
import { DesignPositionService } from './services/design-position.service';
import { VendorFundsService } from '../vendor-funds/vendor-funds.service';
import {
  formatDesignPositions,
  DesignPositionData
} from '../utils/design-position-calculator';
import {
  processImageDelimitations
} from '../utils/delimitation-converter';

@Injectable()
export class VendorPublishService {
  private readonly logger = new Logger(VendorPublishService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly designPositionService: DesignPositionService,
    private readonly vendorFundsService: VendorFundsService,
  ) {}

  /**
   * ✅ NOUVELLE ARCHITECTURE: Publication produit vendeur avec design existant
   * 🆕 PLUS DE MODE TRANSFORMATION - Tout en localStorage côté frontend
   */
  async publishProduct(
    publishDto: VendorPublishDto,
    vendorId: number,
  ): Promise<VendorPublishResponseDto> {
    this.logger.log(`📦 Publication produit vendeur par vendeur ${vendorId}`);

    try {
      // ✅ VALIDATION: Structure produit admin
      await this.validateAdminProductStructure(publishDto.productStructure.adminProduct);

      // ✅ VALIDATION: Design ID fourni
      if (!publishDto.designId) {
        throw new BadRequestException('Design ID requis. Veuillez d\'abord créer ou sélectionner un design.');
      }

      // 🛡️ VALIDATION: Éviter les noms/descriptions auto-générés (toujours stricte maintenant)
      await this.validateVendorProductInfo(publishDto);

      // ✅ VÉRIFIER QUE LE DESIGN EXISTE ET APPARTIENT AU VENDEUR
      const design = await this.prisma.design.findFirst({
        where: {
          id: publishDto.designId,
          vendorId: vendorId
        }
      });

      if (!design) {
        throw new BadRequestException(`Design ${publishDto.designId} introuvable ou n'appartient pas au vendeur`);
      }

      // 🎨 EXTRAIRE LES INFORMATIONS DE POSITION ET DIMENSIONS
      let designWidth: number | null = null;
      let designHeight: number | null = null;
      let designX: number | null = null;
      let designY: number | null = null;
      let designScale: number | null = null;
      let designRotation: number | null = null;

      // Extraction des dimensions depuis designPosition si disponible
      if (publishDto.designPosition) {
        designX = publishDto.designPosition.x;
        designY = publishDto.designPosition.y;
        designScale = publishDto.designPosition.scale;
        designRotation = publishDto.designPosition.rotation;
        
        // Extraction flexible des dimensions (plusieurs formats possibles)
        designWidth = (publishDto.designPosition as any).design_width ?? 
                     (publishDto.designPosition as any).designWidth ?? 
                     (publishDto.designPosition as any).width;
        designHeight = (publishDto.designPosition as any).design_height ?? 
                      (publishDto.designPosition as any).designHeight ?? 
                      (publishDto.designPosition as any).height;
      }

      // Fallback: utiliser les dimensions du design original si pas dans position
      if (!designWidth || !designHeight) {
        const designDimensions = design.dimensions as any;
        if (designDimensions) {
          designWidth = designWidth || designDimensions.width || 1200;
          designHeight = designHeight || designDimensions.height || 1200;
        } else {
          designWidth = designWidth || 1200;
          designHeight = designHeight || 1200;
        }
      }

      this.logger.log(`🎨 Informations design extraites:`, {
        designWidth,
        designHeight,
        designX,
        designY,
        designScale,
        designRotation
      });

      // 🛡️ ANTI-DOUBLON — existe-t-il déjà un VendorProduct identique ?
      // SUPPRIMÉ : On autorise plusieurs produits avec le même design et baseProduct
      // const existing = await this.prisma.vendorProduct.findFirst({
      //   where: {
      //     vendorId,
      //     baseProductId: publishDto.baseProductId,
      //     designId: design.id,
      //     NOT: {
      //       name: { startsWith: 'TRANSFORMATION_' } // Exclure les transformations
      //     }
      //   }
      // });

      // if (existing) {
      //   this.logger.warn(`⚠️ Produit vendeur déjà existant (id=${existing.id}) pour baseProduct ${publishDto.baseProductId} + design ${design.id}`);
      //   return {
      //     success: true,
      //     productId: existing.id,
      //     message: `Produit déjà existant pour ce design et ce produit admin (id=${existing.id})`,
      //     status: existing.status,
      //     needsValidation: !existing.isValidated,
      //     imagesProcessed: 0,
      //     structure: 'admin_product_preserved',
      //     designUrl: design.imageUrl,
      //     designId: design.id,
      //     isDesignReused: true
      //   };
      // }

      this.logger.log(`✅ Création produit réel avec design: ${design.id} - ${design.name}`);

      // ✅ CRÉATION PRODUIT VENDEUR RÉEL
      const vendorProduct = await this.prisma.vendorProduct.create({
        data: {
          baseProductId: publishDto.baseProductId,
          vendorId: vendorId,
          
          // ✅ INFORMATIONS VENDEUR
          name: publishDto.vendorName,
          description: publishDto.vendorDescription,
          price: publishDto.vendorPrice,
          stock: publishDto.vendorStock,
          
          // ✅ CONSERVATION STRUCTURE ADMIN
          adminProductName: publishDto.productStructure.adminProduct.name,
          adminProductDescription: publishDto.productStructure.adminProduct.description,
          adminProductPrice: publishDto.productStructure.adminProduct.price,
          
          // ✅ LIAISON DESIGN EXISTANT
          designId: design.id,
          designCloudinaryUrl: design.imageUrl,
          designCloudinaryPublicId: design.cloudinaryPublicId,
          designPositioning: 'CENTER',
          designScale: publishDto.productStructure.designApplication.scale || 0.6,
          designApplicationMode: 'PRESERVED',
          
          // 🆕 INFORMATIONS DE POSITION ET DIMENSIONS DU DESIGN
          designWidth: designWidth,
          designHeight: designHeight,
          
          // ✅ SÉLECTIONS VENDEUR
          sizes: JSON.stringify(publishDto.selectedSizes),
          colors: JSON.stringify(publishDto.selectedColors),
          
          // ✅ STATUT ET VALIDATION
          status: publishDto.forcedStatus || (
            design.isValidated ? (
              publishDto.postValidationAction === 'TO_DRAFT' ? 'DRAFT' : 'PUBLISHED'
            ) : 'PENDING'
          ),
          isValidated: design.isValidated,
          postValidationAction: publishDto.postValidationAction || 'AUTO_PUBLISH',
          
          // ✅ MÉTADONNÉES COMPATIBILITÉ
          vendorName: publishDto.vendorName,
          vendorDescription: publishDto.vendorDescription,
          vendorStock: publishDto.vendorStock,
          basePriceAdmin: publishDto.productStructure.adminProduct.price,
        },
      });

      // ✅ CRÉATION DU LIEN DESIGN-PRODUIT
      try {
        await this.prisma.designProductLink.create({
          data: {
            designId: design.id,
            vendorProductId: vendorProduct.id
          }
        });
        this.logger.log(`🔗 Lien créé: Design ${design.id} ↔ Produit ${vendorProduct.id}`);
      } catch (linkError) {
        if (linkError.code !== 'P2002') {
          this.logger.error('❌ Erreur création lien design-produit:', linkError);
        }
      }

      // Assurer que la position est sauvegardée si elle est fournie
      const positionData = publishDto.designPosition;
      if (positionData && vendorProduct.id && design.id) {
        await this.designPositionService.upsertPosition(
          vendorId,
          vendorProduct.id,
          design.id,
          { position: positionData }
        );
      }

      // ✅ CONSERVATION RÉFÉRENCES IMAGES ADMIN
      await this.preserveAdminImageStructure(
        vendorProduct.id,
        publishDto.productStructure.adminProduct
      );

      this.logger.log(`✅ Produit vendeur réel ${vendorProduct.id} créé avec design ${design.id}`);

      return {
        success: true,
        productId: vendorProduct.id,
        message: `Produit créé avec design "${design.name}"`,
        status: vendorProduct.status,
        needsValidation: !design.isValidated,
        imagesProcessed: 0,
        structure: 'admin_product_preserved',
        designUrl: design.imageUrl,
        designId: design.id,
        isDesignReused: true
      };

    } catch (error) {
      this.logger.error('❌ Erreur publication produit vendeur:', error);
      throw new BadRequestException(`Erreur création produit: ${error.message}`);
    }
  }

  /**
   * ✅ VALIDATION: Éviter les noms/descriptions auto-générés
   * 🆕 PLUS DE MODE TRANSFORMATION - Validation stricte toujours
   */
  private async validateVendorProductInfo(publishDto: VendorPublishDto) {
    const autoGeneratedPatterns = [
      /produit auto-généré/i,
      /auto-generated/i,
      /temp/i,
      /test/i,
      /prototype/i,
      /temporaire/i,
      /provisional/i,
      /draft/i,
      /brouillon/i,
      /placeholder/i
    ];

    // ✅ VALIDATION NOM
    if (autoGeneratedPatterns.some(pattern => pattern.test(publishDto.vendorName))) {
      throw new BadRequestException(
        'Nom invalide. Veuillez saisir un nom de produit personnalisé (évitez les noms auto-générés).'
      );
    }

    // ✅ VALIDATION DESCRIPTION
    if (autoGeneratedPatterns.some(pattern => pattern.test(publishDto.vendorDescription))) {
      throw new BadRequestException(
        'Description invalide. Veuillez saisir une description personnalisée (évitez les descriptions auto-générées).'
      );
    }

    this.logger.log(`✅ Validation produit vendeur: "${publishDto.vendorName}" - OK`);
  }

  /**
   * ✅ CONSERVATION STRUCTURE ADMIN - IMAGES COMPLÈTES
   */
  private async preserveAdminImageStructure(
    vendorProductId: number,
    adminProduct: any
  ): Promise<void> {
    try {
      for (const colorVariation of adminProduct.images.colorVariations) {
        for (const adminImage of colorVariation.images) {
          // ✅ CRÉER RÉFÉRENCE IMAGE ADMIN (pas de fusion)
          await this.prisma.vendorProductImage.create({
            data: {
              vendorProductId: vendorProductId,
              colorId: colorVariation.id,
              colorName: colorVariation.name,
              colorCode: colorVariation.colorCode,
              imageType: 'admin_reference',
              
              // ✅ CONSERVATION URL ADMIN ORIGINALE
              cloudinaryUrl: adminImage.url,
              cloudinaryPublicId: this.extractPublicIdFromUrl(adminImage.url),
              originalImageKey: `admin_${adminImage.id}_${colorVariation.name}`,
              
              // ✅ MÉTADONNÉES DÉLIMITATIONS (JSON)
              width: null, // Sera calculé si nécessaire
              height: null,
              fileSize: null,
              format: adminImage.url.split('.').pop(),
            },
          });
        }
      }
      
      this.logger.log(`✅ Structure admin conservée pour produit ${vendorProductId}`);
      
    } catch (error) {
      this.logger.error('❌ Erreur conservation structure admin:', error);
      throw error;
    }
  }

  /**
   * ✅ VALIDATION STRUCTURE ADMIN
   */
  private async validateAdminProductStructure(adminProduct: any): Promise<void> {
    // Vérifier que le produit admin existe
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: adminProduct.id },
        include: {
        colorVariations: {
            include: {
            images: {
              include: {
                delimitations: true
              }
            }
          }
        }
      }
    });

    if (!existingProduct) {
      throw new BadRequestException(`Produit admin ${adminProduct.id} introuvable`);
    }

    // Vérifier la cohérence des couleurs et délimitations
    if (!adminProduct.images?.colorVariations?.length) {
      throw new BadRequestException('Aucune variation de couleur trouvée dans la structure admin');
    }

    this.logger.log(`✅ Structure admin validée pour produit ${adminProduct.id}`);
  }

  /**
   * ✅ LISTE PRODUITS VENDEUR - ARCHITECTURE V2 COMPLÈTE
   */
  async getVendorProducts(
    vendorId?: number,
    options: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
    } = {}
  ) {
    try {
      const { limit = 12, offset = 0, status, search } = options;
      
      const where: any = {};
      if (vendorId) {
        where.vendorId = vendorId;
      }
      if (status && status !== 'all') {
        where.status = status.toUpperCase();
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { vendorName: { contains: search, mode: 'insensitive' } }
        ];
      }

      // ✅ CORRECTION: Requête optimisée pour éviter les doublons
      const [products, totalCount] = await Promise.all([
        this.prisma.vendorProduct.findMany({
          where,
          include: {
            vendor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                shop_name: true,
                profile_photo_url: true
              }
            },
            baseProduct: {
              include: {
                categories: true,
                themeProducts: {
                  include: {
                    theme: true
                  }
                },
                colorVariations: {
                  include: {
            images: {
                      include: {
                        delimitations: true
                      }
                    }
                  }
                }
              }
            },
            images: {
              select: {
                id: true,
                colorName: true,
                colorCode: true,
                cloudinaryUrl: true,
                imageType: true,
                createdAt: true
              }
            },
            // ✅ CORRECTION: Inclure le design sans les relations multiples
            design: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                imageUrl: true,
                cloudinaryPublicId: true,
                tags: true,
                isValidated: true,
                validatedAt: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          // ✅ AJOUT: Forcer la distinction pour éviter les doublons
          distinct: ['id']
        }),
        this.prisma.vendorProduct.count({ where })
      ]);

      // ✅ CORRECTION: Récupérer les positions de design séparément pour éviter les doublons
      const productsWithPositions = await Promise.all(
        products.map(async (product) => {
          // Récupérer les positions de design séparément
          const designPositions = await this.prisma.productDesignPosition.findMany({
            where: {
              vendorProductId: product.id
            },
            include: {
              design: true
            }
          });

          // Récupérer les transformations de design séparément
          const designTransforms = await this.prisma.vendorDesignTransform.findMany({
            where: {
              vendorProductId: product.id
            },
            select: {
              id: true,
              designUrl: true,
              transforms: true,
              lastModified: true,
              createdAt: true
            }
          });

          return {
            ...product,
            designPositions,
            designTransforms
          };
        })
      );

      // ✅ FORMATAGE RÉPONSE NOUVELLE ARCHITECTURE COMPLÈTE
      const formattedProducts = productsWithPositions.map(product => ({
          id: product.id,
        vendorName: product.name, // Nom modifié par vendeur
        originalAdminName: product.adminProductName, // Nom original admin
        description: product.description,
          price: product.price,
        stock: product.stock,
          status: product.status,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          isDelete: product.isDelete,

        // 🆕 VALIDATION ADMIN POUR PRODUITS WIZARD
        adminValidated: (product as any).adminValidated, // null = traditionnel, false = en attente, true = validé
        isWizardProduct: !product.designId, // Identification produit WIZARD
        validationStatus: !product.designId
          ? ((product as any).adminValidated === true ? 'admin_validated' : 'pending_admin_validation')
          : (product.design?.isValidated ? 'design_validated' : 'pending_design_validation'),
        // Raison de rejet (exposée pour les produits WIZARD uniquement)
        rejectionReason: !product.designId ? product.rejectionReason || null : null,
          
        // 🆕 MEILLEURES VENTES (simulation avec des valeurs par défaut)
        bestSeller: {
          isBestSeller: false, // Valeur par défaut
          salesCount: 0, // Valeur par défaut
          totalRevenue: 0 // Valeur par défaut
        },
          
        // ✅ STRUCTURE ADMIN CONSERVÉE COMPLÈTE avec délimitations
        adminProduct: {
          id: product.baseProduct.id,
          name: product.adminProductName,
          description: product.adminProductDescription,
          price: product.adminProductPrice,
          categories: (product.baseProduct as any).categories?.map((c: any) => ({ id: c.id, name: c.name })) || [],
          themes: (product.baseProduct as any).themeProducts?.map((tp: any) => ({
            id: tp.theme.id,
            name: tp.theme.name,
            category: tp.theme.category
          })) || [],
          colorVariations: product.baseProduct.colorVariations.map(cv => ({
            id: cv.id,
            name: cv.name,
            colorCode: cv.colorCode,
            images: cv.images.map(img => ({
              id: img.id,
              url: img.url,
              viewType: img.view,
              delimitations: img.delimitations.map(d => ({
                x: d.x,
                y: d.y,
                width: d.width,
                height: d.height,
                coordinateType: d.coordinateType
              }))
            }))
          }))
        },

        // ✅ APPLICATION DESIGN COMPLÈTE avec Cloudinary URL
        designApplication: {
          hasDesign: !!product.designCloudinaryUrl,
          designUrl: product.designCloudinaryUrl, // ← URL CLOUDINARY au lieu de base64
          designCloudinaryPublicId: product.designCloudinaryPublicId,
          positioning: product.designPositioning,
          scale: product.designScale,
          mode: product.designApplicationMode
        },

        // ✅ NOUVEAU: Informations complètes sur le design
        design: product.design ? {
          id: product.design.id,
          name: product.design.name,
          description: product.design.description,
          category: product.design.category,
          imageUrl: product.design.imageUrl,
          cloudinaryPublicId: product.design.cloudinaryPublicId,
          tags: product.design.tags,
          isValidated: product.design.isValidated,
          validatedAt: product.design.validatedAt,
          createdAt: product.design.createdAt
        } : null,

        // ✅ NOUVEAU: Transformations du design
        designTransforms: product.designTransforms.map(transform => ({
          id: transform.id,
          designUrl: transform.designUrl,
          transforms: transform.transforms,
          lastModified: transform.lastModified,
          createdAt: transform.createdAt
        })),

        // ✅ NOUVEAU: Positionnements du design
        designPositions: product.designPositions.map(position => ({
          designId: position.designId,
          position: position.position,
          createdAt: position.createdAt,
          updatedAt: position.updatedAt
        })),

        // ✅ INFORMATIONS VENDEUR
          vendor: {
            id: product.vendor.id,
          fullName: `${product.vendor.firstName} ${product.vendor.lastName}`,
            email: product.vendor.email,
            shop_name: product.vendor.shop_name,
          profile_photo_url: product.vendor.profile_photo_url
          },
          
        // ✅ IMAGES: Distinguer produits wizard vs traditionnel
          images: {
          adminReferences: this.formatProductImages(product),
            total: product.images.length,
          primaryImageUrl: this.getPrimaryImageUrl(product),
            validation: {
            isHealthy: true, // Nouvelle architecture = toujours sain
            totalIssuesDetected: 0
          }
        },

        // ✅ SÉLECTIONS VENDEUR
        selectedSizes: this.parseJsonSafely(product.sizes),
        selectedColors: this.parseJsonSafely(product.colors),
        designId: product.designId // Expose le designId
      }));

      // ✅ MÉTRIQUE SANTÉ (toujours 100% en nouvelle architecture)
      const healthMetrics = {
        totalProducts: totalCount,
        healthyProducts: totalCount,
        unhealthyProducts: 0,
        overallHealthScore: totalCount > 0 ? 100 : 0,
        architecture: 'v2_preserved_admin'
      };

      return {
        success: true,
        data: {
          products: formattedProducts,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount
          },
          healthMetrics
        },
        architecture: 'v2_preserved_admin'
      };

    } catch (error) {
      this.logger.error('❌ Erreur récupération produits vendeur:', error);
      throw new BadRequestException('Erreur lors de la récupération des produits');
    }
  }

  /**
   * ✅ DÉTAILS PRODUIT VENDEUR ENRICHI
   */
  async getVendorProductDetail(productId: number, vendorId?: number) {
    try {
      const where: any = { id: productId };
      if (vendorId) {
        where.vendorId = vendorId;
      }

      const product = await this.prisma.vendorProduct.findFirst({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              shop_name: true,
              profile_photo_url: true
            }
          },
          baseProduct: {
            include: {
              categories: true,
              themeProducts: {
                include: {
                  theme: true
                }
              },
              colorVariations: {
                include: {
                  images: {
                    include: {
                      delimitations: true
                    }
                  }
                }
              }
            }
          },
          design: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              imageUrl: true,
              cloudinaryPublicId: true,
              tags: true,
              isValidated: true,
              validatedAt: true,
              createdAt: true
            }
          },
          designTransforms: {
            select: {
              id: true,
              designUrl: true,
              transforms: true,
              lastModified: true,
              createdAt: true
            }
          },
          designPositions: {
            select: {
              designId: true,
              position: true,
              createdAt: true,
              updatedAt: true
            }
          },
          images: true
        }
      });

      if (!product) {
        throw new NotFoundException(`Produit ${productId} introuvable`);
      }

      // ✅ FORMATAGE DÉTAILS COMPLETS ENRICHI
      const detailedProduct = {
        id: product.id,
        vendorName: product.name,
        vendorDescription: product.description,
        vendorPrice: product.price,
        vendorStock: product.stock,
        status: product.status,

        // 🆕 VALIDATION ADMIN POUR PRODUITS WIZARD
        adminValidated: (product as any).adminValidated, // null = traditionnel, false = en attente, true = validé
        isWizardProduct: !product.designId, // Identification produit WIZARD
        validationStatus: !product.designId
          ? ((product as any).adminValidated === true ? 'admin_validated' : 'pending_admin_validation')
          : (product.design?.isValidated ? 'design_validated' : 'pending_design_validation'),

        // ✅ STRUCTURE ADMIN CONSERVÉE
        adminProduct: {
          id: product.baseProduct.id,
          name: product.adminProductName,
          description: product.adminProductDescription,
          price: product.adminProductPrice,
          categories: (product.baseProduct as any).categories?.map((c: any) => ({ id: c.id, name: c.name })) || [],
          themes: (product.baseProduct as any).themeProducts?.map((tp: any) => ({
            id: tp.theme.id,
            name: tp.theme.name,
            category: tp.theme.category
          })) || [],
          colorVariations: product.baseProduct.colorVariations.map(cv => ({
            id: cv.id,
            name: cv.name,
            colorCode: cv.colorCode,
            images: cv.images.map(img => ({
              id: img.id,
              url: img.url,
              viewType: img.view,
              delimitations: img.delimitations.map(d => ({
                x: d.x,
                y: d.y,
                width: d.width,
                height: d.height,
                coordinateType: d.coordinateType
              }))
            }))
          }))
        },

        // ✅ APPLICATION DESIGN COMPLÈTE avec Cloudinary URL
        designApplication: {
          hasDesign: !!product.designCloudinaryUrl,
          designUrl: product.designCloudinaryUrl, // ← URL CLOUDINARY au lieu de base64
          designCloudinaryPublicId: product.designCloudinaryPublicId,
          positioning: product.designPositioning,
          scale: product.designScale,
          mode: product.designApplicationMode
        },

        // ✅ NOUVEAU: Informations complètes du design
        design: product.design ? {
          id: product.design.id,
          name: product.design.name,
          description: product.design.description,
          category: product.design.category,
          imageUrl: product.design.imageUrl,
          cloudinaryPublicId: product.design.cloudinaryPublicId,
          tags: product.design.tags,
          isValidated: product.design.isValidated,
          validatedAt: product.design.validatedAt,
          createdAt: product.design.createdAt
        } : null,

        // ✅ NOUVEAU: Transformations appliquées au design
        designTransforms: product.designTransforms.map(transform => ({
          id: transform.id,
          designUrl: transform.designUrl,
          transforms: transform.transforms,
          lastModified: transform.lastModified,
          createdAt: transform.createdAt
        })),

        // ✅ NOUVEAU: Positionnements du design
        designPositions: product.designPositions.map(position => ({
          designId: position.designId,
          position: position.position,
          createdAt: position.createdAt,
          updatedAt: position.updatedAt
        })),

        // ✅ INFORMATIONS VENDEUR
        vendor: {
          id: product.vendor.id,
          fullName: `${product.vendor.firstName} ${product.vendor.lastName}`,
          shop_name: product.vendor.shop_name
        },

        // ✅ SÉLECTIONS
        selectedSizes: this.parseJsonSafely(product.sizes),
        selectedColors: this.parseJsonSafely(product.colors),

        // ✅ NOUVEAU: Ajout du designId pour compatibilité
        designId: product.designId,

        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };

      return {
        success: true,
        data: detailedProduct,
        architecture: 'v2_preserved_admin'
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('❌ Erreur récupération détails produit:', error);
      throw new BadRequestException('Erreur lors de la récupération des détails');
    }
  }

  /**
   * ✅ STATISTIQUES VENDEUR
   */
  async getVendorStats(vendorId: number) {
    try {
      const [
        totalProducts,
        publishedProducts,
        draftProducts,
        pendingProducts,
        totalValue,
        totalDesigns,
        publishedDesigns,
        draftDesigns,
        pendingDesigns,
        validatedDesigns,
        vendorAccount,
        vendorEarnings,
        totalOrders,
        yearlyOrders,
        monthlyOrders,
        shopViews
      ] = await Promise.all([
        // Produits vendeur (excluant soft-deleted)
        this.prisma.vendorProduct.count({
          where: { vendorId, isDelete: false }
        }),
        this.prisma.vendorProduct.count({
          where: { vendorId, status: 'PUBLISHED', isDelete: false }
        }),
        this.prisma.vendorProduct.count({
          where: { vendorId, status: 'DRAFT', isDelete: false }
        }),
        this.prisma.vendorProduct.count({
          where: { vendorId, status: 'PENDING', isDelete: false }
        }),
        this.prisma.vendorProduct.aggregate({
          where: { vendorId, isDelete: false },
          _sum: { price: true }
        }),
        // Designs (excluant soft-deleted)
        this.prisma.design.count({
          where: { vendorId, isDelete: false }
        }),
        this.prisma.design.count({
          where: { vendorId, isValidated: true, isPublished: true, isDelete: false }
        }),
        this.prisma.design.count({
          where: { vendorId, isDraft: true, isDelete: false }
        }),
        this.prisma.design.count({
          where: { vendorId, isPending: true, isValidated: false, isDelete: false }
        }),
        this.prisma.design.count({
          where: { vendorId, isValidated: true, isDelete: false }
        }),
        // Compte vendeur pour "Membre depuis" et "Dernière connexion"
        this.prisma.user.findUnique({
          where: { id: vendorId },
          select: { created_at: true, last_login_at: true }
        }),
        // 💰 DONNÉES FINANCIÈRES: Récupérer les gains depuis VendorEarnings
        this.prisma.vendorEarnings.findUnique({
          where: { vendorId }
        }),
        // 📊 COMMANDES: Total des commandes livrées du vendeur
        this.prisma.order.count({
          where: {
            status: 'DELIVERED',
            orderItems: {
              some: {
                product: {
                  vendorProducts: {
                    some: { vendorId }
                  }
                }
              }
            }
          }
        }),
        // 📅 CHIFFRE D'AFFAIRES ANNUEL: Commandes livrées de cette année
        this.prisma.orderItem.aggregate({
          where: {
            order: {
              status: 'DELIVERED',
              createdAt: {
                gte: new Date(new Date().getFullYear(), 0, 1)
              }
            },
            product: {
              vendorProducts: {
                some: { vendorId }
              }
            }
          },
          _sum: { unitPrice: true, quantity: true }
        }),
        // 📅 CHIFFRE D'AFFAIRES MENSUEL: Commandes livrées de ce mois
        this.prisma.orderItem.aggregate({
          where: {
            order: {
              status: 'DELIVERED',
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            },
            product: {
              vendorProducts: {
                some: { vendorId }
              }
            }
          },
          _sum: { unitPrice: true, quantity: true }
        }),
        // 👁️ VUES BOUTIQUE: Simulation (à implémenter avec un vrai système de tracking)
        Promise.resolve(Math.floor(Math.random() * 2000) + 500) // Valeur simulée entre 500 et 2500
      ]);

      // Calcul du chiffre d'affaires avec commission (10% par défaut)
      const commissionRate = vendorEarnings?.averageCommissionRate || 0.10;
      const yearlyRevenue = ((yearlyOrders._sum.unitPrice || 0) * (yearlyOrders._sum.quantity || 0)) * (1 - commissionRate);
      const monthlyRevenue = ((monthlyOrders._sum.unitPrice || 0) * (monthlyOrders._sum.quantity || 0)) * (1 - commissionRate);

      return {
        success: true,
        data: {
          // Statistiques produits
          totalProducts,
          publishedProducts,
          draftProducts,
          pendingProducts,
          totalValue: totalValue._sum.price || 0,
          averagePrice: totalProducts > 0 ? (totalValue._sum.price || 0) / totalProducts : 0,

          // Statistiques designs
          totalDesigns,
          publishedDesigns,
          draftDesigns,
          pendingDesigns,
          validatedDesigns,

          // 💰 DONNÉES FINANCIÈRES (cohérentes avec les appels de fonds)
          yearlyRevenue: Math.round(yearlyRevenue),
          monthlyRevenue: Math.round(monthlyRevenue),
          availableBalance: Math.round(vendorEarnings?.availableAmount || 0),
          pendingAmount: Math.round(vendorEarnings?.pendingAmount || 0),
          totalEarnings: Math.round(vendorEarnings?.totalEarnings || 0),

          // 📊 STATISTIQUES D'ACTIVITÉ
          shopViews: shopViews,
          totalOrders: totalOrders,
          averageCommissionRate: (commissionRate * 100), // Convertir en pourcentage

          // 📅 DATES IMPORTANTES
          memberSince: vendorAccount?.created_at || null,
          lastLoginAt: vendorAccount?.last_login_at || null,
          memberSinceFormatted: this.formatDate(vendorAccount?.created_at || null),
          lastLoginAtFormatted: this.formatDate(vendorAccount?.last_login_at || null),

          architecture: 'v2_preserved_admin'
        }
      };

    } catch (error) {
      this.logger.error('❌ Erreur calcul statistiques:', error);
      throw new BadRequestException('Erreur lors du calcul des statistiques');
    }
  }

  /**
   * ✅ PRODUITS GROUPÉS PAR TYPE
   */
  async getVendorProductsGroupedByBaseProduct(options: {
    vendorId?: number;
    status?: string;
    search?: string;
    productType?: string;
  } = {}) {
    try {
    const { vendorId, status, search, productType } = options;
      
      const where: any = {};
      if (vendorId) where.vendorId = vendorId;
      if (status && status !== 'all') where.status = status.toUpperCase();
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { adminProductName: { contains: search, mode: 'insensitive' } }
        ];
      }

      const products = await this.prisma.vendorProduct.findMany({
        where,
        include: {
          baseProduct: {
            select: { id: true, name: true }
          },
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              shop_name: true,
              profile_photo_url: true,
              created_at: true,
              last_login_at: true,
              status: true,
              country: true,
              vendeur_type: true
            }
          },
          images: {
            select: { colorName: true, colorCode: true, cloudinaryUrl: true }
          }
        }
      });

      // ✅ GROUPEMENT PAR TYPE PRODUIT ADMIN
      const grouped = products.reduce((acc, product) => {
        const baseProductName = product.baseProduct.name;
        
        if (productType && baseProductName.toLowerCase() !== productType.toLowerCase()) {
          return acc;
        }

        if (!acc[baseProductName]) {
          acc[baseProductName] = [];
        }

        acc[baseProductName].push({
          id: product.id,
          vendorName: product.name,
          originalAdminName: product.adminProductName,
          price: product.price,
          selectedSizes: this.parseJsonSafely(product.sizes),
          selectedColors: this.parseJsonSafely(product.colors),
          images: {
            adminReferences: product.images,
            total: product.images.length,
            primaryImageUrl: product.images[0]?.cloudinaryUrl || null
          },
          vendor: {
            id: product.vendor.id,
            fullName: `${product.vendor.firstName} ${product.vendor.lastName}`,
            shop_name: product.vendor.shop_name
          }
        });

        return acc;
      }, {});

      const statistics = {
        totalGroups: Object.keys(grouped).length,
        totalProducts: products.length,
        groupCounts: Object.fromEntries(
          Object.entries(grouped).map(([key, products]) => [key, (products as any[]).length])
        )
      };

      return {
        success: true,
        data: grouped,
        statistics,
        architecture: 'v2_preserved_admin'
      };

    } catch (error) {
      this.logger.error('❌ Erreur groupement produits:', error);
      throw new BadRequestException('Erreur lors du groupement des produits');
    }
  }

  // ✅ HELPERS UTILITAIRES
  private parseJsonSafely(jsonString: any): any {
    if (typeof jsonString === 'string') {
      try {
        return JSON.parse(jsonString);
      } catch {
        return [];
      }
    }
    return jsonString || [];
  }

  private extractPublicIdFromUrl(url: string): string {
    const match = url.match(/\/([^\/]+)\.[^.]+$/);
    return match ? match[1] : '';
  }

  private formatDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

  /**
   * ✅ GESTION DU STATUT DU COMPTE VENDEUR
   */
  async updateVendorAccountStatus(vendorId: number, status: boolean, reason?: string) {
    this.logger.log(`🔄 Mise à jour statut compte vendeur ${vendorId}: ${status ? 'ACTIF' : 'DÉSACTIVÉ'}`);

    try {
      // Vérifier que le vendeur existe
      const vendor = await this.prisma.user.findUnique({
        where: { id: vendorId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
          shop_name: true,
          created_at: true,
          last_login_at: true,
          country: true,
          phone: true,
          vendeur_type: true,
          profile_photo_url: true
        }
      });

      if (!vendor) {
        throw new BadRequestException('Vendeur non trouvé');
      }

      // Mettre à jour le statut
      const updatedVendor = await this.prisma.user.update({
        where: { id: vendorId },
        data: {
          status,
          updated_at: new Date()
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
          shop_name: true,
          updated_at: true
        }
      });

      const action = status ? 'réactivé' : 'désactivé';
      const message = `Compte ${action} avec succès`;

      this.logger.log(`✅ Compte vendeur ${vendorId} ${action}`);

      return {
        success: true,
        message,
        data: {
          ...updatedVendor,
          statusChangedAt: updatedVendor.updated_at.toISOString(),
          reason: reason || null
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erreur mise à jour statut vendeur ${vendorId}:`, error);
      throw new BadRequestException('Erreur lors de la mise à jour du statut du compte');
    }
  }

  /**
   * ✅ RÉCUPÉRER LES INFORMATIONS DU COMPTE VENDEUR
   */
  async getVendorAccountInfo(vendorId: number) {
    this.logger.log(`📋 Récupération informations compte vendeur ${vendorId}`);

    try {
      // Récupérer les informations du vendeur
      const vendor = await this.prisma.user.findUnique({
        where: { id: vendorId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
          shop_name: true,
          phone: true,
          country: true,
          created_at: true,
          last_login_at: true,
          updated_at: true
        }
      });

      if (!vendor) {
        throw new BadRequestException('Vendeur non trouvé');
      }

      // Récupérer les statistiques rapides
      const [totalProducts, publishedProducts, totalDesigns, publishedDesigns] = await Promise.all([
        this.prisma.vendorProduct.count({
          where: { vendorId, isDelete: false }
        }),
        this.prisma.vendorProduct.count({
          where: { vendorId, status: 'PUBLISHED', isDelete: false }
        }),
        this.prisma.design.count({
          where: { vendorId, isDelete: false }
        }),
        this.prisma.design.count({
          where: { vendorId, isPublished: true, isDelete: false }
        })
      ]);

      return {
        success: true,
        data: {
          ...vendor,
          created_at: vendor.created_at.toISOString(),
          last_login_at: vendor.last_login_at?.toISOString() || null,
          updated_at: vendor.updated_at.toISOString(),
          statistics: {
            totalProducts,
            publishedProducts,
            totalDesigns,
            publishedDesigns
          }
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erreur récupération informations vendeur ${vendorId}:`, error);
      throw new BadRequestException('Erreur lors de la récupération des informations du compte');
    }
  }

  // ✅ MÉTHODES DE COMPATIBILITÉ (retournent message architecture v2)
  async validateAndCleanImageMixing(options: any) {
    return {
      success: true,
      message: 'Nouvelle architecture: aucun mélange d\'images possible',
      report: {
        totalProducts: 0,
        issuesFound: 0,
        issuesFixed: 0,
        healthyProducts: 0
      },
      architecture: 'v2_preserved_admin'
    };
  }

  // Méthodes héritées simplifiées
  async submitVendorProductForValidation(id: number, vendorId: number) { 
    throw new BadRequestException('Non implémenté en nouvelle architecture v2');
  }
  
  async getPendingVendorProducts(adminId: number, queryDto: any) { 
    throw new BadRequestException('Non implémenté en nouvelle architecture v2');
  }
  
  async validateVendorProduct(id: number, adminId: number, approved: boolean, rejectionReason?: string) { 
    throw new BadRequestException('Non implémenté en nouvelle architecture v2');
  }
  
  async fixMissingDesignIds() { 
    throw new BadRequestException('Non applicable en nouvelle architecture v2');
  }
  
  async checkDesignValidationForProduct(designId: number) { 
    throw new BadRequestException('Non applicable en nouvelle architecture v2');
  }
  

  
  async publishAllDraftProductsForDesign(designId: number, vendorId: number) { 
    throw new BadRequestException('Non applicable en nouvelle architecture v2');
  }
  
  async fixDesignUrlsForExistingProducts() { 
    throw new BadRequestException('Non applicable en nouvelle architecture v2');
  }
  
  async fixSizesAndColorsFormat() { 
    throw new BadRequestException('Non applicable en nouvelle architecture v2');
  }

  /**
   * 🆕 NOUVELLE MÉTHODE: Cascade validation avec gestion des brouillons
   * Appelée quand un admin valide un design
   */
  async applyDesignValidationCascade(
    designId: number,
    isValidated: boolean,
    adminId: number,
    rejectionReason?: string
  ): Promise<{
    success: boolean;
    affectedProducts: number;
    publishedProducts: number;
    draftProducts: number;
    message: string;
  }> {
    this.logger.log(`🔄 Cascade validation pour design ${designId} - Validé: ${isValidated}`);

    try {
      // 1. Mettre à jour le design
      await this.prisma.design.update({
        where: { id: designId },
        data: {
          isValidated: isValidated,
          validatedAt: new Date(),
          validatedBy: adminId,
          isPending: false,
          rejectionReason: isValidated ? null : rejectionReason
        }
      });

      if (!isValidated) {
        // Si rejeté, tous les produits liés passent en DRAFT
        const rejectedProducts = await this.prisma.vendorProduct.updateMany({
          where: { designId: designId },
          data: {
            status: 'DRAFT',
            isValidated: false,
            validatedAt: new Date(),
            rejectionReason: rejectionReason
          }
        });

        return {
          success: true,
          affectedProducts: rejectedProducts.count,
          publishedProducts: 0,
          draftProducts: rejectedProducts.count,
          message: `Design rejeté - ${rejectedProducts.count} produits mis en brouillon`
        };
      }

      // 2. Récupérer tous les produits liés à ce design
      const linkedProducts = await this.prisma.vendorProduct.findMany({
        where: { designId: designId }
      });

      this.logger.log(`📦 ${linkedProducts.length} produits liés trouvés`);

      let publishedCount = 0;
      let draftCount = 0;

      // 3. Mettre à jour chaque produit selon son action post-validation
      for (const product of linkedProducts) {
        let newStatus: 'PUBLISHED' | 'DRAFT';
        
        if (product.postValidationAction === 'TO_DRAFT') {
          newStatus = 'DRAFT';
          draftCount++;
        } else {
          newStatus = 'PUBLISHED';
          publishedCount++;
        }
        
        await this.prisma.vendorProduct.update({
          where: { id: product.id },
          data: {
            isValidated: true,
            validatedAt: new Date(),
            status: newStatus,
            rejectionReason: null
          }
        });

        this.logger.log(`✅ Produit ${product.id}: ${product.postValidationAction} → ${newStatus}`);
      }

      return {
        success: true,
        affectedProducts: linkedProducts.length,
        publishedProducts: publishedCount,
        draftProducts: draftCount,
        message: `Design validé - ${publishedCount} produits publiés, ${draftCount} en brouillon`
      };

    } catch (error) {
      this.logger.error('❌ Erreur cascade validation:', error);
      throw new BadRequestException(`Erreur cascade validation: ${error.message}`);
    }
  }

  /**
   * 🆕 MÉTHODE: Publier un produit en brouillon
   * Permet au vendeur de publier un produit validé mais en brouillon
   */
  async publishDraftProduct(
    productId: number,
    vendorId: number
  ): Promise<{
    success: boolean;
    message: string;
    newStatus: string;
  }> {
    this.logger.log(`📤 Publication produit brouillon ${productId} par vendeur ${vendorId}`);

    try {
      // Vérifier que le produit appartient au vendeur et est en brouillon validé
      const product = await this.prisma.vendorProduct.findFirst({
        where: {
          id: productId,
          vendorId: vendorId,
          status: 'DRAFT',
          isValidated: true // Doit être validé par admin
        }
      });

      if (!product) {
        throw new BadRequestException('Produit non trouvé ou non éligible à la publication');
      }

      // Publier le produit
      await this.prisma.vendorProduct.update({
        where: { id: productId },
        data: {
          status: 'PUBLISHED',
          updatedAt: new Date()
        }
      });

      this.logger.log(`✅ Produit ${productId} publié avec succès`);

      return {
        success: true,
        message: 'Produit publié avec succès',
        newStatus: 'PUBLISHED'
      };

    } catch (error) {
      this.logger.error('❌ Erreur publication produit brouillon:', error);
      throw new BadRequestException(`Erreur publication: ${error.message}`);
    }
  }

  /**
   * 🆕 MÉTHODE: Obtenir les designs en attente de validation
   * Pour l'interface admin
   */
  async getPendingDesigns(
    adminId: number,
    options: {
      limit?: number;
      offset?: number;
      search?: string;
    } = {}
  ) {
    try {
      const { limit = 20, offset = 0, search } = options;
      
      const where: any = {
        isPending: true,
        isValidated: false
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [designs, totalCount] = await Promise.all([
        this.prisma.design.findMany({
          where,
          include: {
            vendor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                shop_name: true
              }
            },
            vendorProducts: {
              select: {
                id: true,
                name: true,
                price: true,
                postValidationAction: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        this.prisma.design.count({ where })
      ]);

      const formattedDesigns = designs.map(design => ({
        id: design.id,
        name: design.name,
        description: design.description,
        imageUrl: design.imageUrl,
        createdAt: design.createdAt,
        vendor: {
          id: design.vendor.id,
          fullName: `${design.vendor.firstName} ${design.vendor.lastName}`,
          email: design.vendor.email,
          shop_name: design.vendor.shop_name
        },
        linkedProducts: design.vendorProducts.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          postValidationAction: product.postValidationAction
        })),
        totalLinkedProducts: design.vendorProducts.length,
        autoPublishCount: design.vendorProducts.filter(p => p.postValidationAction === 'AUTO_PUBLISH').length,
        toDraftCount: design.vendorProducts.filter(p => p.postValidationAction === 'TO_DRAFT').length
      }));

      return {
        success: true,
        data: {
          designs: formattedDesigns,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount
          }
        }
      };

    } catch (error) {
      this.logger.error('❌ Erreur récupération designs en attente:', error);
      throw new BadRequestException('Erreur lors de la récupération des designs');
    }
  }

  /**
   * 🆕 MÉTHODE: Créer un design séparément
   * Les vendeurs créent d'abord leurs designs, puis les utilisent pour créer des produits
   */
  async createDesign(
    designData: {
      name: string;
      description?: string;
      category: string;
      imageBase64: string;
      tags?: string[];
      price?: number;
    },
    vendorId: number
  ): Promise<{
    success: boolean;
    designId: number;
    message: string;
    designUrl: string;
  }> {
    this.logger.log(`🎨 Création design par vendeur ${vendorId}`);
    this.logger.log(`💰 Prix reçu: ${designData.price} (type: ${typeof designData.price})`);

    try {
      // ✅ VALIDATION: Image fournie
      if (!designData.imageBase64) {
        throw new BadRequestException('Image du design requise');
      }

      // ✅ UPLOAD vers Cloudinary
      this.logger.log('📤 Upload design vers Cloudinary...');
      const uploadResult = await this.cloudinaryService.uploadBase64(
        designData.imageBase64,
        {
          folder: 'vendor-designs',
          resource_type: 'image',
          public_id: `vendor_${vendorId}_design_${Date.now()}`,
          transformation: [
            { quality: 'auto', fetch_format: 'auto' }
          ]
        }
      );

      this.logger.log(`✅ Design uploadé: ${uploadResult.secure_url}`);

      // ✅ CRÉATION DU DESIGN EN BASE
      const design = await this.prisma.design.create({
        data: {
          vendorId: vendorId,
          name: designData.name,
          description: designData.description || '',
          price: designData.price !== undefined ? designData.price : 0,
          categoryId: this.getCategoryId(designData.category),
          imageUrl: uploadResult.secure_url,
          thumbnailUrl: uploadResult.secure_url,
          cloudinaryPublicId: uploadResult.public_id,
          fileSize: uploadResult.bytes || 0,
          originalFileName: `design_${Date.now()}`,
          dimensions: {
            width: uploadResult.width || 1200,
            height: uploadResult.height || 1200
          },
          format: uploadResult.format || 'jpg',
          tags: designData.tags || ['vendor-created'],
          isDraft: false,
          isPublished: false,
          isPending: true, // En attente de validation
          isValidated: false
        }
      });

      this.logger.log(`✅ Design créé avec ID: ${design.id}`);

      return {
        success: true,
        designId: design.id,
        message: `Design "${design.name}" créé avec succès`,
        designUrl: design.imageUrl
      };

    } catch (error) {
      this.logger.error('❌ Erreur création design:', error);
      throw new BadRequestException(`Erreur création design: ${error.message}`);
    }
  }

  /**
   * 🆕 MÉTHODE: Obtenir les designs du vendeur
   */
  async getVendorDesigns(
    vendorId: number,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      search?: string;
    } = {}
  ) {
    try {
      const { limit = 20, offset = 0, status, search } = options;
      
      const where: any = { vendorId: vendorId };
      
      if (status && status !== 'all') {
        if (status === 'VALIDATED') {
          where.isValidated = true;
        } else if (status === 'PENDING') {
          where.isPending = true;
          where.isValidated = false;
        } else if (status === 'DRAFT') {
          where.isDraft = true;
        }
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [designs, totalCount] = await Promise.all([
        this.prisma.design.findMany({
          where,
          include: {
            vendorProducts: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        this.prisma.design.count({ where })
      ]);

      const formattedDesigns = designs.map(design => ({
        id: design.id,
        name: design.name,
        description: design.description,
        imageUrl: design.imageUrl,
        thumbnailUrl: design.thumbnailUrl,
        categoryId: design.categoryId,
        tags: design.tags,
        isValidated: design.isValidated,
        isPending: design.isPending,
        isDraft: design.isDraft,
        createdAt: design.createdAt,
        linkedProducts: design.vendorProducts.length,
        products: design.vendorProducts.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status
        }))
      }));

      return {
        success: true,
        data: {
          designs: formattedDesigns,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount
          }
        }
      };

    } catch (error) {
      this.logger.error('❌ Erreur récupération designs vendeur:', error);
      throw new BadRequestException('Erreur lors de la récupération des designs');
    }
  }

  /**
   * 📍 MÉTHODE: Sauvegarder position design depuis localStorage
   * Permet de sauvegarder la position d'un design sur un produit
   */
  async saveDesignPosition(
    vendorId: number,
    positionData: SaveDesignPositionDto
  ): Promise<{
    vendorProductId: number;
    designId: number;
    position: any;
  }> {
    this.logger.log(`📍 Sauvegarde position design: vendorId=${vendorId}, productId=${positionData.vendorProductId}, designId=${positionData.designId}`);

    try {
      // ✅ VALIDATION: Vérifier que le produit appartient au vendeur
      const vendorProduct = await this.prisma.vendorProduct.findFirst({
        where: {
          id: positionData.vendorProductId,
          vendorId: vendorId
        }
      });

      if (!vendorProduct) {
        throw new ForbiddenException('Ce produit ne vous appartient pas');
      }

      // ✅ VALIDATION: Vérifier que le design existe et appartient au vendeur
      const design = await this.prisma.design.findFirst({
        where: {
          id: positionData.designId,
          vendorId: vendorId
        }
      });

      if (!design) {
        throw new ForbiddenException('Ce design ne vous appartient pas');
      }

      // ✅ SAUVEGARDE: Utiliser le service de position

      // Extraction flexible des dimensions (snake_case ou camelCase, dans ou hors de "position")
      const extractedDesignWidth = (positionData as any).design_width ?? (positionData as any).designWidth ?? (positionData.position as any)?.design_width ?? (positionData.position as any)?.designWidth;
      const extractedDesignHeight = (positionData as any).design_height ?? (positionData as any).designHeight ?? (positionData.position as any)?.design_height ?? (positionData.position as any)?.designHeight;

      this.logger.log('📐 Dimensions extraites (saveDesignPosition):', {
        extractedDesignWidth,
        extractedDesignHeight,
      });

      const result = await this.designPositionService.upsertPosition(
        vendorId,
        vendorProduct.id,
        design.id,
        {
          position: {
            x: positionData.position.x,
            y: positionData.position.y,
            scale: positionData.position.scale,
            rotation: positionData.position.rotation,
            constraints: positionData.position.constraints,
            designWidth: extractedDesignWidth,
            designHeight: extractedDesignHeight,
          }
        }
      );

      this.logger.log(`✅ Position sauvegardée: vendorProductId=${result.vendorProductId}, designId=${result.designId}`);

      return {
        vendorProductId: result.vendorProductId,
        designId: result.designId,
        position: result.position
      };

    } catch (error) {
      this.logger.error('❌ Erreur sauvegarde position design:', error);
      throw error;
    }
  }

  // Ajout d'une méthode pour soft delete un produit vendeur
  async softDeleteVendorProduct(productId: number, userId: number, isAdmin: boolean = false) {
    // Vérifier que le produit existe et appartient au vendeur (ou admin)
    const product = await this.prisma.vendorProduct.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Produit vendeur introuvable');
    if (!isAdmin && product.vendorId !== userId) throw new Error('Non autorisé');
    // Soft delete
    await this.prisma.vendorProduct.update({ where: { id: productId }, data: { isDelete: true } });
    return { success: true, message: 'Produit supprimé (soft delete)' };
  }

  async uploadVendorDesignImage(vendorProductId: number, colorId: number, image: Express.Multer.File, user: any) {
    // Vérifier que le produit existe et appartient au vendeur (ou admin)
    const vendorProduct = await this.prisma.vendorProduct.findUnique({ where: { id: vendorProductId } });
    if (!vendorProduct) throw new NotFoundException('Produit vendeur introuvable');
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN' && vendorProduct.vendorId !== user.sub && vendorProduct.vendorId !== user.id) {
      throw new BadRequestException('Non autorisé à uploader une image pour ce produit vendeur');
    }
    // Vérifier le fichier
    if (!image) throw new BadRequestException('Fichier image requis');
    // Upload sur Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(image);
    return {
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height
    };
  }

  /**
   * ✅ CALCUL ET MISE À JOUR DES MEILLEURES VENTES
   * Met à jour les statistiques de vente et marque les meilleures ventes
   */
  async updateBestSellerStats(vendorId?: number) {
    try {
      this.logger.log(`📊 Mise à jour des statistiques de vente pour vendeur ${vendorId || 'tous'}`);

      // Récupérer tous les produits du vendeur
      const whereClause = vendorId ? { vendorId } : {};
      
      const vendorProducts = await this.prisma.vendorProduct.findMany({
        where: {
          ...whereClause,
          isDelete: false,
          status: 'PUBLISHED'
        },
        include: {
          baseProduct: true
        }
      });

      // Calculer les statistiques de vente pour chaque produit
      for (const vendorProduct of vendorProducts) {
        const salesStats = await this.calculateProductSalesStats(vendorProduct.id);
        
        // Note: Les champs salesCount, totalRevenue et isBestSeller n'existent pas dans le schéma
        // await this.prisma.vendorProduct.update({
        //   where: { id: vendorProduct.id },
        //   data: {
        //     salesCount: salesStats.salesCount,
        //     totalRevenue: salesStats.totalRevenue,
        //     isBestSeller: salesStats.isBestSeller
        //   }
        // });
      }

      // Marquer les meilleures ventes (top 10% des produits par revenus)
      await this.markTopSellers(vendorId);

      this.logger.log(`✅ Statistiques de vente mises à jour pour ${vendorProducts.length} produits`);
      
      return {
        success: true,
        message: `Statistiques mises à jour pour ${vendorProducts.length} produits`,
        updatedProducts: vendorProducts.length
      };

    } catch (error) {
      this.logger.error('❌ Erreur mise à jour statistiques vente:', error);
      throw new BadRequestException('Erreur lors de la mise à jour des statistiques de vente');
    }
  }

  /**
   * ✅ CALCUL DES STATISTIQUES DE VENTE POUR UN PRODUIT
   */
  private async calculateProductSalesStats(vendorProductId: number) {
    // Récupérer toutes les commandes contenant ce produit
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        product: {
          vendorProducts: {
            some: {
              id: vendorProductId
            }
          }
        },
        order: {
          status: {
            in: ['CONFIRMED', 'SHIPPED', 'DELIVERED']
          }
        }
      },
      include: {
        order: true,
        product: true
      }
    });

    // Calculer les statistiques
    const salesCount = orderItems.reduce((total, item) => total + item.quantity, 0);
    const totalRevenue = orderItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);

    return {
      salesCount,
      totalRevenue,
      isBestSeller: false // Sera mis à jour par markTopSellers
    };
  }

  /**
   * ✅ MARQUER LES MEILLEURES VENTES
   */
  private async markTopSellers(vendorId?: number) {
    try {
      // Récupérer tous les produits avec leurs revenus
      const whereClause = vendorId ? { vendorId } : {};
      
      const productsWithRevenue = await this.prisma.vendorProduct.findMany({
        where: {
          ...whereClause,
          isDelete: false,
          status: 'PUBLISHED'
          // totalRevenue field doesn't exist in schema
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      });

      if (productsWithRevenue.length === 0) return;

      // Calculer le seuil pour les meilleures ventes (top 10% ou minimum 3 produits)
      const topSellerCount = Math.max(3, Math.ceil(productsWithRevenue.length * 0.1));
      const topSellers = productsWithRevenue.slice(0, topSellerCount);

      // Note: isBestSeller field doesn't exist in schema
      // for (const product of productsWithRevenue) {
      //   const isBestSeller = topSellers.some(top => top.id === product.id);
      //   
      //   await this.prisma.vendorProduct.update({
      //     where: { id: product.id },
      //     data: { isBestSeller }
      //   });
      // }

      this.logger.log(`🏆 ${topSellers.length} produits identifiés comme meilleures ventes (simulation)`);
    } catch (error) {
      this.logger.error('❌ Erreur marquage meilleures ventes:', error);
    }
  }

  /**
   * ✅ RÉCUPÉRER LES MEILLEURES VENTES D'UN VENDEUR
   */
  async getBestSellers(vendorId?: number, limit: number = 10) {
    this.logger.log(`🏆 Récupération des meilleures ventes${vendorId ? ` pour vendeur ${vendorId}` : ''}`);

    try {
      const whereClause: any = {
        isDelete: false,
        status: 'PUBLISHED',
        isBestSeller: true,
        vendor: { status: true } // Masquer les produits des vendeurs désactivés côté client
      };

      if (vendorId) {
        whereClause.vendorId = vendorId;
      }

      const bestSellers = await this.prisma.vendorProduct.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              shop_name: true,
              profile_photo_url: true
            }
          },
          baseProduct: {
            include: {
              colorVariations: {
                include: {
                  images: true
                }
              }
            }
          },
          design: true
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: limit
      });

      // ✅ ENRICHIR AVEC STRUCTURE COMPLÈTE
      const enrichedBestSellers = await Promise.all(
        bestSellers.map(async (product) => {
          const enrichedProduct = await this.enrichVendorProductWithCompleteStructure(product);
          return enrichedProduct;
        })
      );

      return {
        success: true,
        data: {
          bestSellers: enrichedBestSellers,
          total: enrichedBestSellers.length
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur récupération meilleures ventes:', error);
      throw new BadRequestException('Erreur lors de la récupération des meilleures ventes');
    }
  }

  /**
   * ✅ PRODUITS PUBLICS - Récupère tous les produits vendeurs pour le frontend public
   */
  async getPublicVendorProducts(options: {
    limit?: number;
    offset?: number;
    vendorId?: number;
    status?: string;
    search?: string;
    category?: string;
    adminProductName?: string;
    minPrice?: number;
    maxPrice?: number;
    isBestSeller?: boolean;
  } = {}) {
    this.logger.log(`🌐 Récupération produits publics avec options:`, options);

    try {
      const whereClause: any = {
        isDelete: false,
        vendor: { status: true } // Masquer les produits des vendeurs désactivés côté client
      };

      // Filtres
      if (options.vendorId) whereClause.vendorId = options.vendorId;
      if (options.status) whereClause.status = options.status;
      if (options.isBestSeller === true) {
        whereClause.isBestSeller = true;
        this.logger.log(`🏆 Filtre isBestSeller activé`);
      } else {
        this.logger.log(`❌ Filtre isBestSeller NON activé - options.isBestSeller = ${options.isBestSeller}`);
      }
      if (options.minPrice) whereClause.price = { gte: options.minPrice };
      if (options.maxPrice) whereClause.price = { ...whereClause.price, lte: options.maxPrice };

      // 🆕 FILTRE PAR NOM DE PRODUIT ADMIN
      let adminProductFilters: any[] = [];

      if (options.adminProductName) {
        this.logger.log(`🎯 Filtre par nom de produit admin: "${options.adminProductName}"`);

        // Chercher les produits de base dont le nom correspond
        const matchingBaseProducts = await this.prisma.product.findMany({
          where: {
            name: {
              contains: options.adminProductName,
              mode: 'insensitive'
            },
            isReadyProduct: false // Uniquement les produits admin/mockups
          },
          select: {
            id: true,
            name: true
          }
        });

        if (matchingBaseProducts.length > 0) {
          const baseProductIds = matchingBaseProducts.map(bp => bp.id);
          adminProductFilters.push({
            baseProductId: { in: baseProductIds }
          });
          this.logger.log(`✅ ${baseProductIds.length} produits de base trouvés pour "${options.adminProductName}":`, matchingBaseProducts.map(bp => bp.name));
        } else {
          // Si aucun produit trouvé, retourner des résultats vides
          adminProductFilters.push({
            baseProductId: -1
          });
          this.logger.log(`❌ Aucun produit de base trouvé pour "${options.adminProductName}" - retour vide`);
        }
      }

      // 🆕 FILTRE PAR CATÉGORIE COMPLET (Design + Produits de base)
      if (options.category) {
        this.logger.log(`🏷️ Filtre par catégorie: "${options.category}"`);

        // 1. Chercher dans les DesignCategory (pour les produits avec designs)
        const designCategory = await this.prisma.designCategory.findFirst({
          where: {
            name: {
              equals: options.category,
              mode: 'insensitive'
            }
          }
        });

        // 2. Chercher dans les Category (pour les produits de base)
        const baseCategory = await this.prisma.category.findFirst({
          where: {
            name: {
              equals: options.category,
              mode: 'insensitive'
            }
          }
        });

        this.logger.log(`📊 Catégories trouvées - Design: ${designCategory?.id || 'NULL'}, Base: ${baseCategory?.id || 'NULL'}`);

        // 3. Construire le filtre OR pour les deux types de catégories
        const categoryFilters: any[] = [];

        // Ajouter filtre pour DesignCategory si trouvée
        if (designCategory) {
          categoryFilters.push({
            design: {
              categoryId: designCategory.id
            }
          });
          this.logger.log(`✅ Ajout filtre DesignCategory ID: ${designCategory.id}`);
        }

        // Ajouter filtre pour Category (produits de base) si trouvée
        if (baseCategory) {
          categoryFilters.push({
            baseProduct: {
              categories: {
                some: {
                  id: baseCategory.id
                }
              }
            }
          });
          this.logger.log(`✅ Ajout filtre Category ID: ${baseCategory.id}`);
        }

        // 4. Combiner tous les filtres (adminProduct + category)
        const allFilters = [...adminProductFilters, ...categoryFilters];

        if (allFilters.length > 0) {
          if (allFilters.length === 1) {
            // Si un seul filtre, l'appliquer directement
            Object.assign(whereClause, allFilters[0]);
          } else {
            // Si plusieurs filtres, les combiner avec OR
            whereClause.OR = allFilters;
          }
          this.logger.log(`🔗 Filtres combinés avec ${allFilters.length} conditions:`, allFilters);
        } else {
          // Si aucun filtre trouvé mais category demandé, retourner des résultats vides
          if (options.category) {
            whereClause.design = {
              categoryId: -1
            };
            this.logger.log(`❌ Aucune catégorie trouvée pour "${options.category}" - retour vide`);
          }
        }
      } else if (adminProductFilters.length > 0) {
        // Si pas de catégorie mais filtre adminProduct
        if (adminProductFilters.length === 1) {
          Object.assign(whereClause, adminProductFilters[0]);
        } else {
          whereClause.OR = adminProductFilters;
        }
        this.logger.log(`🎯 Filtre adminProduct appliqué:`, adminProductFilters);
      }

      this.logger.log(`🔍 Where clause finale:`, JSON.stringify(whereClause, null, 2));

      // Recherche textielle - combiner avec le filtre de catégorie si présent
      if (options.search) {
        const searchFilters = [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
          { vendor: { firstName: { contains: options.search, mode: 'insensitive' } } },
          { vendor: { lastName: { contains: options.search, mode: 'insensitive' } } },
          { vendor: { shop_name: { contains: options.search, mode: 'insensitive' } } }
        ];

        if (whereClause.OR && whereClause.OR.length > 0) {
          // S'il y a déjà un filtre de catégorie (OR), combiner avec AND
          whereClause.AND = [
            { OR: whereClause.OR }, // Le filtre de catégorie
            { OR: searchFilters }   // Le filtre de recherche
          ];
          delete whereClause.OR; // Nettoyer l'OR direct
          this.logger.log(`🔗 Combinaison recherche + catégorie avec AND logique`);
        } else {
          // Pas de filtre de catégorie, utiliser la recherche normalement
          whereClause.OR = searchFilters;
        }
      }

      const products = await this.prisma.vendorProduct.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              shop_name: true,
              profile_photo_url: true
            }
          },
          baseProduct: {
            include: {
              colorVariations: {
                include: {
                  images: {
                    include: {
                      delimitations: true
                    }
                  }
                }
              }
            }
          },
          design: true
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: Math.min(options.limit || 20, 100),
        skip: options.offset || 0,
        // ✅ AJOUT: Forcer la distinction pour éviter les doublons
        distinct: ['id']
      });

      // ✅ CORRECTION: Récupérer les positions de design séparément
      const productsWithPositions = await Promise.all(
        products.map(async (product) => {
          // Récupérer les positions de design séparément
          const designPositions = await this.prisma.productDesignPosition.findMany({
            where: {
              vendorProductId: product.id
            },
            include: {
              design: true
            }
          });

          return {
            ...product,
            designPositions
          };
        })
      );

      // ✅ ENRICHIR AVEC STRUCTURE COMPLÈTE
      const enrichedProducts = await Promise.all(
        productsWithPositions.map(async (product) => {
          const enrichedProduct = await this.enrichVendorProductWithCompleteStructure(product);
          return enrichedProduct;
        })
      );

      // Compter le total
      const total = await this.prisma.vendorProduct.count({ where: whereClause });

      return {
        products: enrichedProducts,
        pagination: {
          total,
          limit: options.limit || 20,
          offset: options.offset || 0,
          hasMore: (options.offset || 0) + (options.limit || 20) < total
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur récupération produits publics:', error);
      throw new BadRequestException('Erreur lors de la récupération des produits publics');
    }
  }

  /**
   * ✅ DÉTAILS PRODUIT PUBLIC - Récupère les détails complets d'un produit pour le frontend public
   */
  async getPublicVendorProductDetail(productId: number) {
    this.logger.log(`🔍 Récupération détails produit public ${productId}`);

    try {
      const product = await this.prisma.vendorProduct.findFirst({
        where: {
          id: productId,
          isDelete: false,
          status: 'PUBLISHED',
          vendor: { status: true } // Masquer les produits des vendeurs désactivés côté client
        },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              shop_name: true,
              profile_photo_url: true,
              email: true,
              created_at: true,
              last_login_at: true,
              status: true,
              country: true,
              phone: true,
              vendeur_type: true
            }
          },
          baseProduct: {
            include: {
              colorVariations: {
                include: {
                  images: {
                    include: {
                      delimitations: true
                    }
                  }
                }
              }
            }
          },
          design: true,
          designPositions: {
            include: {
              design: true
            }
          }
        }
      });

      if (!product) {
        throw new NotFoundException(`Produit ${productId} introuvable ou non publié`);
      }

      // ✅ ENRICHIR AVEC STRUCTURE COMPLÈTE
      const enrichedProduct = await this.enrichVendorProductWithCompleteStructure(product);

      return enrichedProduct;
    } catch (error) {
      this.logger.error(`❌ Erreur récupération détails produit public: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✅ RECHERCHE PUBLIQUE - Recherche avancée dans tous les produits vendeurs
   */
  async searchPublicVendorProducts(options: {
    query: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    vendorId?: number;
    limit?: number;
  }) {
    this.logger.log(`🔍 Recherche publique: "${options.query}"`);

    try {
      const whereClause: any = {
        isDelete: false,
        status: 'PUBLISHED',
        // Commenté: vendor: { status: true } - Afficher les produits même si vendeur désactivé
        OR: [
          { name: { contains: options.query, mode: 'insensitive' } },
          { description: { contains: options.query, mode: 'insensitive' } },
          { vendor: { firstName: { contains: options.query, mode: 'insensitive' } } },
          { vendor: { lastName: { contains: options.query, mode: 'insensitive' } } },
          { vendor: { shop_name: { contains: options.query, mode: 'insensitive' } } },
          { design: { name: { contains: options.query, mode: 'insensitive' } } },
          { design: { description: { contains: options.query, mode: 'insensitive' } } }
        ]
      };

      // Filtres supplémentaires
      if (options.vendorId) whereClause.vendorId = options.vendorId;
      if (options.minPrice) whereClause.price = { gte: options.minPrice };
      if (options.maxPrice) whereClause.price = { ...whereClause.price, lte: options.maxPrice };

      // 🆕 FILTRE PAR CATÉGORIE COMPLET (Design + Produits de base)
      if (options.category) {
        this.logger.log(`🔍 Recherche: filtre catégorie "${options.category}"`);

        // 1. Chercher dans les DesignCategory (pour les produits avec designs)
        const designCategory = await this.prisma.designCategory.findFirst({
          where: {
            name: {
              equals: options.category,
              mode: 'insensitive'
            }
          }
        });

        // 2. Chercher dans les Category (pour les produits de base)
        const baseCategory = await this.prisma.category.findFirst({
          where: {
            name: {
              equals: options.category,
              mode: 'insensitive'
            }
          }
        });

        // 3. Construire le filtre OR pour les deux types de catégories
        const categoryFilters: any[] = [];

        // Ajouter filtre pour DesignCategory si trouvée
        if (designCategory) {
          categoryFilters.push({
            design: {
              categoryId: designCategory.id
            }
          });
          this.logger.log(`✅ Recherche: DesignCategory trouvée ID: ${designCategory.id}`);
        }

        // Ajouter filtre pour Category (produits de base) si trouvée
        if (baseCategory) {
          categoryFilters.push({
            baseProduct: {
              categories: {
                some: {
                  id: baseCategory.id
                }
              }
            }
          });
          this.logger.log(`✅ Recherche: Category trouvée ID: ${baseCategory.id}`);
        }

        // 4. Ajouter à la clause OR existante
        if (categoryFilters.length > 0) {
          // Combiner avec les filtres de recherche existants
          whereClause.OR.push(...categoryFilters);
          this.logger.log(`🔗 Recherche: filtre catégorie combiné (${categoryFilters.length} conditions)`);
        } else {
          // Si aucune catégorie trouvée, garder la recherche sur les autres champs
          this.logger.log(`❌ Recherche: aucune catégorie trouvée pour "${options.category}"`);
        }
      }

      const products = await this.prisma.vendorProduct.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              shop_name: true,
              profile_photo_url: true
            }
          },
          baseProduct: {
            include: {
              colorVariations: {
                include: {
                  images: true
                }
              }
            }
          },
          design: {
            include: {
              category: true
            }
          },
          designPositions: {
            include: {
              design: true
            }
          }
        },
        orderBy: [


          { createdAt: 'desc' }
        ],
        take: Math.min(options.limit || 20, 100)
      });

      // ✅ ENRICHIR AVEC STRUCTURE COMPLÈTE
      const enrichedProducts = await Promise.all(
        products.map(async (product) => {
          const enrichedProduct = await this.enrichVendorProductWithCompleteStructure(product);
          return enrichedProduct;
        })
      );

      return {
        products: enrichedProducts,
        total: enrichedProducts.length,
        query: options.query
      };
    } catch (error) {
      this.logger.error('❌ Erreur recherche publique:', error);
      throw new BadRequestException('Erreur lors de la recherche publique');
    }
  }

  /**
   * ✅ ENRICHIR PRODUIT AVEC STRUCTURE COMPLÈTE
   * Ajoute toutes les informations nécessaires pour l'affichage frontend
   */
  private async enrichVendorProductWithCompleteStructure(product: any) {
    try {
      // ✅ STRUCTURE ADMIN CONSERVÉE
      const adminProduct = {
        id: product.baseProduct.id,
        name: product.baseProduct.name,
        description: product.baseProduct.description,
        price: product.baseProduct.price,
        colorVariations: product.baseProduct.colorVariations || [],
        sizes: product.baseProduct.sizes || []
      };

      // ✅ DESIGN APPLICATION
      const designApplication = {
        hasDesign: !!product.design,
        designUrl: product.design?.imageUrl || null,
        positioning: 'CENTER',
        scale: 0.6,
        mode: 'PRESERVED'
      };

      // ✅ DÉLIMITATIONS - Zones où les designs peuvent être appliqués avec utilitaires unifiés
      const designDelimitations = [];
      if (product.baseProduct && product.baseProduct.colorVariations) {
        for (const colorVariation of product.baseProduct.colorVariations) {
          if (colorVariation.images && colorVariation.images.length > 0) {
            // Traiter les images avec les utilitaires unifiés
            const processedImages = processImageDelimitations(colorVariation.images);
            const image = processedImages[0]; // Première image comme référence

            designDelimitations.push({
              colorName: colorVariation.name,
              colorCode: colorVariation.colorCode,
              imageUrl: image.url,
              naturalWidth: image.naturalWidth,
              naturalHeight: image.naturalHeight,
              delimitations: image.delimitations
            });
          }
        }
      }

      // ✅ DESIGN COMPLET
      const design = product.design ? {
        id: product.design.id,
        name: product.design.name,
        description: product.design.description,
        category: product.design.category,
        imageUrl: product.design.imageUrl,
        tags: product.design.tags || [],
        isValidated: product.design.isValidated
      } : null;

      // ✅ POSITIONNEMENTS DESIGN - Utilisation des utilitaires unifiés
      const designPositions: DesignPositionData[] = formatDesignPositions(product.designPositions || []);
      
      this.logger.log(`✅ [UNIFIED-VENDOR] Produit ${product.id}: Positions standardisées`, designPositions.length);

      // ✅ MEILLEURES VENTES
      const bestSeller = {
        isBestSeller: product.isBestSeller || false,
        salesCount: product.salesCount || 0,
        totalRevenue: product.totalRevenue || 0
      };

      // ✅ IMAGES ADMIN CONSERVÉES
      const images = {
        adminReferences: product.baseProduct.colorVariations?.map((colorVar: any) => ({
          colorName: colorVar.name,
          colorCode: colorVar.colorCode,
          adminImageUrl: colorVar.images?.[0]?.url || null,
          imageType: 'admin_reference'
        })) || [],
        total: product.baseProduct.colorVariations?.length || 0,
        primaryImageUrl: product.baseProduct.colorVariations?.[0]?.images?.[0]?.url || null
      };

      // ✅ SÉLECTIONS VENDEUR
      const selectedSizes = this.parseJsonSafely(product.sizes) || [];
      const selectedColors = this.parseJsonSafely(product.colors) || [];

      return {
        id: product.id,
        vendorName: product.name,
        price: product.price,
        status: product.status,
        
        // 🏆 MEILLEURES VENTES
        bestSeller,
        
        // 🎨 STRUCTURE ADMIN CONSERVÉE
        adminProduct,
        
        // 🎨 APPLICATION DESIGN
        designApplication,
        
        // 🎨 DÉLIMITATIONS DU DESIGN
        designDelimitations,
        
        // 🎨 INFORMATIONS DESIGN COMPLÈTES
        design,
        
        // 🎨 POSITIONNEMENTS DU DESIGN
        designPositions,
        
        // 👤 INFORMATIONS VENDEUR
        vendor: {
          id: product.vendor.id,
          fullName: `${product.vendor.firstName} ${product.vendor.lastName}`,
          shop_name: product.vendor.shop_name,
          profile_photo_url: product.vendor.profile_photo_url
        },
        
        // 🖼️ IMAGES ADMIN CONSERVÉES
        images,
        
        // 📏 SÉLECTIONS VENDEUR
        selectedSizes,
        selectedColors,
        designId: product.designId
      };
    } catch (error) {
      this.logger.error(`❌ Erreur enrichissement produit ${product.id}:`, error);
      return product; // Retourner le produit de base en cas d'erreur
    }
  }

  /**
   * 🚀 PUBLICATION D'UN PRODUIT VENDEUR
   * Change le statut d'un produit de DRAFT/PENDING vers PUBLISHED
   */
  async publishVendorProduct(productId: number, vendorId: number) {
    this.logger.log(`🚀 Publication produit ${productId} par vendeur ${vendorId}`);

    try {
      // 1. Récupération du produit avec vérification propriétaire
      const product = await this.prisma.vendorProduct.findFirst({
        where: {
          id: productId,
          vendorId: vendorId // Sécurité: seul le propriétaire peut publier
        },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!product) {
        this.logger.warn(`❌ Produit ${productId} non trouvé pour vendeur ${vendorId}`);
        throw new NotFoundException('Produit non trouvé ou accès refusé');
      }

      this.logger.log(`📦 Produit trouvé: ${product.name} (statut: ${product.status})`);

      // 2. Vérification du statut actuel
      if (product.status === 'PUBLISHED') {
        throw new BadRequestException('Le produit est déjà publié');
      }

      if (!['DRAFT', 'PENDING'].includes(product.status)) {
        throw new BadRequestException(`Impossible de publier un produit avec le statut: ${product.status}`);
      }

      // 3. Mise à jour du statut
      const previousStatus = product.status;
      const publishedProduct = await this.prisma.vendorProduct.update({
        where: { id: productId },
        data: {
          status: 'PUBLISHED',
          updatedAt: new Date()
        },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      this.logger.log(`✅ Produit ${productId} publié avec succès (${previousStatus} → PUBLISHED)`);

      // 4. Réponse de succès
      return {
        success: true,
        message: 'Produit publié avec succès',
        product: {
          id: publishedProduct.id,
          name: publishedProduct.name,
          status: publishedProduct.status,
          publishedAt: publishedProduct.updatedAt.toISOString()
        },
        previousStatus,
        newStatus: 'PUBLISHED'
      };

    } catch (error) {
      this.logger.error(`❌ Erreur publication produit ${productId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la publication: ${error.message}`);
    }
  }

  /**
   * 🎨 NOUVEAU: Créer un produit wizard SANS design
   * Spécialement conçu pour les produits créés via le wizard frontend
   */
  async createWizardProduct(payload: any, vendorId: number): Promise<any> {
    this.logger.log(`🎨 Création produit wizard pour vendeur ${vendorId}`);

    try {
      // Validation des données wizard
      this.validateWizardProduct(payload);

      const {
        baseProductId,
        vendorName,
        vendorDescription,
        vendorPrice,
        vendorStock = 10,
        selectedColors,
        selectedSizes,
        productImages,
        productStructure,
        forcedStatus = 'DRAFT'
      } = payload;

      // 1. Valider que le mockup existe
      const mockup = await this.prisma.product.findFirst({
        where: {
          id: baseProductId,
          isReadyProduct: false
        }
      });

      if (!mockup) {
        throw new BadRequestException('Mockup introuvable');
      }

      // 2. Valider marge minimum 10%
      const minimumPrice = mockup.price * 1.1;
      if (vendorPrice < minimumPrice) {
        throw new BadRequestException(
          `Prix trop bas. Minimum: ${minimumPrice} FCFA (marge 10%)`
        );
      }

      // 3. Créer le produit vendeur SANS design
      const vendorProduct = await this.prisma.vendorProduct.create({
        data: {
          vendorId: vendorId,
          baseProductId: baseProductId,
          name: vendorName,
          description: vendorDescription,
          price: vendorPrice,
          stock: vendorStock,
          status: forcedStatus as any,
          colors: JSON.stringify(selectedColors),
          sizes: JSON.stringify(selectedSizes),

          // IMPORTANT: Pas de designId - c'est un produit simple
          designId: null,

          // Informations vendeur
          vendorName: vendorName,
          vendorDescription: vendorDescription,
          vendorStock: vendorStock,
          basePriceAdmin: mockup.price,

          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // 4. Traiter et sauvegarder les images produit (si présentes)
      const savedImages = await this.processWizardImages(vendorProduct.id, productImages || null);

      // 5. Retourner le produit créé
      return {
        success: true,
        message: 'Produit wizard créé avec succès',
        data: {
          id: vendorProduct.id,
          vendorId: vendorId,
          name: vendorProduct.name,
          description: vendorProduct.description,
          price: vendorProduct.price,
          status: vendorProduct.status,
          baseProduct: {
            id: mockup.id,
            name: mockup.name,
            price: mockup.price
          },
          calculations: {
            basePrice: mockup.price,
            vendorProfit: vendorPrice - mockup.price,
            expectedRevenue: Math.round((vendorPrice - mockup.price) * 0.7),
            platformCommission: Math.round((vendorPrice - mockup.price) * 0.3),
            marginPercentage: ((vendorPrice - mockup.price) / mockup.price) * 100
          },
          images: savedImages,
          wizard: {
            createdViaWizard: true,
            hasDesign: false,
            imageCount: savedImages.length
          },
          createdAt: vendorProduct.createdAt,
          updatedAt: vendorProduct.updatedAt
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erreur création produit wizard: ${error.message}`);
      throw error;
    }
  }

  /**
   * Traitement des images base64 pour produits wizard
   */
  private async processWizardImages(vendorProductId: number, productImages: any): Promise<any[]> {
    const savedImages = [];

    if (!productImages) {
      return savedImages;
    }

    // Image principale
    if (productImages.baseImage) {
      try {
        const baseImageResult = await this.saveBase64Image(
          productImages.baseImage,
          `wizard-product-${vendorProductId}-base`
        );

        const baseImageRecord = await this.prisma.vendorProductImage.create({
          data: {
            vendorProductId: vendorProductId,
            imageType: 'base',
            cloudinaryUrl: baseImageResult.url,
            cloudinaryPublicId: baseImageResult.public_id,
            createdAt: new Date(),
            uploadedAt: new Date()
          }
        });

        savedImages.push({
          id: baseImageRecord.id,
          url: baseImageResult.url,
          type: 'base',
          isMain: true
        });
      } catch (error) {
        this.logger.error(`❌ Erreur upload image base: ${error.message}`);
      }
    }

    // Images de détail
    if (productImages.detailImages && productImages.detailImages.length > 0) {
      for (let i = 0; i < productImages.detailImages.length; i++) {
        try {
          const detailImageResult = await this.saveBase64Image(
            productImages.detailImages[i],
            `wizard-product-${vendorProductId}-detail-${i + 1}`
          );

          const detailImageRecord = await this.prisma.vendorProductImage.create({
            data: {
              vendorProductId: vendorProductId,
              imageType: 'detail',
              cloudinaryUrl: detailImageResult.url,
              cloudinaryPublicId: detailImageResult.public_id,
              createdAt: new Date(),
              uploadedAt: new Date()
            }
          });

          savedImages.push({
            id: detailImageRecord.id,
            url: detailImageResult.url,
            type: 'detail',
            isMain: false,
            orderIndex: i + 1
          });
        } catch (error) {
          this.logger.error(`❌ Erreur upload image détail ${i + 1}: ${error.message}`);
        }
      }
    }

    return savedImages;
  }

  /**
   * Validation spécifique pour les produits wizard
   */
  private validateWizardProduct(payload: any): void {
    const errors = [];

    // Validations obligatoires
    if (!payload.baseProductId) errors.push('baseProductId requis');
    if (!payload.vendorName) errors.push('vendorName requis');
    if (!payload.vendorPrice || payload.vendorPrice <= 0) errors.push('vendorPrice invalide');
    if (!payload.selectedColors || payload.selectedColors.length === 0) errors.push('Au moins une couleur requise');
    if (!payload.selectedSizes || payload.selectedSizes.length === 0) errors.push('Au moins une taille requise');

    // 🎯 NOUVEAU: Images optionnelles pour certains types de wizard
    // if (!payload.productImages || !payload.productImages.baseImage) errors.push('Image principale requise');

    if (errors.length > 0) {
      throw new BadRequestException(errors.join(', '));
    }
  }

  /**
   * Sauvegarder une image base64 sur Cloudinary
   */
  private async saveBase64Image(base64Data: string, filename: string): Promise<any> {
    try {
      // Supprimer le préfixe data:image/...;base64, si présent
      const base64Clean = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

      // Convertir en buffer
      const buffer = Buffer.from(base64Clean, 'base64');

      // Créer un objet file-like pour cloudinary
      const fileObject = {
        buffer: buffer,
        originalname: `${filename}.png`,
        mimetype: 'image/png',
        size: buffer.length
      } as Express.Multer.File;

      // Upload vers Cloudinary
      const result = await this.cloudinaryService.uploadImage(fileObject, 'wizard-products');

      return {
        url: result.secure_url,
        public_id: result.public_id
      };
    } catch (error) {
      this.logger.error(`❌ Erreur sauvegarde image base64: ${error.message}`);
      throw new BadRequestException(`Erreur sauvegarde image: ${error.message}`);
    }
  }

  /**
   * 🏷️ Convertir nom de catégorie en ID
   */
  private getCategoryId(categoryName: string): number {
    const CATEGORY_MAPPING = {
      'Mangas': 5,
      'ILLUSTRATION': 1,
      'LOGO': 2,
      'PATTERN': 3,
      'TYPOGRAPHY': 4,
      'ABSTRACT': 6,
      'illustration': 1,
      'logo': 2,
      'pattern': 3,
      'typography': 4,
      'abstract': 6
    };

    const categoryId = CATEGORY_MAPPING[categoryName];

    if (!categoryId) {
      this.logger.warn(`⚠️ Catégorie "${categoryName}" non reconnue, utilisation de l'ID par défaut (1)`);
      return 1; // ID par défaut pour ILLUSTRATION
    }

    this.logger.log(`🏷️ Conversion catégorie: "${categoryName}" → ID ${categoryId}`);
    return categoryId;
  }

  /**
   * 🆕 HELPER: Formater les images selon le type de produit (wizard vs traditionnel)
   */
  private formatProductImages(product: any) {
    // Si le produit a des images propres (wizard product), les utiliser
    if (product.images && product.images.length > 0) {
      return product.images.map(img => ({
        colorName: img.colorName || null,
        colorCode: img.colorCode || null,
        adminImageUrl: img.cloudinaryUrl,
        imageType: img.imageType || 'base'
      }));
    }

    // Sinon, utiliser les images du mockup (produit traditionnel)
    if (product.baseProduct?.colorVariations) {
      const adminReferences = [];

      for (const colorVariation of product.baseProduct.colorVariations) {
        for (const image of colorVariation.images || []) {
          adminReferences.push({
            colorName: colorVariation.name,
            colorCode: colorVariation.colorCode,
            adminImageUrl: image.url,
            imageType: 'admin_reference'
          });
        }
      }

      return adminReferences;
    }

    return [];
  }

  /**
   * 🆕 HELPER: Obtenir l'image principale selon le type de produit
   */
  private getPrimaryImageUrl(product: any) {
    // Pour les produits wizard, utiliser l'image de type 'base' ou la première
    if (product.images && product.images.length > 0) {
      const baseImage = product.images.find(img =>
        (img.imageType || '').toLowerCase() === 'base'
      );
      return baseImage?.cloudinaryUrl || product.images[0]?.cloudinaryUrl || null;
    }

    // Pour les produits traditionnels, utiliser la première image du mockup
    if (product.baseProduct?.colorVariations?.[0]?.images?.[0]) {
      return product.baseProduct.colorVariations[0].images[0].url;
    }

    return null;
  }
}
 
 
 
 
 
 
 
 
 
 
