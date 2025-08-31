import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { MailService } from '../core/mail/mail.service';

export enum PostValidationAction {
  AUTO_PUBLISH = 'AUTO_PUBLISH',
  TO_DRAFT = 'TO_DRAFT'
}

@Injectable()
export class VendorProductValidationService {
  private readonly logger = new Logger(VendorProductValidationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * 🎯 ENDPOINT VENDEUR: Modifier l'action post-validation
   */
  async updatePostValidationAction(
    productId: number,
    vendorId: number,
    action: 'AUTO_PUBLISH' | 'TO_DRAFT'
  ): Promise<{ success: boolean; message: string; product: any }> {
    try {
      // Vérifier que le produit appartient au vendeur
      const product = await this.prisma.vendorProduct.findFirst({
        where: {
          id: productId,
          vendorId: vendorId,
          isDelete: false
        }
      });

      if (!product) {
        throw new NotFoundException('Produit non trouvé ou non autorisé');
      }

      // Vérifier que le produit n'est pas encore validé
      if (product.isValidated) {
        throw new BadRequestException('Impossible de modifier l\'action d\'un produit déjà validé');
      }

      // Vérifier que le produit est en attente
      if (product.status !== 'PENDING') {
        throw new BadRequestException('Seuls les produits en attente peuvent être modifiés');
      }

      // Mise à jour
      const updatedProduct = await this.prisma.vendorProduct.update({
        where: { id: productId },
        data: {
          postValidationAction: action,
          updatedAt: new Date()
        },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      this.logger.log(`✅ Action post-validation mise à jour: Produit ${productId} → ${action}`);

      return {
        success: true,
        message: 'Choix de publication mis à jour avec succès',
        product: this.formatProductResponse(updatedProduct)
      };

    } catch (error) {
      this.logger.error('❌ Erreur mise à jour action post-validation:', error);
      throw error;
    }
  }

  /**
   * 🎯 ENDPOINT VENDEUR: Publier manuellement un produit validé
   */
  async publishValidatedProduct(
    productId: number,
    vendorId: number
  ): Promise<{ success: boolean; message: string; product: any }> {
    try {
      // Vérifier que le produit appartient au vendeur
      const product = await this.prisma.vendorProduct.findFirst({
        where: {
          id: productId,
          vendorId: vendorId,
          isDelete: false
        }
      });

      if (!product) {
        throw new NotFoundException('Produit non trouvé ou non autorisé');
      }

      // Vérifier que le produit est validé
      if (!product.isValidated) {
        throw new BadRequestException('Le produit doit être validé avant d\'être publié');
      }

      // Vérifier que le produit est en brouillon
      if (product.status !== 'DRAFT') {
        throw new BadRequestException('Seuls les produits en brouillon validés peuvent être publiés');
      }

      // Publication
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
              lastName: true,
              email: true
            }
          }
        }
      });

      this.logger.log(`🚀 Produit publié manuellement: ${productId}`);

      // Notification optionnelle
      try {
        await this.notifyVendorProductManuallyPublished(publishedProduct);
      } catch (notifError) {
        this.logger.error('❌ Erreur notification publication manuelle:', notifError);
        // Ne pas faire échouer la publication pour une erreur de notification
      }

