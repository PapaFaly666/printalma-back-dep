import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCustomizationDto, UpdateCustomizationDto } from './dto/create-customization.dto';

@Injectable()
export class CustomizationService {
  private readonly logger = new Logger(CustomizationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Créer ou mettre à jour une personnalisation
   * Si une personnalisation existe déjà pour le même produit/user/session, la mettre à jour
   */
  async upsertCustomization(
    dto: CreateCustomizationDto,
    userId?: number
  ) {
    this.logger.log(`Sauvegarde personnalisation - Product: ${dto.productId}, User: ${userId || 'guest'}`);

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

    // Chercher une personnalisation existante
    const existingCustomization = await this.prisma.productCustomization.findFirst({
      where: {
        productId: dto.productId,
        ...(userId ? { userId } : { sessionId: dto.sessionId }),
        status: 'draft'
      }
    });

    // Données à sauvegarder
    const data = {
      productId: dto.productId,
      colorVariationId: dto.colorVariationId,
      viewId: dto.viewId,
      designElements: dto.designElements as any,
      sizeSelections: dto.sizeSelections as any,
      previewImageUrl: dto.previewImageUrl,
      totalPrice,
      userId,
      sessionId: userId ? null : dto.sessionId,
      status: 'draft'
    };

    if (existingCustomization) {
      // Mettre à jour
      this.logger.log(`Mise à jour personnalisation existante: ${existingCustomization.id}`);
      return this.prisma.productCustomization.update({
        where: { id: existingCustomization.id },
        data,
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
    } else {
      // Créer nouveau
      this.logger.log('Création nouvelle personnalisation');
      return this.prisma.productCustomization.create({
        data,
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
        ...(dto.designElements && { designElements: dto.designElements as any }),
        ...(dto.sizeSelections && { sizeSelections: dto.sizeSelections as any }),
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
}
