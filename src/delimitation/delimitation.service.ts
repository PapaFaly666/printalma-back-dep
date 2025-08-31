import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DelimitationDto, CoordinateType } from '../product/dto/create-product-request.dto';

@Injectable()
export class DelimitationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une nouvelle délimitation (toujours stockée en pourcentages)
   */
  async createDelimitation(productImageId: number, data: DelimitationDto) {
    // 1. Récupérer les dimensions de l'image pour validation/conversion
    const productImage = await this.prisma.productImage.findUnique({
      where: { id: productImageId },
      select: { naturalWidth: true, naturalHeight: true },
    });

    if (!productImage?.naturalWidth || !productImage?.naturalHeight) {
      throw new BadRequestException('Dimensions naturelles de l\'image inconnues');
    }

    // 2. Déterminer le type de coordonnées demandé
    const isPixel = data.coordinateType === CoordinateType.PIXEL || data.coordinateType === CoordinateType.ABSOLUTE;

    // 3. Valider selon le type
    if (!isPixel) {
      // Pourcentages → Bornes 0-100 et pas de débordement
      this.validateDelimitationBounds({ x: data.x, y: data.y, width: data.width, height: data.height });
    } else {
      // Pour les coordonnées pixel : referenceWidth & referenceHeight obligatoires
      if (!data.referenceWidth || !data.referenceHeight) {
        throw new BadRequestException('referenceWidth et referenceHeight sont obligatoires pour les délimitations PIXEL');
      }

      // Optionnel : avertir si les références ne correspondent pas à la taille naturelle de l'image
      // Pas bloquant car on peut créer des délimitations sur des images déjà redimensionnées.
    }

    // 4. Créer la délimitation (conserve le type fourni)
    const delimitation = await this.prisma.delimitation.create({
      data: {
        productImageId,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        name: data.name,
        rotation: data.rotation || 0,
        coordinateType: isPixel ? CoordinateType.ABSOLUTE : CoordinateType.PERCENTAGE,
        referenceWidth: data.referenceWidth || 0,
        referenceHeight: data.referenceHeight || 0,
      },
    });

    return delimitation;
  }

  /**
   * Mettre à jour une délimitation
   */
  async updateDelimitation(id: number, data: Partial<DelimitationDto>) {
    // 1. Vérifier que la délimitation existe
    const existing = await this.prisma.delimitation.findUnique({
      where: { id },
      include: {
        productImage: {
          select: { naturalWidth: true, naturalHeight: true }
        }
      }
    });

    if (!existing) {
      throw new NotFoundException(`Délimitation avec l'ID ${id} non trouvée`);
    }

    // 2. Préparer les nouvelles coordonnées
    const nextCoordinateType = data.coordinateType ?? existing.coordinateType;
    const isPixel = nextCoordinateType === CoordinateType.PIXEL || nextCoordinateType === CoordinateType.ABSOLUTE;

    const coords = {
      x: data.x ?? existing.x,
      y: data.y ?? existing.y,
      width: data.width ?? existing.width,
      height: data.height ?? existing.height,
    };

    // 3. Validation
    if (!isPixel) {
      this.validateDelimitationBounds(coords);
    } else {
      // Pour les coordonnées pixel : s'assurer de la présence des références
      const refWidth = data.referenceWidth ?? existing.referenceWidth;
      const refHeight = data.referenceHeight ?? existing.referenceHeight;
      if (!refWidth || !refHeight) {
        throw new BadRequestException('referenceWidth et referenceHeight obligatoires pour les délimitations PIXEL');
      }
    }

    // 4. Mettre à jour
    const updated = await this.prisma.delimitation.update({
      where: { id },
      data: {
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
        name: data.name,
        rotation: data.rotation,
        coordinateType: isPixel ? CoordinateType.ABSOLUTE : CoordinateType.PERCENTAGE,
        referenceWidth: data.referenceWidth ?? existing.referenceWidth,
        referenceHeight: data.referenceHeight ?? existing.referenceHeight,
      },
    });

    return updated;
  }

  /**
   * Récupérer les délimitations d'une image avec ses dimensions naturelles
   */
  async getImageWithDelimitations(productImageId: number) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: productImageId },
      select: {
        id: true,
        naturalWidth: true,
        naturalHeight: true,
        delimitations: {
          orderBy: { createdAt: 'asc' }
        }
      },
    });

    if (!image) {
      throw new NotFoundException(`Image produit ${productImageId} introuvable`);
    }

    return {
      imageId: image.id,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      delimitations: image.delimitations.map((d) => ({
        ...d,
        coordinateType: d.coordinateType === CoordinateType.ABSOLUTE ? CoordinateType.PIXEL : d.coordinateType,
      })),
    };
  }

  /**
   * Supprimer une délimitation
   */
  async deleteDelimitation(id: number) {
    const existing = await this.prisma.delimitation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Délimitation avec l'ID ${id} non trouvée`);
    }

    await this.prisma.delimitation.delete({
      where: { id },
    });

    return { success: true, message: 'Délimitation supprimée avec succès' };
  }

  /**
   * Convertir coordonnées absolues vers pourcentages
   */
  static convertAbsoluteToPercentage(
    absoluteCoords: { x: number; y: number; width: number; height: number },
    imageSize: { width: number; height: number },
  ) {
    return {
      x: Math.round((absoluteCoords.x / imageSize.width) * 10000) / 100,
      y: Math.round((absoluteCoords.y / imageSize.height) * 10000) / 100,
      width: Math.round((absoluteCoords.width / imageSize.width) * 10000) / 100,
      height: Math.round((absoluteCoords.height / imageSize.height) * 10000) / 100,
    };
  }

  /**
   * Validation des limites de délimitation (0-100% et pas de débordement)
   */
  private validateDelimitationBounds(data: { x: number; y: number; width: number; height: number }) {
    const errors: string[] = [];

    // Vérifier les bornes et débordements
    if (data.x < 0) errors.push('x doit être ≥ 0%');
    if (data.y < 0) errors.push('y doit être ≥ 0%');
    if (data.width <= 0) errors.push('width doit être > 0%');
    if (data.height <= 0) errors.push('height doit être > 0%');
    if (data.x + data.width > 100) errors.push('La zone dépasse horizontalement (x + width > 100%)');
    if (data.y + data.height > 100) errors.push('La zone dépasse verticalement (y + height > 100%)');

    if (errors.length > 0) {
      throw new BadRequestException(`Validation : ${errors.join(', ')}`);
    }
  }

  /**
   * Convertir coordonnées pourcentages vers absolues
   */
  static convertPercentageToAbsolute(
    percentageCoords: { x: number; y: number; width: number; height: number },
    imageSize: { width: number; height: number },
  ) {
    return {
      x: Math.round((percentageCoords.x * imageSize.width) / 100),
      y: Math.round((percentageCoords.y * imageSize.height) / 100),
      width: Math.round((percentageCoords.width * imageSize.width) / 100),
      height: Math.round((percentageCoords.height * imageSize.height) / 100),
    };
  }

  /**
   * Migrer une délimitation vers des coordonnées en pourcentages
   */
  async migrateToPercentage(
    delimitationId: number,
    imageWidth: number,
    imageHeight: number,
  ) {
    const delimitation = await this.prisma.delimitation.findUnique({
      where: { id: delimitationId },
    });

    if (!delimitation) {
      throw new NotFoundException(`Délimitation ${delimitationId} non trouvée`);
    }

    // Convertir en pourcentages si ce n'est pas déjà le cas
    if (delimitation.coordinateType !== CoordinateType.PERCENTAGE) {
      const percentageCoords = DelimitationService.convertAbsoluteToPercentage(
        {
          x: delimitation.x,
          y: delimitation.y,
          width: delimitation.width,
          height: delimitation.height,
        },
        { width: imageWidth, height: imageHeight }
      );

      return await this.prisma.delimitation.update({
        where: { id: delimitationId },
        data: {
          ...percentageCoords,
          coordinateType: CoordinateType.PERCENTAGE,
        },
      });
    }

    return delimitation;
  }

  /**
   * Migrer toutes les délimitations d'un produit vers des pourcentages
   */
  async migrateProductDelimitationsToPercentage(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        colorVariations: {
          include: {
            images: {
              include: {
                delimitations: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produit ${productId} non trouvé`);
    }

    let success = 0;
    let errors = 0;
    let total = 0;

    for (const colorVariation of product.colorVariations) {
      for (const image of colorVariation.images) {
        for (const delimitation of image.delimitations) {
          total++;
          try {
            await this.migrateToPercentage(
              delimitation.id,
              image.naturalWidth || 0,
              image.naturalHeight || 0,
            );
            success++;
          } catch (error) {
            errors++;
            console.error(`Erreur migration délimitation ${delimitation.id}:`, error);
          }
        }
      }
    }

    return { success, errors, total };
  }

  /**
   * Obtenir les statistiques des délimitations
   */
  async getDelimitationStats() {
    const total = await this.prisma.delimitation.count();
    const percentageCount = await this.prisma.delimitation.count({
      where: { coordinateType: CoordinateType.PERCENTAGE },
    });

    const pixelCount = total - percentageCount;

    return {
      total,
      percentageCount,
      pixelCount,
      migrationProgress: total > 0 ? Math.round((percentageCount / total) * 100) : 100,
    };
  }
} 