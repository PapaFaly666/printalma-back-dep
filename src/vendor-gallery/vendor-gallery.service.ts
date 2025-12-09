import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { GalleryStatus } from '@prisma/client';

const GALLERY_CONSTRAINTS = {
  IMAGES_COUNT: 5,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  CAPTION_MAX_LENGTH: 200,
};

@Injectable()
export class VendorGalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // NOUVELLES MÉTHODES POUR GALERIE UNIQUE PAR VENDEUR

  async getGalleryByVendorId(vendorId: number) {
    const gallery = await this.prisma.vendorGallery.findFirst({
      where: {
        vendorId,
        deletedAt: null,
      },
      include: {
        images: {
          orderBy: { orderPosition: 'asc' },
        },
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true,
            avatar: true,
          },
        },
      },
    });

    if (!gallery) {
      return null;
    }

    return {
      ...gallery,
      images_count: gallery.images.length,
    };
  }

  async getPublishedGalleryByVendorId(vendorId: number) {
    const gallery = await this.prisma.vendorGallery.findFirst({
      where: {
        vendorId,
        deletedAt: null,
        isPublished: true,
        status: GalleryStatus.PUBLISHED,
      },
      include: {
        images: {
          orderBy: { orderPosition: 'asc' },
        },
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true,
            avatar: true,
          },
        },
      },
    });

    if (!gallery) {
      return null;
    }

    return {
      ...gallery,
      images_count: gallery.images.length,
    };
  }

  async createOrUpdateGallery(
    vendorId: number,
    createGalleryDto: CreateGalleryDto,
    files: Express.Multer.File[],
  ) {
    if (!files || files.length !== GALLERY_CONSTRAINTS.IMAGES_COUNT) {
      throw new BadRequestException(
        `Une galerie doit contenir exactement ${GALLERY_CONSTRAINTS.IMAGES_COUNT} images`,
      );
    }

    for (const file of files) {
      if (file.size > GALLERY_CONSTRAINTS.MAX_IMAGE_SIZE) {
        throw new BadRequestException(
          `Le fichier ${file.originalname} dépasse la taille maximale de 5MB`,
        );
      }

      if (!GALLERY_CONSTRAINTS.ALLOWED_FORMATS.includes(file.mimetype)) {
        throw new BadRequestException(
          `Le fichier ${file.originalname} a un format non supporté. Formats acceptés: JPEG, PNG, WebP`,
        );
      }
    }

    try {
      // Vérifier si le vendeur a déjà une galerie (même supprimée) avant la transaction
      const existingGalleryBefore = await this.prisma.vendorGallery.findFirst({
        where: {
          vendorId,
        },
        include: { images: true },
      });

      const gallery = await this.prisma.$transaction(async (prisma) => {
        // Utiliser la galerie trouvée précédemment
        let existingGallery = existingGalleryBefore;

        let gallery;
        let imagesToDelete: any[] = [];

        if (existingGallery) {
          // Si la galerie est supprimée, la restaurer
          if (existingGallery.deletedAt) {
            gallery = await prisma.vendorGallery.update({
              where: { id: existingGallery.id },
              data: {
                title: createGalleryDto.title,
                description: createGalleryDto.description || null,
                status: GalleryStatus.DRAFT,
                deletedAt: null,
                updatedAt: new Date(),
              },
            });
          } else {
            // Supprimer les anciennes images de Cloudinary
            if (existingGallery.images.length > 0) {
              imagesToDelete = existingGallery.images;
            }

            // Mettre à jour la galerie existante
            gallery = await prisma.vendorGallery.update({
              where: { id: existingGallery.id },
              data: {
                title: createGalleryDto.title,
                description: createGalleryDto.description || null,
                status: GalleryStatus.DRAFT,
                updatedAt: new Date(),
              },
            });
          }
        } else {
          // Créer une nouvelle galerie
          try {
            gallery = await prisma.vendorGallery.create({
              data: {
                vendorId,
                title: createGalleryDto.title,
                description: createGalleryDto.description || null,
                status: GalleryStatus.DRAFT,
              },
            });
          } catch (error) {
            // Si création échoue à cause de la contrainte unique, essayer de trouver et mettre à jour
            if (error.code === 'P2002') {
              console.log('Tentative de création échouée, recherche de la galerie existante...');
              const fallbackGallery = await prisma.vendorGallery.findFirst({
                where: { vendorId },
                include: { images: true },
              });

              if (fallbackGallery) {
                gallery = await prisma.vendorGallery.update({
                  where: { id: fallbackGallery.id },
                  data: {
                    title: createGalleryDto.title,
                    description: createGalleryDto.description || null,
                    status: GalleryStatus.DRAFT,
                    deletedAt: null,
                    updatedAt: new Date(),
                  },
                });
                existingGallery = fallbackGallery;
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          }
        }

        // Supprimer les anciennes images de la base de données
        if (imagesToDelete.length > 0) {
          await prisma.galleryImage.deleteMany({
            where: {
              galleryId: gallery.id,
            },
          });
        }

        // Uploader les nouvelles images
        const uploadedImages = await Promise.all(
          files.map(async (file, index) => {
            const uploadResult = await this.cloudinaryService.uploadImage(
              file,
              `galleries/vendor_${vendorId}`,
            );

            const caption = createGalleryDto.captions?.[index]?.caption || null;

            return prisma.galleryImage.create({
              data: {
                galleryId: gallery.id,
                imageUrl: uploadResult.secure_url,
                imagePath: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                caption,
                orderPosition: index + 1,
                fileSize: uploadResult.bytes,
                mimeType: file.mimetype,
                width: uploadResult.width,
                height: uploadResult.height,
              },
            });
          }),
        );

        // Nettoyer les anciennes images de Cloudinary en arrière-plan
        setTimeout(async () => {
          for (const image of imagesToDelete) {
            try {
              await this.cloudinaryService.deleteImage(image.publicId);
            } catch (error) {
              console.error(`Erreur suppression image ${image.publicId}:`, error);
            }
          }
        }, 1000);

        return {
          ...gallery,
          images: uploadedImages,
        };
      });

      // Récupérer la galerie complète avec les infos du vendeur
      const completeGallery = await this.getGalleryByVendorId(vendorId);

      return {
        success: true,
        message: existingGalleryBefore && !existingGalleryBefore.deletedAt
          ? 'Galerie mise à jour avec succès'
          : 'Galerie créée avec succès',
        data: completeGallery,
      };
    } catch (error) {
      console.error('Erreur création/mise à jour galerie:', error);

      // Nettoyer les fichiers uploadés en cas d'erreur
      for (const file of files) {
        try {
          if ((file as any).cloudinaryPublicId) {
            await this.cloudinaryService.deleteImage((file as any).cloudinaryPublicId);
          }
        } catch (cleanupError) {
          console.error('Erreur nettoyage fichier:', cleanupError);
        }
      }

      throw new InternalServerErrorException(
        'Erreur lors de la création/mise à jour de la galerie',
      );
    }
  }

  async updateGalleryByVendorId(
    vendorId: number,
    updateGalleryDto: UpdateGalleryDto,
  ) {
    const gallery = await this.prisma.vendorGallery.findFirst({
      where: { vendorId, deletedAt: null },
    });

    if (!gallery) {
      throw new NotFoundException('Aucune galerie trouvée pour ce vendeur');
    }

    const updatedGallery = await this.prisma.vendorGallery.update({
      where: { id: gallery.id },
      data: {
        ...(updateGalleryDto.title && { title: updateGalleryDto.title }),
        ...(updateGalleryDto.description !== undefined && {
          description: updateGalleryDto.description,
        }),
        ...(updateGalleryDto.status && { status: updateGalleryDto.status }),
        ...(updateGalleryDto.is_published !== undefined && {
          isPublished: updateGalleryDto.is_published,
        }),
      },
      include: {
        images: {
          orderBy: { orderPosition: 'asc' },
        },
      },
    });

    const completeGallery = await this.getGalleryByVendorId(vendorId);

    return {
      success: true,
      message: 'Galerie mise à jour avec succès',
      data: completeGallery,
    };
  }

  async toggleGalleryPublishByVendorId(
    vendorId: number,
    isPublished: boolean,
  ) {
    const gallery = await this.prisma.vendorGallery.findFirst({
      where: { vendorId, deletedAt: null },
      include: { images: true },
    });

    if (!gallery) {
      throw new NotFoundException('Aucune galerie trouvée pour ce vendeur');
    }

    if (isPublished && gallery.images.length !== GALLERY_CONSTRAINTS.IMAGES_COUNT) {
      throw new BadRequestException(
        `Une galerie doit avoir exactement ${GALLERY_CONSTRAINTS.IMAGES_COUNT} images pour être publiée`,
      );
    }

    await this.prisma.vendorGallery.update({
      where: { id: gallery.id },
      data: {
        isPublished,
        status: isPublished ? GalleryStatus.PUBLISHED : GalleryStatus.DRAFT,
      },
    });

    return {
      success: true,
      message: isPublished ? 'Galerie publiée' : 'Galerie dépubliée',
    };
  }

  async deleteGalleryByVendorId(vendorId: number) {
    const gallery = await this.prisma.vendorGallery.findFirst({
      where: { vendorId, deletedAt: null },
      include: { images: true },
    });

    if (!gallery) {
      throw new NotFoundException('Aucune galerie trouvée pour ce vendeur');
    }

    await this.prisma.vendorGallery.update({
      where: { id: gallery.id },
      data: { deletedAt: new Date() },
    });

    // Nettoyer les images de Cloudinary en arrière-plan
    setTimeout(async () => {
      for (const image of gallery.images) {
        try {
          await this.cloudinaryService.deleteImage(image.publicId);
        } catch (error) {
          console.error(`Erreur suppression image ${image.publicId}:`, error);
        }
      }
    }, 1000);

    return {
      success: true,
      message: 'Galerie supprimée avec succès',
    };
  }

  async getGalleryStats(vendorId: number) {
    const gallery = await this.prisma.vendorGallery.findFirst({
      where: { vendorId, deletedAt: null },
      include: { images: true },
    });

    if (!gallery) {
      return {
        success: true,
        data: {
          hasGallery: false,
          isPublished: false,
          imagesCount: 0,
          canPublish: false,
        },
      };
    }

    return {
      success: true,
      data: {
        hasGallery: true,
        isPublished: gallery.isPublished,
        status: gallery.status,
        imagesCount: gallery.images.length,
        canPublish: gallery.images.length === GALLERY_CONSTRAINTS.IMAGES_COUNT,
        title: gallery.title,
        createdAt: gallery.createdAt,
        updatedAt: gallery.updatedAt,
      },
    };
  }

  async createGallery(
    vendorId: number,
    createGalleryDto: CreateGalleryDto,
    files: Express.Multer.File[],
  ) {
    if (!files || files.length !== GALLERY_CONSTRAINTS.IMAGES_COUNT) {
      throw new BadRequestException(
        `Une galerie doit contenir exactement ${GALLERY_CONSTRAINTS.IMAGES_COUNT} images`,
      );
    }

    for (const file of files) {
      if (file.size > GALLERY_CONSTRAINTS.MAX_IMAGE_SIZE) {
        throw new BadRequestException(
          `Le fichier ${file.originalname} dépasse la taille maximale de 5MB`,
        );
      }

      if (!GALLERY_CONSTRAINTS.ALLOWED_FORMATS.includes(file.mimetype)) {
        throw new BadRequestException(
          `Le fichier ${file.originalname} a un format non supporté. Formats acceptés: JPEG, PNG, WebP`,
        );
      }
    }

    try {
      const gallery = await this.prisma.$transaction(async (prisma) => {
        const newGallery = await prisma.vendorGallery.create({
          data: {
            vendorId,
            title: createGalleryDto.title,
            description: createGalleryDto.description || null,
            status: GalleryStatus.DRAFT,
          },
        });

        const uploadedImages = await Promise.all(
          files.map(async (file, index) => {
            const uploadResult = await this.cloudinaryService.uploadImage(
              file,
              `galleries/vendor_${vendorId}`,
            );

            const caption = createGalleryDto.captions?.[index]?.caption || null;

            return prisma.galleryImage.create({
              data: {
                galleryId: newGallery.id,
                imageUrl: uploadResult.secure_url,
                imagePath: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                caption,
                orderPosition: index + 1,
                fileSize: uploadResult.bytes,
                mimeType: file.mimetype,
                width: uploadResult.width,
                height: uploadResult.height,
              },
            });
          }),
        );

        return {
          ...newGallery,
          images: uploadedImages,
        };
      });

      return {
        success: true,
        message: 'Galerie créée avec succès',
        data: gallery,
      };
    } catch (error) {
      console.error('Erreur création galerie:', error);

      for (const file of files) {
        try {
          if ((file as any).cloudinaryPublicId) {
            await this.cloudinaryService.deleteImage((file as any).cloudinaryPublicId);
          }
        } catch (cleanupError) {
          console.error('Erreur nettoyage fichier:', cleanupError);
        }
      }

      throw new InternalServerErrorException(
        'Erreur lors de la création de la galerie',
      );
    }
  }

  async getVendorGalleries(
    vendorId: number,
    page: number = 1,
    limit: number = 10,
    status?: GalleryStatus,
  ) {
    const offset = (page - 1) * limit;

    const where: any = {
      vendorId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const [galleries, total] = await Promise.all([
      this.prisma.vendorGallery.findMany({
        where,
        include: {
          images: {
            orderBy: { orderPosition: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.vendorGallery.count({ where }),
    ]);

    const galleriesWithCount = galleries.map((gallery) => ({
      ...gallery,
      images_count: gallery.images.length,
    }));

    return {
      success: true,
      data: {
        galleries: galleriesWithCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getGalleryById(galleryId: number, vendorId?: number) {
    const where: any = { id: galleryId };

    if (vendorId) {
      where.vendorId = vendorId;
    }

    const gallery = await this.prisma.vendorGallery.findFirst({
      where,
      include: {
        images: {
          orderBy: { orderPosition: 'asc' },
        },
      },
    });

    if (!gallery) {
      throw new NotFoundException('Galerie non trouvée');
    }

    return {
      ...gallery,
      images_count: gallery.images.length,
    };
  }

  async updateGallery(
    galleryId: number,
    vendorId: number,
    updateGalleryDto: UpdateGalleryDto,
  ) {
    const gallery = await this.prisma.vendorGallery.findFirst({
      where: { id: galleryId, vendorId },
    });

    if (!gallery) {
      throw new NotFoundException('Galerie non trouvée');
    }

    const updatedGallery = await this.prisma.vendorGallery.update({
      where: { id: galleryId },
      data: {
        ...(updateGalleryDto.title && { title: updateGalleryDto.title }),
        ...(updateGalleryDto.description !== undefined && {
          description: updateGalleryDto.description,
        }),
        ...(updateGalleryDto.status && { status: updateGalleryDto.status }),
        ...(updateGalleryDto.is_published !== undefined && {
          isPublished: updateGalleryDto.is_published,
        }),
      },
      include: {
        images: {
          orderBy: { orderPosition: 'asc' },
        },
      },
    });

    return {
      success: true,
      message: 'Galerie mise à jour avec succès',
      data: updatedGallery,
    };
  }

  async deleteGallery(galleryId: number, vendorId: number) {
    const gallery = await this.prisma.vendorGallery.findFirst({
      where: { id: galleryId, vendorId },
      include: { images: true },
    });

    if (!gallery) {
      throw new NotFoundException('Galerie non trouvée');
    }

    await this.prisma.vendorGallery.update({
      where: { id: galleryId },
      data: { deletedAt: new Date() },
    });

    for (const image of gallery.images) {
      try {
        await this.cloudinaryService.deleteImage(image.publicId);
      } catch (error) {
        console.error(`Erreur suppression image ${image.publicId}:`, error);
      }
    }

    return {
      success: true,
      message: 'Galerie supprimée avec succès',
    };
  }

  async togglePublish(
    galleryId: number,
    vendorId: number,
    isPublished: boolean,
  ) {
    const gallery = await this.prisma.vendorGallery.findFirst({
      where: { id: galleryId, vendorId },
      include: { images: true },
    });

    if (!gallery) {
      throw new NotFoundException('Galerie non trouvée');
    }

    if (gallery.images.length !== GALLERY_CONSTRAINTS.IMAGES_COUNT) {
      throw new BadRequestException(
        `Une galerie doit avoir exactement ${GALLERY_CONSTRAINTS.IMAGES_COUNT} images pour être publiée`,
      );
    }

    await this.prisma.vendorGallery.update({
      where: { id: galleryId },
      data: {
        isPublished,
        status: isPublished ? GalleryStatus.PUBLISHED : GalleryStatus.DRAFT,
      },
    });

    return {
      success: true,
      message: isPublished ? 'Galerie publiée' : 'Galerie dépubliée',
    };
  }

  async getPublishedGalleries(vendorId?: number, page: number = 1, limit: number = 12) {
    const offset = (page - 1) * limit;

    const where: any = {
      isPublished: true,
      deletedAt: null,
      status: GalleryStatus.PUBLISHED,
    };

    if (vendorId) {
      where.vendorId = vendorId;
    }

    const [galleries, total] = await Promise.all([
      this.prisma.vendorGallery.findMany({
        where,
        include: {
          images: {
            orderBy: { orderPosition: 'asc' },
          },
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              shop_name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.vendorGallery.count({ where }),
    ]);

    return {
      success: true,
      data: {
        galleries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }
}
