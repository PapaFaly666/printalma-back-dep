import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { CreateDesignerDto } from './dto/create-designer.dto';
import { UpdateDesignerDto } from './dto/update-designer.dto';

@Injectable()
export class DesignerService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Upload de l'avatar du designer
   * Support: jpg, jpeg, png, gif, webp, SVG
   * Taille max: 10MB
   */
  private async uploadAvatar(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    try {
      // Validation du type de fichier
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Type de fichier non supporté: ${file.mimetype}. Formats acceptés: JPG, PNG, GIF, WEBP, SVG`
        );
      }

      // Validation de la taille (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new BadRequestException(
          `Le fichier est trop volumineux (${Math.round(file.size / 1024 / 1024)}MB). Taille maximale: 10MB`
        );
      }

      console.log(`📤 Upload avatar: ${file.originalname} (${Math.round(file.size / 1024)}KB, ${file.mimetype})`);

      // Utiliser la méthode spécifique pour les avatars designers
      const result = await this.cloudinaryService.uploadDesignerAvatar(file);

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('❌ Erreur upload avatar designer:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        error.message || 'Erreur lors de l\'upload de l\'avatar'
      );
    }
  }

  /**
   * Récupérer tous les designers (Admin)
   */
  async getAllDesigners() {
    try {
      const designers = await this.prisma.designer.findMany({
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      });

      const total = await this.prisma.designer.count();

      return {
        designers,
        total,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des designers:', error);
      throw new BadRequestException('Erreur lors de la récupération des designers');
    }
  }

  /**
   * Créer un nouveau designer
   */
  async createDesigner(
    createDto: CreateDesignerDto,
    avatarFile: Express.Multer.File,
    createdById: number,
  ) {
    try {
      // Déterminer le prochain sortOrder
      const maxSortOrder = await this.prisma.designer.findFirst({
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });

      const nextSortOrder = maxSortOrder ? maxSortOrder.sortOrder + 1 : 1;

      // Upload de l'avatar si fourni
      let avatarUrl: string | null = null;
      let avatarPublicId: string | null = null;

      if (avatarFile) {
        const uploadResult = await this.uploadAvatar(avatarFile);
        avatarUrl = uploadResult.url;
        avatarPublicId = uploadResult.publicId;
      }

      // Créer le designer
      const designer = await this.prisma.designer.create({
        data: {
          name: createDto.name,
          displayName: createDto.displayName,
          bio: createDto.bio,
          avatarUrl,
          avatarPublicId,
          isActive: createDto.isActive ?? true,
          sortOrder: createDto.sortOrder ?? nextSortOrder,
          createdBy: createdById,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return designer;
    } catch (error) {
      console.error('Erreur lors de la création du designer:', error);
      throw new BadRequestException('Erreur lors de la création du designer');
    }
  }

  /**
   * Mettre à jour un designer
   */
  async updateDesigner(
    id: number,
    updateDto: UpdateDesignerDto,
    avatarFile?: Express.Multer.File,
  ) {
    try {
      // Vérifier que le designer existe
      const existingDesigner = await this.prisma.designer.findUnique({
        where: { id },
      });

      if (!existingDesigner) {
        throw new NotFoundException(`Designer #${id} non trouvé`);
      }

      // Gérer l'upload de l'avatar
      let avatarUrl = existingDesigner.avatarUrl;
      let avatarPublicId = existingDesigner.avatarPublicId;

      if (avatarFile) {
        const uploadResult = await this.uploadAvatar(avatarFile);
        avatarUrl = uploadResult.url;
        avatarPublicId = uploadResult.publicId;

        // Supprimer l'ancien avatar si il existe
        if (existingDesigner.avatarPublicId) {
          try {
            await this.cloudinaryService.deleteImage(existingDesigner.avatarPublicId);
            console.log('Ancien avatar supprimé:', existingDesigner.avatarPublicId);
          } catch (error) {
            console.warn('Erreur suppression ancien avatar:', error);
          }
        }
      } else if (updateDto.removeAvatar) {
        // Supprimer l'avatar existant
        if (existingDesigner.avatarPublicId) {
          try {
            await this.cloudinaryService.deleteImage(existingDesigner.avatarPublicId);
            console.log('Avatar supprimé:', existingDesigner.avatarPublicId);
          } catch (error) {
            console.warn('Erreur suppression avatar:', error);
          }
        }
        avatarUrl = null;
        avatarPublicId = null;
      }

      // Créer l'objet de mise à jour
      const updateData: any = {
        ...updateDto,
        avatarUrl,
        avatarPublicId,
        updatedAt: new Date(),
      };

      // Supprimer les champs undefined et removeAvatar
      delete updateData.removeAvatar;
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      // Effectuer la mise à jour
      const updatedDesigner = await this.prisma.designer.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return updatedDesigner;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du designer:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Erreur lors de la mise à jour du designer');
    }
  }

  /**
   * Supprimer un designer
   */
  async deleteDesigner(id: number): Promise<void> {
    try {
      const designer = await this.prisma.designer.findUnique({
        where: { id },
      });

      if (!designer) {
        throw new NotFoundException(`Designer #${id} non trouvé`);
      }

      // Supprimer l'avatar de Cloudinary si il existe
      if (designer.avatarPublicId) {
        try {
          await this.cloudinaryService.deleteImage(designer.avatarPublicId);
          console.log('Avatar supprimé:', designer.avatarPublicId);
        } catch (error) {
          console.warn('Erreur suppression avatar:', error);
        }
      }

      // Supprimer le designer
      await this.prisma.designer.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du designer:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Erreur lors de la suppression du designer');
    }
  }

  /**
   * Récupérer les designers en vedette (Public)
   */
  async getFeaturedDesigners() {
    try {
      const designers = await this.prisma.designer.findMany({
        where: {
          isFeatured: true,
          isActive: true,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          featuredOrder: 'asc',
        },
      });

      return designers;
    } catch (error) {
      console.error('Erreur lors de la récupération des designers en vedette:', error);
      throw new BadRequestException('Erreur lors de la récupération des designers en vedette');
    }
  }

  /**
   * Mettre à jour les designers en vedette
   */
  async updateFeaturedDesigners(designerIds: string[]): Promise<any[]> {
    try {
      // Validation
      if (designerIds.length === 0) {
        throw new BadRequestException('Au moins 1 designer doit être sélectionné');
      }

      if (designerIds.length < 6) {
        throw new BadRequestException('Exactement 6 designers doivent être sélectionnés');
      }

      if (designerIds.length > 6) {
        throw new BadRequestException('Maximum 6 designers autorisés');
      }

      // Convertir les IDs en nombres
      const numericIds = designerIds.map(id => parseInt(id, 10));

      // Vérifier que tous les designers existent
      const existingDesigners = await this.prisma.designer.findMany({
        where: {
          id: { in: numericIds },
        },
      });

      if (existingDesigners.length !== numericIds.length) {
        const foundIds = existingDesigners.map(d => d.id);
        const missingIds = numericIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(
          `Les designers suivants n'existent pas: ${missingIds.join(', ')}`
        );
      }

      // Vérifier que tous les designers sont actifs
      const inactiveDesigners = existingDesigners.filter(d => !d.isActive);
      if (inactiveDesigners.length > 0) {
        const inactiveNames = inactiveDesigners.map(d => d.name);
        throw new BadRequestException(
          `Les designers suivants sont inactifs: ${inactiveNames.join(', ')}`
        );
      }

      // Transaction atomique
      return await this.prisma.$transaction(async (tx) => {
        // Réinitialiser tous les designers
        await tx.designer.updateMany({
          where: {},
          data: {
            isFeatured: false,
            featuredOrder: null,
          },
        });

        // Mettre à jour les designers sélectionnés
        const updatedDesigners = [];

        for (let i = 0; i < numericIds.length; i++) {
          const designer = await tx.designer.update({
            where: { id: numericIds[i] },
            data: {
              isFeatured: true,
              featuredOrder: i + 1,
            },
            include: {
              creator: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });

          updatedDesigners.push(designer);
        }

        return updatedDesigners;
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des designers en vedette:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Erreur lors de la mise à jour des designers en vedette');
    }
  }
}
