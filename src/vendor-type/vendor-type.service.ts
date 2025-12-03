import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateVendorTypeDto } from './dto/create-vendor-type.dto';
import { UpdateVendorTypeDto } from './dto/update-vendor-type.dto';
import { VendorWithDesignsAndProductsResponseDto, VendorsListResponseDto } from './dto/vendor-with-designs-products-response.dto';

@Injectable()
export class VendorTypeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau type de vendeur
   */
  async create(createVendorTypeDto: CreateVendorTypeDto) {
    const { label, description } = createVendorTypeDto;

    // Vérifier si le type existe déjà
    const existing = await this.prisma.vendorType.findUnique({
      where: { label },
    });

    if (existing) {
      throw new ConflictException(
        `Le type de vendeur "${label}" existe déjà`,
      );
    }

    // Créer le type
    const vendorType = await this.prisma.vendorType.create({
      data: {
        label,
        description,
      },
    });

    return {
      message: 'Type de vendeur créé avec succès',
      vendorType,
    };
  }

  /**
   * Récupérer tous les types de vendeurs
   */
  async findAll() {
    const vendorTypes = await this.prisma.vendorType.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        label: 'asc',
      },
    });

    return vendorTypes.map((type) => ({
      id: type.id,
      label: type.label,
      description: type.description,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
      userCount: type._count.users,
    }));
  }

  /**
   * Récupérer un type de vendeur par ID
   */
  async findOne(id: number) {
    const vendorType = await this.prisma.vendorType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!vendorType) {
      throw new NotFoundException(`Type de vendeur #${id} introuvable`);
    }

    return {
      id: vendorType.id,
      label: vendorType.label,
      description: vendorType.description,
      createdAt: vendorType.createdAt,
      updatedAt: vendorType.updatedAt,
      userCount: vendorType._count.users,
    };
  }

  /**
   * Mettre à jour un type de vendeur
   */
  async update(id: number, updateVendorTypeDto: UpdateVendorTypeDto) {
    // Vérifier si le type existe
    await this.findOne(id);

    // Si on modifie le label, vérifier l'unicité
    if (updateVendorTypeDto.label) {
      const existing = await this.prisma.vendorType.findFirst({
        where: {
          label: updateVendorTypeDto.label,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Le type de vendeur "${updateVendorTypeDto.label}" existe déjà`,
        );
      }
    }

    // Mettre à jour
    const vendorType = await this.prisma.vendorType.update({
      where: { id },
      data: updateVendorTypeDto,
    });

    return {
      message: 'Type de vendeur modifié avec succès',
      vendorType,
    };
  }

  /**
   * Supprimer un type de vendeur
   */
  async remove(id: number) {
    // Vérifier si le type existe
    const vendorType = await this.findOne(id);

    // Vérifier si des utilisateurs utilisent ce type
    if (vendorType.userCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce type car ${vendorType.userCount} vendeur(s) l'utilisent actuellement`,
      );
    }

    // Supprimer
    await this.prisma.vendorType.delete({
      where: { id },
    });

    return {
      message: 'Type de vendeur supprimé avec succès',
    };
  }

  /**
   * Vérifier si un type existe par label
   */
  async checkExists(label: string): Promise<boolean> {
    const count = await this.prisma.vendorType.count({
      where: { label },
    });
    return count > 0;
  }

  /**
   * Récupérer tous les vendeurs avec leurs designs et produits
   */
  async findAllVendorsWithDesignsAndProducts(
    page: number = 1,
    limit: number = 10,
    vendorTypeId?: number,
    country?: string,
  ): Promise<VendorsListResponseDto> {
    const skip = (page - 1) * limit;

    // Construire les filtres
    const where: any = {
      is_deleted: false,
      status: true,
      role: 'VENDEUR',
    };

    if (vendorTypeId) {
      where.vendorTypeId = vendorTypeId;
    }

    if (country) {
      where.country = country;
    }

    // Compter le nombre total de vendeurs
    const total = await this.prisma.user.count({ where });

    // Récupérer les vendeurs avec pagination (informations de base)
    const vendors = await this.prisma.user.findMany({
      where,
      include: {
        vendorType: {
          select: {
            id: true,
            label: true,
            description: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    });

    // Pour chaque vendeur, récupérer ses designs et produits
    const transformedVendors = await Promise.all(
      vendors.map(async (vendor) => {
        // Récupérer les designs du vendeur
        const designs = await this.prisma.design.findMany({
          where: { vendorId: vendor.id },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        // Récupérer les produits du vendeur
        const vendorProducts = await this.prisma.vendorProduct.findMany({
          where: { vendorId: vendor.id },
          include: {
            baseProduct: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                subCategory: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                variation: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            design: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        // Calculer les statistiques
        const totalDesigns = designs.length;
        const totalProducts = vendorProducts.length;
        const publishedDesigns = designs.filter((d) => d.isPublished).length;
        const validatedProducts = vendorProducts.filter((p) => p.isValidated).length;
        const totalDesignEarnings = designs.reduce((sum, d) => sum + d.earnings, 0);
        const totalProductRevenue = vendorProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
        const totalDesignViews = designs.reduce((sum, d) => sum + d.views, 0);
        const totalProductViews = vendorProducts.reduce((sum, p) => sum + p.viewsCount, 0);

        return {
          id: vendor.id,
          firstName: vendor.firstName,
          lastName: vendor.lastName,
          email: vendor.email,
          shopName: vendor.shop_name,
          photoProfil: vendor.photo_profil,
          avatar: vendor.avatar,
          address: vendor.address,
          country: vendor.country,
          phone: vendor.phone,
          profilePhotoUrl: vendor.profile_photo_url,
          status: vendor.status,
          vendorType: vendor.vendorType?.label,
          createdAt: vendor.created_at,
          lastLoginAt: vendor.last_login_at,
          designs: designs.map((design) => ({
            id: design.id,
            name: design.name,
            description: design.description,
            price: design.price,
            imageUrl: design.imageUrl,
            thumbnailUrl: design.thumbnailUrl,
            dimensions: design.dimensions,
            format: design.format,
            tags: design.tags,
            isValidated: design.isValidated,
            isPublished: design.isPublished,
            views: design.views,
            likes: design.likes,
            earnings: design.earnings,
            usageCount: design.usageCount,
            createdAt: design.createdAt,
            publishedAt: design.publishedAt,
            category: design.category,
            delimitations: design.dimensions, // Utiliser dimensions comme délimitations
            productPositions: [], // Simplifié pour cette réponse
          })),
          products: vendorProducts.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            status: product.status,
            isValidated: product.isValidated,
            salesCount: product.salesCount,
            totalRevenue: product.totalRevenue,
            averageRating: product.averageRating,
            isBestSeller: product.isBestSeller,
            bestSellerRank: product.bestSellerRank,
            bestSellerCategory: product.bestSellerCategory,
            viewsCount: product.viewsCount,
            designWidth: product.designWidth,
            designHeight: product.designHeight,
            designFormat: product.designFormat,
            designCloudinaryUrl: product.designCloudinaryUrl,
            designPositioning: product.designPositioning,
            designScale: product.designScale,
            sizes: product.sizes,
            colors: product.colors,
            createdAt: product.createdAt,
            validatedAt: product.validatedAt,
            baseProduct: product.baseProduct ? {
              id: product.baseProduct.id,
              name: product.baseProduct.name,
              description: product.baseProduct.description,
              category: product.baseProduct.category,
              subCategory: product.baseProduct.subCategory,
              variation: product.baseProduct.variation,
            } : undefined,
            design: product.design ? {
              id: product.design.id,
              name: product.design.name,
              description: product.design.description,
              price: product.design.price,
              imageUrl: product.design.imageUrl,
              thumbnailUrl: product.design.thumbnailUrl,
              dimensions: product.design.dimensions,
              format: product.design.format,
              tags: product.design.tags,
              isValidated: product.design.isValidated,
              isPublished: product.design.isPublished,
              views: product.design.views,
              likes: product.design.likes,
              earnings: product.design.earnings,
              usageCount: product.design.usageCount,
              createdAt: product.design.createdAt,
              publishedAt: product.design.publishedAt,
              category: designs.find(d => d.id === product.design.id)?.category,
              delimitations: product.design.dimensions,
              productPositions: [], // Simplifié pour cette réponse
            } : undefined,
          })),
          totalDesigns,
          totalProducts,
          publishedDesigns,
          validatedProducts,
          totalDesignEarnings,
          totalProductRevenue,
          totalDesignViews,
          totalProductViews,
        };
      }),
    );

    return {
      vendors: transformedVendors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupérer un vendeur spécifique avec ses designs et produits
   */
  async findVendorWithDesignsAndProducts(vendorId: number): Promise<VendorWithDesignsAndProductsResponseDto> {
    const vendor = await this.prisma.user.findFirst({
      where: {
        id: vendorId,
        is_deleted: false,
        status: true,
        role: 'VENDEUR',
      },
      include: {
        vendorType: {
          select: {
            id: true,
            label: true,
            description: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendeur #${vendorId} introuvable`);
    }

    // Récupérer les designs du vendeur
    const designs = await this.prisma.design.findMany({
      where: { vendorId: vendor.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Récupérer les produits du vendeur
    const vendorProducts = await this.prisma.vendorProduct.findMany({
      where: { vendorId: vendor.id },
      include: {
        baseProduct: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            subCategory: {
              select: {
                id: true,
                name: true,
              },
            },
            variation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        design: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculer les statistiques
    const totalDesigns = designs.length;
    const totalProducts = vendorProducts.length;
    const publishedDesigns = designs.filter((d) => d.isPublished).length;
    const validatedProducts = vendorProducts.filter((p) => p.isValidated).length;
    const totalDesignEarnings = designs.reduce((sum, d) => sum + d.earnings, 0);
    const totalProductRevenue = vendorProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalDesignViews = designs.reduce((sum, d) => sum + d.views, 0);
    const totalProductViews = vendorProducts.reduce((sum, p) => sum + p.viewsCount, 0);

    return {
      id: vendor.id,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      email: vendor.email,
      shopName: vendor.shop_name,
      photoProfil: vendor.photo_profil,
      avatar: vendor.avatar,
      address: vendor.address,
      country: vendor.country,
      phone: vendor.phone,
      profilePhotoUrl: vendor.profile_photo_url,
      status: vendor.status,
      vendorType: vendor.vendorType?.label,
      createdAt: vendor.created_at,
      lastLoginAt: vendor.last_login_at,
      designs: designs.map((design) => ({
        id: design.id,
        name: design.name,
        description: design.description,
        price: design.price,
        imageUrl: design.imageUrl,
        thumbnailUrl: design.thumbnailUrl,
        dimensions: design.dimensions,
        format: design.format,
        tags: design.tags,
        isValidated: design.isValidated,
        isPublished: design.isPublished,
        views: design.views,
        likes: design.likes,
        earnings: design.earnings,
        usageCount: design.usageCount,
        createdAt: design.createdAt,
        publishedAt: design.publishedAt,
        category: design.category,
        delimitations: design.dimensions, // Utiliser dimensions comme délimitations
        productPositions: [], // Simplifié pour cette réponse
      })),
      products: vendorProducts.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        status: product.status,
        isValidated: product.isValidated,
        salesCount: product.salesCount,
        totalRevenue: product.totalRevenue,
        averageRating: product.averageRating,
        isBestSeller: product.isBestSeller,
        bestSellerRank: product.bestSellerRank,
        bestSellerCategory: product.bestSellerCategory,
        viewsCount: product.viewsCount,
        designWidth: product.designWidth,
        designHeight: product.designHeight,
        designFormat: product.designFormat,
        designCloudinaryUrl: product.designCloudinaryUrl,
        designPositioning: product.designPositioning,
        designScale: product.designScale,
        sizes: product.sizes,
        colors: product.colors,
        createdAt: product.createdAt,
        validatedAt: product.validatedAt,
        baseProduct: product.baseProduct ? {
          id: product.baseProduct.id,
          name: product.baseProduct.name,
          description: product.baseProduct.description,
          category: product.baseProduct.category,
          subCategory: product.baseProduct.subCategory,
          variation: product.baseProduct.variation,
        } : undefined,
        design: product.design ? {
          id: product.design.id,
          name: product.design.name,
          description: product.design.description,
          price: product.design.price,
          imageUrl: product.design.imageUrl,
          thumbnailUrl: product.design.thumbnailUrl,
          dimensions: product.design.dimensions,
          format: product.design.format,
          tags: product.design.tags,
          isValidated: product.design.isValidated,
          isPublished: product.design.isPublished,
          views: product.design.views,
          likes: product.design.likes,
          earnings: product.design.earnings,
          usageCount: product.design.usageCount,
          createdAt: product.design.createdAt,
          publishedAt: product.design.publishedAt,
          category: designs.find(d => d.id === product.design.id)?.category,
          delimitations: product.design.dimensions,
          productPositions: [], // Simplifié pour cette réponse
        } : undefined,
      })),
      totalDesigns,
      totalProducts,
      publishedDesigns,
      validatedProducts,
      totalDesignEarnings,
      totalProductRevenue,
      totalDesignViews,
      totalProductViews,
    };
  }
}
