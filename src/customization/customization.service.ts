import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCustomizationDto, UpdateCustomizationDto } from './dto/create-customization.dto';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

@Injectable()
export class CustomizationService {
  private readonly logger = new Logger(CustomizationService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) {}

  /**
   * Créer ou mettre à jour une personnalisation
   * Si une personnalisation existe déjà pour le même produit/user/session, la mettre à jour
   */
  async upsertCustomization(
    dto: CreateCustomizationDto,
    userId?: number,
    customizationId?: number
  ) {
    this.logger.log(`Sauvegarde personnalisation - Product: ${dto.productId}, User: ${userId || 'guest'}, CustomizationId: ${customizationId || 'new'}`);

    // Debug: vérifier ce qui arrive dans le service
    this.logger.log(`📥 DTO reçu dans service:`);
    this.logger.log(`  - designElements: ${dto.designElements ? `présent (${dto.designElements.length} éléments)` : 'absent'}`);
    this.logger.log(`  - elementsByView: ${dto.elementsByView ? `présent (${Object.keys(dto.elementsByView).length} vues)` : 'absent'}`);

    // Normaliser les données - Convertir designElements en elementsByView si nécessaire
    let normalizedElementsByView: Record<string, any[]>;

    if (dto.elementsByView) {
      // Format multi-vues fourni directement
      normalizedElementsByView = dto.elementsByView;
      this.logger.log(`  - Utilisation de elementsByView (${Object.keys(dto.elementsByView).length} vues)`);
    } else if (dto.designElements) {
      // Format simple - Convertir en format multi-vues
      const viewKey = `${dto.colorVariationId}-${dto.viewId}`;
      normalizedElementsByView = {
        [viewKey]: dto.designElements
      };
      this.logger.log(`  - Conversion de designElements vers elementsByView[${viewKey}] (${dto.designElements.length} éléments)`);
    } else {
      // Aucun élément fourni
      const viewKey = `${dto.colorVariationId}-${dto.viewId}`;
      normalizedElementsByView = {
        [viewKey]: []
      };
      this.logger.warn(`  ⚠️ Aucun élément de design fourni!`);
    }

    // 🔧 VALIDATION: Détecter et corriger les arrays imbriqués dans elementsByView
    Object.keys(normalizedElementsByView).forEach(viewKey => {
      const elements = normalizedElementsByView[viewKey];

      if (elements.length > 0 && Array.isArray(elements[0])) {
        this.logger.warn(`⚠️ BUG DÉTECTÉ dans vue ${viewKey}: array imbriqué! Correction automatique...`);

        // Si c'est [[]], extraire le contenu
        if (elements.length === 1 && Array.isArray(elements[0])) {
          normalizedElementsByView[viewKey] = elements[0];
        }
      }

      // Filtrer les éléments invalides
      normalizedElementsByView[viewKey] = normalizedElementsByView[viewKey].filter(el => {
        if (!el || typeof el !== 'object' || Array.isArray(el)) {
          this.logger.warn(`⚠️ Élément invalide filtré dans vue ${viewKey}: ${JSON.stringify(el)}`);
          return false;
        }
        return true;
      });
    });

    // Compter le total d'éléments
    const totalElements = Object.values(normalizedElementsByView).reduce((sum, elements) => sum + elements.length, 0);
    this.logger.debug(`  - Total éléments: ${totalElements}`);
    if (totalElements > 0) {
      const firstView = Object.keys(normalizedElementsByView)[0];
      const firstElement = normalizedElementsByView[firstView][0];
      this.logger.debug(`  - Premier élément (vue ${firstView}): ${JSON.stringify(firstElement).substring(0, 150)}...`);
    }

    // Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    // Calculer le prix total (si sizeSelections fourni)
    const totalQuantity = dto.sizeSelections?.reduce((sum, s) => sum + s.quantity, 0) || 0;
    const totalPrice = totalQuantity * Number(product.price);

    // Préparer designElements pour Prisma (pour compatibilité)
    // On stocke les éléments de la première vue comme designElements
    const firstViewKey = Object.keys(normalizedElementsByView)[0];
    let designElementsForPrisma = normalizedElementsByView[firstViewKey] || [];

    // 🔧 VALIDATION: Détecter et corriger le bug du double array wrapping
    if (designElementsForPrisma.length > 0 && Array.isArray(designElementsForPrisma[0])) {
      this.logger.warn(`⚠️ BUG DÉTECTÉ: designElements contient un array imbriqué! Correction automatique...`);
      this.logger.debug(`  Avant: ${JSON.stringify(designElementsForPrisma).substring(0, 100)}`);

      // Si c'est [[]], on doit utiliser le premier élément (qui est lui-même un array)
      // Si c'est [[{...}]], extraire le contenu
      if (designElementsForPrisma.length === 1 && Array.isArray(designElementsForPrisma[0])) {
        designElementsForPrisma = designElementsForPrisma[0];
      }

      this.logger.debug(`  Après: ${JSON.stringify(designElementsForPrisma).substring(0, 100)}`);
    }

    // 🔧 VALIDATION: S'assurer que designElementsForPrisma est un array d'objets valides
    if (Array.isArray(designElementsForPrisma)) {
      // Filtrer les éléments qui ne sont pas des objets valides
      designElementsForPrisma = designElementsForPrisma.filter(el => {
        if (!el || typeof el !== 'object' || Array.isArray(el)) {
          this.logger.warn(`⚠️ Élément invalide filtré: ${JSON.stringify(el)}`);
          return false;
        }
        return true;
      });
    }

    // Données communes pour update - Cast en type Prisma compatible
    const updateData = {
      colorVariationId: dto.colorVariationId,
      viewId: dto.viewId,
      designElements: designElementsForPrisma as any,  // Format simple (compatibilité)
      elementsByView: normalizedElementsByView as any,  // Format multi-vues (nouveau)
      delimitations: (dto.delimitations as any) || null,
      sizeSelections: (dto.sizeSelections as any) || null,
      previewImageUrl: dto.previewImageUrl,
      totalPrice,
      timestamp: dto.timestamp ? BigInt(dto.timestamp) : null,
      sessionId: userId ? null : dto.sessionId,
      status: 'draft',
      ...(dto.vendorProductId && { vendorProductId: dto.vendorProductId }),
    };

    // Données pour create (inclut productId et userId)
    const createData = {
      ...updateData,
      productId: dto.productId,
      ...(userId && { userId }),  // Seulement si userId existe
    };

    this.logger.debug(`📦 Data to save:`);
    this.logger.debug(`  - elementsByView vues: ${Object.keys(normalizedElementsByView).join(', ')}`);
    this.logger.debug(`  - designElements count (compat): ${designElementsForPrisma.length}`);
    this.logger.debug(`  - Total éléments (toutes vues): ${totalElements}`);
    if (totalElements > 0) {
      this.logger.debug(`  - First element keys: ${Object.keys(normalizedElementsByView[firstViewKey][0]).join(', ')}`);
    }

    // Si un customizationId est fourni, mettre à jour directement cette personnalisation
    if (customizationId) {
      const existingCustomization = await this.prisma.productCustomization.findUnique({
        where: { id: customizationId }
      });

      if (!existingCustomization) {
        throw new NotFoundException(`Customization with ID ${customizationId} not found`);
      }

      // Vérifier les permissions (l'utilisateur doit être propriétaire ou c'est une session guest)
      if (userId && existingCustomization.userId !== userId) {
        throw new NotFoundException(`Customization not found or access denied`);
      }

      if (!userId && existingCustomization.sessionId !== dto.sessionId) {
        throw new NotFoundException(`Customization not found or access denied`);
      }

      this.logger.log(`Mise à jour personnalisation spécifique: ${customizationId}`);
      const updated = await this.prisma.productCustomization.update({
        where: { id: customizationId },
        data: updateData,
        include: {
          product: {
            include: {
              colorVariations: {
                include: {
                  images: true
                }
              }
            }
          }
        }
      });

      // Debug: vérifier ce qui est retourné
      this.logger.debug(`✅ Updated customization ${updated.id}:`);
      this.logger.debug(`  - designElements: ${Array.isArray(updated.designElements) ? (updated.designElements as any[]).length : 0} éléments`);
      this.logger.debug(`  - elementsByView: ${updated.elementsByView ? JSON.stringify(updated.elementsByView).substring(0, 200) + '...' : 'null'}`);

      return updated;
    }

    // Sinon, chercher une personnalisation existante pour ce produit
    const existingCustomization = await this.prisma.productCustomization.findFirst({
      where: {
        productId: dto.productId,
        ...(userId ? { userId } : { sessionId: dto.sessionId }),
        status: 'draft'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (existingCustomization) {
      // Mettre à jour la plus récente
      this.logger.log(`Mise à jour personnalisation existante: ${existingCustomization.id}`);
      const updated = await this.prisma.productCustomization.update({
        where: { id: existingCustomization.id },
        data: updateData,
        include: {
          product: {
            include: {
              colorVariations: {
                include: {
                  images: true
                }
              }
            }
          }
        }
      });

      this.logger.debug(`✅ Updated draft ${updated.id}:`);
      this.logger.debug(`  - designElements: ${Array.isArray(updated.designElements) ? (updated.designElements as any[]).length : 0} éléments`);
      this.logger.debug(`  - elementsByView: ${updated.elementsByView ? JSON.stringify(updated.elementsByView).substring(0, 200) + '...' : 'null'}`);

      return updated;
    } else {
      // Créer nouveau
      this.logger.log('Création nouvelle personnalisation');
      const created = await this.prisma.productCustomization.create({
        data: createData,
        include: {
          product: {
            include: {
              colorVariations: {
                include: {
                  images: true
                }
              }
            }
          }
        }
      });

      this.logger.debug(`✅ Created customization ${created.id}:`);
      this.logger.debug(`  - designElements: ${Array.isArray(created.designElements) ? (created.designElements as any[]).length : 0} éléments`);
      this.logger.debug(`  - elementsByView: ${created.elementsByView ? JSON.stringify(created.elementsByView).substring(0, 200) + '...' : 'null'}`);

      return created;
    }
  }

  /**
   * Récupérer une personnalisation par ID
   */
  async getCustomizationById(id: number) {
    const customization = await this.prisma.productCustomization.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      }
    });

    if (!customization) {
      throw new NotFoundException(`Customization with ID ${id} not found`);
    }

    return customization;
  }

