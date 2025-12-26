import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateStickerDto } from './dto/create-sticker.dto';
import { UpdateStickerDto } from './dto/update-sticker.dto';
import { StickerQueryDto, PublicStickerQueryDto } from './dto/sticker-query.dto';

@Injectable()
export class StickerService {
  private readonly logger = new Logger(StickerService.name);

  constructor(private prisma: PrismaService) {}

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

    // Valider la taille
    const size = await this.prisma.stickerSize.findUnique({
      where: { id: createDto.size.id },
    });

    if (!size || !size.isActive) {
      throw new BadRequestException('Taille de sticker invalide');
    }

    // Valider la finition
    const finish = await this.prisma.stickerFinish.findUnique({
      where: { id: createDto.finish },
    });

    if (!finish || !finish.isActive) {
      throw new BadRequestException('Finition invalide');
    }

    // Valider les dimensions
    if (
      createDto.size.width !== parseFloat(size.widthCm.toString()) ||
      createDto.size.height !== parseFloat(size.heightCm.toString())
    ) {
      throw new BadRequestException('Les dimensions ne correspondent pas à la taille sélectionnée');
    }

    // Valider le prix
    const calculatedPrice = Math.round(
      parseInt(size.basePrice.toString()) * parseFloat(finish.priceMultiplier.toString())
    );

    if (Math.abs(createDto.price - calculatedPrice) > 100) {
      throw new BadRequestException(
        `Prix invalide. Prix calculé: ${calculatedPrice} FCFA (basé sur taille: ${size.basePrice} × finition: ${finish.priceMultiplier})`
      );
    }

    // Générer SKU
    const sku = await this.generateSKU(vendorId, createDto.designId);

    // Créer le sticker
    const sticker = await this.prisma.stickerProduct.create({
      data: {
        vendorId,
        designId: createDto.designId,
        name: createDto.name,
        description: createDto.description,
        sku,
        sizeId: createDto.size.id,
        widthCm: createDto.size.width,
        heightCm: createDto.size.height,
        finish: createDto.finish,
        shape: createDto.shape,
        basePrice: parseInt(size.basePrice.toString()),
        finishMultiplier: parseFloat(finish.priceMultiplier.toString()),
        finalPrice: createDto.price,
        minimumQuantity: createDto.minimumQuantity || 1,
        stockQuantity: createDto.stockQuantity,
        status: 'PENDING', // Toujours en attente de validation
      },
      include: {
        size: true,
        finishConfig: true,
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

    return {
      success: true,
      message: 'Sticker créé avec succès',
      data: this.formatStickerResponse(sticker),
    };
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
          size: true,
          finishConfig: true,
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
        size: true,
        finishConfig: true,
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

    // Empêcher la modification si publié
    if (sticker.status === 'PUBLISHED' && updateDto.status !== 'DRAFT') {
      throw new BadRequestException(
        'Impossible de modifier un sticker publié. Passez-le en brouillon d\'abord.'
      );
    }

    const updated = await this.prisma.stickerProduct.update({
      where: { id },
      data: {
        ...updateDto,
        publishedAt: updateDto.status === 'PUBLISHED' ? new Date() : sticker.publishedAt,
      },
      include: {
        size: true,
        finishConfig: true,
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
          size: true,
          finishConfig: true,
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
    const [sizes, finishes] = await Promise.all([
      this.prisma.stickerSize.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.stickerFinish.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    return {
      success: true,
      data: {
        sizes: sizes.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          width: parseFloat(s.widthCm.toString()),
          height: parseFloat(s.heightCm.toString()),
          basePrice: parseInt(s.basePrice.toString()),
        })),
        finishes: finishes.map(f => ({
          id: f.id,
          name: f.name,
          description: f.description,
          priceMultiplier: parseFloat(f.priceMultiplier.toString()),
        })),
        shapes: [
          { id: 'SQUARE', name: 'Carré', description: 'Forme carrée classique' },
          { id: 'CIRCLE', name: 'Cercle', description: 'Forme ronde' },
          { id: 'RECTANGLE', name: 'Rectangle', description: 'Forme rectangulaire' },
          { id: 'DIE_CUT', name: 'Découpe personnalisée', description: 'Découpé selon la forme du design' },
        ],
      },
    };
  }

  /**
   * Générer un SKU unique
   */
  private async generateSKU(vendorId: number, designId: number): Promise<string> {
    const count = await this.prisma.stickerProduct.count({
      where: { vendorId },
    });
    return `STK-${vendorId}-${designId}-${count + 1}`;
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
    const [sizes, finishes, priceRange] = await Promise.all([
      this.prisma.stickerSize.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      }),
      this.prisma.stickerFinish.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      }),
      this.prisma.stickerProduct.aggregate({
        where: { status: 'PUBLISHED' },
        _min: { finalPrice: true },
        _max: { finalPrice: true },
      }),
    ]);

    return {
      sizes,
      finishes,
      priceRange: {
        min: priceRange._min.finalPrice || 500,
        max: priceRange._max.finalPrice || 5000,
      },
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
        id: sticker.size.id,
        name: sticker.size.name,
        width: parseFloat(sticker.widthCm.toString()),
        height: parseFloat(sticker.heightCm.toString()),
      },
      finish: sticker.finish,
      shape: sticker.shape,
      basePrice: sticker.basePrice,
      finishMultiplier: parseFloat(sticker.finishMultiplier.toString()),
      finalPrice: sticker.finalPrice,
      status: sticker.status,
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
      size: `${sticker.size.name} (${sticker.widthCm}x${sticker.heightCm}cm)`,
      finish: sticker.finishConfig.name,
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
      configuration: {
        size: {
          id: sticker.size.id,
          name: sticker.size.name,
          width: parseFloat(sticker.widthCm.toString()),
          height: parseFloat(sticker.heightCm.toString()),
        },
        finish: {
          id: sticker.finishConfig.id,
          name: sticker.finishConfig.name,
          multiplier: parseFloat(sticker.finishMultiplier.toString()),
        },
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
      imageUrl: sticker.design?.thumbnailUrl || sticker.design?.imageUrl,
      vendor: {
        id: sticker.vendor.id,
        shopName: sticker.vendor.shop_name,
      },
      size: `${sticker.size.name} (${sticker.widthCm}x${sticker.heightCm}cm)`,
      finish: sticker.finishConfig.name,
      shape: sticker.shape,
      price: sticker.finalPrice,
      minimumOrder: sticker.minimumQuantity,
      viewCount: sticker.viewCount,
      saleCount: sticker.saleCount,
    };
  }
}
