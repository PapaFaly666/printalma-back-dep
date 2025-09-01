import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateColorDto } from './dto/create-color.dto';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

@Injectable()
export class ColorService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // Temporary stub methods to prevent controller errors
  async create(createColorDto: CreateColorDto, file?: Express.Multer.File) {
    throw new BadRequestException('Color service is temporarily disabled. Please use the new product creation API.');
  }

  async findAll() {
    throw new BadRequestException('Color service is temporarily disabled. Please use the new product API.');
  }

  async findOne(id: number) {
    throw new BadRequestException('Color service is temporarily disabled. Please use the new product API.');
  }

  async remove(id: number) {
    throw new BadRequestException('Color service is temporarily disabled. Please use the new product API.');
  }

  async addColorImages(id: number, files: Express.Multer.File[]) {
    throw new BadRequestException('Color service is temporarily disabled. Please use the new product API.');
  }

  async addColorImage(id: number, file: Express.Multer.File) {
    throw new BadRequestException('Color service is temporarily disabled. Please use the new product API.');
  }

  async updateMainImage(id: number, file: Express.Multer.File) {
    throw new BadRequestException('Color service is temporarily disabled. Please use the new product API.');
  }

  /*
  // The Color model has been replaced by ColorVariation in the new schema
  // This service is temporarily disabled
  
  async create(createColorDto: CreateColorDto) {
    try {
      return this.prisma.color.create({
        data: {
          name: createColorDto.name,
          hexCode: createColorDto.hexCode,
          imageUrl: createColorDto.imageUrl || 'https://via.placeholder.com/100x100',
          imagePublicId: createColorDto.imagePublicId || null,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la création de la couleur:', error);
      throw new BadRequestException(
        `Erreur lors de la création de la couleur: ${error.message}`,
      );
    }
  }

  async findAll() {
    return this.prisma.color.findMany({
      include: {
        products: true, // Inclut les produits associés à chaque couleur
      },
    });
  }

  async findOne(id: number) {
    const color = await this.prisma.color.findUnique({
      where: { id },
      include: {
        products: true, // Inclut les produits associés
      },
    });

    if (!color) {
      throw new NotFoundException(`Couleur avec l'ID ${id} non trouvée`);
    }

    return color;
  }

  async update(id: number, updateColorDto: UpdateColorDto) {
    try {
      // Vérifier si la couleur existe
      await this.findOne(id);

      return this.prisma.color.update({
        where: { id },
        data: {
          name: updateColorDto.name,
          hexCode: updateColorDto.hexCode,
          imageUrl: updateColorDto.imageUrl,
          imagePublicId: updateColorDto.imagePublicId,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la mise à jour de la couleur: ${error.message}`,
      );
    }
  }

  async remove(id: number) {
    try {
      return this.prisma.color.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Erreur lors de la suppression de la couleur ${id}:`, error);
      if (error.code === 'P2025') {
        throw new NotFoundException(`Couleur avec l'ID ${id} non trouvée`);
    }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Impossible de supprimer cette couleur car elle est utilisée par des produits',
        );
      }
      throw new BadRequestException(
        `Erreur lors de la suppression de la couleur: ${error.message}`,
      );
    }
  }

  async uploadImage(id: number, file: Express.Multer.File) {
    try {
      // Vérifier que la couleur existe
      const color = await this.findOne(id);
      
      // Supprimer l'ancienne image si elle existe
      if (color.imagePublicId) {
        await this.cloudinaryService.deleteImage(color.imagePublicId);
      }
      
      // Télécharger la nouvelle image sur Cloudinary
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'colors',
      );
      
      // Mettre à jour la couleur avec l'URL et l'ID public de l'image
      const updatedColor = await this.prisma.color.update({
        where: { id },
        data: {
          imageUrl: uploadResult.secure_url,
          imagePublicId: uploadResult.public_id,
        },
      });

      return {
        success: true,
        colorId: updatedColor.id,
        imageUrl: updatedColor.imageUrl,
        name: updatedColor.name,
        hexCode: updatedColor.hexCode,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors du téléchargement de l'image: ${error.message}`,
      );
    }
  }
  */
}