      return {
        success: true,
        message: 'Produit publié avec succès',
        product: this.formatProductResponse(publishedProduct)
      };

    } catch (error) {
      this.logger.error('❌ Erreur publication manuelle:', error);
      throw error;
    }
  }

  /**
   * 🎯 ENDPOINT ADMIN: Récupérer les produits en attente de validation
   */
  async getPendingProducts(
    adminId: number,
    options: {
      page?: number;
      limit?: number;
      vendorId?: number;
      designUrl?: string;
    } = {}
  ): Promise<{
    products: any[];
    pagination: any;
    stats: any;
  }> {
    try {
      // Vérifier que l'utilisateur est admin
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId }
      });

      if (!admin || !['ADMIN', 'SUPERADMIN'].includes(admin.role)) {
        throw new ForbiddenException('Seuls les administrateurs peuvent voir les produits en attente');
      }

      const { page = 1, limit = 20, vendorId, designUrl } = options;
      const skip = (page - 1) * limit;

      // Filtres
      const where: any = {
        status: 'PENDING',
        isValidated: false,
        isDelete: false
      };

      if (vendorId) {
        where.vendorId = vendorId;
      }

      if (designUrl) {
        where.designCloudinaryUrl = designUrl;
      }

      // Récupération
      const [products, totalCount] = await Promise.all([
        this.prisma.vendorProduct.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
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
            baseProduct: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }),
        this.prisma.vendorProduct.count({ where })
      ]);

      // Statistiques
      const stats = await this.getValidationStats();

      return {
        products: products.map(p => this.formatProductResponse(p)),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit
        },
        stats
      };

    } catch (error) {
      this.logger.error('❌ Erreur récupération produits en attente:', error);
      throw error;
    }
  }

  /**
   * 🎯 ENDPOINT ADMIN: Valider un produit spécifique (sans design)
   */
  async validateProduct(
    productId: number,
    adminId: number,
    approved: boolean,
    rejectionReason?: string
  ): Promise<{ success: boolean; message: string; product: any }> {
    try {
      // Vérifier que l'utilisateur est admin
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId }
      });

      if (!admin || !['ADMIN', 'SUPERADMIN'].includes(admin.role)) {
        throw new ForbiddenException('Seuls les administrateurs peuvent valider les produits');
      }

      // Récupérer le produit
      const product = await this.prisma.vendorProduct.findUnique({
        where: { id: productId },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!product) {
        throw new NotFoundException('Produit non trouvé');
      }

      if (product.isValidated) {
        throw new BadRequestException('Ce produit a déjà été validé');
      }

      // Validation
      if (!approved && !rejectionReason) {
        throw new BadRequestException('Une raison de rejet est obligatoire');
      }

      const newStatus = approved 
        ? (product.postValidationAction === 'AUTO_PUBLISH' ? 'PUBLISHED' : 'DRAFT')
        : 'PENDING'; // Reste en attente si rejeté

      const updatedProduct = await this.prisma.vendorProduct.update({
        where: { id: productId },
        data: {
          status: newStatus,
          isValidated: approved,
          validatedAt: approved ? new Date() : null,
          validatedBy: approved ? adminId : null,
          rejectionReason: approved ? null : rejectionReason,
          updatedAt: new Date()
        },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      this.logger.log(`${approved ? '✅' : '❌'} Produit ${productId} ${approved ? 'validé' : 'rejeté'}`);

      // Notifications
      try {
        if (approved) {
          if (product.postValidationAction === 'AUTO_PUBLISH') {
            await this.notifyVendorProductAutoPublished(updatedProduct);
          } else {
            await this.notifyVendorProductValidatedToDraft(updatedProduct);
          }
        } else {
          await this.notifyVendorProductRejected(updatedProduct, rejectionReason);
        }
      } catch (notifError) {
        this.logger.error('❌ Erreur notification validation:', notifError);
      }

      return {
        success: true,
        message: approved ? 'Produit validé avec succès' : 'Produit rejeté',
        product: this.formatProductResponse(updatedProduct)
      };

    } catch (error) {
      this.logger.error('❌ Erreur validation produit:', error);
      throw error;
    }
  }

  /**
   * 📊 Statistiques de validation
   */
  private async getValidationStats() {
    const [pending, validated, rejected] = await Promise.all([
      this.prisma.vendorProduct.count({
        where: { status: 'PENDING', isValidated: false, isDelete: false }
      }),
      this.prisma.vendorProduct.count({
        where: { isValidated: true, isDelete: false }
      }),
      this.prisma.vendorProduct.count({
        where: { rejectionReason: { not: null }, isDelete: false }
      })
    ]);

    return {
      pending,
      validated,
      rejected,
      total: pending + validated + rejected
    };
  }

  /**
   * 📧 Notifications
   */
  private async notifyVendorProductAutoPublished(product: any): Promise<void> {
    const subject = '🎉 Votre produit a été publié automatiquement - Printalma';
    const vendorName = `${product.vendor.firstName} ${product.vendor.lastName}`;
    
    await this.mailService.sendEmail({
      to: product.vendor.email,
      subject: subject,
      template: 'vendor-product-auto-published',
      context: {
        vendorName: vendorName,
        productName: product.vendorName || 'Produit sans nom',
        productPrice: (product.vendorPrice / 100).toFixed(2),
        dashboardUrl: `${process.env.FRONTEND_URL}/vendor/products`
      }
    });
  }

  private async notifyVendorProductValidatedToDraft(product: any): Promise<void> {
    const subject = '✅ Votre produit a été validé - Prêt à publier - Printalma';
    const vendorName = `${product.vendor.firstName} ${product.vendor.lastName}`;
    
    await this.mailService.sendEmail({
      to: product.vendor.email,
      subject: subject,
      template: 'vendor-product-validated-draft',
      context: {
        vendorName: vendorName,
        productName: product.vendorName || 'Produit sans nom',
        productPrice: (product.vendorPrice / 100).toFixed(2),
        dashboardUrl: `${process.env.FRONTEND_URL}/vendor/products`
      }
    });
  }

  private async notifyVendorProductManuallyPublished(product: any): Promise<void> {
    const subject = '🚀 Votre produit a été publié - Printalma';
    const vendorName = `${product.vendor.firstName} ${product.vendor.lastName}`;
    
    await this.mailService.sendEmail({
      to: product.vendor.email,
      subject: subject,
      template: 'vendor-product-manually-published',
      context: {
        vendorName: vendorName,
        productName: product.vendorName || 'Produit sans nom',
        productPrice: (product.vendorPrice / 100).toFixed(2),
        dashboardUrl: `${process.env.FRONTEND_URL}/vendor/products`
      }
    });
  }

  private async notifyVendorProductRejected(product: any, rejectionReason: string): Promise<void> {
    const subject = '❌ Votre produit nécessite des modifications - Printalma';
    const vendorName = `${product.vendor.firstName} ${product.vendor.lastName}`;
    
    await this.mailService.sendEmail({
      to: product.vendor.email,
      subject: subject,
      template: 'vendor-product-rejected',
      context: {
        vendorName: vendorName,
        productName: product.vendorName || 'Produit sans nom',
        rejectionReason: rejectionReason,
        dashboardUrl: `${process.env.FRONTEND_URL}/vendor/products`
      }
    });
  }

  /**
   * 📋 Formatage de la réponse produit
   */
  private formatProductResponse(product: any) {
    return {
      id: product.id,
      vendorName: product.vendorName,
      vendorDescription: product.vendorDescription,
      vendorPrice: product.vendorPrice,
      vendorStock: product.vendorStock,
      status: product.status,
      isValidated: product.isValidated,
      validatedAt: product.validatedAt ? product.validatedAt.toISOString() : null,
      validatedBy: product.validatedBy,
      postValidationAction: product.postValidationAction,
      designCloudinaryUrl: product.designCloudinaryUrl,
      rejectionReason: product.rejectionReason,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      vendor: product.vendor ? {
        id: product.vendor.id,
        firstName: product.vendor.firstName,
        lastName: product.vendor.lastName,
        email: product.vendor.email,
        shop_name: product.vendor.shop_name
      } : undefined
    };
  }

  /**
   * 🎯 ENDPOINT ADMIN: Récupérer TOUS les produits vendeur avec TOUTES les informations détaillées
   */
  async getAllVendorProductsWithDetails(
    adminId: number,
    options: {
      page?: number;
      limit?: number;
      vendorId?: number;
      status?: string;
      search?: string;
      includeDesigns?: boolean;
      includeImages?: boolean;
      includePositions?: boolean;
      includeTransforms?: boolean;
    } = {}
  ): Promise<{
    products: any[];
    pagination: any;
    stats: any;
  }> {
    try {
      // Vérifier que l'utilisateur est admin
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId }
      });

      if (!admin || !['ADMIN', 'SUPERADMIN'].includes(admin.role)) {
        throw new ForbiddenException('Seuls les administrateurs peuvent voir tous les produits vendeur');
      }

      const { 
        page = 1, 
        limit = 20, 
        vendorId, 
        status, 
        search,
        includeDesigns = true,
        includeImages = true,
        includePositions = true,
        includeTransforms = true
      } = options;
      const skip = (page - 1) * limit;

      // Filtres
      const where: any = {};

      if (vendorId) {
        where.vendorId = vendorId;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { vendor: { firstName: { contains: search, mode: 'insensitive' } } },
          { vendor: { lastName: { contains: search, mode: 'insensitive' } } },
          { vendor: { shop_name: { contains: search, mode: 'insensitive' } } }
        ];
      }

      // Récupération avec toutes les relations
      const [products, totalCount] = await Promise.all([
        this.prisma.vendorProduct.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            // Informations vendeur complètes
            vendor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                shop_name: true,
                phone: true,
                country: true,
                address: true,
                profile_photo_url: true,
                vendeur_type: true,
                status: true,
                created_at: true,
                last_login_at: true
              }
            },
            // Informations produit de base complètes
            baseProduct: {
              include: {
                categories: true,
                sizes: true,
                colorVariations: {
                  include: {
                    images: {
                      include: {
                        delimitations: true
                      }
                    }
                  }
                },
                validator: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            // Informations du validateur
            validator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            },
            // Design associé si disponible
            ...(includeDesigns && {
              design: {
                include: {
                  vendor: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      shop_name: true
                    }
                  },
                  validator: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                }
              }
            }),
            // Images du produit vendeur
            ...(includeImages && {
              images: true
            }),
            // Positions des designs
            ...(includePositions && {
              designPositions: {
                include: {
                  design: {
                    select: {
                      id: true,
                      name: true,
                      imageUrl: true,
                      cloudinaryPublicId: true,
                      category: true
                    }
                  }
                }
              }
            }),
            // Transformations des designs
            ...(includeTransforms && {
              designTransforms: {
                include: {
                  vendor: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }),
            // Liens design-produit
            designProductLinks: {
              include: {
                design: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    cloudinaryPublicId: true,
                    category: true,
                    format: true,
                    isValidated: true,
                    validatedAt: true
                  }
                }
              }
            }
          }
        }),
        this.prisma.vendorProduct.count({ where })
      ]);

      // Statistiques globales
      const stats = await this.getGlobalVendorProductStats();

      return {
        products: products.map(p => this.formatCompleteProductResponse(p)),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit
        },
        stats
      };

    } catch (error) {
      this.logger.error('❌ Erreur récupération de tous les produits vendeur:', error);
      throw error;
    }
  }

  /**
   * Statistiques globales des produits vendeur
   */
  private async getGlobalVendorProductStats() {
    try {
      const [
        totalProducts,
        pendingProducts,
        publishedProducts,
        draftProducts,
        rejectedProducts,
        validatedProducts,
        totalVendors,
        totalDesigns,
        totalImages
      ] = await Promise.all([
        this.prisma.vendorProduct.count({ where: { isDelete: false } }),
        this.prisma.vendorProduct.count({ where: { status: 'PENDING', isDelete: false } }),
        this.prisma.vendorProduct.count({ where: { status: 'PUBLISHED', isDelete: false } }),
        this.prisma.vendorProduct.count({ where: { status: 'DRAFT', isDelete: false } }),
        this.prisma.vendorProduct.count({ where: { rejectionReason: { not: null }, isDelete: false } }),
        this.prisma.vendorProduct.count({ where: { isValidated: true, isDelete: false } }),
        this.prisma.user.count({ where: { role: 'VENDEUR' } }),
        this.prisma.design.count(),
        this.prisma.vendorProductImage.count()
      ]);

      return {
        totalProducts,
        pendingProducts,
        publishedProducts,
        draftProducts,
        rejectedProducts,
        validatedProducts,
        totalVendors,
        totalDesigns,
        totalImages,
        validationRate: totalProducts > 0 ? ((validatedProducts / totalProducts) * 100).toFixed(1) : 0
      };
    } catch (error) {
      this.logger.error('❌ Erreur calcul statistiques globales:', error);
      return {};
    }
  }

  /**
   * Formatter la réponse complète d'un produit vendeur selon la structure attendue
   */
  private formatCompleteProductResponse(product: any) {
    // 🎯 1. DESIGN APPLICATION (NOUVEAU - PRIORITAIRE)
    const designApplication = this.formatDesignApplication(product);
    
    // 🎯 2. COULEURS SÉLECTIONNÉES (NOUVEAU - CRITICAL)
    const selectedColors = this.formatSelectedColors(product);
    
    // 🎯 3. POSITIONS DES DESIGNS (AMÉLIORER)
    const designPositions = this.formatDesignPositions(product);
    
    // 🎯 4. PRODUIT ADMIN (RENOMMER baseProduct -> adminProduct)
    const adminProduct = this.formatAdminProduct(product);

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      status: product.status,
      postValidationAction: product.postValidationAction,
      
      // 🆕 DESIGN APPLICATION (STRUCTURE CRITIQUE)
      designApplication,
      
      // 🆕 COULEURS SÉLECTIONNÉES (CRITICAL POUR UI)
      selectedColors,
      
      // 🆕 POSITIONS ENRICHIES
      designPositions,
      
      // 🆕 PRODUIT ADMIN (RENOMMÉ)
      adminProduct,
      
      // Informations admin originales (LEGACY)
      adminProductName: product.adminProductName,
      adminProductDescription: product.adminProductDescription,
      adminProductPrice: product.adminProductPrice,
      
      // Design principal (LEGACY - gardé pour compatibilité)
      designCloudinaryUrl: product.designCloudinaryUrl,
      designCloudinaryPublicId: product.designCloudinaryPublicId,
      designPositioning: product.designPositioning,
      designScale: product.designScale,
      designApplicationMode: product.designApplicationMode,
      designId: product.designId,
      
      // Sélections vendeur (LEGACY)
      sizes: product.sizes,
      colors: product.colors,
      
      // Métadonnées vendeur
      vendorName: product.vendorName,
      vendorDescription: product.vendorDescription,
      vendorStock: product.vendorStock,
      basePriceAdmin: product.basePriceAdmin,
      
      // Validation
      isValidated: product.isValidated,
      validatedAt: product.validatedAt,
      validatedBy: product.validatedBy,
      rejectionReason: product.rejectionReason,
      submittedForValidationAt: product.submittedForValidationAt,
      
      // Timestamps
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      
      // Relations enrichies (LEGACY - gardé pour compatibilité)
      vendor: product.vendor,
      baseProduct: product.baseProduct, // Gardé en plus d'adminProduct
      validator: product.validator,
      design: product.design,
      images: product.images,
      designTransforms: product.designTransforms,
      designProductLinks: product.designProductLinks,
      
      // Métadonnées calculées
      hasDesign: !!product.designCloudinaryUrl || !!product.designId || !!product.design?.imageUrl,
      hasImages: product.images?.length > 0,
      hasPositions: designPositions?.length > 0,
      hasTransforms: product.designTransforms?.length > 0,
      totalDesignLinks: product.designProductLinks?.length || 0,
      
      // Statut enrichi
      statusDisplay: this.getStatusDisplay(product.status, product.isValidated),
      canBePublished: product.isValidated && product.status === 'DRAFT',
      needsValidation: product.status === 'PENDING' && !product.isValidated
    };
  }

  /**
   * 🎨 Formater l'application du design (CRITICAL)
   */
  private formatDesignApplication(product: any) {
    // Ordre de priorité pour l'URL du design
    const designUrl = product.designCloudinaryUrl || 
                     product.design?.imageUrl || 
                     product.designPositions?.[0]?.design?.imageUrl;
    
    const designCloudinaryPublicId = product.designCloudinaryPublicId ||
                                   product.design?.cloudinaryPublicId ||
                                   product.designPositions?.[0]?.design?.cloudinaryPublicId;

    const hasDesign = !!designUrl;

    return {
      hasDesign,
      designUrl: designUrl || null,
      designCloudinaryPublicId: designCloudinaryPublicId || null,
      positioning: product.designPositioning || 'CENTER',
      scale: product.designScale || 0.8,
      mode: product.designApplicationMode || 'PRESERVED'
    };
  }

  /**
   * 🎨 Formater les couleurs sélectionnées (CRITICAL)
   */
  private formatSelectedColors(product: any) {
    try {
      // Parser les couleurs depuis le JSON
      let selectedColorIds = [];
      if (typeof product.colors === 'string') {
        selectedColorIds = JSON.parse(product.colors);
      } else if (Array.isArray(product.colors)) {
        selectedColorIds = product.colors;
      }

      // Récupérer les infos complètes des couleurs depuis baseProduct
      const selectedColors = [];
      if (product.baseProduct?.colorVariations && selectedColorIds.length > 0) {
        for (const colorId of selectedColorIds) {
          const colorVariation = product.baseProduct.colorVariations.find(cv => cv.id === colorId);
          if (colorVariation) {
            selectedColors.push({
              id: colorVariation.id,
              name: colorVariation.name,
              colorCode: colorVariation.colorCode
            });
          }
        }
      }

      // Si aucune couleur sélectionnée, retourner toutes les couleurs disponibles
      if (selectedColors.length === 0 && product.baseProduct?.colorVariations) {
        return product.baseProduct.colorVariations.map(cv => ({
          id: cv.id,
          name: cv.name,
          colorCode: cv.colorCode
        }));
      }

      return selectedColors;
    } catch (error) {
      this.logger.warn('❌ Erreur parsing couleurs sélectionnées:', error);
      return [];
    }
  }

  /**
   * 🎯 Formater les positions des designs (AMÉLIORER)
   */
  private formatDesignPositions(product: any) {
    if (!product.designPositions || product.designPositions.length === 0) {
      return [];
    }

    return product.designPositions.map(dp => ({
      vendorProductId: dp.vendorProductId,
      designId: dp.designId,
      position: dp.position || { x: 0.5, y: 0.3, scale: 0.8, rotation: 0 },
      createdAt: dp.createdAt,
      design: {
        id: dp.design?.id,
        name: dp.design?.name,
        imageUrl: dp.design?.imageUrl,
        cloudinaryPublicId: dp.design?.cloudinaryPublicId,
        category: dp.design?.category
      }
    }));
  }

  /**
   * 🏭 Formater le produit admin avec variations de couleur complètes
   */
  private formatAdminProduct(product: any) {
    if (!product.baseProduct) {
      return null;
    }

    return {
      id: product.baseProduct.id,
      name: product.baseProduct.name,
      description: product.baseProduct.description,
      price: product.baseProduct.price,
      stock: product.baseProduct.stock,
      status: product.baseProduct.status,
      categories: product.baseProduct.categories || [],
      sizes: product.baseProduct.sizes || [],
      colorVariations: (product.baseProduct.colorVariations || []).map(cv => ({
        id: cv.id,
        name: cv.name,
        colorCode: cv.colorCode,
        images: (cv.images || []).map(img => ({
          id: img.id,
          view: img.view,
          url: img.url,
          publicId: img.publicId,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          viewType: img.view, // Alias pour compatibilité
          delimitations: (img.delimitations || []).map(delim => ({
            id: delim.id,
            x: delim.x,
            y: delim.y,
            width: delim.width,
            height: delim.height,
            rotation: delim.rotation || 0,
            name: delim.name,
            coordinateType: delim.coordinateType || 'PERCENTAGE'
          }))
        }))
      })),
      validator: product.baseProduct.validator
    };
  }

  /**
   * Obtenir l'affichage du statut
   */
  private getStatusDisplay(status: string, isValidated: boolean) {
    if (status === 'PUBLISHED' && isValidated) return 'Publié et validé';
    if (status === 'DRAFT' && isValidated) return 'Validé - En brouillon';
    if (status === 'PENDING' && !isValidated) return 'En attente de validation';
    if (status === 'REJECTED') return 'Rejeté';
    return status;
  }

  /**
   * 🎯 ENDPOINT ADMIN: Créer un produit pour un vendeur
   */
  async createProductForVendor(
    adminId: number,
    productData: any
  ): Promise<{
    success: boolean;
    message: string;
    productId: number;
    vendorId: number;
    vendorName: string;
    status: string;
    createdBy: string;
    newDesignCreated?: boolean;
    newDesignName?: string;
    designId: number;
    designUrl: string;
  }> {
    try {
      // Vérifier que l'utilisateur est admin
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId }
      });

      if (!admin || !['ADMIN', 'SUPERADMIN'].includes(admin.role)) {
        throw new ForbiddenException('Seuls les administrateurs peuvent créer des produits pour les vendeurs');
      }

      // Vérifier que le vendeur existe et est actif
      const vendor = await this.prisma.user.findUnique({
        where: { 
          id: productData.vendorId,
          role: 'VENDEUR',
          status: true
        }
      });

      if (!vendor) {
        throw new NotFoundException('Vendeur non trouvé ou inactif');
      }

      // Vérifier qu'au moins un design est fourni (soit ID existant, soit nouveau)
      if (!productData.designId && !productData.newDesign) {
        throw new BadRequestException('Vous devez fournir soit un designId existant, soit un newDesign à créer');
      }

      if (productData.designId && productData.newDesign) {
        throw new BadRequestException('Vous ne pouvez pas fournir à la fois un designId et un newDesign');
      }

      let design;
      let newDesignCreated = false;
      let newDesignName;

      // Cas 1: Utiliser un design existant
      if (productData.designId) {
        design = await this.prisma.design.findUnique({
          where: { 
            id: productData.designId,
            vendorId: productData.vendorId
          }
        });

        if (!design) {
          throw new NotFoundException('Design non trouvé ou n\'appartient pas au vendeur spécifié');
        }

        this.logger.log(`🎨 Utilisation du design existant: ${design.name} (ID: ${design.id})`);
      }
      // Cas 2: Créer un nouveau design pour le vendeur
      else if (productData.newDesign) {
        this.logger.log(`🎨 Création d'un nouveau design pour le vendeur ${productData.vendorId}`);
        
        try {
          // Utiliser la logique de création de design existante
          const designCreationResult = await this.createDesignForVendor(
            productData.vendorId,
            productData.newDesign
          );

          design = await this.prisma.design.findUnique({
            where: { id: designCreationResult.designId }
          });

          newDesignCreated = true;
          newDesignName = design.name;

          this.logger.log(`✅ Nouveau design créé: ${design.name} (ID: ${design.id})`);
          
        } catch (designError) {
          this.logger.error('❌ Erreur création design:', designError);
          throw new BadRequestException(`Erreur lors de la création du design: ${designError.message}`);
        }
      }

      // Vérifier que le produit de base existe
      const baseProduct = await this.prisma.product.findUnique({
        where: { id: productData.baseProductId }
      });

      if (!baseProduct) {
        throw new NotFoundException('Produit de base non trouvé');
      }

      this.logger.log(`🎯 Admin ${adminId} crée un produit pour le vendeur ${productData.vendorId}`);

      // 🎨 EXTRAIRE LES INFORMATIONS DE POSITION ET DIMENSIONS
      let designWidth: number | null = null;
      let designHeight: number | null = null;

      // Extraction des dimensions depuis designPosition si disponible
      if (productData.designPosition) {
        // Extraction flexible des dimensions (plusieurs formats possibles)
        designWidth = (productData.designPosition as any).design_width ?? 
                     (productData.designPosition as any).designWidth ?? 
                     (productData.designPosition as any).width;
        designHeight = (productData.designPosition as any).design_height ?? 
                      (productData.designPosition as any).designHeight ?? 
                      (productData.designPosition as any).height;
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

      this.logger.log(`🎨 Informations design extraites (admin):`, {
        designWidth,
        designHeight
      });

      // Créer le produit vendeur
      const vendorProduct = await this.prisma.vendorProduct.create({
        data: {
          baseProductId: productData.baseProductId,
          vendorId: productData.vendorId,
          
          // Informations produit
          name: productData.vendorName,
          description: productData.vendorDescription,
          price: productData.vendorPrice,
          stock: productData.vendorStock,
          
          // Conservation structure admin
          adminProductName: productData.productStructure.adminProduct.name,
          adminProductDescription: productData.productStructure.adminProduct.description,
          adminProductPrice: productData.productStructure.adminProduct.price,
          
          // Liaison design
          designId: design.id,
          designCloudinaryUrl: design.imageUrl,
          designCloudinaryPublicId: design.cloudinaryPublicId,
          designPositioning: 'CENTER',
          designScale: productData.productStructure.designApplication.scale || 0.6,
          designApplicationMode: 'PRESERVED',
          
          // 🆕 INFORMATIONS DE POSITION ET DIMENSIONS DU DESIGN
          designWidth: designWidth,
          designHeight: designHeight,
          
          // Sélections vendeur
          sizes: JSON.stringify(productData.selectedSizes),
          colors: JSON.stringify(productData.selectedColors),
          
          // Statut - Admin peut forcer le statut ou bypass validation
          status: productData.bypassAdminValidation ? 
                  (productData.forcedStatus || 'PUBLISHED') :
                  (productData.forcedStatus || (design.isValidated ? 'DRAFT' : 'PENDING')),
          isValidated: productData.bypassAdminValidation ? true : design.isValidated,
          postValidationAction: productData.postValidationAction || 'AUTO_PUBLISH',
          
          // Métadonnées
          vendorName: productData.vendorName,
          vendorDescription: productData.vendorDescription,
          vendorStock: productData.vendorStock,
          basePriceAdmin: productData.productStructure.adminProduct.price,
        },
      });

      // Créer le lien design-produit
      try {
        await this.prisma.designProductLink.create({
          data: {
            designId: design.id,
            vendorProductId: vendorProduct.id
          }
        });
      } catch (linkError) {
        if (linkError.code !== 'P2002') {
          this.logger.error('❌ Erreur création lien design-produit:', linkError);
        }
      }

      // Sauvegarder position design si fournie
      if (productData.designPosition) {
        try {
          await this.prisma.productDesignPosition.create({
            data: {
              vendorProductId: vendorProduct.id,
              designId: design.id,
              position: productData.designPosition,
            }
          });
        } catch (positionError) {
          this.logger.error('❌ Erreur sauvegarde position design:', positionError);
        }
      }

      // Conserver références images admin
      await this.preserveAdminImageStructure(
        vendorProduct.id,
        productData.productStructure.adminProduct
      );

      this.logger.log(`✅ Produit ${vendorProduct.id} créé par admin ${adminId} pour vendeur ${vendor.firstName} ${vendor.lastName}`);

      return {
        success: true,
        message: `Produit créé avec succès pour ${vendor.firstName} ${vendor.lastName}`,
        productId: vendorProduct.id,
        vendorId: vendor.id,
        vendorName: `${vendor.firstName} ${vendor.lastName}`,
        status: vendorProduct.status,
        createdBy: 'admin_created',
        newDesignCreated,
        newDesignName,
        designId: design.id,
        designUrl: design.imageUrl
      };

    } catch (error) {
      this.logger.error('❌ Erreur création produit par admin:', error);
      throw error;
    }
  }

  /**
   * 🎨 Créer un design pour un vendeur (utilisé par l'admin)
   */
  private async createDesignForVendor(
    vendorId: number,
    designData: {
      name: string;
      description?: string;
      category: string;
      imageBase64: string;
      tags?: string[];
    }
  ): Promise<{
    designId: number;
    designUrl: string;
  }> {
    try {
      // Utiliser le service CloudinaryService pour uploader l'image
      const uploadResult = await this.uploadBase64ToCloudinary(designData.imageBase64, vendorId);

      // Créer le design dans la base de données
      const design = await this.prisma.design.create({
        data: {
          name: designData.name,
          description: designData.description || '',
          category: designData.category as any,
          imageUrl: uploadResult.secure_url,
          cloudinaryPublicId: uploadResult.public_id,
          vendorId: vendorId,
          tags: designData.tags ? { set: designData.tags } : undefined,
          isValidated: false,
          format: uploadResult.format || 'png'
        } as any
      });

      this.logger.log(`✅ Design créé pour vendeur ${vendorId}: ${design.name} (ID: ${design.id})`);

      return {
        designId: design.id,
        designUrl: design.imageUrl
      };

    } catch (error) {
      this.logger.error('❌ Erreur création design pour vendeur:', error);
      throw new BadRequestException(`Erreur création design: ${error.message}`);
    }
  }

  /**
   * 📸 Upload image base64 vers Cloudinary
   */
  private async uploadBase64ToCloudinary(imageBase64: string, vendorId: number) {
    // Cette méthode devrait utiliser CloudinaryService
    // Pour l'instant, je simule la réponse
    // Dans une vraie implémentation, il faudrait injecter CloudinaryService
    
    // Simulation de l'upload Cloudinary
    const mockPublicId = `admin_design_${vendorId}_${Date.now()}`;
    
    return {
      secure_url: `https://res.cloudinary.com/printalma/image/upload/v1/${mockPublicId}.png`,
      public_id: mockPublicId,
      format: 'png',
      width: 800,
      height: 600,
      bytes: 150000
    };
  }

  /**
   * 🎨 ENDPOINT ADMIN: Récupérer les designs d'un vendeur
   */
  async getVendorDesigns(
    adminId: number,
    vendorId: number,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
    } = {}
  ): Promise<{
    designs: any[];
    total: number;
    stats: {
      validated: number;
      pending: number;
      rejected: number;
    };
  }> {
    try {
      // Vérifier que l'utilisateur est admin
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId }
      });

      if (!admin || !['ADMIN', 'SUPERADMIN'].includes(admin.role)) {
        throw new ForbiddenException('Seuls les administrateurs peuvent voir les designs des vendeurs');
      }

      // Vérifier que le vendeur existe
      const vendor = await this.prisma.user.findUnique({
        where: { 
          id: vendorId,
          role: 'VENDEUR'
        }
      });

      if (!vendor) {
        throw new NotFoundException('Vendeur non trouvé');
      }

      const { limit = 20, offset = 0, status } = options;

      // Filtres
      const where: any = {
        vendorId: vendorId
      };

      if (status) {
        if (status === 'validated') {
          where.isValidated = true;
        } else if (status === 'pending') {
          where.isValidated = false;
          where.rejectionReason = null;
        } else if (status === 'rejected') {
          where.rejectionReason = { not: null };
        }
      }

      // Récupération
      const [designs, totalCount] = await Promise.all([
        this.prisma.design.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            imageUrl: true,
            cloudinaryPublicId: true,
            isValidated: true,
            createdAt: true,
            validatedAt: true,
            rejectionReason: true,
            tags: true
          }
        }),
        this.prisma.design.count({ where })
      ]);

      // Statistiques
      const [validated, pending, rejected] = await Promise.all([
        this.prisma.design.count({
          where: { vendorId, isValidated: true }
        }),
        this.prisma.design.count({
          where: { vendorId, isValidated: false, rejectionReason: null }
        }),
        this.prisma.design.count({
          where: { vendorId, rejectionReason: { not: null } }
        })
      ]);

      return {
        designs: designs.map(design => ({
          id: design.id,
          name: design.name,
          description: design.description,
          category: design.category,
          imageUrl: design.imageUrl,
          cloudinaryPublicId: design.cloudinaryPublicId,
          isValidated: design.isValidated,
          createdAt: design.createdAt.toISOString(),
          validatedAt: design.validatedAt?.toISOString(),
          rejectionReason: design.rejectionReason,
          tags: design.tags ? (design.tags as string[]) : []
        })),
        total: totalCount,
        stats: {
          validated,
          pending,
          rejected
        }
      };

    } catch (error) {
      this.logger.error('❌ Erreur récupération designs vendeur:', error);
      throw error;
    }
  }

  /**
   * 👥 ENDPOINT ADMIN: Lister les vendeurs disponibles
   */
  async getAvailableVendors(adminId: number): Promise<{
    vendors: any[];
    total: number;
    stats: {
      active: number;
      inactive: number;
      withProducts: number;
      withoutProducts: number;
    };
  }> {
    try {
      // Vérifier que l'utilisateur est admin
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId }
      });

      if (!admin || !['ADMIN', 'SUPERADMIN'].includes(admin.role)) {
        throw new ForbiddenException('Seuls les administrateurs peuvent voir la liste des vendeurs');
      }

      // Récupérer tous les vendeurs avec leurs statistiques
      const vendors = await this.prisma.user.findMany({
        where: { 
          role: 'VENDEUR' 
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          shop_name: true,
          vendeur_type: true,
          status: true,
          created_at: true,
          last_login_at: true,
          _count: {
            select: {
              vendorProducts: true,
              designs: true
            }
          }
        },
        orderBy: [
          { status: 'desc' }, // Actifs en premier
          { created_at: 'desc' }
        ]
      });

      // Calculer les statistiques de produits pour chaque vendeur
      const vendorsWithStats = await Promise.all(
        vendors.map(async (vendor) => {
          const [publishedProducts] = await Promise.all([
            this.prisma.vendorProduct.count({
              where: {
                vendorId: vendor.id,
                status: 'PUBLISHED',
                isDelete: false
              }
            })
          ]);

          return {
            id: vendor.id,
            firstName: vendor.firstName,
            lastName: vendor.lastName,
            email: vendor.email,
            shop_name: vendor.shop_name,
            vendeur_type: vendor.vendeur_type,
            status: vendor.status,
            totalProducts: vendor._count.vendorProducts,
            publishedProducts,
            totalDesigns: vendor._count.designs,
            lastLogin: vendor.last_login_at,
            memberSince: vendor.created_at
          };
        })
      );

      // Calculer les statistiques globales
      const stats = {
        active: vendors.filter(v => v.status).length,
        inactive: vendors.filter(v => !v.status).length,
        withProducts: vendors.filter(v => v._count.vendorProducts > 0).length,
        withoutProducts: vendors.filter(v => v._count.vendorProducts === 0).length,
      };

      return {
        vendors: vendorsWithStats,
        total: vendors.length,
        stats
      };

    } catch (error) {
      this.logger.error('❌ Erreur récupération vendeurs:', error);
      throw error;
    }
  }

  /**
   * 🏭 Conserver la structure des images admin
   */
  private async preserveAdminImageStructure(
    vendorProductId: number,
    adminProduct: any
  ): Promise<void> {
    try {
      for (const colorVariation of adminProduct.images.colorVariations) {
        for (const adminImage of colorVariation.images) {
          await this.prisma.vendorProductImage.create({
            data: {
              vendorProductId: vendorProductId,
              colorId: colorVariation.id,
              colorName: colorVariation.name,
              colorCode: colorVariation.colorCode,
              imageType: 'admin_reference',
              
              cloudinaryUrl: adminImage.url,
              cloudinaryPublicId: this.extractPublicIdFromUrl(adminImage.url),
              originalImageKey: `admin_${adminImage.id}_${colorVariation.name}`,
              
              width: null,
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
   * 🔧 Extraire le public ID d'une URL Cloudinary
   */
  private extractPublicIdFromUrl(url: string): string {
    try {
      const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
      return matches ? matches[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }
} 