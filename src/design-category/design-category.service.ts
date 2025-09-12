import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { CreateDesignCategoryDto, UpdateDesignCategoryDto, ListDesignCategoriesQueryDto, DesignCategoryResponseDto } from './dto/create-design-category.dto';

@Injectable()
export class DesignCategoryService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Générer un slug unique à partir du nom
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[àáâäãåā]/g, 'a')
      .replace(/[èéêëē]/g, 'e')
      .replace(/[ìíîïī]/g, 'i')
      .replace(/[òóôöõøō]/g, 'o')
      .replace(/[ùúûüū]/g, 'u')
      .replace(/[ýÿ]/g, 'y')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '') // Supprimer les caractères spéciaux
      .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
      .replace(/-+/g, '-') // Supprimer les tirets multiples
      .replace(/^-|-$/g, ''); // Supprimer les tirets en début/fin
  }

  /**
   * Upload de l'image de couverture
   */
  private async uploadCoverImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    try {
      const result = await this.cloudinaryService.uploadImageWithOptions(file, {
        folder: 'design-categories',
        transformation: [
          {
            width: 800,
            height: 600,
            crop: 'fill',
            gravity: 'center',
            quality: 'auto:good',
            fetch_format: 'auto',
            flags: 'progressive'
          }
        ]
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Erreur upload image couverture:', error);
      throw new BadRequestException('Erreur lors de l\'upload de l\'image de couverture');
    }
  }

  /**
   * Créer une nouvelle catégorie de design
   */
  async createCategory(
    createDto: CreateDesignCategoryDto, 
    createdById: number, 
    coverImage?: Express.Multer.File
  ): Promise<DesignCategoryResponseDto> {
    try {
      // Générer le slug si non fourni
      const slug = createDto.slug || this.generateSlug(createDto.name);

      // Vérifier l'unicité du nom
      const existingByName = await this.prisma.designCategory.findUnique({
        where: { name: createDto.name },
      });
      if (existingByName) {
        throw new ConflictException('Une catégorie avec ce nom existe déjà');
      }

      // Vérifier l'unicité du slug
      const existingBySlug = await this.prisma.designCategory.findUnique({
        where: { slug },
      });
      if (existingBySlug) {
        throw new ConflictException('Une catégorie avec ce slug existe déjà');
      }

      // Upload de l'image de couverture si fournie
      let coverImageUrl: string | undefined;
      let coverImagePublicId: string | undefined;
      
      if (coverImage) {
        const uploadResult = await this.uploadCoverImage(coverImage);
        coverImageUrl = uploadResult.url;
        coverImagePublicId = uploadResult.publicId;
      }

      // Créer la catégorie
      const category = await this.prisma.designCategory.create({
        data: {
          name: createDto.name,
          description: createDto.description,
          slug,
          coverImageUrl,
          coverImagePublicId,
          isActive: createDto.isActive ?? true,
          sortOrder: createDto.sortOrder ?? 0,
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
          _count: {
            select: {
              designs: true,
            },
          },
        },
      });

      return {
        id: category.id,
        name: category.name,
        description: category.description || '',
        slug: category.slug,
        coverImageUrl: category.coverImageUrl || null,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        designCount: category._count.designs,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        creator: category.creator,
      };
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Erreur lors de la création de la catégorie');
    }
  }

  /**
   * Récupérer la liste des catégories avec pagination et filtres
   */
  async getCategories(queryDto: ListDesignCategoriesQueryDto): Promise<{
    categories: DesignCategoryResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    const { page = 1, limit = 20, isActive, search } = queryDto;
    
    const whereCondition: any = {};

    // Filtre par statut actif
    if (isActive !== undefined) {
      whereCondition.isActive = isActive;
    }

    // Recherche par nom ou slug
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    try {
      const [categories, total] = await Promise.all([
        this.prisma.designCategory.findMany({
          where: whereCondition,
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                designs: true,
              },
            },
          },
          orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' },
          ],
          skip,
          take: limit,
        }),
        this.prisma.designCategory.count({
          where: whereCondition,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      const formattedCategories: DesignCategoryResponseDto[] = categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || '',
        slug: category.slug,
        coverImageUrl: category.coverImageUrl || null,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        designCount: category._count.designs,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        creator: category.creator,
      }));

      return {
        categories: formattedCategories,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrevious,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw new BadRequestException('Erreur lors de la récupération des catégories');
    }
  }

  /**
   * Récupérer une catégorie par ID
   */
  async getCategoryById(id: number): Promise<DesignCategoryResponseDto> {
    try {
      const category = await this.prisma.designCategory.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              designs: true,
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException('Catégorie non trouvée');
      }

      return {
        id: category.id,
        name: category.name,
        description: category.description || '',
        slug: category.slug,
        coverImageUrl: category.coverImageUrl || null,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        designCount: category._count.designs,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        creator: category.creator,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la catégorie:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Erreur lors de la récupération de la catégorie');
    }
  }

  /**
   * Mettre à jour une catégorie
   */
  async updateCategory(
    id: number, 
    updateDto: UpdateDesignCategoryDto, 
    coverImage?: Express.Multer.File
  ): Promise<DesignCategoryResponseDto> {
    try {
      // Vérifier que la catégorie existe
      const existingCategory = await this.prisma.designCategory.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new NotFoundException('Catégorie non trouvée');
      }

      // Vérifier l'unicité du nom si modifié
      if (updateDto.name && updateDto.name !== existingCategory.name) {
        const existingByName = await this.prisma.designCategory.findUnique({
          where: { name: updateDto.name },
        });
        if (existingByName) {
          throw new ConflictException('Une catégorie avec ce nom existe déjà');
        }
      }

      // Vérifier l'unicité du slug si modifié
      if (updateDto.slug && updateDto.slug !== existingCategory.slug) {
        const existingBySlug = await this.prisma.designCategory.findUnique({
          where: { slug: updateDto.slug },
        });
        if (existingBySlug) {
          throw new ConflictException('Une catégorie avec ce slug existe déjà');
        }
      }

      // Gérer l'upload de la nouvelle image de couverture
      let coverImageUrl: string | undefined;
      let coverImagePublicId: string | undefined;
      
      if (coverImage) {
        const uploadResult = await this.uploadCoverImage(coverImage);
        coverImageUrl = uploadResult.url;
        coverImagePublicId = uploadResult.publicId;
        
        // Supprimer l'ancienne image si elle existe
        if (existingCategory.coverImagePublicId) {
          try {
            await this.cloudinaryService.deleteImage(existingCategory.coverImagePublicId);
            console.log('Ancienne image de couverture supprimée:', existingCategory.coverImagePublicId);
          } catch (error) {
            console.warn('Erreur suppression ancienne image:', error);
          }
        }
      }

      // Créer l'objet de mise à jour
      const updateData: any = { ...updateDto };
      
      if (coverImageUrl) {
        updateData.coverImageUrl = coverImageUrl;
        updateData.coverImagePublicId = coverImagePublicId;
      }
      
      // Générer un nouveau slug si le nom change mais pas de slug fourni
      if (updateDto.name && !updateDto.slug) {
        const newSlug = this.generateSlug(updateDto.name);
        const existingByNewSlug = await this.prisma.designCategory.findUnique({
          where: { slug: newSlug },
        });
        if (!existingByNewSlug) {
          updateData.slug = newSlug;
        }
      }

      // Supprimer les champs undefined
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      // Effectuer la mise à jour
      const updatedCategory = await this.prisma.designCategory.update({
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
          _count: {
            select: {
              designs: true,
            },
          },
        },
      });

      return {
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description || '',
        slug: updatedCategory.slug,
        coverImageUrl: updatedCategory.coverImageUrl || null,
        isActive: updatedCategory.isActive,
        sortOrder: updatedCategory.sortOrder,
        designCount: updatedCategory._count.designs,
        createdAt: updatedCategory.createdAt,
        updatedAt: updatedCategory.updatedAt,
        creator: updatedCategory.creator,
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
      
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Erreur lors de la mise à jour de la catégorie');
    }
  }

  /**
   * Supprimer une catégorie (soft delete)
   */
  async deleteCategory(id: number): Promise<{ message: string }> {
    try {
      const category = await this.prisma.designCategory.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              designs: true,
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException('Catégorie non trouvée');
      }

      // Vérifier s'il y a des designs associés
      if (category._count.designs > 0) {
        throw new BadRequestException(
          `Impossible de supprimer cette catégorie car elle contient ${category._count.designs} design(s). Veuillez d'abord déplacer ou supprimer les designs associés.`
        );
      }

      // Supprimer l'image de couverture de Cloudinary si elle existe
      if (category.coverImagePublicId) {
        try {
          await this.cloudinaryService.deleteImage(category.coverImagePublicId);
          console.log('Image de couverture supprimée:', category.coverImagePublicId);
        } catch (error) {
          console.warn('Erreur suppression image couverture:', error);
        }
      }

      // Supprimer la catégorie
      await this.prisma.designCategory.delete({
        where: { id },
      });

      return {
        message: `Catégorie "${category.name}" supprimée avec succès`,
      };
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Erreur lors de la suppression de la catégorie');
    }
  }

  /**
   * Récupérer une catégorie par slug
   */
  async getCategoryBySlug(slug: string): Promise<DesignCategoryResponseDto> {
    try {
      const category = await this.prisma.designCategory.findUnique({
        where: { slug },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              designs: true,
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException('Catégorie non trouvée');
      }

      return {
        id: category.id,
        name: category.name,
        description: category.description || '',
        slug: category.slug,
        coverImageUrl: category.coverImageUrl || null,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        designCount: category._count.designs,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        creator: category.creator,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la catégorie par slug:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Erreur lors de la récupération de la catégorie');
    }
  }

  /**
   * Récupérer les catégories actives pour les vendeurs (endpoint public)
   */
  async getActiveCategories(): Promise<DesignCategoryResponseDto[]> {
    try {
      const categories = await this.prisma.designCategory.findMany({
        where: { isActive: true },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              designs: true,
            },
          },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      });

      return categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || '',
        slug: category.slug,
        coverImageUrl: category.coverImageUrl || null,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        designCount: category._count.designs,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        creator: category.creator,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories actives:', error);
      throw new BadRequestException('Erreur lors de la récupération des catégories actives');
    }
  }
}