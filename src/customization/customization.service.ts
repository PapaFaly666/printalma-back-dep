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
    userId?: number,
    customizationId?: number
  ) {
    this.logger.log(`Sauvegarde personnalisation - Product: ${dto.productId}, User: ${userId || 'guest'}, CustomizationId: ${customizationId || 'new'}`);

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

    // Données à sauvegarder
    const data = {
      productId: dto.productId,
      colorVariationId: dto.colorVariationId,
      viewId: dto.viewId,
      designElements: JSON.parse(JSON.stringify(dto.designElements)),
      sizeSelections: dto.sizeSelections ? JSON.parse(JSON.stringify(dto.sizeSelections)) : null,
      previewImageUrl: dto.previewImageUrl,
      totalPrice,
      userId,
      sessionId: userId ? null : dto.sessionId,
      status: 'draft'
    };

    // Si un customizationId est fourni, mettre à jour directement cette personnalisation
    if (customizationId) {
      const existingCustomization = await this.prisma.productCustomization.findUnique({
        where: { id: customizationId }
      });

      if (!existingCustomization) {
        throw new NotFoundException(`Customization with ID ${customizationId} not found`);
      }

      // Vérifier les permissions (l'utilisateur doit être propriétaire ou c'est une session guest)
      if (userId && existingCustomization.userId !== userId) {
        throw new NotFoundException(`Customization not found or access denied`);
      }

      if (!userId && existingCustomization.sessionId !== dto.sessionId) {
        throw new NotFoundException(`Customization not found or access denied`);
      }

      this.logger.log(`Mise à jour personnalisation spécifique: ${customizationId}`);
      return this.prisma.productCustomization.update({
        where: { id: customizationId },
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

    // Sinon, chercher une personnalisation existante pour ce produit
    const existingCustomization = await this.prisma.productCustomization.findFirst({
      where: {
        productId: dto.productId,
        ...(userId ? { userId } : { sessionId: dto.sessionId }),
        status: 'draft'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (existingCustomization) {
      // Mettre à jour la plus récente
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
        ...(dto.designElements && { designElements: JSON.parse(JSON.stringify(dto.designElements)) }),
        ...(dto.sizeSelections && { sizeSelections: JSON.parse(JSON.stringify(dto.sizeSelections)) }),
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

  /**
   * Migrer les personnalisations d'une session guest vers un utilisateur connecté
   * Utilisé lors de la connexion/inscription
   */
  async migrateGuestCustomizations(sessionId: string, userId: number) {
    this.logger.log(`Migration des personnalisations de session ${sessionId} vers utilisateur ${userId}`);

    // Récupérer toutes les personnalisations de la session
    const guestCustomizations = await this.prisma.productCustomization.findMany({
      where: {
        sessionId,
        userId: null, // S'assurer que ce sont bien des personnalisations guest
      }
    });

    if (guestCustomizations.length === 0) {
      this.logger.log('Aucune personnalisation guest à migrer');
      return { migrated: 0, customizations: [] };
    }

    // Mettre à jour toutes les personnalisations pour les lier à l'utilisateur
    const updatePromises = guestCustomizations.map(customization =>
      this.prisma.productCustomization.update({
        where: { id: customization.id },
        data: {
          userId,
          sessionId: null, // Retirer le sessionId car l'utilisateur est maintenant connecté
        }
      })
    );

    const migratedCustomizations = await Promise.all(updatePromises);

    this.logger.log(`${migratedCustomizations.length} personnalisation(s) migrée(s) avec succès`);

    return {
      migrated: migratedCustomizations.length,
      customizations: migratedCustomizations
    };
  }

  /**
   * Récupérer une personnalisation draft pour un produit spécifique
   * Utile pour continuer une personnalisation en cours
   */
  async getDraftCustomizationForProduct(
    productId: number,
    userId?: number,
    sessionId?: string
  ) {
    const customization = await this.prisma.productCustomization.findFirst({
      where: {
        productId,
        status: 'draft',
        ...(userId ? { userId } : { sessionId })
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

    return customization;
  }
}
