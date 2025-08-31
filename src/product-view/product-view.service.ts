import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';

@Injectable()
export class ProductViewService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // Temporary stub methods to prevent controller errors
  async create(createProductViewDto: any, file?: Express.Multer.File) {
    throw new BadRequestException('ProductView service is temporarily disabled. Please use the new product API with ProductImage.');
  }

  async findAllByProductId(productId: number) {
    throw new BadRequestException('ProductView service is temporarily disabled. Please use the new product API with ProductImage.');
  }

  async findOne(id: number) {
    throw new BadRequestException('ProductView service is temporarily disabled. Please use the new product API with ProductImage.');
  }

  async update(id: number, viewType: string, description: string, file?: Express.Multer.File) {
    throw new BadRequestException('ProductView service is temporarily disabled. Please use the new product API with ProductImage.');
  }

  async remove(id: number) {
    throw new BadRequestException('ProductView service is temporarily disabled. Please use the new product API with ProductImage.');
  }

  /*
  // The ProductView model has been replaced by ProductImage in the new schema
  // This service is temporarily disabled

  async create(
    createProductViewDto: CreateProductViewDto,
    file?: Express.Multer.File,
  ) {
    try {
    // Vérifier si une vue de ce type existe déjà pour ce produit
    const existingView = await this.prisma.productView.findUnique({
      where: {
        productId_viewType: {
            productId: createProductViewDto.productId,
            viewType: createProductViewDto.viewType,
          },
        },
    });

    if (existingView) {
        throw new BadRequestException(
          `Une vue ${createProductViewDto.viewType} existe déjà pour ce produit`,
        );
    }

      let imageUrl = null;
      let imagePublicId = null;

      if (file) {
      // Télécharger l'image sur Cloudinary
        const uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'product-views',
        );
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      }

      return this.prisma.productView.create({
        data: {
          viewType: createProductViewDto.viewType,
          imageUrl,
          imagePublicId,
          description: createProductViewDto.description,
          productId: createProductViewDto.productId,
        },
        include: {
          product: true,
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la création de la vue: ${error.message}`,
      );
    }
  }

  async findAll() {
    return this.prisma.productView.findMany({
      include: {
        product: true,
      },
    });
  }

  async findOne(id: number) {
    const view = await this.prisma.productView.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!view) {
      throw new NotFoundException(`Vue avec l'ID ${id} non trouvée`);
    }

    return view;
  }

  async update(
    id: number,
    updateProductViewDto: UpdateProductViewDto,
    file?: Express.Multer.File,
  ) {
    try {
      // Vérifier si la vue existe
      const existingView = await this.findOne(id);

      let imageUrl = existingView.imageUrl;
      let imagePublicId = existingView.imagePublicId;

      if (file) {
        // Supprimer l'ancienne image si elle existe
        if (existingView.imagePublicId) {
          await this.cloudinaryService.deleteImage(existingView.imagePublicId);
        }

        // Télécharger la nouvelle image
        const uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'product-views',
        );
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      }

      return this.prisma.productView.update({
        where: { id },
        data: {
          viewType: updateProductViewDto.viewType,
          imageUrl,
          imagePublicId,
          description: updateProductViewDto.description,
        },
        include: {
          product: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la mise à jour de la vue: ${error.message}`,
      );
    }
  }

  async remove(id: number) {
    try {
      // Récupérer la vue pour obtenir l'ID public de l'image
      const view = await this.findOne(id);

      // Supprimer l'image de Cloudinary si elle existe
      if (view.imagePublicId) {
        await this.cloudinaryService.deleteImage(view.imagePublicId);
      }

      return this.prisma.productView.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la suppression de la vue: ${error.message}`,
      );
    }
  }

  // Trouver toutes les vues d'un produit spécifique
  async findByProduct(productId: number) {
    return this.prisma.productView.findMany({
      where: { productId },
      include: {
        product: true,
      },
    });
  }

  // Trouver une vue spécifique d'un produit par type
  async findByProductAndType(productId: number, viewType: string) {
    const view = await this.prisma.productView.findUnique({
      where: {
        productId_viewType: {
          productId,
          viewType,
        },
      },
      include: {
        product: true,
      },
    });

    if (!view) {
      throw new NotFoundException(
        `Vue ${viewType} non trouvée pour le produit ${productId}`,
      );
    }

    return view;
  }
  */
}