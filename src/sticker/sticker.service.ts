import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateStickerDto } from './dto/create-sticker.dto';
import { UpdateStickerDto } from './dto/update-sticker.dto';
import { StickerQueryDto, PublicStickerQueryDto } from './dto/sticker-query.dto';
import { StickerGeneratorService } from './services/sticker-generator.service';
import { StickerCloudinaryService } from './services/sticker-cloudinary.service';

@Injectable()
export class StickerService {
  private readonly logger = new Logger(StickerService.name);

  constructor(
    private prisma: PrismaService,
    private stickerGenerator: StickerGeneratorService,
    private stickerCloudinary: StickerCloudinaryService,
  ) {}

  /**
   * Créer un nouveau sticker
   */
  async create(vendorId: number, createDto: CreateStickerDto) {
    this.logger.log(`Création sticker pour vendeur ${vendorId}`);

    // Valider que le design existe et appartient au vendeur
    const design = await this.prisma.design.findFirst({
      where: {
        id: createDto.designId,
        vendorId: vendorId,
        isValidated: true,
      },
    });

    if (!design) {
      throw new BadRequestException(
        'Design introuvable ou non validé. Le design doit vous appartenir et être validé.'
      );
    }

    // Valider les dimensions (min 1cm, max 100cm)
    if (createDto.size.width < 1 || createDto.size.width > 100) {
      throw new BadRequestException('La largeur doit être entre 1 et 100 cm');
    }

    if (createDto.size.height < 1 || createDto.size.height > 100) {
      throw new BadRequestException('La hauteur doit être entre 1 et 100 cm');
    }

    // Valider le prix (minimum 500 FCFA)
    if (createDto.price < 500) {
      throw new BadRequestException('Le prix minimum est de 500 FCFA');
    }

    // Générer SKU
    const sku = await this.generateSKU(vendorId, createDto.designId);

    // Créer le sticker (sans imageUrl pour l'instant)
    const sticker = await this.prisma.stickerProduct.create({
      data: {
        vendorId,
        designId: createDto.designId,
        name: createDto.name,
        description: createDto.description,
        sku,
        sizeId: `${createDto.size.width}x${createDto.size.height}`, // ID généré automatiquement
        widthCm: createDto.size.width,
        heightCm: createDto.size.height,
        finish: createDto.finish || 'glossy', // Valeur par défaut
        shape: createDto.shape,
        basePrice: createDto.price, // Prix direct sans calcul
        finishMultiplier: 1.0, // Pas de multiplicateur
        finalPrice: createDto.price,
        minimumQuantity: createDto.minimumQuantity || 1,
        stockQuantity: createDto.stockQuantity,
        status: 'PUBLISHED', // Stickers directement publiés sans validation
        stickerType: createDto.stickerType || 'autocollant', // Persister le type
        borderColor: createDto.borderColor || 'glossy-white', // Persister la couleur de bordure
        publishedAt: new Date(), // Date de publication immédiate
      },
      include: {
        design: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            thumbnailUrl: true,
          },
        },
        vendor: {
          select: {
            id: true,
            shop_name: true,
          },
        },
      },
    });

    this.logger.log(`✅ Sticker créé: ${sticker.id} (SKU: ${sku})`);

    // GÉNÉRATION DE L'IMAGE DU STICKER
    try {
      this.logger.log(`🎨 Génération de l'image du sticker ${sticker.id}...`);

      // Déterminer le type de sticker et la couleur de bordure
      const stickerType = createDto.stickerType || 'autocollant';
      const borderColor = createDto.borderColor || 'glossy-white';

      // Construire la chaîne de taille pour le générateur
      const sizeString = `${createDto.size.width} cm x ${createDto.size.height} cm`;

      // Générer l'image du sticker avec bordures
      const stickerImageBuffer = await this.stickerGenerator.createStickerFromDesign(
        design.imageUrl,
        stickerType,
        borderColor,
        sizeString,
        createDto.shape
      );

      this.logger.log(`✅ Image générée (${stickerImageBuffer.length} bytes)`);

      // Upload sur Cloudinary
      this.logger.log(`☁️ Upload sur Cloudinary...`);

      const { url: imageUrl, publicId } = await this.stickerCloudinary.uploadStickerToCloudinary(
        stickerImageBuffer,
        sticker.id,
        createDto.designId
      );

      // Mettre à jour l'URL de l'image dans la BDD
      this.logger.log(`💾 Mise à jour BDD - Sticker ID: ${sticker.id}, URL: ${imageUrl}, PublicID: ${publicId}`);

      const updated = await this.prisma.stickerProduct.update({
        where: { id: sticker.id },
        data: {
          imageUrl,
          cloudinaryPublicId: publicId,
        },
      });

      this.logger.log(`✅ BDD mise à jour - imageUrl: ${updated.imageUrl}, cloudinaryPublicId: ${updated.cloudinaryPublicId}`);

      // Récupérer le sticker mis à jour
      const updatedSticker = await this.prisma.stickerProduct.findUnique({
        where: { id: sticker.id },
        include: {
          design: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              thumbnailUrl: true,
            },
          },
          vendor: {
            select: {
              id: true,
              shop_name: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Sticker créé avec succès',
        productId: updatedSticker.id,
        data: this.formatStickerResponse(updatedSticker),
      };

    } catch (error) {
      // En cas d'erreur, on log mais on retourne quand même le sticker
      // (l'image pourra être générée plus tard)
      this.logger.error(`❌ Erreur génération/upload image: ${error.message}`);

      return {
        success: true,
        message: 'Sticker créé avec succès (image en cours de génération)',
        productId: sticker.id,
        data: this.formatStickerResponse(sticker),
        warning: 'L\'image du sticker sera générée ultérieurement',
      };
    }
  }

  /**
   * Lister les stickers du vendeur
   */
  async findAllByVendor(vendorId: number, query: StickerQueryDto) {
    const { status, page, limit, sortBy, sortOrder } = query;

    const where: any = {
      vendorId,
    };

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [stickers, total] = await Promise.all([
      this.prisma.stickerProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: this.buildOrderBy(sortBy, sortOrder),
        include: {
          design: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              thumbnailUrl: true,
            },
          },
        },
      }),
      this.prisma.stickerProduct.count({ where }),
    ]);

    return {
      success: true,
      data: {
        stickers: stickers.map(s => this.formatListResponse(s)),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    };
  }

  /**
   * Obtenir les détails d'un sticker
   */
  async findOne(id: number, vendorId?: number) {
    const sticker = await this.prisma.stickerProduct.findUnique({
      where: { id },
      include: {
        design: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            thumbnailUrl: true,
            categoryId: true,
          },
        },
        vendor: {
          select: {
            id: true,
            shop_name: true,
          },
        },
      },
    });

    if (!sticker) {
      throw new NotFoundException('Sticker introuvable');
    }

    // Si vendorId est fourni, vérifier la propriété
    if (vendorId && sticker.vendorId !== vendorId) {
      throw new ForbiddenException('Vous n\'avez pas accès à ce sticker');
    }

    return {
      success: true,
      data: this.formatDetailResponse(sticker),
    };
  }

  /**
   * Mettre à jour un sticker
   */
  async update(id: number, vendorId: number, updateDto: UpdateStickerDto) {
    // Vérifier que le sticker existe et appartient au vendeur
    const sticker = await this.prisma.stickerProduct.findUnique({
      where: { id },
    });

    if (!sticker) {
      throw new NotFoundException('Sticker introuvable');
    }

    if (sticker.vendorId !== vendorId) {
      throw new ForbiddenException('Vous n\'avez pas le droit de modifier ce sticker');
    }

    const updated = await this.prisma.stickerProduct.update({
      where: { id },
      data: {
        ...updateDto,
        publishedAt: updateDto.status === 'PUBLISHED' ? new Date() : sticker.publishedAt,
      },
      include: {
        design: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Sticker mis à jour avec succès',
      data: this.formatStickerResponse(updated),
    };
  }

  /**
   * Régénérer l'image d'un sticker avec les nouveaux paramètres de bordure
   * Utile pour appliquer de nouvelles épaisseurs de bordure sans recréer le sticker
   */
  async regenerateImage(id: number, vendorId: number) {
    this.logger.log(`🔄 Régénération image sticker ID: ${id}`);

    // Récupérer le sticker avec toutes les infos nécessaires
    const sticker = await this.prisma.stickerProduct.findUnique({
      where: { id },
      include: {
        design: true,
      },
    });

    if (!sticker) {
      throw new NotFoundException('Sticker introuvable');
    }

    if (sticker.vendorId !== vendorId) {
      throw new ForbiddenException('Vous n\'avez pas le droit de modifier ce sticker');
    }

    // Récupérer le type de sticker depuis les métadonnées
    const stickerType = sticker.stickerType as 'autocollant' | 'pare-chocs' || 'autocollant';
    const borderColor = sticker.borderColor as 'transparent' | 'white' | 'glossy-white' | 'matte-white' || 'glossy-white';
    const shape = sticker.shape as 'SQUARE' | 'CIRCLE' | 'RECTANGLE' | 'DIE_CUT' || 'SQUARE';

    // Taille en cm depuis les dimensions du sticker
    const sizeString = `${sticker.widthCm} cm x ${sticker.heightCm} cm`;

    // Générer la nouvelle image avec les nouveaux paramètres de bordure
    this.logger.log(`🎨 Génération nouvelle image avec bordures ${stickerType} (${borderColor})`);
    const stickerImageBuffer = await this.stickerGenerator.createStickerFromDesign(
      sticker.design.imageUrl,
      stickerType,
      borderColor,
      sizeString,
      shape
    );

    this.logger.log(`✅ Nouvelle image générée (${stickerImageBuffer.length} bytes)`);

    // Supprimer l'ancienne image de Cloudinary
    if (sticker.cloudinaryPublicId) {
      this.logger.log(`🗑️ Suppression ancienne image: ${sticker.cloudinaryPublicId}`);
      await this.stickerCloudinary.deleteStickerFromCloudinary(sticker.cloudinaryPublicId);
    }

    // Upload la nouvelle image sur Cloudinary
    this.logger.log(`☁️ Upload nouvelle image sur Cloudinary...`);
    const { url: imageUrl, publicId } = await this.stickerCloudinary.uploadStickerToCloudinary(
      stickerImageBuffer,
      sticker.id,
      sticker.designId
    );

    // Mettre à jour l'URL de l'image dans la BDD
    this.logger.log(`💾 Mise à jour BDD - Sticker ID: ${sticker.id}, URL: ${imageUrl}`);
    const updated = await this.prisma.stickerProduct.update({
      where: { id: sticker.id },
      data: {
        imageUrl,
        cloudinaryPublicId: publicId,
      },
      include: {
        design: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Image du sticker régénérée avec succès',
      data: this.formatStickerResponse(updated),
    };
  }

  /**
   * Supprimer un sticker
   */
  async remove(id: number, vendorId: number) {
    const sticker = await this.prisma.stickerProduct.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });

    if (!sticker) {
      throw new NotFoundException('Sticker introuvable');
    }

    if (sticker.vendorId !== vendorId) {
      throw new ForbiddenException('Vous n\'avez pas le droit de supprimer ce sticker');
    }

    // Empêcher la suppression s'il y a des commandes
    if (sticker.orderItems.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer un sticker qui a des commandes associées'
      );
    }

    // Supprimer l'image de Cloudinary si elle existe
    if (sticker.cloudinaryPublicId) {
      try {
        this.logger.log(`🗑️ Suppression image Cloudinary: ${sticker.cloudinaryPublicId}`);
        await this.stickerCloudinary.deleteStickerFromCloudinary(sticker.cloudinaryPublicId);
      } catch (error) {
        // Logger l'erreur mais continuer la suppression
        this.logger.warn(`⚠️ Échec suppression Cloudinary (non bloquant): ${error.message}`);
      }
    }

    // Supprimer le sticker de la BDD
    await this.prisma.stickerProduct.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Sticker supprimé avec succès',
    };
  }

  /**
   * Liste publique des stickers
   */
  async findAllPublic(query: PublicStickerQueryDto) {
    const { search, vendorId, size, finish, minPrice, maxPrice, page, limit } = query;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (size) {
      where.sizeId = size;
    }

    if (finish) {
      where.finish = finish;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.finalPrice = {};
      if (minPrice !== undefined) where.finalPrice.gte = minPrice;
      if (maxPrice !== undefined) where.finalPrice.lte = maxPrice;
    }

    const skip = (page - 1) * limit;

    const [stickers, total, filters] = await Promise.all([
      this.prisma.stickerProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          design: {
            select: {
              imageUrl: true,
              thumbnailUrl: true,
            },
          },
          vendor: {
            select: {
              id: true,
              shop_name: true,
            },
          },
        },
      }),
      this.prisma.stickerProduct.count({ where }),
      this.getFilters(),
    ]);

    return {
      success: true,
      data: {
        stickers: stickers.map(s => this.formatPublicResponse(s)),
        filters,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    };
  }

  /**
   * Obtenir les configurations disponibles
   */
  async getConfigurations() {
    return {
      success: true,
      data: {
        shapes: [
          { id: 'SQUARE', name: 'Carré', description: 'Forme carrée classique' },
          { id: 'CIRCLE', name: 'Cercle', description: 'Forme ronde' },
          { id: 'RECTANGLE', name: 'Rectangle', description: 'Forme rectangulaire' },
          { id: 'DIE_CUT', name: 'Découpe personnalisée', description: 'Découpé selon la forme du design' },
        ],
        stickerTypes: [
          { id: 'autocollant', name: 'Autocollant', description: 'Bordure fine avec effets 3D' },
          { id: 'pare-chocs', name: 'Pare-chocs', description: 'Bordure épaisse simple' },
        ],
        borderColors: [
          { id: 'glossy-white', name: 'Blanc brillant', description: 'Bordure blanche avec effet brillant' },
          { id: 'white', name: 'Blanc', description: 'Bordure blanche simple' },
          { id: 'matte-white', name: 'Blanc mat', description: 'Bordure blanche mate' },
          { id: 'transparent', name: 'Transparent', description: 'Sans bordure' },
        ],
      },
    };
  }

  /**
   * Générer un SKU unique
   */
  private async generateSKU(vendorId: number, designId: number): Promise<string> {
    // Compter le nombre de stickers pour ce vendeur ET ce design
    const count = await this.prisma.stickerProduct.count({
      where: {
        vendorId,
        designId,
      },
    });

    // Ajouter un timestamp pour garantir l'unicité en cas de création simultanée
    const timestamp = Date.now().toString().slice(-6);
    return `STK-${vendorId}-${designId}-${count + 1}-${timestamp}`;
  }

  /**
   * Construire la clause orderBy
   */
  private buildOrderBy(sortBy: string, sortOrder: string) {
    const orderMap: Record<string, string> = {
      created_at: 'createdAt',
      price: 'finalPrice',
      sale_count: 'saleCount',
      view_count: 'viewCount',
    };

    return {
      [orderMap[sortBy] || 'createdAt']: sortOrder || 'desc',
    };
  }

  /**
   * Obtenir les filtres disponibles
   */
  private async getFilters() {
    const priceRange = await this.prisma.stickerProduct.aggregate({
      where: { status: 'PUBLISHED' },
      _min: { finalPrice: true },
      _max: { finalPrice: true },
    });

    return {
      priceRange: {
        min: priceRange._min.finalPrice || 500,
        max: priceRange._max.finalPrice || 5000,
      },
      shapes: ['SQUARE', 'CIRCLE', 'RECTANGLE', 'DIE_CUT'],
    };
  }

  /**
   * Formater la réponse complète
   */
  private formatStickerResponse(sticker: any) {
    return {
      id: sticker.id,
      vendorId: sticker.vendorId,
      designId: sticker.designId,
      name: sticker.name,
      sku: sticker.sku,
      size: {
        width: parseFloat(sticker.widthCm.toString()),
        height: parseFloat(sticker.heightCm.toString()),
      },
      finish: sticker.finish,
      shape: sticker.shape,
      basePrice: sticker.basePrice,
      finishMultiplier: parseFloat(sticker.finishMultiplier.toString()),
      finalPrice: sticker.finalPrice,
      status: sticker.status,
      imageUrl: sticker.imageUrl,
      createdAt: sticker.createdAt,
    };
  }

  /**
   * Formater la réponse liste
   */
  private formatListResponse(sticker: any) {
    return {
      id: sticker.id,
      name: sticker.name,
      designPreview: sticker.design?.thumbnailUrl || sticker.design?.imageUrl,
      stickerImage: sticker.imageUrl,
      size: `${sticker.widthCm}x${sticker.heightCm}cm`,
      finish: sticker.finish,
      price: sticker.finalPrice,
      status: sticker.status,
      saleCount: sticker.saleCount,
      viewCount: sticker.viewCount,
      createdAt: sticker.createdAt,
    };
  }

  /**
   * Formater la réponse détaillée
   */
  private formatDetailResponse(sticker: any) {
    return {
      id: sticker.id,
      vendor: {
        id: sticker.vendor.id,
        shopName: sticker.vendor.shop_name,
      },
      design: {
        id: sticker.design.id,
        name: sticker.design.name,
        imageUrl: sticker.design.imageUrl,
        category: sticker.design.categoryId,
      },
      name: sticker.name,
      description: sticker.description,
      sku: sticker.sku,
      imageUrl: sticker.imageUrl,
      configuration: {
        size: {
          width: parseFloat(sticker.widthCm.toString()),
          height: parseFloat(sticker.heightCm.toString()),
        },
        finish: sticker.finish,
        shape: sticker.shape,
      },
      pricing: {
        basePrice: sticker.basePrice,
        finishMultiplier: parseFloat(sticker.finishMultiplier.toString()),
        finalPrice: sticker.finalPrice,
        currency: 'FCFA',
      },
      stock: {
        quantity: sticker.stockQuantity,
        minimumOrder: sticker.minimumQuantity,
      },
      status: sticker.status,
      stats: {
        viewCount: sticker.viewCount,
        saleCount: sticker.saleCount,
      },
      createdAt: sticker.createdAt,
      publishedAt: sticker.publishedAt,
    };
  }

  /**
   * Formater la réponse publique
   */
  private formatPublicResponse(sticker: any) {
    return {
      id: sticker.id,
      name: sticker.name,
      description: sticker.description,
      imageUrl: sticker.imageUrl || sticker.design?.thumbnailUrl || sticker.design?.imageUrl,
      vendor: {
        id: sticker.vendor.id,
        shopName: sticker.vendor.shop_name,
      },
      size: `${sticker.widthCm}x${sticker.heightCm}cm`,
      finish: sticker.finish,
      shape: sticker.shape,
      price: sticker.finalPrice,
      minimumOrder: sticker.minimumQuantity,
      viewCount: sticker.viewCount,
      saleCount: sticker.saleCount,
    };
  }
}