  /**
   * Récupérer toutes les personnalisations d'un utilisateur
   */
  async getUserCustomizations(userId: number, status?: string) {
    return this.prisma.productCustomization.findMany({
      where: {
        userId,
        ...(status && { status })
      },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Récupérer les personnalisations d'une session (guest)
   */
  async getSessionCustomizations(sessionId: string, status?: string) {
    return this.prisma.productCustomization.findMany({
      where: {
        sessionId,
        ...(status && { status })
      },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Mettre à jour une personnalisation
   */
  async updateCustomization(id: number, dto: UpdateCustomizationDto) {
    // Vérifier que la personnalisation existe
    await this.getCustomizationById(id);

    return this.prisma.productCustomization.update({
      where: { id },
      data: {
        ...(dto.designElements && { designElements: JSON.parse(JSON.stringify(dto.designElements)) }),
        ...(dto.sizeSelections && { sizeSelections: JSON.parse(JSON.stringify(dto.sizeSelections)) }),
        ...(dto.previewImageUrl && { previewImageUrl: dto.previewImageUrl }),
        ...(dto.status && { status: dto.status })
      },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Supprimer une personnalisation
   */
  async deleteCustomization(id: number) {
    await this.getCustomizationById(id);

    return this.prisma.productCustomization.delete({
      where: { id }
    });
  }

  /**
   * Marquer une personnalisation comme commandée
   */
  async markAsOrdered(id: number, orderId: number) {
    return this.prisma.productCustomization.update({
      where: { id },
      data: {
        status: 'ordered',
        orderId
      }
    });
  }

  /**
   * Migrer les personnalisations d'une session guest vers un utilisateur connecté
   * Utilisé lors de la connexion/inscription
   */
  async migrateGuestCustomizations(sessionId: string, userId: number) {
    this.logger.log(`Migration des personnalisations de session ${sessionId} vers utilisateur ${userId}`);

    // Récupérer toutes les personnalisations de la session
    const guestCustomizations = await this.prisma.productCustomization.findMany({
      where: {
        sessionId,
        userId: null, // S'assurer que ce sont bien des personnalisations guest
      }
    });

    if (guestCustomizations.length === 0) {
      this.logger.log('Aucune personnalisation guest à migrer');
      return { migrated: 0, customizations: [] };
    }

    // Mettre à jour toutes les personnalisations pour les lier à l'utilisateur
    const updatePromises = guestCustomizations.map(customization =>
      this.prisma.productCustomization.update({
        where: { id: customization.id },
        data: {
          userId,
          sessionId: null, // Retirer le sessionId car l'utilisateur est maintenant connecté
        }
      })
    );

    const migratedCustomizations = await Promise.all(updatePromises);

    this.logger.log(`${migratedCustomizations.length} personnalisation(s) migrée(s) avec succès`);

    return {
      migrated: migratedCustomizations.length,
      customizations: migratedCustomizations
    };
  }

  /**
   * Récupérer une personnalisation draft pour un produit spécifique
   * Utile pour continuer une personnalisation en cours
   */
  async getDraftCustomizationForProduct(
    productId: number,
    userId?: number,
    sessionId?: string
  ) {
    const customization = await this.prisma.productCustomization.findFirst({
      where: {
        productId,
        status: 'draft',
        ...(userId ? { userId } : { sessionId })
      },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return customization;
  }

  /**
   * Rechercher des personnalisations avec filtres
   * GET /api/customizations?productId=123&sessionId=guest_abc123&userId=789
   */
  async findCustomizations(filters: {
    productId?: number;
    sessionId?: string;
    userId?: number;
    status?: string;
  }) {
    const where: any = {};

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    } else if (filters.sessionId) {
      where.sessionId = filters.sessionId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return this.prisma.productCustomization.findMany({
      where,
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Upload d'une image pour une personnalisation
   * POST /api/customizations/upload-image
   */
  async uploadCustomizationImage(file: Express.Multer.File) {
    this.logger.log(`Upload image personnalisation: ${file.originalname}`);

    // Valider le fichier
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Vérifier la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Vérifier le type MIME
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`);
    }

    // Upload vers Cloudinary
    const result = await this.cloudinaryService.uploadImage(file, 'customizations');

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  }

  /**
   * Upload d'une image de prévisualisation (mockup)
   */
  async uploadPreviewImage(base64Data: string) {
    this.logger.log('Upload preview image');

    if (!base64Data) {
      throw new BadRequestException('No image data provided');
    }

    // Vérifier le format base64
    if (!base64Data.startsWith('data:image/')) {
      throw new BadRequestException('Invalid base64 format');
    }

    const result = await this.cloudinaryService.uploadBase64(base64Data, {
      folder: 'customization-previews',
      quality: 'auto:good'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  }

  /**
   * Valider les éléments de design selon la spécification
   * IMPORTANT: Les retours à la ligne (\n) dans le texte DOIVENT être préservés
   */
  validateDesignElements(elements: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxElements = 50; // Limite le nombre d'éléments par personnalisation

    if (!Array.isArray(elements)) {
      return { valid: false, errors: ['designElements must be an array'] };
    }

    if (elements.length > maxElements) {
      errors.push(`Too many elements: ${elements.length}. Maximum is ${maxElements}`);
    }

    elements.forEach((element, index) => {
      // Champs obligatoires pour tous les éléments
      if (!element.id || typeof element.id !== 'string') {
        errors.push(`Element ${index}: id is required and must be a string`);
      }

      if (!element.type || !['text', 'image'].includes(element.type)) {
        errors.push(`Element ${index}: type must be "text" or "image"`);
      }

      // Vérifier les coordonnées (0-1)
      if (typeof element.x !== 'number' || element.x < 0 || element.x > 1) {
        errors.push(`Element ${index}: x must be a number between 0 and 1 (got ${element.x})`);
      }
      if (typeof element.y !== 'number' || element.y < 0 || element.y > 1) {
        errors.push(`Element ${index}: y must be a number between 0 and 1 (got ${element.y})`);
      }

      // Vérifier les dimensions
      if (typeof element.width !== 'number' || element.width <= 0) {
        errors.push(`Element ${index}: width must be a positive number`);
      }
      if (typeof element.height !== 'number' || element.height <= 0) {
        errors.push(`Element ${index}: height must be a positive number`);
      }

      // Rotation
      if (typeof element.rotation !== 'number') {
        errors.push(`Element ${index}: rotation must be a number`);
      }

      // zIndex
      if (typeof element.zIndex !== 'number') {
        errors.push(`Element ${index}: zIndex must be a number`);
      }

      // Validations spécifiques au type
      if (element.type === 'text') {
        // Texte - IMPORTANT: peut contenir des \n pour les retours à la ligne
        if (typeof element.text !== 'string') {
          errors.push(`Element ${index}: text must be a string`);
        }
        if (element.text && element.text.length > 500) {
          errors.push(`Element ${index}: text exceeds 500 characters`);
        }

        // Taille de police (10-100 selon la spec)
        if (typeof element.fontSize !== 'number' || element.fontSize < 10 || element.fontSize > 100) {
          errors.push(`Element ${index}: fontSize must be a number between 10 and 100 (got ${element.fontSize})`);
        }

        // Police
        if (!element.fontFamily || typeof element.fontFamily !== 'string') {
          errors.push(`Element ${index}: fontFamily is required and must be a string`);
        }

        // Couleur (format hex strict)
        if (!element.color || !/^#[0-9A-Fa-f]{6}$/.test(element.color)) {
          errors.push(`Element ${index}: color must be a valid hex color (e.g., #000000)`);
        }

        // fontWeight
        if (!['normal', 'bold'].includes(element.fontWeight)) {
          errors.push(`Element ${index}: fontWeight must be "normal" or "bold"`);
        }

        // fontStyle
        if (!['normal', 'italic'].includes(element.fontStyle)) {
          errors.push(`Element ${index}: fontStyle must be "normal" or "italic"`);
        }

        // textDecoration
        if (!['none', 'underline'].includes(element.textDecoration)) {
          errors.push(`Element ${index}: textDecoration must be "none" or "underline"`);
        }

        // textAlign
        if (!['left', 'center', 'right'].includes(element.textAlign)) {
          errors.push(`Element ${index}: textAlign must be "left", "center", or "right"`);
        }
      }

      if (element.type === 'image') {
        // URL d'image requise
        if (!element.imageUrl) {
          errors.push(`Element ${index}: imageUrl is required for image elements`);
        }

        // Vérifier que l'URL est valide (domaines autorisés)
        if (element.imageUrl) {
          const allowedDomains = ['res.cloudinary.com', 'localhost', '127.0.0.1'];
          try {
            const url = new URL(element.imageUrl);
            const isAllowed = allowedDomains.some(domain => url.hostname.includes(domain));
            if (!isAllowed && !element.imageUrl.startsWith('/')) {
              errors.push(`Element ${index}: imageUrl domain not allowed`);
            }
          } catch {
            // URL relative ou invalide
            if (!element.imageUrl.startsWith('/')) {
              errors.push(`Element ${index}: invalid imageUrl`);
            }
          }
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Version améliorée de upsertCustomization avec validation
   */
  async upsertCustomizationWithValidation(
    dto: CreateCustomizationDto,
    userId?: number,
    customizationId?: number
  ) {
    // Valider les éléments de design
    const validation = this.validateDesignElements(dto.designElements);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid design elements',
        errors: validation.errors
      });
    }

    // Appeler la méthode existante
    return this.upsertCustomization(dto, userId, customizationId);
  }
}
